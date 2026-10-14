import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { branchCode, offlineReceipts } = await req.json();

    const branch = await prisma.location.findUnique({
      where: { code: branchCode },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Unrecognized branch code.' }, { status: 404 });
    }

    const syncedResults: string[] = [];

    // Process queued offline receipts idempotently
    for (const r of offlineReceipts) {
      const existing = await prisma.posReceipt.findUnique({
        where: { receiptNumber: r.receiptNumber },
      });

      if (existing) {
        syncedResults.push(r.receiptNumber);
        continue;
      }

      await prisma.$transaction(async (tx) => {
        // Record receipt
        await tx.posReceipt.create({
          data: {
            receiptNumber: r.receiptNumber,
            offlineClientId: r.offlineClientId,
            locationId: branch.id,
            staffUserId: r.staffUserId,
            cashierName: r.cashierName,
            subtotal: r.subtotal,
            discount: r.discount || 0,
            total: r.total,
            tenderType: r.tenderType,
            cashAmount: r.cashAmount || 0,
            cardAmount: r.cardAmount || 0,
            itemsJson: r.items,
          },
        });

        // Deduct branch inventory only (does not touch warehouse online stock)
        for (const item of r.items) {
          await tx.stockBalance.update({
            where: {
              locationId_variantId: {
                locationId: branch.id,
                variantId: item.variantId,
              },
            },
            data: { onHand: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              locationId: branch.id,
              change: -item.quantity,
              reason: `POS_IN_STORE_SALE_${r.receiptNumber}`,
              actorEmail: r.cashierName,
            },
          });
        }
      });

      syncedResults.push(r.receiptNumber);
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedResults.length,
      receipts: syncedResults,
    });
  } catch (error) {
    console.error('POS Sync Error:', error);
    return NextResponse.json({ error: 'Failed to synchronize POS transactions.' }, { status: 500 });
  }
}