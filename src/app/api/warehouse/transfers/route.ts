import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { TransferStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'all', 'discrepancies', 'requests'

    let whereClause: any = {};
    if (filter === 'discrepancies') {
      whereClause.status = TransferStatus.DISCREPANCY_FLAGGED;
    } else if (filter === 'requests') {
      whereClause.status = TransferStatus.REQUESTED;
    }

    const transfers = await prisma.stockTransfer.findMany({
      where: whereClause,
      include: {
        sourceLocation: true,
        destinationLocation: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(transfers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load transfers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // Create New Transfer or Branch Request
    if (action === 'CREATE_TRANSFER' || action === 'CREATE_REPLENISHMENT_REQUEST') {
      const { sourceLocationId, destinationLocationId, items, notes } = body;

      const transfer = await prisma.stockTransfer.create({
        data: {
          transferNumber: `TRF-KHI-${Math.floor(1000 + Math.random() * 9000)}`,
          sourceLocationId,
          destinationLocationId,
          status: action === 'CREATE_REPLENISHMENT_REQUEST' ? TransferStatus.REQUESTED : TransferStatus.APPROVED,
          requestedBy: session.email,
          notes,
          items: {
            create: items.map((i: any) => ({
              variantId: i.variantId,
              quantitySent: i.quantity,
            })),
          },
        },
        include: { items: true },
      });

      return NextResponse.json(transfer, { status: 201 });
    }

    // Flag or Resolve Discrepancy
    if (action === 'RECORD_DISCREPANCY') {
      const { transferId, discrepancyNote, itemsReceived } = body;

      const transfer = await prisma.stockTransfer.findUnique({
        where: { id: transferId },
        include: { items: true },
      });

      if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });

      // Update actual received counts and flag discrepancy
      await prisma.$transaction(async (tx) => {
        for (const receivedItem of itemsReceived) {
          await tx.stockTransferItem.update({
            where: { id: receivedItem.itemId },
            data: { quantityReceived: receivedItem.quantityReceived },
          });

          // Increment only what was physically received at destination branch
          await tx.stockBalance.upsert({
            where: {
              locationId_variantId: {
                locationId: transfer.destinationLocationId,
                variantId: receivedItem.variantId,
              },
            },
            update: { onHand: { increment: receivedItem.quantityReceived } },
            create: {
              locationId: transfer.destinationLocationId,
              variantId: receivedItem.variantId,
              onHand: receivedItem.quantityReceived,
            },
          });
        }

        await tx.stockTransfer.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.DISCREPANCY_FLAGGED,
            discrepancyNote,
            receivedAt: new Date(),
          },
        });
      });

      return NextResponse.json({ success: true, message: 'Discrepancy recorded and stock partially reconciled.' });
    }

    return NextResponse.json({ error: 'Invalid transfer action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Transfer processing error' }, { status: 500 });
  }
}