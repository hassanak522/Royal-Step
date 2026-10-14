'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, CategoryType, SubCategoryType } from '@/types/product';
import { ArrowRight, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { PRODUCTS } from '@/data/products';

interface PLPProps {
  category: CategoryType;
  initialProducts: Product[];
}

export default function CategoryClientView({ category, initialProducts = PRODUCTS,}: PLPProps) {
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Available dynamic filter choices derived from current category catalog
  const availableMaterials = useMemo(() => {
    return Array.from(new Set(initialProducts.map((p) => p.material).filter(Boolean)));
  }, [initialProducts]);

  // Multi-attribute filtering pipeline
  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((p) => p.category === category);

    if (selectedSubCategory !== 'all') {
      result = result.filter((p) => p.subCategory === selectedSubCategory);
    }

    if (selectedMaterial !== 'all') {
      result = result.filter((p) => p.material === selectedMaterial);
    }

    if (selectedSize !== null) {
      result = result.filter((p) =>
        p.variants.some((v) => (v.sizeEU ?? v.size) === selectedSize && v.stockCount > 0)
      );
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice));
    }

    return result;
  }, [initialProducts, category, selectedSubCategory, selectedMaterial, selectedSize, sortBy]);

  const clearAllFilters = () => {
    setSelectedSubCategory('all');
    setSelectedSize(null);
    setSelectedMaterial('all');
    setSortBy('featured');
  };

  const hasActiveFilters =
    selectedSubCategory !== 'all' || selectedSize !== null || selectedMaterial !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Category Header */}
      <div className="border-b pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Catalog &bull; {category}
          </span>
          <h1 className="text-3xl font-black uppercase text-neutral-900 mt-1">
            {category === 'traditional'
              ? 'Peshawari & Kaptaan Chappals'
              : `${category}'s Footwear Collection`}
          </h1>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 border rounded-md text-xs font-bold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5"/> Filters
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid with Sidebar Filter */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block space-y-6 border-r pr-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-red-600 font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3"/> Reset
              </button>
            )}
          </div>

          {/* Size Filter Pills */}
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 mb-2">
              Select Size (EU)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[39, 40, 41, 42, 43, 44, 45].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                  className={`py-1.5 text-xs font-bold rounded border transition ${
                    selectedSize === sz
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Leather Material Filter */}
          {availableMaterials.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-2">
                Leather Material
              </label>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="material"
                    checked={selectedMaterial === 'all'}
                    onChange={() => setSelectedMaterial('all')}
                  />
                  <span>All Materials</span>
                </label>
                {availableMaterials.map((mat) => (
                  <label key={mat} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="material"
                      checked={selectedMaterial === mat}
                      onChange={() => setSelectedMaterial(mat)}
                    />
                    <span>{mat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="lg:col-span-3">
          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedSize && (
                <span className="inline-flex items-center gap-1 text-xs bg-neutral-100 border px-2.5 py-1 rounded-full font-medium">
                  Size: EU {selectedSize}
                  <button onClick={() => setSelectedSize(null)}>
                    <X className="w-3 h-3"/>
                  </button>
                </span>
              )}
              {selectedMaterial !== 'all' && (
                <span className="inline-flex items-center gap-1 text-xs bg-neutral-100 border px-2.5 py-1 rounded-full font-medium">
                  Material: {selectedMaterial}
                  <button onClick={() => setSelectedMaterial('all')}>
                    <X className="w-3 h-3"/>
                  </button>
                </span>
              )}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-xl">
              <p className="text-sm font-semibold text-neutral-800">No pairs match your filters.</p>
              <button
                onClick={clearAllFilters}
                className="mt-3 text-xs font-bold uppercase underline"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-xs flex flex-col justify-between"
                >
                  <div className="relative w-full aspect-square bg-neutral-100 overflow-hidden">
                    <Image alt="{product.name}" className="object-cover group-hover:scale-105 transition duration-300" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" src="{product.images[0]}"/>
                    {product.salePrice && (
                      <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded">
                        Sale
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {product.material}
                      </span>
                      <h3 className="font-bold text-sm text-neutral-900 mt-1 line-clamp-1">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      <span className="text-sm font-black text-neutral-900">
                        Rs. {(product.salePrice ?? product.basePrice).toLocaleString()}
                      </span>
                      <Link className="text-xs font-bold flex items-center gap-1 hover:underline" href="{`/product/${product.slug}`}">
                        Select Size <ArrowRight className="w-3.5 h-3.5"/>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}