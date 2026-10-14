import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';
import { LocationType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'suppliers';

    if (type === 'suppliers') {
      const suppliers = await prisma.supplier.findMany({
        include: { purchaseOrders: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(suppliers);
    }

    if (type === 'purchase-orders') {
      const pos = await prisma.purchaseOrder.findMany({
        include: {
          supplier: true,
          location: true,
          items: { include: { variant: { include: { product: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(pos);
    }

    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch procurement data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // Create New Supplier Profile
    if (action === 'CREATE_SUPPLIER') {
      const { name, contactPerson, phone, email, address, city } = body;
      const supplier = await prisma.supplier.create({
        data: {
          name,
          contactPerson,
          phone,
          email,
          address,
          city: city || 'Karachi',
        },
      });
      return NextResponse.json(supplier, { status: 201 });
    }

    // Create New Purchase Order
    if (action === 'CREATE_PO') {
      const { supplierId, items, notes } = body;
      const warehouse = await prisma.location.findFirst({
        where: { type: LocationType.CENTRAL_WAREHOUSE, isActive: true },
      });

      if (!warehouse) {
        return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
      }

      let totalCost = 0;
      for (const item of items) {
        totalCost += (item.unitCost || 0) * item.quantity;
      }

      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-KHI-${Date.now().toString().slice(-6)}`,
          supplierId,
          locationId: warehouse.id,
          totalCost,
          notes,
          status: 'PENDING',
          items: {
            create: items.map((i: any) => ({
              variantId: i.variantId,
              quantityOrdered: i.quantity,
              unitCost: i.unitCost,
            })),
          },
        },
        include: { items: true, supplier: true },
      });

      return NextResponse.json(po, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Procurement error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}