import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { ReturnStatus, LocationType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Warehouse or manager privileges required.' }, { status: 401 });
    }

    const {
      ticketNumber,
      inspectionResult, // 'PASSED_RESTOCKABLE' | 'FAILED_REJECTED'
      conditionGrade,    // 'GRADE_A_MINT' | 'GRADE_B_MINOR_SCUFF' | 'GRADE_C_DAMAGED_SOLE'
      action,            // 'EXCHANGE' | 'REFUND' | 'REJECT'
      exchangeReplacementVariantId,
      notes,
    } = await req.json();

    if (!ticketNumber || !inspectionResult || !action) {
      return NextResponse.json({ error: 'Missing mandatory inspection parameters.' }, { status: 400 });
    }

    // 1. Locate Return Ticket and Order
    const ticket = await prisma.returnRequest.findUnique({
      where: { ticketNumber },
      include: { order: { include: { items: true } } },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Return ticket not found.' }, { status: 404 });
    }

    // 2. Fetch Central Warehouse Location
    const warehouse = await prisma.location.findFirst({
      where: { type: LocationType.CENTRAL_WAREHOUSE, isActive: true },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Central warehouse location offline.' }, { status: 500 });
    }

    // Find the original item variant
    const originalItem = ticket.order.items.find(
      (item) => item.productName.toLowerCase().includes(ticket.productName.toLowerCase()) || item.sizeEU === ticket.currentSize
    );

    // 3. Authoritative Multi-table Transaction
    const updatedTicket = await prisma.$transaction(async (tx) => {
      // SCENARIO 1: REJECTED / DAMAGED SOLE
      if (inspectionResult === 'FAILED_REJECTED' || action === 'REJECT') {
        if (originalItem?.variantId) {
          // Add to damaged inventory quarantine
          await tx.stockBalance.upsert({
            where: {
              locationId_variantId: {
                locationId: warehouse.id,
                variantId: originalItem.variantId,
              },
            },
            update: { damaged: { increment: 1 } },
            create: {
              locationId: warehouse.id,
              variantId: originalItem.variantId,
              onHand: 0,
              damaged: 1,
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: originalItem.variantId,
              locationId: warehouse.id,
              change: 1,
              reason: `RETURN_QUARANTINE_REJECTED_${ticket.ticketNumber}`,
              referenceId: ticket.ticketNumber,
              actorEmail: session.email,
            },
          });
        }

        return await tx.returnRequest.update({
          where: { id: ticket.id },
          data: {
            status: ReturnStatus.QUARANTINED,
            inspectorStaffId: session.id,
            conditionGrade: conditionGrade || 'GRADE_C_DAMAGED_SOLE',
            inspectNotes: `QC Inspection Failed: ${notes}`,
          },
        });
      }

      // SCENARIO 2: PASSED & SIZE EXCHANGE
      if (action === 'EXCHANGE') {
        const replacementVariantId = exchangeReplacementVariantId || ticket.replacementVariantId;
        if (!replacementVariantId) {
          throw new Error('Replacement size variant must be selected for exchange.');
        }

        // Restock original returned shoe to sellable warehouse onHand
        if (originalItem?.variantId) {
          await tx.stockBalance.upsert({
            where: {
              locationId_variantId: {
                locationId: warehouse.id,
                variantId: originalItem.variantId,
              },
            },
            update: { onHand: { increment: 1 } },
            create: {
              locationId: warehouse.id,
              variantId: originalItem.variantId,
              onHand: 1,
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: originalItem.variantId,
              locationId: warehouse.id,
              change: 1,
              reason: `RETURN_RESTOCK_EXCHANGE_${ticket.ticketNumber}`,
              referenceId: ticket.ticketNumber,
              actorEmail: session.email,
            },
          });
        }

        // Atomically reserve replacement size variant at warehouse
        const repStock = await tx.stockBalance.findUnique({
          where: {
            locationId_variantId: {
              locationId: warehouse.id,
              variantId: replacementVariantId,
            },
          },
        });

        const available = (repStock?.onHand || 0) - (repStock?.reservedOnline || 0) - (repStock?.damaged || 0);
        if (!repStock || available < 1) {
          throw new Error('Replacement size variant is out of stock in warehouse.');
        }

        await tx.stockBalance.update({
          where: { id: repStock.id },
          data: { reservedOnline: { increment: 1 } },
        });

        const replacementOrderNumber = `RS-EX-${ticket.ticketNumber.replace('RET-', '')}`;

        // Create new dispatch order for the replacement pair
        await tx.order.create({
          data: {
            orderNumber: replacementOrderNumber,
            fulfillmentLocationId: warehouse.id,
            customerName: ticket.order.customerName,
            phone: ticket.order.phone,
            province: ticket.order.province,
            city: ticket.order.city,
            area: ticket.order.area,
            address: ticket.order.address,
            paymentMethod: 'EXCHANGE_ZERO_BALANCE',
            paymentStatus: 'PAID',
            subtotal: 0,
            deliveryFee: 0,
            total: 0,
            itemSummary: `Size Exchange Replacement: ${ticket.productName} (EU ${ticket.requestedSize})`,
            items: {
              create: [
                {
                  variantId: replacementVariantId,
                  productName: ticket.productName,
                  sizeEU: ticket.requestedSize || 42,
                  color: 'Standard',
                  unitPrice: 0,
                  costPrice: 0,
                  quantity: 1,
                },
              ],
            },
          },
        });

        // Write event to outbox
        await tx.outboxEvent.create({
          data: {
            idempotencyKey: `EXCHANGE-${ticket.ticketNumber}`,
            aggregateType: 'RETURN_EXCHANGE',
            aggregateId: ticket.ticketNumber,
            eventType: 'RETURNS.EXCHANGE_DISPATCH_CREATED',
            sourceApp: 'CENTRAL_WMS',
            sourceLocationId: warehouse.id,
            payload: { replacementOrderNumber, replacementVariantId },
          },
        });

        return await tx.returnRequest.update({
          where: { id: ticket.id },
          data: {
            status: ReturnStatus.EXCHANGE_ALLOCATED,
            inspectorStaffId: session.id,
            conditionGrade: conditionGrade || 'GRADE_A_MINT',
            inspectNotes: notes || 'Passed inspection. Replacement dispatched.',
            replacementVariantId,
            replacementOrderNumber,
          },
        });
      }

      // SCENARIO 3: PASSED & FULL REFUND
      if (action === 'REFUND') {
        // Restock original returned shoe to sellable onHand
        if (originalItem?.variantId) {
          await tx.stockBalance.upsert({
            where: {
              locationId_variantId: {
                locationId: warehouse.id,
                variantId: originalItem.variantId,
              },
            },
            update: { onHand: { increment: 1 } },
            create: {
              locationId: warehouse.id,
              variantId: originalItem.variantId,
              onHand: 1,
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: originalItem.variantId,
              locationId: warehouse.id,
              change: 1,
              reason: `RETURN_RESTOCK_REFUND_${ticket.ticketNumber}`,
              referenceId: ticket.ticketNumber,
              actorEmail: session.email,
            },
          });
        }

        // Tag Finance Outbox for gateway refund / bank payout
        await tx.outboxEvent.create({
          data: {
            idempotencyKey: `REFUND-${ticket.ticketNumber}`,
            aggregateType: 'REFUND',
            aggregateId: ticket.ticketNumber,
            eventType: 'FINANCE.REFUND_AUTHORIZED',
            sourceApp: 'CENTRAL_WMS',
            sourceLocationId: warehouse.id,
            payload: { orderId: ticket.orderId, amount: ticket.order.total },
          },
        });

        return await tx.returnRequest.update({
          where: { id: ticket.id },
          data: {
            status: ReturnStatus.REFUND_APPROVED,
            inspectorStaffId: session.id,
            conditionGrade: conditionGrade || 'GRADE_A_MINT',
            inspectNotes: notes || 'Passed inspection. Refund authorized for finance.',
          },
        });
      }

      throw new Error('Unsupported inspection action.');
    });

    return NextResponse.json({ success: true, returnRequest: updatedTicket }, { status: 200 });
  } catch (error: any) {
    console.error('Inspection processing failed:', error);
    return NextResponse.json({ error: error.message || 'Inspection processing error' }, { status: 500 });
  }
}