import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { PaymentStatus, OrderFulfillmentStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'FINANCE_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized: Finance privileges required.' }, { status: 403 });
    }

    const { cnNumbers, bankReference } = await req.json();

    if (!cnNumbers || !Array.isArray(cnNumbers)) {
      return NextResponse.json({ error: 'Missing CN numbers list.' }, { status: 400 });
    }

    const settledOrders: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const cn of cnNumbers) {
        const order = await tx.order.findFirst({
          where: { leopardCn: cn, codSettled: false },
        });

        if (!order) continue;

        await tx.order.update({
          where: { id: order.id },
          data: {
            codSettled: true,
            codSettledAt: new Date(),
            paymentStatus: PaymentStatus.COD_REMITTED,
            fulfillmentStatus: OrderFulfillmentStatus.CLOSED,
          },
        });

        await tx.outboxEvent.create({
          data: {
            idempotencyKey: `COD-SETTLED-${order.id}`,
            aggregateType: 'ORDER',
            aggregateId: order.orderNumber,
            eventType: 'FINANCE.COD_SETTLED',
            sourceApp: 'FINANCE_RECONCILIATION',
            payload: {
              orderNumber: order.orderNumber,
              amount: order.total,
              bankReference,
            },
          },
        });

        settledOrders.push(order.orderNumber);
      }
    });

    return NextResponse.json({
      success: true,
      settledCount: settledOrders.length,
      orders: settledOrders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Settlement failed.' }, { status: 500 });
  }
}