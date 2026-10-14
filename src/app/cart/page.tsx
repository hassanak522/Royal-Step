'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const [isClient, setIsClient] = useState(false);
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="min-h-[50vh] flex items-center justify-center text-xs text-neutral-400">Loading bag...</div>;
  }

  const subtotal = getTotalPrice();
  const deliveryFee = subtotal >= 4999 || subtotal === 0 ? 0 : 150;
  const grandTotal = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-neutral-900 uppercase">Your bag is empty</h2>
        <p className="mt-2 text-xs text-neutral-500">
          Looks like you haven&apos;t added any pairs yet. Explore our latest arrivals from Karachi workshops.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-neutral-900 text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight">
        Shopping Bag ({items.reduce((acc, i) => acc + i.quantity, 0)})
      </h1>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 p-4 border border-neutral-200 rounded-lg bg-white shadow-sm"
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-bold text-sm sm:text-base text-neutral-900 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-neutral-400 hover:text-red-600 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-1 flex gap-3 text-xs text-neutral-500">
                    <span>Size: <strong className="text-neutral-800 font-semibold">{item.size} (EU)</strong></span>
                    <span>&bull;</span>
                    <span>Color: <strong className="text-neutral-800 font-semibold">{item.color}</strong></span>
                  </div>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div className="flex items-center border border-neutral-300 rounded">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-neutral-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-neutral-900">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Delivery Threshold */}
        <div className="border border-neutral-200 rounded-lg p-6 bg-white shadow-sm h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Order Summary
          </h2>

          <div className="mt-4 space-y-3 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-neutral-900">
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase">Free</span>
                ) : (
                  `Rs. ${deliveryFee}`
                )}
              </span>
            </div>
            {subtotal < 4999 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded">
                Add Rs. {(4999 - subtotal).toLocaleString()} more to unlock <strong>Free Delivery</strong> in Karachi.
              </p>
            )}
          </div>

          <div className="h-px bg-neutral-200 my-4" />

          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold text-neutral-900">Total</span>
            <span className="text-xl font-black text-neutral-900">Rs. {grandTotal.toLocaleString()}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-6 w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-neutral-500" />
            <span>Guaranteed Safe & Secure Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}