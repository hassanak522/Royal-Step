'use client';

import React, { useState } from 'react';
import { 
  Megaphone, 
  Tag, 
  Image as ImageIcon, 
  Star, 
  Globe, 
  Bell, 
  Plus, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';

export default function MarketingWorkspace() {
  const [activeTab, setActiveTab] = useState<
    'banners' | 'homepage-cms' | 'coupons' | 'reviews' | 'seo' | 'notifications'
  >('coupons');

  const [coupons, setCoupons] = useState([
    { code: 'EID2026', type: 'PERCENT', value: 15, minOrder: 5000, usage: 48 },
    { code: 'ROYALSTEP10', type: 'PERCENT', value: 10, minOrder: 0, usage: 112 },
    { code: 'FREESHIP', type: 'FIXED', value: 200, minOrder: 3500, usage: 76 },
  ]);

  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'PERCENT', value: 10, minOrder: 0 });

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    setCoupons([...coupons, { ...newCoupon, usage: 0 }]);
    setNewCoupon({ code: '', type: 'PERCENT', value: 10, minOrder: 0 });
    alert('Coupon code activated across online checkout!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="flex justify-between items-center pb-6 border-b">
        <div>
          <h1 className="text-2xl font-black uppercase text-neutral-900 tracking-tight">
            Marketing & Content Management (CMS)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Discount vouchers, hero campaigns, customer review moderation, and SEO defaults[cite: 45, 48].
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-6 border-b pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 ${
            activeTab === 'coupons' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Tag className="w-4 h-4" /> 1. Coupons & Promotions
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 ${
            activeTab === 'banners' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> 2. Banner & Hero Manager
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 ${
            activeTab === 'reviews' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Star className="w-4 h-4" /> 3. Reviews Moderation
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 ${
            activeTab === 'seo' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Globe className="w-4 h-4" /> 4. SEO & Meta Tags
        </button>
      </div>

      {/* TAB: COUPONS & DISCOUNTS */}
      {activeTab === 'coupons' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddCoupon} className="border rounded-xl p-5 bg-white shadow-xs space-y-4">
            <h3 className="font-bold text-sm uppercase text-neutral-900">Create Discount Voucher</h3>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. AZADI2026"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="mt-1 w-full p-2 border rounded font-mono font-bold text-xs uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">Discount Type</label>
              <select
                value={newCoupon.type}
                onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                className="mt-1 w-full p-2 border rounded text-xs bg-white"
              >
                <option value="PERCENT">Percentage Discount (%)</option>
                <option value="FIXED">Flat PKR Amount (Rs.)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">Discount Value</label>
              <input
                type="number"
                required
                value={newCoupon.value}
                onChange={(e) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full p-2 border rounded font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">Minimum Order (PKR)</label>
              <input
                type="number"
                value={newCoupon.minOrder}
                onChange={(e) => setNewCoupon({ ...newCoupon, minOrder: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full p-2 border rounded text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-900 text-white rounded text-xs font-bold uppercase"
            >
              Activate Coupon
            </button>
          </form>

          <div className="md:col-span-2 border rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Benefit</th>
                  <th className="p-3">Min Order</th>
                  <th className="p-3">Redeemed</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-neutral-800">
                {coupons.map((c) => (
                  <tr key={c.code} className="hover:bg-neutral-50/50">
                    <td className="p-3 font-mono font-black text-neutral-900">{c.code}</td>
                    <td className="p-3 font-bold">{c.value}{c.type === 'PERCENT' ? '%' : ' PKR'} OFF</td>
                    <td className="p-3 text-neutral-500">Rs. {c.minOrder.toLocaleString()}</td>
                    <td className="p-3 font-mono">{c.usage} times</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}