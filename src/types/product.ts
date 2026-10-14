export type CategoryType = 'men' | 'women' | 'kids' | 'traditional';
export type SubCategoryType = 
  | 'casual' 
  | 'formal' 
  | 'traditional' 
  | 'sports' 
  | 'peshawari' 
  | 'kaptaan' 
  | 'khussa';

export interface ProductVariant {
  id: string;
  sku: string;
  size: number; // Primary EU standard size (e.g. 39, 40, 41, 42...)
  sizeEU?: number;
  sizeUK?: number;
  lengthCm?: number;
  lengthInches?: number;
  color: string;
  stockCount: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategoryType;
  subCategory: SubCategoryType;
  basePrice: number;
  salePrice?: number;
  description: string;
  material: string;
  images: string[];
  variants: ProductVariant[];
  isFeatured?: boolean;
}