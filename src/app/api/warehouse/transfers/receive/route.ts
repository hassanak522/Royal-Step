import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { TransferStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { transferId, itemsReceived, discrepancyNote } = await req.json();

    if (!transferId || !Array.isArray(itemsReceived)) {
      return NextResponse.json({ error: 'Missing transferId or itemsReceived.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUniqueOrThrow({
        where: { id: transferId },
        include: { items: true, destinationLocation: true, sourceLocation: true },
      });

      if (transfer.status === TransferStatus.RECEIVED) {
        throw new Error(`Transfer ${transfer.transferNumber} has already been received.`);
      }

      let hasDiscrepancy = false;

      // 1. Reconcile each item against physical box counts
      for (const item of transfer.items) {
        const receivedEntry = itemsReceived.find((r: any) => r.variantId === item.variantId);
        const actualReceived = receivedEntry !== undefined ? Number(receivedEntry.quantityReceived) : item.quantitySent;

        if (actualReceived !== item.quantitySent) {
          hasDiscrepancy = true;
        }

        // Update received quantity on the transfer item
        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: { quantityReceived: actualReceived },
        });

        // Increment destination branch onHand ONLY by the physically verified quantity
        if (actualReceived > 0) {
          await tx.stockBalance.upsert({
            where: {
              locationId_variantId: {
                locationId: transfer.destinationLocationId,
                variantId: item.variantId,
              },
            },
            update: {
              onHand: { increment: actualReceived },
            },
            create: {
              locationId: transfer.destinationLocationId,
              variantId: item.variantId,
              onHand: actualReceived,
            },
          });

          // Log to auditable ledger
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              locationId: transfer.destinationLocationId,
              change: actualReceived,
              reason: `TRANSFER_RECEIVE_${transfer.transferNumber}`,
              referenceId: transfer.transferNumber,
              actorEmail: session.email,
            },
          });
        }

        // If items are missing/damaged in transit, log discrepancy movement
        const missingCount = item.quantitySent - actualReceived;
        if (missingCount > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              locationId: transfer.destinationLocationId,
              change: 0,
              reason: `TRANSFER_DISCREPANCY_SHORT_${transfer.transferNumber}: Missing ${missingCount} pairs`,
              referenceId: transfer.transferNumber,
              actorEmail: session.email,
            },
          });
        }
      }

      // 2. Resolve final transfer status
      const finalStatus = hasDiscrepancy ? TransferStatus.DISCREPANCY_FLAGGED : TransferStatus.RECEIVED;

      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: {
          status: finalStatus,
          receivedAt: new Date(),
          discrepancyNote: hasDiscrepancy ? discrepancyNote || 'Discrepancy flagged during store box count.' : null,
        },
      });

      // 3. Resolve linked replenishment alert if one was open
      for (const item of transfer.items) {
        await tx.replenishmentAlert.updateMany({
          where: {
            locationId: transfer.destinationLocationId,
            variantId: item.variantId,
            status: 'OPEN',
          },
          data: { status: 'RESOLVED', linkedReference: transfer.transferNumber },
        });
      }

      // 4. Record event in Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          idempotencyKey: `TRF-RECV-${transfer.transferNumber}-${Date.now()}`,
          aggregateType: 'STOCK_TRANSFER',
          aggregateId: transfer.transferNumber,
          eventType: hasDiscrepancy ? 'INVENTORY.TRANSFER_DISCREPANCY' : 'INVENTORY.TRANSFER_RECEIVED',
          sourceApp: `BRANCH_${transfer.destinationLocation.code}`,
          sourceLocationId: transfer.destinationLocationId,
          payload: {
            transferNumber: transfer.transferNumber,
            status: finalStatus,
            destinationCode: transfer.destinationLocation.code,
            discrepancyNote: updatedTransfer.discrepancyNote,
          },
        },
      });

      return updatedTransfer;
    });

    return NextResponse.json({ success: true, transfer: result });
  } catch (error: any) {
    console.error('Transfer receive error:', error);
    return NextResponse.json({ error: error.message || 'Failed to receive transfer.' }, { status: 500 });
  }
}