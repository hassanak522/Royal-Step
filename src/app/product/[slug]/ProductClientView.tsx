'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingBag, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ProductClientView({ product }: { product: any }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  // Default to the first available variant if present
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find this inside ProductClientView.tsx:
const handleAddToCart = () => {
  setErrorMsg('');

  if (!selectedVariant) {
    setErrorMsg('Please select a shoe size to proceed.');
    return;
  }

  setIsAdding(true);

  try {
    // Add the item to cart store including the required slug property
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug, // <--- ADD THIS LINE
      name: product.name,
      price: product.salePrice ?? product.basePrice,
      size: selectedVariant.sizeEU ?? selectedVariant.size ?? 42,
      color: selectedVariant.color || 'Standard',
      image: product.images?.[0] || '/placeholder.png',
      quantity: 1,
    });

    setTimeout(() => {
      router.push('/cart');
    }, 150);
  } catch (err) {
    console.error('Cart add error:', err);
    setIsAdding(false);
  }
};

  const currentPrice = product.salePrice ?? product.basePrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Gallery Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
          <Image
            src={product.images?.[0] || '/placeholder.png'}
            alt={product.name}
            fill
            priority
            className="object-cover"
          />
          {product.salePrice && (
            <span className="absolute top-4 left-4 bg-red-600 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded">
              Special Offer
            </span>
          )}
        </div>

        {/* Product Details & Size Picker */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase text-neutral-400 tracking-wider">
              {product.category} &bull; {product.material}
            </span>
            <h1 className="text-3xl font-black uppercase text-neutral-900 tracking-tight mt-1">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-black text-neutral-900 font-mono">
                Rs. {currentPrice.toLocaleString()}
              </span>
              {product.salePrice && (
                <span className="text-base text-neutral-400 line-through font-mono">
                  Rs. {product.basePrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-600 mt-4 leading-relaxed">
              {product.description ||
                'Pure handcrafted leather footwear crafted by master artisans. Features durable sole stitching, cushioned interior, and breathable full-grain leather.'}
            </p>
          </div>

          {/* Sizing Matrix */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Select Size (EU) *
              </label>
              <span className="text-[11px] text-neutral-500 underline cursor-pointer">
                Pakistan / EU Size Guide
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {product.variants?.map((v: any) => {
                const sizeNumber = v.sizeEU ?? v.size;
                const isSelected = selectedVariant?.id === v.id;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(v);
                      setErrorMsg('');
                    }}
                    className={`px-4 py-2.5 text-xs font-bold rounded-lg border transition ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-900'
                    }`}
                  >
                    EU {sizeNumber}
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-bold mt-2">{errorMsg}</p>
            )}
          </div>

          {/* Add to Bag Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
            >
              <ShoppingBag className="w-4 h-4" />
              {isAdding ? 'Adding to Cart...' : 'Add to Bag'}
            </button>

            {/* Badges */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-2 text-xs text-neutral-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Open-parcel inspection allowed on Cash on Delivery nationwide[cite: 1, 5].</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>7-Day size exchange policy at any of our 4 Karachi stores[cite: 1, 4].</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}