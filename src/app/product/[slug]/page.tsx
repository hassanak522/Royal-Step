import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductClientView from './ProductClientView';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // 1. Fetch product with its variants from the database
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: {
        include: {
          stockBalances: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // 2. Render client view
  return <ProductClientView product={product} />;
}