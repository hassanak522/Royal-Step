'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Warehouse, 
  Store, 
  Globe, 
  Truck, 
  BarChart3, 
  Download, 
  CheckCircle2, 
  ArrowRight,
  PackagePlus,
  RefreshCw
} from 'lucide-react';

export default function HeadquarterAdminWorkspace() {
  const [activeWorkspace, setActiveWorkspace] = useState<'hq' | 'warehouse' | 'branches' | 'online'>('hq');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Workspace Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase text-neutral-900 tracking-tight">
              Royal Step Enterprise ERP
            </h1>
            <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Omnichannel
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Central Warehouse (Korangi), 4 Karachi Physical Stores & Nationwide Online Channel[cite: 41, 42].
          </p>
        </div>

        {/* Workspace Selector */}
        <div className="flex bg-neutral-100 p-1 rounded-lg text-xs font-bold">
          <button
            onClick={() => setActiveWorkspace('hq')}
            className={`px-3 py-1.5 rounded-md transition ${activeWorkspace === 'hq' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
          >
            Consolidated HQ
          </button>
          <button
            onClick={() => setActiveWorkspace('warehouse')}
            className={`px-3 py-1.5 rounded-md transition ${activeWorkspace === 'warehouse' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
          >
            Central Warehouse
          </button>
          <button
            onClick={() => setActiveWorkspace('branches')}
            className={`px-3 py-1.5 rounded-md transition ${activeWorkspace === 'branches' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
          >
            4 Physical Stores
          </button>
          <button
            onClick={() => setActiveWorkspace('online')}
            className={`px-3 py-1.5 rounded-md transition ${activeWorkspace === 'online' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
          >
            Online Channel
          </button>
        </div>
      </div>

      {/* WORKSPACE 1: CONSOLIDATED HEADQUARTERS */}
      {activeWorkspace === 'hq' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="border rounded-xl p-5 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Group Gross Revenue</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                Rs. {metrics?.consolidatedRevenue?.toLocaleString() || 0}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold">Online + 4 Karachi Outlets[cite: 41]</span>
            </div>

            <div className="border rounded-xl p-5 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Online Channel Share</span>
              <p className="text-2xl font-black text-blue-900 mt-1">
                Rs. {metrics?.online?.grossSales?.toLocaleString() || 0}
              </p>
              <span className="text-[10px] text-neutral-500 font-medium">{metrics?.online?.orderCount || 0} Web Orders</span>
            </div>

            <div className="border rounded-xl p-5 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Physical Stores Share</span>
              <p className="text-2xl font-black text-amber-900 mt-1">
                Rs. {metrics?.physicalRetail?.grossSales?.toLocaleString() || 0}
              </p>
              <span className="text-[10px] text-neutral-500 font-medium">{metrics?.physicalRetail?.transactionCount || 0} In-Store Slips</span>
            </div>

            <div className="border rounded-xl p-5 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Online Gross Margin</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                {metrics?.online?.grossMarginPercentage || '0'}%
              </p>
              <span className="text-[10px] text-neutral-500 font-medium">After Product Cost (COGS)[cite: 48, 50]</span>
            </div>
          </div>

          {/* Karachi Stores Sales Breakdown */}
          <div className="border rounded-xl p-5 bg-white shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
              Physical Retail Branches Breakdown (Karachi)[cite: 41]
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {metrics?.physicalRetail?.branches?.map((b: any) => (
                <div key={b.name} className="p-4 border rounded-lg bg-neutral-50/50">
                  <span className="text-xs font-bold text-neutral-900 block">{b.name}</span>
                  <p className="text-lg font-black text-neutral-900 mt-1">
                    Rs. {b.sales.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-neutral-500">{b.transactions} Customers Served</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 2: CENTRAL WAREHOUSE LOGISTICS */}
      {activeWorkspace === 'warehouse' && (
        <div className="mt-6 space-y-4">
          <div className="border rounded-xl p-6 bg-white shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold uppercase text-neutral-900">Central Warehouse Receiving & Transfers</h3>
              <p className="text-xs text-neutral-500">Record supplier shipments (GRN) and dispatch store replenishment.</p>
            </div>
            <a
              href="/branch"
              className="px-4 py-2 bg-neutral-900 text-white rounded text-xs font-bold uppercase tracking-wider"
            >
              Open Transfer Console
            </a>
          </div>
        </div>
      )}

      {/* WORKSPACE 3: PHYSICAL STORES OPERATIONS */}
      {activeWorkspace === 'branches' && (
        <div className="mt-6 space-y-4">
          <div className="border rounded-xl p-6 bg-white shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold uppercase text-neutral-900">Desktop POS Cashier Terminals</h3>
              <p className="text-xs text-neutral-500">High-speed barcode checkout, split tenders, and offline sync.</p>
            </div>
            <a
              href="/pos"
              target="_blank"
              className="px-4 py-2 bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider"
            >
              Launch POS Terminal
            </a>
          </div>
        </div>
      )}

      {/* WORKSPACE 4: ONLINE COMMERCE & LEOPARDS COURIER */}
      {activeWorkspace === 'online' && (
        <div className="mt-6 space-y-4">
          <div className="border rounded-xl p-6 bg-white shadow-xs">
            <h3 className="text-base font-bold uppercase text-neutral-900">Leopards COD Settlement Tracker</h3>
            <p className="text-xs text-neutral-500 mt-1">Courier collection versus bank remittance reconciliation[cite: 46, 48].</p>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 border rounded-lg bg-amber-50/50 border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800">Pending Courier Collection (COD)</span>
                <p className="text-xl font-black text-amber-950 mt-1">
                  Rs. {metrics?.online?.pendingCodCollection?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-emerald-50/50 border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Remitted into Bank Account</span>
                <p className="text-xl font-black text-emerald-950 mt-1">
                  Rs. {metrics?.online?.settledCodAmount?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}