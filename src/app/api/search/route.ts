import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Typo normalization dictionary for local footwear terms
function normalizeSearchTerm(term: string): string {
  const t = term.toLowerCase().trim();
  if (t.includes('peshawr') || t.includes('pashawari') || t.includes('chappal')) return 'peshawari';
  if (t.includes('kaptan') || t.includes('kaptaan') || t.includes('captan')) return 'kaptaan';
  if (t.includes('oxfrd')) return 'oxford';
  if (t.includes('lofr') || t.includes('loafr')) return 'loafer';
  return t;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q') || '';
    const query = normalizeSearchTerm(rawQuery);

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const matchedProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { material: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { subCategory: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        subCategory: true,
        basePrice: true,
        salePrice: true,
        images: true,
      },
      take: 6,
    });

    return NextResponse.json(matchedProducts);
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}