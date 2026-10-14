import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PRODUCTS } from '@/data/products';
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export default function HomePage() {
  const featuredShoes = PRODUCTS.filter((p) => p.isFeatured);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-neutral-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
            Handcrafted in Pakistan &bull; Karachi Outlets
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            CRAFTED FOR COMFORT. <br className="hidden sm:inline" /> BUILT TO LAST.
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Explore premium cow leather formals, authentic Peshawari chappals, and daily casuals. Order online with Cash on Delivery or visit our outlets across Karachi.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              href="/category/men"
              className="bg-white text-neutral-900 px-6 py-3.5 rounded font-bold text-sm hover:bg-neutral-200 transition"
            >
              Shop Men&apos;s Collection
            </Link>
            <Link
              href="/stores"
              className="border border-white/60 text-white px-6 py-3.5 rounded font-bold text-sm hover:bg-white hover:text-neutral-900 transition"
            >
              View Karachi Outlets
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <Truck className="w-8 h-8 text-neutral-800 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-neutral-900">Karachi Delivery in 24-48 Hours</h4>
              <p className="text-xs text-neutral-500">Fast shipping with Leopard COD available</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-neutral-200 pt-4 md:pt-0 md:pl-6">
            <RotateCcw className="w-8 h-8 text-neutral-800 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-neutral-900">7-Day Size Exchange</h4>
              <p className="text-xs text-neutral-500">Exchange at any branch or via courier</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-neutral-200 pt-4 md:pt-0 md:pl-6">
            <ShieldCheck className="w-8 h-8 text-neutral-800 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-neutral-900">100% Genuine Leather</h4>
              <p className="text-xs text-neutral-500">Directly from our artisan tanneries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900 uppercase">
              Featured Footwear
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Our top-rated designs across Karachi branches</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredShoes.map((product) => (
            <div
              key={product.id}
              className="group border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col justify-between"
            >
              <div className="relative w-full aspect-square bg-neutral-100 overflow-hidden">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
                {product.salePrice && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded">
                    Sale
                  </span>
                )}
              </div>

              <div className="p-5 flex flex-col flex-grow justify-between">
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    {product.category} &bull; {product.subCategory}
                  </span>
                  <h3 className="font-bold text-base text-neutral-900 mt-1 group-hover:text-neutral-600 transition">
                    {product.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-neutral-900">
                      Rs. {(product.salePrice ?? product.basePrice).toLocaleString()}
                    </span>
                    {product.salePrice && (
                      <span className="text-xs text-neutral-400 line-through ml-2">
                        Rs. {product.basePrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/product/${product.slug}`}
                    className="text-xs font-bold flex items-center gap-1 text-neutral-900 group-hover:translate-x-0.5 transition"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}