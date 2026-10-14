import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized POS Terminal access' }, { status: 401 });
    }

    const {
      branchCode,
      items,
      tenderType,     // 'CASH' | 'CARD' | 'SPLIT'
      cashAmount,
      cardAmount,
      customerPhone,
      discount = 0,
    } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Sale cart is empty' }, { status: 400 });
    }

    // 1. Verify and lock the branch
    const branch = await prisma.location.findUnique({
      where: { code: branchCode },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Invalid store location' }, { status: 404 });
    }

    // 2. Validate local stock at this branch
    let calculatedSubtotal = 0;
    const validatedItems: {
      variantId: string;
      productName: string;
      sku: string;
      sizeEU: number;
      price: number;
      quantity: number;
    }[] = [];

    for (const item of items) {
      const stockRec = await prisma.stockBalance.findUnique({
        where: {
          locationId_variantId: {
            locationId: branch.id,
            variantId: item.variantId,
          },
        },
        include: { variant: { include: { product: true } } },
      });

      if (!stockRec || stockRec.onHand < item.quantity) {
        return NextResponse.json(
          {
            error: `Out of stock at ${branch.name} for ${stockRec?.variant.product.name ?? 'item'} (EU ${stockRec?.variant.sizeEU}). Available: ${stockRec?.onHand ?? 0}`,
          },
          { status: 400 }
        );
      }

      const unitPrice = stockRec.variant.product.salePrice ?? stockRec.variant.product.basePrice;
      calculatedSubtotal += unitPrice * item.quantity;

      validatedItems.push({
        variantId: stockRec.variantId,
        productName: stockRec.variant.product.name,
        sku: stockRec.variant.sku,
        sizeEU: stockRec.variant.sizeEU,
        price: unitPrice,
        quantity: item.quantity,
      });
    }

    const grandTotal = Math.max(0, calculatedSubtotal - discount);

    // Generate branch-specific receipt sequence (e.g. RCP-CLIFTON-2026-9810)
    const branchPrefix = branch.code.replace('RET-KHI-', 'KHI');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RCP-${branchPrefix}-${Date.now().toString().slice(-4)}${randomSuffix}`;

    // 3. Atomic Transaction: Deduct local stock, record receipt, and log ledger
    const receipt = await prisma.$transaction(async (tx) => {
      for (const item of validatedItems) {
        await tx.stockBalance.update({
          where: {
            locationId_variantId: {
              locationId: branch.id,
              variantId: item.variantId,
            },
          },
          data: { onHand: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            locationId: branch.id,
            change: -item.quantity,
            reason: 'POS_IN_STORE_SALE',
            referenceId: receiptNumber,
            actorEmail: session.email,
          },
        });
      }

      return await tx.posReceipt.create({
        data: {
          receiptNumber,
          locationId: branch.id,
          staffUserId: session.id,
          cashierName: session.name,
          subtotal: calculatedSubtotal,
          discount,
          total: grandTotal,
          tenderType,
          cashAmount: tenderType === 'CARD' ? 0 : (cashAmount || grandTotal),
          cardAmount: tenderType === 'CASH' ? 0 : (cardAmount || grandTotal),
          itemsJson: validatedItems,
        },
      });
    });

    return NextResponse.json({ success: true, receipt }, { status: 201 });
  } catch (error) {
    console.error('POS sale execution failed:', error);
    return NextResponse.json({ error: 'Failed to complete POS transaction' }, { status: 500 });
  }
}