import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, subCategory, basePrice, salePrice, material, description, images, color, variants } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        category,
        subCategory,
        basePrice: parseFloat(basePrice),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        material: material || 'Genuine Leather',
        description: description || 'Handcrafted Pakistani pure leather shoes.',
        images: images.length ? images : ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80'],
        variants: {
          create: variants.map((v: any) => ({
            sku: `${slug.slice(0, 3)}-${v.size}-${Date.now().toString().slice(-4)}`,
            size: v.size,
            sizeUK: v.sizeUK || null,
            color: color || 'Classic Black',
            stockCount: parseInt(v.stockCount) || 0,
          })),
        },
      },
      include: { variants: true },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}