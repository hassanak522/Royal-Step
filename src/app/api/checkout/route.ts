import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LocationType, ChannelType, PaymentStatus, OrderFulfillmentStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const idempotencyKey = req.headers.get('x-idempotency-key') || `CHK-${crypto.randomUUID()}`;
    const body = await req.json();
    const { customer, items, paymentMethod, notes } = body;

    if (!customer?.fullName || !customer?.phone || !customer?.address || !customer?.city) {
      return NextResponse.json({ error: 'Incomplete delivery information.' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    // 1. Check Idempotency Record
    const existingRecord = await prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey },
    });
    if (existingRecord) {
      return NextResponse.json(existingRecord.responseBody, { status: existingRecord.responseStatus });
    }

    // 2. Locate Active Central Warehouse
    const warehouse = await prisma.location.findFirst({
      where: { type: LocationType.CENTRAL_WAREHOUSE, isActive: true },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Central Warehouse allocation system is offline.' }, { status: 500 });
    }

    // 3. Execute Atomic Transaction: Validate & Reserve Warehouse Stock
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const validatedItems: {
        variantId: string;
        productName: string;
        sizeEU: number;
        color: string;
        unitPrice: number;
        costPrice: number;
        quantity: number;
      }[] = [];

      for (const item of items) {
        // Query stock balance strictly locked for this warehouse
        const balance = await tx.stockBalance.findUnique({
          where: {
            locationId_variantId: {
              locationId: warehouse.id,
              variantId: item.variantId,
            },
          },
          include: {
            variant: {
              include: { product: true },
            },
          },
        });

        if (!balance) {
          throw new Error(`Variant ${item.variantId} is not registered at the central warehouse.`);
        }

        // Available-To-Sell (ATS) = onHand - reservedOnline - reservedTransfer - damaged - safetyBuffer
        const sellableStock =
          balance.onHand -
          balance.reservedOnline -
          balance.reservedTransfer -
          balance.damaged -
          balance.safetyBuffer;

        if (sellableStock < item.quantity) {
          throw new Error(
            `Insufficient warehouse stock for ${balance.variant.product.name} (EU ${balance.variant.sizeEU}). Only ${Math.max(
              0,
              sellableStock
            )} available.`
          );
        }

        const unitPrice = balance.variant.product.salePrice ?? balance.variant.product.basePrice;
        const costPrice = balance.variant.product.costPrice ?? 0;
        subtotal += unitPrice * item.quantity;

        validatedItems.push({
          variantId: balance.variant.id,
          productName: balance.variant.product.name,
          sizeEU: balance.variant.sizeEU,
          color: balance.variant.color,
          unitPrice,
          costPrice,
          quantity: item.quantity,
        });

        // Atomically increment online reservation (does not alter physical onHand until courier handover)
        await tx.stockBalance.update({
          where: { id: balance.id },
          data: { reservedOnline: { increment: item.quantity } },
        });

        // Audit in Stock Movement Ledger
        await tx.stockMovement.create({
          data: {
            variantId: balance.variant.id,
            locationId: warehouse.id,
            change: 0, // Physical stock remains on shelf
            reason: `ONLINE_STOCK_RESERVATION_${idempotencyKey}`,
            actorEmail: 'STOREFRONT_GUEST_CHECKOUT',
          },
        });
      }

      // Settings and Delivery Calculation
      const settings = await tx.storeSetting.findUnique({ where: { id: 'default' } });
      const freeThreshold = settings?.freeShippingThreshold ?? 4999;
      const flatShipping = settings?.flatShippingRate ?? 200;
      const deliveryFee = subtotal >= freeThreshold ? 0 : flatShipping;
      const grandTotal = subtotal + deliveryFee;

      const orderNumber = `RS-ON-${Math.floor(100000 + Math.random() * 900000)}`;
      const itemSummary = validatedItems
        .map((i) => `${i.productName} (EU ${i.sizeEU} × ${i.quantity})`)
        .join(', ');

      const order = await tx.order.create({
        data: {
          orderNumber,
          channel: ChannelType.ONLINE_STORE,
          fulfillmentLocationId: warehouse.id,
          customerName: customer.fullName.trim(),
          phone: customer.phone.trim(),
          altPhone: customer.altPhone?.trim() || null,
          province: customer.province || 'Sindh',
          city: customer.city.trim(),
          area: customer.area.trim(),
          address: customer.address.trim(),
          landmark: customer.landmark?.trim() || null,
          notes: notes?.trim() || null,
          paymentMethod: paymentMethod || 'COD',
          paymentStatus: paymentMethod === 'COD' ? PaymentStatus.COD_PENDING_COLLECTION : PaymentStatus.PENDING,
          fulfillmentStatus:
            paymentMethod === 'COD'
              ? OrderFulfillmentStatus.AWAITING_CONFIRMATION
              : OrderFulfillmentStatus.CONFIRMED,
          subtotal,
          deliveryFee,
          total: grandTotal,
          itemSummary,
          items: {
            create: validatedItems.map((v) => ({
              variantId: v.variantId,
              productName: v.productName,
              sizeEU: v.sizeEU,
              color: v.color,
              unitPrice: v.unitPrice,
              costPrice: v.costPrice,
              quantity: v.quantity,
            })),
          },
        },
      });

      // Write Outbox Event for downstream systems
      await tx.outboxEvent.create({
        data: {
          idempotencyKey: `ORDER-CREATED-${order.id}`,
          aggregateType: 'ORDER',
          aggregateId: order.orderNumber,
          eventType: 'ORDER.CREATED_UNPAID',
          sourceApp: 'ONLINE_STOREFRONT',
          sourceLocationId: warehouse.id,
          payload: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            paymentMethod: order.paymentMethod,
          },
        },
      });

      return order;
    });

    const responsePayload = {
      success: true,
      orderNumber: result.orderNumber,
      orderId: result.id,
      paymentMethod: result.paymentMethod,
      total: result.total,
    };

    // Cache idempotency response for 72 hours
    await prisma.idempotencyRecord.create({
      data: {
        key: idempotencyKey,
        resourcePath: '/api/checkout',
        responseStatus: 201,
        responseBody: responsePayload,
        expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
      },
    });

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error: any) {
    console.error('Checkout Reservation Error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed.' }, { status: 400 });
  }
}