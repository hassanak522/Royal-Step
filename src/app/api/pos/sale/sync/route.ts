import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Missing X-Idempotency-Key header' }, { status: 400 });
    }

    // 1. Idempotency Check: Return cached response if this event was already processed
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey },
    });
    if (existing) {
      return NextResponse.json(existing.responseBody, { status: existing.responseStatus });
    }

    const body = await req.json();
    const {
      eventId,
      receiptNumber,
      locationCode,
      cashierName,
      lineItems,
      tender,
    } = body;

    // 2. ACID Transaction Boundary
    const result = await prisma.$transaction(async (tx) => {
      // Find branch location
      const location = await tx.location.findUnique({
        where: { code: locationCode },
      });
      if (!location) {
        throw new Error(`Invalid branch code: ${locationCode}`);
      }

      // Check if receipt already exists by receiptNumber
      const duplicateReceipt = await tx.posReceipt.findUnique({
        where: { receiptNumber },
      });
      if (duplicateReceipt) {
        return { receipt: duplicateReceipt, thresholdAlertGenerated: false };
      }

      // Compute total
      const totalAmount = tender.cashAmount + tender.cardAmount;

      // Create POS Receipt record
      const receipt = await tx.posReceipt.create({
        data: {
          receiptNumber,
          offlineClientId: eventId,
          locationId: location.id,
          staffUserId: body.cashierId || (await tx.staffUser.findFirst({ select: { id: true } }))?.id || '',
          cashierName: cashierName || 'Cashier Desk',
          subtotal: totalAmount + (tender.discount || 0),
          discount: tender.discount || 0,
          total: totalAmount,
          tenderType: tender.type,
          cashAmount: tender.cashAmount,
          cardAmount: tender.cardAmount,
          itemsJson: lineItems,
        },
      });

      let thresholdAlertGenerated = false;

      // Deduct inventory ONLY from this branch (warehouse is completely untouched)
      for (const item of lineItems) {
        const balance = await tx.stockBalance.update({
          where: {
            locationId_variantId: {
              locationId: location.id,
              variantId: item.variantId,
            },
          },
          data: {
            onHand: { decrement: item.quantity },
          },
        });

        // Record stock movement ledger
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            locationId: location.id,
            change: -item.quantity,
            reason: `POS_SALE_${receiptNumber}`,
            referenceId: receiptNumber,
            actorEmail: cashierName || 'cashier',
          },
        });

        // Evaluate Low-Stock Replenishment Threshold (Flow Diagram 2)
        if (balance.onHand <= balance.safetyBuffer) {
          thresholdAlertGenerated = true;
          await tx.replenishmentAlert.upsert({
            where: {
              locationId_variantId_status: {
                locationId: location.id,
                variantId: item.variantId,
                status: 'OPEN',
              },
            },
            create: {
              locationId: location.id,
              variantId: item.variantId,
              currentOnHand: balance.onHand,
              minimumThreshold: balance.safetyBuffer,
              suggestedAction: 'INTERNAL_TRANSFER',
              status: 'OPEN',
            },
            update: {
              currentOnHand: balance.onHand,
            },
          });
        }
      }

      // Write to Outbox Event
      await tx.outboxEvent.create({
        data: {
          idempotencyKey,
          aggregateType: 'POS_RECEIPT',
          aggregateId: receiptNumber,
          eventType: 'POS.SALE_COMMITTED',
          sourceApp: `POS_${locationCode}`,
          sourceLocationId: location.id,
          payload: { receiptId: receipt.id, receiptNumber, totalAmount, locationCode },
        },
      });

      return { receipt, thresholdAlertGenerated };
    });

    const responseData = {
      status: 'SUCCESS',
      idempotencyKey,
      receiptNumber: result.receipt.receiptNumber,
      thresholdAlertGenerated: result.thresholdAlertGenerated,
    };

    // Cache idempotency response for 72 hours
    await prisma.idempotencyRecord.create({
      data: {
        key: idempotencyKey,
        resourcePath: '/api/pos/sale/sync',
        responseStatus: 200,
        responseBody: responseData,
        expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
      },
    });

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error('POS Sync API Error:', error);
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  }
}