import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LocationType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { customer, paymentMethod, items } = await req.json();

    if (!customer?.fullName || !customer?.phone || !customer?.address || !customer?.city) {
      return NextResponse.json({ error: 'Incomplete delivery information.' }, { status: 400 });
    }

    // 1. Locate Karachi Central Warehouse
    const warehouse = await prisma.location.findFirst({
      where: { type: LocationType.CENTRAL_WAREHOUSE, isActive: true },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Central Warehouse allocation system offline.' }, { status: 500 });
    }

    // 2. Authoritative check on Central Warehouse Sellable Stock
    let calculatedSubtotal = 0;
    const validatedItems: {
      variantId: string;
      productName: string;
      sizeEU: number;
      color: string;
      unitPrice: number;
      quantity: number;
    }[] = [];

    for (const item of items) {
      const balance = await prisma.stockBalance.findUnique({
        where: {
          locationId_variantId: {
            locationId: warehouse.id,
            variantId: item.variantId,
          },
        },
        include: { variant: { include: { product: true } } },
      });

      if (!balance) {
        return NextResponse.json({ error: 'Selected footwear variant not stocked at warehouse.' }, { status: 400 });
      }

      // Sellable Available-to-Sell (ATS) = OnHand - ReservedOnline - ReservedTransfer - Damaged - SafetyBuffer
      const availableToSell = balance.onHand - balance.reservedOnline - balance.reservedTransfer - balance.damaged - balance.safetyBuffer;

      if (availableToSell < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient online warehouse stock for ${balance.variant.product.name} (EU ${balance.variant.sizeEU}). Only ${Math.max(0, availableToSell)} available for nationwide shipping.` },
          { status: 400 }
        );
      }

      const price = balance.variant.product.salePrice ?? balance.variant.product.basePrice;
      calculatedSubtotal += price * item.quantity;

      validatedItems.push({
        variantId: balance.variant.id,
        productName: balance.variant.product.name,
        sizeEU: balance.variant.sizeEU,
        color: balance.variant.color,
        unitPrice: price,
        quantity: item.quantity,
      });
    }

    const settings = await prisma.storeSetting.findUnique({ where: { id: 'default' } });
    const deliveryFee = calculatedSubtotal >= (settings?.freeShippingThreshold ?? 4999) ? 0 : (settings?.flatShippingRate ?? 200);
    const grandTotal = calculatedSubtotal + deliveryFee;

    const orderNumber = `RS-ON-${Math.floor(100000 + Math.random() * 900000)}`;
    const itemSummary = validatedItems.map((i) => `${i.productName} (EU ${i.sizeEU} × ${i.quantity})`).join(', ');

    // 3. Atomic Transaction: Reserve warehouse stock and create tagged online order
    const createdOrder = await prisma.$transaction(async (tx) => {
      for (const item of validatedItems) {
        // Increment reservedOnline without touching physical onHand yet (held until dispatch)
        await tx.stockBalance.update({
          where: {
            locationId_variantId: {
              locationId: warehouse.id,
              variantId: item.variantId,
            },
          },
          data: {
            reservedOnline: { increment: item.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            locationId: warehouse.id,
            change: -item.quantity,
            reason: 'ONLINE_ORDER_RESERVATION',
            referenceId: orderNumber,
            actorEmail: 'STOREFRONT_GUEST_CHECKOUT',
          },
        });
      }

      return await tx.order.create({
        data: {
          orderNumber,
          fulfillmentLocationId: warehouse.id,
          customerName: customer.fullName.trim(),
          phone: customer.phone.trim(),
          altPhone: customer.altPhone?.trim() || null,
          province: customer.province || 'Sindh',
          city: customer.city.trim(),
          area: customer.area.trim(),
          address: customer.address.trim(),
          landmark: customer.landmark?.trim() || null,
          notes: customer.notes?.trim() || null,
          paymentMethod: paymentMethod || 'COD',
          paymentStatus: paymentMethod === 'COD' ? 'COD_PENDING_COLLECTION' : 'PENDING',
          subtotal: calculatedSubtotal,
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
              quantity: v.quantity,
            })),
          },
        },
      });
    });

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Online checkout failed:', error);
    return NextResponse.json({ error: 'Server order creation error' }, { status: 500 });
  }
}