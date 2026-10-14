'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  Store, 
  Boxes, 
  ShieldAlert, 
  MapPin, 
  Phone 
} from 'lucide-react';

export default function GlobalNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      {/* Top Operations Utility Strip */}
      <div className="bg-neutral-900 text-neutral-300 text-[11px] py-1.5 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            4 Karachi Physical Outlets Open &bull; Nationwide Courier Delivery[cite: 41, 44]
          </span>
        </div>

        {/* Omnichannel Workspaces Quick Switcher */}
        <div className="flex items-center gap-4 font-bold">
          <Link href="/pos" className="text-amber-400 hover:underline flex items-center gap-1">
            <Store className="w-3 h-3" /> Branch POS Desk[cite: 55]
          </Link>
          <span className="text-neutral-700">|</span>
          <Link href="/warehouse" className="hover:text-white flex items-center gap-1">
            <Boxes className="w-3 h-3" /> Central WMS[cite: 54]
          </Link>
          <span className="text-neutral-700">|</span>
          <Link href="/admin" className="hover:text-white">
            HQ Admin[cite: 53]
          </Link>
          <span className="text-neutral-700">|</span>
          <Link href="/marketing" className="hover:text-white">
            CMS & Marketing
          </Link>
        </div>
      </div>

      {/* Main Brand & Category Navigation Bar (Wireframe E1) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-black text-xl uppercase tracking-tighter text-neutral-900">
            Royal Step
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-neutral-700">
            <Link href="/category/men" className="hover:text-black">Men</Link>
            <Link href="/category/traditional" className="hover:text-black">Peshawari & Kaptaan</Link>
            <Link href="/category/women" className="hover:text-black">Women</Link>
            <Link href="/category/kids" className="hover:text-black">Kids</Link>
            <Link href="/track" className="hover:text-black">Track Order</Link>
            <Link href="/exchange" className="hover:text-black text-amber-800">Size Exchange</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/wishlist" className="p-2 text-neutral-700 hover:text-black">
            <Heart className="w-4 h-4" />
          </Link>
          <Link href="/cart" className="p-2 text-neutral-900 hover:text-black relative">
            <ShoppingBag className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}