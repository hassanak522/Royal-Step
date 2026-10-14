import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderNumber, phone, productName, currentSize, requestedSize, reason } = body;

    if (!orderNumber || !phone || !productName || !currentSize || !requestedSize) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Verify order exists
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber.trim(), mode: 'insensitive' },
        phone: { contains: phone.trim().slice(-9) },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'No order found matching these details. Please verify your Order ID and phone number.' },
        { status: 404 }
      );
    }

    const exchange = await prisma.exchangeRequest.create({
      data: {
        orderId: order.id,
        customerName: order.customerName,
        phone: order.phone,
        productName: productName.trim(),
        currentSize: parseInt(currentSize, 10),
        requestedSize: parseInt(requestedSize, 10),
        reason: reason || 'Size adjustment requested by customer',
        status: 'REQUESTED',
      },
    });

    return NextResponse.json({ success: true, exchangeId: exchange.id }, { status: 201 });
  } catch (error) {
    console.error('Exchange error:', error);
    return NextResponse.json({ error: 'Internal server error while processing exchange.' }, { status: 500 });
  }
}