import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { ReturnStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { orderNumber, phone, productName, currentSize, requestedSize, requestType, reason } = await req.json();

    // 1. Locate Order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber.trim(), mode: 'insensitive' },
        phone: { contains: phone.trim().slice(-9) },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found matching provided details.' }, { status: 404 });
    }

    const ticketNumber = `RET-${Math.floor(1000 + Math.random() * 9000)}`;

    const ret = await prisma.returnRequest.create({
      data: {
        ticketNumber,
        orderId: order.id,
        channel: order.channel,
        customerName: order.customerName,
        phone: order.phone,
        productName,
        currentSize: parseInt(currentSize, 10),
        requestedSize: requestedSize ? parseInt(requestedSize, 10) : null,
        requestType: requestType || 'EXCHANGE',
        reason,
        status: ReturnStatus.REQUESTED,
      },
    });

    return NextResponse.json({ success: true, returnRequest: ret }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log return ticket.' }, { status: 500 });
  }
}

// Staff Inspection & Restock/Quarantine (Step 5 of Diagram 2)
export async function PATCH(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticketId, inspectionApproved, inspectNotes } = await req.json();

    const ret = await prisma.returnRequest.findUnique({
      where: { id: ticketId },
      include: { order: true },
    });

    if (!ret) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

    if (inspectionApproved) {
      // If approved exchange: allocate replacement variant; if approved refund: authorize payout
      const updated = await prisma.returnRequest.update({
        where: { id: ticketId },
        data: {
          status:
            ret.requestType === 'EXCHANGE'
              ? ReturnStatus.EXCHANGE_ALLOCATED
              : ReturnStatus.REFUND_APPROVED,
          inspectNotes,
        },
      });

      return NextResponse.json({ success: true, returnRequest: updated });
    } else {
      // Rejection or damaged quarantine
      const updated = await prisma.returnRequest.update({
        where: { id: ticketId },
        data: {
          status: ReturnStatus.QUARANTINED,
          inspectNotes: `Rejected: ${inspectNotes}`,
        },
      });

      return NextResponse.json({ success: true, returnRequest: updated });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Inspection processing failed.' }, { status: 500 });
  }
}