import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { TransferStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sourceLocationId, destinationLocationId, items, notes } = await req.json();

    const transferNumber = `TRF-KHI-${Math.floor(1000 + Math.random() * 9000)}`;

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        sourceLocationId,
        destinationLocationId,
        status: TransferStatus.REQUESTED,
        requestedBy: session.email,
        notes,
        items: {
          create: items.map((i: any) => ({
            variantId: i.variantId,
            quantitySent: i.quantity,
          })),
        },
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create stock transfer request.' }, { status: 500 });
  }
}

// Update status: Dispatching or Receiving with stock adjustments
export async function PATCH(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { transferId, action } = await req.json(); // action: "DISPATCH" | "RECEIVE"

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: { items: true },
    });

    if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });

    if (action === 'DISPATCH') {
      // Deduct warehouse onHand and mark In-Transit
      await prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          await tx.stockBalance.update({
            where: {
              locationId_variantId: {
                locationId: transfer.sourceLocationId,
                variantId: item.variantId,
              },
            },
            data: { onHand: { decrement: item.quantitySent } },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              locationId: transfer.sourceLocationId,
              change: -item.quantitySent,
              reason: `TRANSFER_DISPATCH_${transfer.transferNumber}`,
              actorEmail: session.email,
            },
          });
        }

        await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: { status: TransferStatus.DISPATCHED_IN_TRANSIT, dispatchedAt: new Date() },
        });
      });

      return NextResponse.json({ success: true, message: 'Transfer dispatched. Stock in-transit.' });
    }

    if (action === 'RECEIVE') {
      // Add to destination branch onHand
      await prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          await tx.stockBalance.upsert({
            where: {
              locationId_variantId: {
                locationId: transfer.destinationLocationId,
                variantId: item.variantId,
              },
            },
            update: { onHand: { increment: item.quantitySent } },
            create: {
              locationId: transfer.destinationLocationId,
              variantId: item.variantId,
              onHand: item.quantitySent,
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              locationId: transfer.destinationLocationId,
              change: item.quantitySent,
              reason: `TRANSFER_RECEIVE_${transfer.transferNumber}`,
              actorEmail: session.email,
            },
          });
        }

        await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: { status: TransferStatus.RECEIVED, receivedAt: new Date() },
        });
      });

      return NextResponse.json({ success: true, message: 'Stock received at branch.' });
    }

    return NextResponse.json({ error: 'Invalid transfer action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process transfer.' }, { status: 500 });
  }
}