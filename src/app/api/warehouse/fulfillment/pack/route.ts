import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { OrderFulfillmentStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { orderId, action, verifiedBarcodes } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    if (action === 'START_PICKING') {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { fulfillmentStatus: OrderFulfillmentStatus.PICKING },
      });
      return NextResponse.json({ success: true, status: updated.fulfillmentStatus });
    }

    if (action === 'COMPLETE_PACKING') {
      // Move to PACKED and READY_FOR_DISPATCH
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { fulfillmentStatus: OrderFulfillmentStatus.PACKED },
      });

      await prisma.auditLog.create({
        data: {
          staffUserId: session.id,
          action: 'ORDER_PACKED_QC_PASSED',
          entity: 'Order',
          entityId: order.id,
          newValue: `Verified items: ${order.itemSummary}`,
        },
      });

      return NextResponse.json({ success: true, status: updated.fulfillmentStatus });
    }

    return NextResponse.json({ error: 'Invalid packing action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Fulfillment error.' }, { status: 500 });
  }
}