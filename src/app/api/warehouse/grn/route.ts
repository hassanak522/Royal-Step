import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { LocationType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'WAREHOUSE_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized: Warehouse receiving privileges required.' }, { status: 403 });
    }

    const { supplierId, items, poNumber, notes } = await req.json();

    // 1. Locate Central Warehouse
    const warehouse = await prisma.location.findFirst({
      where: { type: LocationType.CENTRAL_WAREHOUSE, isActive: true },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Central Warehouse not configured.' }, { status: 500 });
    }

    // 2. Atomic Transaction: Record PO/GRN, increment warehouse onHand, and log movement
    const result = await prisma.$transaction(async (tx) => {
      let totalCost = 0;
      for (const item of items) {
        totalCost += item.unitCost * item.quantity;
      }

      const po = await tx.purchaseOrder.create({
        data: {
          poNumber: poNumber || `PO-KHI-${Date.now().toString().slice(-6)}`,
          supplierId,
          locationId: warehouse.id,
          status: 'COMPLETED',
          totalCost,
          notes,
          items: {
            create: items.map((i: any) => ({
              variantId: i.variantId,
              quantityOrdered: i.quantity,
              quantityReceived: i.quantity,
              unitCost: i.unitCost,
            })),
          },
        },
      });

      for (const item of items) {
        // Increment Central Warehouse Stock Balance
        await tx.stockBalance.upsert({
          where: {
            locationId_variantId: {
              locationId: warehouse.id,
              variantId: item.variantId,
            },
          },
          update: { onHand: { increment: item.quantity } },
          create: {
            locationId: warehouse.id,
            variantId: item.variantId,
            onHand: item.quantity,
          },
        });

        // Write to Auditable Stock Movement Ledger
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            locationId: warehouse.id,
            change: item.quantity,
            reason: `SUPPLIER_GRN_${po.poNumber}`,
            referenceId: po.poNumber,
            actorEmail: session.email,
          },
        });
      }

      return po;
    });

    return NextResponse.json({ success: true, purchaseOrder: result }, { status: 201 });
  } catch (error) {
    console.error('GRN Receiving failed:', error);
    return NextResponse.json({ error: 'Failed to process Goods Receiving Note.' }, { status: 500 });
  }
}