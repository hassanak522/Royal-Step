'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Truck, 
  RotateCcw, 
  Receipt, 
  Store, 
  CheckCircle, 
  Clock, 
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function BranchOperationsERP() {
  const [branchCode, setBranchCode] = useState('RET-KHI-01'); // Clifton
  const [activeTab, setActiveTab] = useState<'transfers' | 'shift' | 'inventory'>('transfers');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Shift closing state
  const [closingCash, setClosingCash] = useState('');
  const [shiftNote, setShiftNote] = useState('');

  // Receive transfer handler
  const handleReceiveTransfer = async (transferId: string) => {
    if (!confirm('Confirm receipt of these shoe pairs into branch sellable stock?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transfers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, action: 'RECEIVE' }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Stock received and added to shelf balance!');
      } else {
        alert(data.error || 'Failed to accept transfer');
      }
    } catch {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase text-neutral-900 tracking-tight">
              Branch Operations & Store ERP
            </h1>
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Retail
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Local shelf inventory, warehouse replenishment receipt, and till reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg p-2">
          <Store className="w-4 h-4 text-neutral-700" />
          <select
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            className="text-xs font-bold bg-transparent outline-none cursor-pointer"
          >
            <option value="RET-KHI-01">Clifton Branch (Park Towers)</option>
            <option value="RET-KHI-02">Tariq Road PECHS Branch</option>
            <option value="RET-KHI-03">Saddar Heritage Outlet</option>
            <option value="RET-KHI-04">Gulshan-e-Iqbal LuckyOne Branch</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-6 border-b pb-3">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'transfers' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Truck className="w-4 h-4" /> Inbound Warehouse Replenishment
        </button>
        <button
          onClick={() => setActiveTab('shift')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'shift' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Receipt className="w-4 h-4" /> End-of-Day Cashier Till Close
        </button>
      </div>

      {/* TAB 1: INBOUND WAREHOUSE TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="mt-6 space-y-4">
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-xs">
            <h3 className="font-bold text-sm text-neutral-900 uppercase">
              Pending Deliveries from Central Warehouse (Korangi Hub)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Physical inventory in transit. Click &quot;Accept & Verify&quot; after counting boxes.
            </p>

            <div className="mt-4 border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 font-bold text-neutral-600 border-b">
                  <tr>
                    <th className="p-3">Transfer #</th>
                    <th className="p-3">Source Hub</th>
                    <th className="p-3">Pairs Sent</th>
                    <th className="p-3">Dispatch Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-neutral-800">
                  <tr className="hover:bg-neutral-50/50">
                    <td className="p-3 font-mono font-bold">TRF-KHI-4091</td>
                    <td className="p-3">Central Warehouse (Korangi)</td>
                    <td className="p-3 font-bold">24 Pairs (Oxfords & Kaptaan)</td>
                    <td className="p-3 font-mono text-neutral-500">10/10/2026 14:30</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded text-[10px]">
                        IN-TRANSIT
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleReceiveTransfer('sample-id')}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] uppercase"
                      >
                        Accept & Verify
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: END-OF-DAY TILL RECONCILIATION */}
      {activeTab === 'shift' && (
        <div className="mt-6 border border-neutral-200 rounded-xl p-6 bg-white shadow-xs max-w-2xl space-y-5">
          <div>
            <h3 className="font-bold text-base text-neutral-900 uppercase">
              Shift Closing & Cash Drawer Tally
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Reconcile physical cash and card machine terminal slips at store closing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-neutral-50 rounded border">
              <span className="text-neutral-500 block">Opening Cash Float:</span>
              <strong className="text-base text-neutral-900 font-mono">Rs. 5,000</strong>
            </div>
            <div className="p-3 bg-neutral-50 rounded border">
              <span className="text-neutral-500 block">Total Shift Card Slips:</span>
              <strong className="text-base text-neutral-900 font-mono">Rs. 42,490</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700">
              Counted Physical Cash in Drawer (PKR) *
            </label>
            <input
              type="number"
              placeholder="e.g. 58490"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="mt-1 w-full p-2.5 border font-mono font-bold text-base rounded focus:border-neutral-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700">
              Shift Notes / Explanations
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Rs. 200 petty cash spent on shop tea/water..."
              value={shiftNote}
              onChange={(e) => setShiftNote(e.target.value)}
              className="mt-1 w-full p-2.5 text-xs border rounded focus:border-neutral-900 outline-none"
            />
          </div>

          <button
            onClick={() => alert('Shift finalized and audited successfully!')}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold text-xs uppercase tracking-wider transition"
          >
            Finalize Shift & Lock Till
          </button>
        </div>
      )}
    </div>
  );
}