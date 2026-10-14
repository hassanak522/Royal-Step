import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const branchCode = searchParams.get('branchCode') || 'RET-KHI-01';

    if (!query) return NextResponse.json([]);

    const branch = await prisma.location.findUnique({
      where: { code: branchCode },
    });

    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    const variants = await prisma.productVariant.findMany({
      where: {
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { equals: query } },
          { product: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        product: true,
        stockBalances: {
          where: { locationId: branch.id },
        },
      },
      take: 8,
    });

    const results = variants.map((v) => ({
      variantId: v.id,
      sku: v.sku,
      barcode: v.barcode,
      name: v.product.name,
      sizeEU: v.sizeEU,
      color: v.color,
      price: v.product.salePrice ?? v.product.basePrice,
      branchStock: v.stockBalances[0]?.onHand ?? 0,
      image: v.product.images[0] ?? '',
    }));

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}