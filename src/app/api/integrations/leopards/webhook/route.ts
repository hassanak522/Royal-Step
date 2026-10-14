import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderFulfillmentStatus, PaymentStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { track_number, status, event_time, reason } = payload;

    if (!track_number) {
      return NextResponse.json({ error: 'Missing track_number' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { leopardCn: track_number },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found for track number.' }, { status: 404 });
    }

    // Normalized Leopards Delivery States
    if (status === 'DELIVERED') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          fulfillmentStatus: OrderFulfillmentStatus.DELIVERED,
        },
      });

      await prisma.outboxEvent.create({
        data: {
          idempotencyKey: `DELIVERED-${order.id}`,
          aggregateType: 'ORDER',
          aggregateId: order.orderNumber,
          eventType: 'LOGISTICS.DELIVERED',
          sourceApp: 'LEOPARDS_WEBHOOK',
          payload: { orderNumber: order.orderNumber, deliveredAt: event_time },
        },
      });
    } else if (status === 'RETURNED' || status === 'RTO') {
      // Delivery failed: parcel returns to origin
      await prisma.order.update({
        where: { id: order.id },
        data: {
          fulfillmentStatus: OrderFulfillmentStatus.RTO,
          notes: `RTO Event: ${reason || 'Customer refused / uncontactable'}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Webhook processing error.' }, { status: 500 });
  }
}