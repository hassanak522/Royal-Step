import { Product } from '@/types/product';

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Handcrafted Oxford Leather Shoes',
    slug: 'handcrafted-oxford-leather-shoes',
    category: 'men',
    subCategory: 'formal',
    basePrice: 11999,
    salePrice: 9499,
    description: 'Precision handcrafted using premium full-grain cow leather. Ideal for corporate wear, weddings, and formal occasions.',
    material: 'Full-Grain Cow Leather',
    images: [
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    variants: [
      { id: 'v1-39', sku: 'OX-BLK-39', size: 39, sizeEU: 39, sizeUK: 5.5, lengthCm: 24.5, lengthInches: 9.6, color: 'Onyx Black', stockCount: 5 },
      { id: 'v1-40', sku: 'OX-BLK-40', size: 40, sizeEU: 40, sizeUK: 6.5, lengthCm: 25.0, lengthInches: 9.8, color: 'Onyx Black', stockCount: 8 },
      { id: 'v1-41', sku: 'OX-BLK-41', size: 41, sizeEU: 41, sizeUK: 7.5, lengthCm: 26.0, lengthInches: 10.2, color: 'Onyx Black', stockCount: 12 },
      { id: 'v1-42', sku: 'OX-BLK-42', size: 42, sizeEU: 42, sizeUK: 8.0, lengthCm: 26.5, lengthInches: 10.4, color: 'Onyx Black', stockCount: 0 },
      { id: 'v1-43', sku: 'OX-BLK-43', size: 43, sizeEU: 43, sizeUK: 9.0, lengthCm: 27.5, lengthInches: 10.8, color: 'Onyx Black', stockCount: 6 },
      { id: 'v1-44', sku: 'OX-BLK-44', size: 44, sizeEU: 44, sizeUK: 9.5, lengthCm: 28.0, lengthInches: 11.0, color: 'Onyx Black', stockCount: 4 },
      { id: 'v1-45', sku: 'OX-BLK-45', size: 45, sizeEU: 45, sizeUK: 10.5, lengthCm: 29.0, lengthInches: 11.4, color: 'Onyx Black', stockCount: 2 }
    ]
  },
  {
    id: 'prod-2',
    name: 'Classic Penny Loafer',
    slug: 'classic-penny-loafer',
    category: 'men',
    subCategory: 'casual',
    basePrice: 8499,
    description: 'Effortless slip-on loafers crafted with cushioned insoles for comfortable all-day office and weekend wear.',
    material: 'Genuine Suede Leather',
    images: [
      'https://images.unsplash.com/photo-1582895101673-9a4f66453676?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    variants: [
      { id: 'v2-40', sku: 'LF-BRN-40', size: 40, sizeEU: 40, sizeUK: 6.5, lengthCm: 25.0, lengthInches: 9.8, color: 'Tan Brown', stockCount: 7 },
      { id: 'v2-41', sku: 'LF-BRN-41', size: 41, sizeEU: 41, sizeUK: 7.5, lengthCm: 26.0, lengthInches: 10.2, color: 'Tan Brown', stockCount: 10 },
      { id: 'v2-42', sku: 'LF-BRN-42', size: 42, sizeEU: 42, sizeUK: 8.0, lengthCm: 26.5, lengthInches: 10.4, color: 'Tan Brown', stockCount: 5 },
      { id: 'v2-43', sku: 'LF-BRN-43', size: 43, sizeEU: 43, sizeUK: 9.0, lengthCm: 27.5, lengthInches: 10.8, color: 'Tan Brown', stockCount: 3 }
    ]
  },
  {
    id: 'prod-3',
    name: 'Traditional Kaptan Peshawari Chappal',
    slug: 'kaptan-peshawari-chappal',
    category: 'traditional',
    subCategory: 'kaptaan',
    basePrice: 6999,
    description: 'Iconic double-sole Kaptaan Peshawari chappal with durable tyre sole construction and contrast hand-stitching.',
    material: 'Natural Veg-Tanned Buffalo Leather',
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    variants: [
      { id: 'v3-40', sku: 'PSH-BLK-40', size: 40, sizeEU: 40, sizeUK: 6.5, lengthCm: 25.0, lengthInches: 9.8, color: 'Matte Black', stockCount: 9 },
      { id: 'v3-41', sku: 'PSH-BLK-41', size: 41, sizeEU: 41, sizeUK: 7.5, lengthCm: 26.0, lengthInches: 10.2, color: 'Matte Black', stockCount: 15 },
      { id: 'v3-42', sku: 'PSH-BLK-42', size: 42, sizeEU: 42, sizeUK: 8.0, lengthCm: 26.5, lengthInches: 10.4, color: 'Matte Black', stockCount: 11 },
      { id: 'v3-43', sku: 'PSH-BLK-43', size: 43, sizeEU: 43, sizeUK: 9.0, lengthCm: 27.5, lengthInches: 10.8, color: 'Matte Black', stockCount: 4 }
    ]
  },
  {
    id: 'prod-4',
    name: 'Elegance Block Heel Pump',
    slug: 'elegance-block-heel-pump',
    category: 'women',
    subCategory: 'formal',
    basePrice: 7999,
    salePrice: 5999,
    description: 'Sophisticated 2.5-inch block heel designed for high stability, padded footbed, and evening comfort.',
    material: 'Patent Leather Finish',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    variants: [
      { id: 'v4-36', sku: 'HL-BLK-36', size: 36, sizeEU: 36, sizeUK: 3.5, lengthCm: 22.5, lengthInches: 8.8, color: 'Nude Beige', stockCount: 6 },
      { id: 'v4-37', sku: 'HL-BLK-37', size: 37, sizeEU: 37, sizeUK: 4.5, lengthCm: 23.5, lengthInches: 9.2, color: 'Nude Beige', stockCount: 12 },
      { id: 'v4-38', sku: 'HL-BLK-38', size: 38, sizeEU: 38, sizeUK: 5.0, lengthCm: 24.0, lengthInches: 9.4, color: 'Nude Beige', stockCount: 8 },
      { id: 'v4-39', sku: 'HL-BLK-39', size: 39, sizeEU: 39, sizeUK: 5.5, lengthCm: 24.5, lengthInches: 9.6, color: 'Nude Beige', stockCount: 5 }
    ]
  },
  {
    id: 'prod-5',
    name: 'Kids Lightweight Active Sneakers',
    slug: 'kids-lightweight-active-sneakers',
    category: 'kids',
    subCategory: 'sports',
    basePrice: 3999,
    description: 'Durable breathable mesh sneaker with dual velcro closures for easy on-and-off during school and sports.',
    material: 'Engineered Breathable Mesh',
    images: [
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    variants: [
      { id: 'v5-28', sku: 'KD-BLU-28', size: 28, sizeEU: 28, sizeUK: 10.0, lengthCm: 17.5, lengthInches: 6.9, color: 'Navy Blue', stockCount: 8 },
      { id: 'v5-30', sku: 'KD-BLU-30', size: 30, sizeEU: 30, sizeUK: 11.5, lengthCm: 18.5, lengthInches: 7.3, color: 'Navy Blue', stockCount: 14 },
      { id: 'v5-32', sku: 'KD-BLU-32', size: 32, sizeEU: 32, sizeUK: 13.0, lengthCm: 20.0, lengthInches: 7.9, color: 'Navy Blue', stockCount: 9 }
    ]
  },
  {
    id: 'prod-6',
    name: 'Women Casual Comfort Mules',
    slug: 'women-casual-comfort-mules',
    category: 'women',
    subCategory: 'casual',
    basePrice: 5499,
    description: 'Minimalist slip-on mules featuring cushioned arch support and a lightweight rubber sole for day-long errands.',
    material: 'Soft Vegan Leather',
    images: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    variants: [
      { id: 'v6-37', sku: 'ML-TAN-37', size: 37, sizeEU: 37, sizeUK: 4.5, lengthCm: 23.5, lengthInches: 9.2, color: 'Tan', stockCount: 6 },
      { id: 'v6-38', sku: 'ML-TAN-38', size: 38, sizeEU: 38, sizeUK: 5.0, lengthCm: 24.0, lengthInches: 9.4, color: 'Tan', stockCount: 9 },
      { id: 'v6-39', sku: 'ML-TAN-39', size: 39, sizeEU: 39, sizeUK: 5.5, lengthCm: 24.5, lengthInches: 9.6, color: 'Tan', stockCount: 4 }
    ]
  },
  {
    id: 'prod-7',
    name: 'Boys Classic Formal School Shoes',
    slug: 'boys-classic-formal-school-shoes',
    category: 'kids',
    subCategory: 'formal',
    basePrice: 3499,
    description: 'Reinforced toe cap with scuff-resistant finish and non-marking soles designed for active school days.',
    material: 'Polished Genuine Leather',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    variants: [
      { id: 'v7-30', sku: 'SC-BLK-30', size: 30, sizeEU: 30, sizeUK: 11.5, lengthCm: 18.5, lengthInches: 7.3, color: 'School Black', stockCount: 15 },
      { id: 'v7-32', sku: 'SC-BLK-32', size: 32, sizeEU: 32, sizeUK: 13.0, lengthCm: 20.0, lengthInches: 7.9, color: 'School Black', stockCount: 10 },
      { id: 'v7-34', sku: 'SC-BLK-34', size: 34, sizeEU: 34, sizeUK: 1.5, lengthCm: 21.5, lengthInches: 8.5, color: 'School Black', stockCount: 8 }
    ]
  }
];