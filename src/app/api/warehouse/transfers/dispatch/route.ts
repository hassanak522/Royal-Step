import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { TransferStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'WAREHOUSE_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized: Warehouse dispatch privileges required.' }, { status: 403 });
    }

    const { transferId, vehicleManifestNumber, lineItems } = await req.json();

    if (!transferId) {
      return NextResponse.json({ error: 'Missing transferId.' }, { status: 400 });
    }

    // Atomic transaction: verify warehouse stock, deduct onHand, mark IN_TRANSIT, log ledger & outbox
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUniqueOrThrow({
        where: { id: transferId },
        include: { items: true, sourceLocation: true, destinationLocation: true },
      });

      if (transfer.status === TransferStatus.DISPATCHED_IN_TRANSIT || transfer.status === TransferStatus.RECEIVED) {
        throw new Error(`Transfer ${transfer.transferNumber} is already ${transfer.status}.`);
      }

      // 1. Process each transfer item
      for (const item of transfer.items) {
        const itemOverride = lineItems?.find((li: any) => li.variantId === item.variantId);
        const qtyToDispatch = itemOverride ? itemOverride.quantity : item.quantitySent;

        const whStock = await tx.stockBalance.findUnique({
          where: {
            locationId_variantId: {
              locationId: transfer.sourceLocationId,
              variantId: item.variantId,
            },
          },
          include: { variant: { include: { product: true } } },
        });

        if (!whStock || whStock.onHand < qtyToDispatch) {
          throw new Error(
            `Insufficient warehouse stock for ${whStock?.variant.product.name ?? 'item'} (EU ${whStock?.variant.sizeEU}). Available: ${whStock?.onHand ?? 0}, Requested: ${qtyToDispatch}`
          );
        }

        // Deduct warehouse onHand
        await tx.stockBalance.update({
          where: {
            locationId_variantId: {
              locationId: transfer.sourceLocationId,
              variantId: item.variantId,
            },
          },
          data: {
            onHand: { decrement: qtyToDispatch },
            reservedTransfer: { decrement: Math.min(whStock.reservedTransfer, qtyToDispatch) },
          },
        });

        // Write to auditable stock ledger
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            locationId: transfer.sourceLocationId,
            change: -qtyToDispatch,
            reason: `TRANSFER_DISPATCH_${transfer.transferNumber}`,
            referenceId: transfer.transferNumber,
            actorEmail: session.email,
          },
        });
      }

      // 2. Update transfer status to In-Transit
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: {
          status: TransferStatus.DISPATCHED_IN_TRANSIT,
          dispatchedAt: new Date(),
          approvedBy: session.name || session.email,
          notes: vehicleManifestNumber ? `Manifest: ${vehicleManifestNumber}. ${transfer.notes || ''}` : transfer.notes,
        },
        include: { items: { include: { variant: { include: { product: true } } } }, destinationLocation: true },
      });

      // 3. Write event to Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          idempotencyKey: `TRF-DISP-${transfer.transferNumber}-${Date.now()}`,
          aggregateType: 'STOCK_TRANSFER',
          aggregateId: transfer.transferNumber,
          eventType: 'INVENTORY.TRANSFER_DISPATCHED',
          sourceApp: 'CENTRAL_WMS',
          sourceLocationId: transfer.sourceLocationId,
          payload: {
            transferNumber: transfer.transferNumber,
            sourceLocationCode: transfer.sourceLocation.code,
            destinationLocationCode: transfer.destinationLocation.code,
            itemsCount: transfer.items.length,
          },
        },
      });

      return updatedTransfer;
    });

    return NextResponse.json({ success: true, transfer: result });
  } catch (error: any) {
    console.error('Transfer dispatch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch transfer.' }, { status: 500 });
  }
}