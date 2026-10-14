import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { OrderFulfillmentStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { orderIds } = await req.json(); // Array of order UUIDs handed over

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'No orders provided for handover.' }, { status: 400 });
    }

    const processedOrders: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const orderId of orderIds) {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (!order || !order.fulfillmentLocationId) continue;
        if (order.fulfillmentStatus === OrderFulfillmentStatus.SHIPPED) continue;

        // Permanent Inventory Commitment: Deduct physical stock and remove reservation
        for (const item of order.items) {
          await tx.stockBalance.update({
            where: {
              locationId_variantId: {
                locationId: order.fulfillmentLocationId,
                variantId: item.variantId,
              },
            },
            data: {
              onHand: { decrement: item.quantity },
              reservedOnline: { decrement: item.quantity },
            },
          });

          // Immutable Stock Ledger Record
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              locationId: order.fulfillmentLocationId,
              change: -item.quantity,
              reason: `ONLINE_COURIER_HANDOVER_${order.orderNumber}`,
              referenceId: order.leopardCn || order.orderNumber,
              actorEmail: session.email,
            },
          });
        }

        // Transition Order to SHIPPED
        await tx.order.update({
          where: { id: order.id },
          data: { fulfillmentStatus: OrderFulfillmentStatus.SHIPPED },
        });

        // Publish Outbox Event for WhatsApp / SMS notifications
        await tx.outboxEvent.create({
          data: {
            idempotencyKey: `SHIPPED-${order.id}`,
            aggregateType: 'ORDER',
            aggregateId: order.orderNumber,
            eventType: 'LOGISTICS.DISPATCHED',
            sourceApp: 'CENTRAL_WMS',
            sourceLocationId: order.fulfillmentLocationId,
            payload: {
              orderNumber: order.orderNumber,
              customerPhone: order.phone,
              courierCn: order.leopardCn,
              trackingUrl: `https://royalstep.pk/track?cn=${order.leopardCn}`,
            },
          },
        });

        processedOrders.push(order.orderNumber);
      }
    });

    return NextResponse.json({
      success: true,
      dispatchedCount: processedOrders.length,
      orders: processedOrders,
    });
  } catch (error: any) {
    console.error('Handover commitment failed:', error);
    return NextResponse.json({ error: error.message || 'Courier handover failed.' }, { status: 500 });
  }
}