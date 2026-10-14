'use client';

import React, { useState } from 'react';
import { Ruler, Check } from 'lucide-react';

interface SizeRow {
  eu: number;
  uk: number;
  us: number;
  cm: number;
  inch: number;
}

const FOOTWEAR_SIZES: SizeRow[] = [
  { eu: 39, uk: 5.5, us: 6.5, cm: 24.5, inch: 9.6 },
  { eu: 40, uk: 6.5, us: 7.5, cm: 25.0, inch: 9.8 },
  { eu: 41, uk: 7.5, us: 8.5, cm: 26.0, inch: 10.2 },
  { eu: 42, uk: 8.0, us: 9.0, cm: 26.5, inch: 10.4 },
  { eu: 43, uk: 9.0, us: 10.0, cm: 27.5, inch: 10.8 },
  { eu: 44, uk: 9.5, us: 10.5, cm: 28.0, inch: 11.0 },
  { eu: 45, uk: 10.5, us: 11.5, cm: 29.0, inch: 11.4 },
];

export default function SizeConversionChart({
  isOpen,
  onClose,
  selectedUnit = 'cm',
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedUnit?: 'cm' | 'inch';
}) {
  const [unit, setUnit] = useState<'cm' | 'inch'>(selectedUnit);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-neutral-900" />
            <h3 className="font-bold text-base text-neutral-900">
              Royal Step Footwear Size Chart
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Measurement Unit Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-medium">
            Toggle measurement standard:
          </span>
          <div className="flex bg-neutral-100 p-0.5 rounded-md border border-neutral-200">
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 text-xs font-bold rounded ${
                unit === 'cm' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
              }`}
            >
              Centimeters (cm)
            </button>
            <button
              onClick={() => setUnit('inch')}
              className={`px-3 py-1 text-xs font-bold rounded ${
                unit === 'inch' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
              }`}
            >
              Inches (in)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-neutral-50 text-neutral-700 uppercase font-bold border-b border-neutral-200">
              <tr>
                <th className="p-2.5">EU Size</th>
                <th className="p-2.5 bg-neutral-100/70">Pak/UK Size</th>
                <th className="p-2.5">US Size</th>
                <th className="p-2.5">Foot Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-800">
              {FOOTWEAR_SIZES.map((row) => (
                <tr key={row.eu} className="hover:bg-neutral-50 transition">
                  <td className="p-2.5 font-bold text-neutral-900">{row.eu}</td>
                  <td className="p-2.5 font-bold bg-neutral-50 text-neutral-900">
                    UK {row.uk}
                  </td>
                  <td className="p-2.5 text-neutral-600">{row.us}</td>
                  <td className="p-2.5 font-medium text-emerald-800">
                    {unit === 'cm' ? `${row.cm} cm` : `${row.inch} in`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded text-[11px] text-neutral-600 leading-relaxed">
          <strong>Tip for Pakistani buyers:</strong> Most local branded shoes align with <strong>UK sizing</strong>. If you wear Bata or Service Size 8, choose <strong>UK 8 (EU 42)</strong>.
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-neutral-900 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-neutral-800"
        >
          Got It, Continue Shopping
        </button>
      </div>
    </div>
  );
}