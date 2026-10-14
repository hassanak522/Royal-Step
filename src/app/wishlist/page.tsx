'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlistStore } from '@/store/useWishlistStore';
import { Trash2, Heart, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const [isClient, setIsClient] = useState(false);
  const { items, toggleWishlist, clearWishlist } = useWishlistStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-3"/>
        <h1 className="text-2xl font-black uppercase text-neutral-900">Your Wishlist is Empty</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Save your favorite handcrafted leather pairs to keep track of them.
        </p>
        <Link className="mt-6 inline-block px-6 py-2.5 bg-neutral-900 text-white rounded text-xs font-bold uppercase tracking-wider" href="/">
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex justify-between items-center pb-6 border-b">
        <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
          Saved Pairs ({items.length})
        </h1>
        <button
          onClick={clearWishlist}
          className="text-xs text-red-600 font-semibold hover:underline"
        >
          Clear All
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.productId} className="border rounded-lg overflow-hidden bg-white shadow-xs p-3 flex flex-col justify-between">
            <div className="relative w-full aspect-square rounded bg-neutral-100 overflow-hidden mb-3">
              <Image alt="{item.name}" className="object-cover" fill src="{item.image}"/>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-xs text-neutral-900 line-clamp-1">{item.name}</h3>
              <p className="text-xs font-black text-neutral-900">Rs. {item.price.toLocaleString()}</p>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <Link className="text-xs font-bold text-neutral-900 flex items-center gap-1 hover:underline" href="{`/product/${item.slug}`}">
                Choose Size <ArrowRight className="w-3.5 h-3.5"/>
              </Link>
              <button
                onClick={() => toggleWishlist(item)}
                className="text-neutral-400 hover:text-red-600"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}