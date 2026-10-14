import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus, OrderFulfillmentStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { orderId, action, transactionReference } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (action === 'VERIFY_DIGITAL_PAYMENT') {
      // Transition digital payment order into paid and allocated for picking
      const updated = await prisma.$transaction(async (tx) => {
        const ord = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            fulfillmentStatus: OrderFulfillmentStatus.ALLOCATED,
          },
        });

        await tx.outboxEvent.create({
          data: {
            idempotencyKey: `PAYMENT-VERIFIED-${ord.id}`,
            aggregateType: 'ORDER',
            aggregateId: ord.orderNumber,
            eventType: 'ORDER.PAYMENT_CONFIRMED',
            sourceApp: 'PAYMENT_GATEWAY_ADAPTER',
            payload: {
              orderNumber: ord.orderNumber,
              transactionReference,
              amountPaid: ord.total,
            },
          },
        });

        return ord;
      });

      return NextResponse.json({ success: true, order: updated });
    }

    if (action === 'CONFIRM_COD_PHONE') {
      // Transition COD order from awaiting confirmation to confirmed & allocated
      const updated = await prisma.$transaction(async (tx) => {
        const ord = await tx.order.update({
          where: { id: order.id },
          data: {
            fulfillmentStatus: OrderFulfillmentStatus.ALLOCATED,
          },
        });

        await tx.outboxEvent.create({
          data: {
            idempotencyKey: `COD-CONFIRMED-${ord.id}`,
            aggregateType: 'ORDER',
            aggregateId: ord.orderNumber,
            eventType: 'ORDER.COD_CONFIRMED',
            sourceApp: 'CUSTOMER_SUPPORT_APP',
            payload: { orderNumber: ord.orderNumber },
          },
        });

        return ord;
      });

      return NextResponse.json({ success: true, order: updated });
    }

    if (action === 'CANCEL_AND_RELEASE_STOCK') {
      // Customer or staff cancelled: release reserved stock back into available pool
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.stockBalance.update({
            where: {
              locationId_variantId: {
                locationId: order.fulfillmentLocationId!,
                variantId: item.variantId,
              },
            },
            data: {
              reservedOnline: { decrement: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              locationId: order.fulfillmentLocationId!,
              change: 0,
              reason: `RESERVATION_RELEASED_CANCELLATION_${order.orderNumber}`,
              actorEmail: 'SYSTEM_ORDER_RELEASE',
            },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            fulfillmentStatus: OrderFulfillmentStatus.CANCELLED,
            paymentStatus: PaymentStatus.FAILED,
          },
        });
      });

      return NextResponse.json({ success: true, message: 'Stock reservation released.' });
    }

    return NextResponse.json({ error: 'Invalid verification action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed.' }, { status: 500 });
  }
}