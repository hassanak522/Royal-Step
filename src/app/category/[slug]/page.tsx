import { notFound } from 'next/navigation';
import { CategoryType } from '@/types/product';
import { PRODUCTS } from '@/data/products';
import CategoryClientView from './CategoryClientView';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const VALID_CATEGORIES: CategoryType[] = ['men', 'women', 'kids', 'traditional'];

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  if (!VALID_CATEGORIES.includes(slug as CategoryType)) {
    notFound();
  }

  return (
    <CategoryClientView
      category={slug as CategoryType}
      initialProducts={PRODUCTS}
    />
  );
}