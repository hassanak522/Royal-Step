import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { locationId, variantId, adjustmentType, quantity, reason } = await req.json();

    if (!locationId || !variantId || !quantity) {
      return NextResponse.json({ error: 'Missing required adjustment parameters' }, { status: 400 });
    }

    const qty = parseInt(quantity, 10);

    const result = await prisma.$transaction(async (tx) => {
      let updateData: any = {};
      let movementChange = 0;

      if (adjustmentType === 'ADD_STOCK') {
        updateData.onHand = { increment: qty };
        movementChange = qty;
      } else if (adjustmentType === 'DAMAGE_WRITE_OFF') {
        updateData.onHand = { decrement: qty };
        updateData.damaged = { increment: qty };
        movementChange = -qty;
      } else if (adjustmentType === 'RECONCILIATION_CORRECTION') {
        updateData.onHand = qty; // absolute override
        movementChange = qty;
      }

      const balance = await tx.stockBalance.upsert({
        where: { locationId_variantId: { locationId, variantId } },
        update: updateData,
        create: {
          locationId,
          variantId,
          onHand: adjustmentType === 'DAMAGE_WRITE_OFF' ? 0 : qty,
          damaged: adjustmentType === 'DAMAGE_WRITE_OFF' ? qty : 0,
        },
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          locationId,
          change: movementChange,
          reason: `MANUAL_ADJUSTMENT_${adjustmentType}: ${reason || 'Cycle count correction'}`,
          actorEmail: session.email,
        },
      });

      return balance;
    });

    return NextResponse.json({ success: true, balance: result });
  } catch (error) {
    console.error('Stock adjust error:', error);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}