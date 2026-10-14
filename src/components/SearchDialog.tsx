'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  salePrice?: number | null;
  images: string[];
}

export default function SearchDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (Array.isArray(data)) setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search shoes by name, leather type, style (e.g. Peshawari, Oxford)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-neutral-900"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-4 divide-y divide-neutral-100">
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="py-8 text-center text-xs text-neutral-500">
              No matching footwear found for &quot;{query}&quot;. Try searching &quot;Peshawari&quot;, &quot;Oxford&quot;, or &quot;Loafer&quot;.
            </div>
          )}

          {results.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.slug}`}
              onClick={onClose}
              className="py-3 flex items-center justify-between hover:bg-neutral-50 px-2 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">{item.name}</h4>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-neutral-900">
                  Rs. {(item.salePrice ?? item.basePrice).toLocaleString()}
                </span>
                {item.salePrice && (
                  <span className="block text-[10px] text-neutral-400 line-through">
                    Rs. {item.basePrice.toLocaleString()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}