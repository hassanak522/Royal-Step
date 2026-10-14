'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Truck, 
  PackageCheck, 
  ClipboardList, 
  RotateCcw, 
  AlertTriangle, 
  Building2, 
  Clock, 
  CheckCircle2, 
  Search, 
  RefreshCw,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

export default function CentralWarehouseERP() {
  const [activeTab, setActiveTab] = useState<
    | 'overview' 
    | 'suppliers' 
    | 'purchase-orders' 
    | 'stock-adjust' 
    | 'replenishment-reqs' 
    | 'transfer-create' 
    | 'discrepancy'
    | 'returns-inspection'
  >('overview');

  // Live Data States
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [returnTickets, setReturnTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', contactPerson: '', address: '' });
  const [newPO, setNewPO] = useState({ supplierId: '', variantId: '', quantity: 20, unitCost: 3500, notes: '' });
  const [adjustData, setAdjustData] = useState({ locationId: '', variantId: '', adjustmentType: 'ADD_STOCK', quantity: 5, reason: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [supRes, poRes, trfRes, searchRes] = await Promise.all([
        fetch('/api/warehouse/procurement?type=suppliers'),
        fetch('/api/warehouse/procurement?type=purchase-orders'),
        fetch('/api/warehouse/transfers'),
        fetch('/api/pos/lookup?q=a'),
      ]);

      if (supRes.ok) setSuppliers(await supRes.json());
      if (poRes.ok) setPurchaseOrders(await poRes.json());
      if (trfRes.ok) setTransfers(await trfRes.json());
      if (searchRes.ok) setVariants(await searchRes.json());
    } catch (err) {
      console.error('Failed to load warehouse data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/warehouse/procurement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE_SUPPLIER', ...newSupplier }),
    });
    if (res.ok) {
      alert('Supplier created successfully!');
      setNewSupplier({ name: '', phone: '', email: '', contactPerson: '', address: '' });
      loadData();
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/warehouse/procurement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE_PO',
        supplierId: newPO.supplierId || suppliers[0]?.id,
        items: [{ variantId: newPO.variantId || variants[0]?.variantId, quantity: newPO.quantity, unitCost: newPO.unitCost }],
        notes: newPO.notes,
      }),
    });
    if (res.ok) {
      alert('Purchase Order Generated!');
      loadData();
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/warehouse/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjustData),
    });
    if (res.ok) {
      alert('Stock Ledger Adjusted and Audited!');
      loadData();
    }
  };

  // 4D Quality Control Action Handler
  const handleInspectReturn = async (ticketNumber: string, action: 'EXCHANGE' | 'REJECT') => {
    try {
      const res = await fetch('/api/returns/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber,
          inspectionResult: action === 'EXCHANGE' ? 'PASSED_RESTOCKABLE' : 'FAILED_REJECTED',
          conditionGrade: action === 'EXCHANGE' ? 'GRADE_A_MINT' : 'GRADE_C_DAMAGED_SOLE',
          action,
          exchangeReplacementVariantId: variants[0]?.variantId,
          notes: action === 'EXCHANGE' 
            ? 'Leather and sole pristine. Size replacement approved.' 
            : 'Outdoor gravel marks on sole. Rejected to quarantine.',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(action === 'EXCHANGE' 
          ? 'Inspection Passed: Original pair restocked, replacement size allocated.' 
          : 'Inspection Rejected: Damaged pair moved to quarantine ledger.');
        loadData();
      } else {
        alert(data.error || 'Inspection failed');
      }
    } catch {
      alert('Network error while processing inspection');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-neutral-900 text-white flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-6 px-2">
            <Boxes className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="font-black text-sm uppercase">Royal Step WMS</h1>
              <span className="text-[10px] text-neutral-400 font-mono">Central Korangi Hub[cite: 1]</span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'overview' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              <Boxes className="w-4 h-4" /> 1. Overview[cite: 14]
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'suppliers' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              <Building2 className="w-4 h-4" /> 2. Supplier Directory[cite: 14]
            </button>
            <button
              onClick={() => setActiveTab('purchase-orders')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'purchase-orders' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              <ClipboardList className="w-4 h-4" /> 3. Purchase Orders (PO)[cite: 14]
            </button>
            <button
              onClick={() => setActiveTab('stock-adjust')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'stock-adjust' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              <RotateCcw className="w-4 h-4" /> 4. Stock Adjustments[cite: 14]
            </button>
            <button
              onClick={() => setActiveTab('replenishment-reqs')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'replenishment-reqs' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              <Clock className="w-4 h-4" /> 5. Branch Replenishments[cite: 14]
            </button>
            <button
              onClick={() => setActiveTab('transfer-create')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'transfer-create' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              <Truck className="w-4 h-4" /> 6. Stock Transfers[cite: 14]
            </button>
            <button
              onClick={() => setActiveTab('discrepancy')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'discrepancy' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              <AlertTriangle className="w-4 h-4" /> 7. Transfer Discrepancies[cite: 2, 14]
            </button>
            <button
              onClick={() => setActiveTab('returns-inspection')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'returns-inspection' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              <ShieldCheck className="w-4 h-4" /> 8. Returns & QC Desk
            </button>
          </nav>
        </div>

        <button 
          onClick={loadData} 
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 p-2 border border-neutral-800 rounded transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase text-neutral-900">Warehouse Dashboard Overview[cite: 14]</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-white border rounded-xl shadow-xs">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Total Suppliers</span>
                <p className="text-2xl font-black text-neutral-900 mt-1">{suppliers.length}</p>
              </div>
              <div className="p-4 bg-white border rounded-xl shadow-xs">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Active Purchase Orders</span>
                <p className="text-2xl font-black text-neutral-900 mt-1">{purchaseOrders.length}</p>
              </div>
              <div className="p-4 bg-white border rounded-xl shadow-xs">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Transfers In-Transit</span>
                <p className="text-2xl font-black text-amber-800 mt-1">{transfers.filter(t => t.status === 'DISPATCHED_IN_TRANSIT').length}</p>
              </div>
              <div className="p-4 bg-white border rounded-xl shadow-xs">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Flagged Discrepancies</span>
                <p className="text-2xl font-black text-red-600 mt-1">{transfers.filter(t => t.status === 'DISCREPANCY_FLAGGED').length}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUPPLIER DIRECTORY */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase text-neutral-900">Supplier Directory[cite: 14]</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <form onSubmit={handleCreateSupplier} className="bg-white p-5 border rounded-xl shadow-xs space-y-3">
                <h3 className="font-bold text-xs uppercase text-neutral-800">Add New Leather/Sole Supplier</h3>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600">Company Name *</label>
                  <input required type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full p-2 text-xs border rounded" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600">Contact Person</label>
                  <input type="text" value={newSupplier.contactPerson} onChange={e => setNewSupplier({...newSupplier, contactPerson: e.target.value})} className="w-full p-2 text-xs border rounded" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600">Phone *</label>
                  <input required type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full p-2 text-xs border rounded" />
                </div>
                <button type="submit" className="w-full py-2 bg-neutral-900 text-white rounded text-xs font-bold uppercase">Save Supplier Profile</button>
              </form>

              <div className="md:col-span-2 bg-white border rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 border-b font-bold text-neutral-600">
                    <tr><th className="p-3">Supplier Name</th><th className="p-3">Contact</th><th className="p-3">Phone</th><th className="p-3">Total POs</th></tr>
                  </thead>
                  <tbody className="divide-y text-neutral-800">
                    {suppliers.map(s => (
                      <tr key={s.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-bold">{s.name}</td>
                        <td className="p-3">{s.contactPerson || 'N/A'}</td>
                        <td className="p-3 font-mono">{s.phone}</td>
                        <td className="p-3 font-bold">{s.purchaseOrders?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PURCHASE ORDERS (PO) */}
        {activeTab === 'purchase-orders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase text-neutral-900">Purchase Orders (Procurement)[cite: 14]</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <form onSubmit={handleCreatePO} className="bg-white p-5 border rounded-xl shadow-xs space-y-3">
                <h3 className="font-bold text-xs uppercase text-neutral-800">Raise New Purchase Order</h3>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600">Select Supplier</label>
                  <select value={newPO.supplierId} onChange={e => setNewPO({...newPO, supplierId: e.target.value})} className="w-full p-2 text-xs border rounded bg-white">
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600">Shoe Variant / Model</label>
                  <select value={newPO.variantId} onChange={e => setNewPO({...newPO, variantId: e.target.value})} className="w-full p-2 text-xs border rounded bg-white">
                    {variants.map(v => <option key={v.variantId} value={v.variantId}>{v.name} (EU {v.sizeEU})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600">Pairs Quantity</label>
                    <input type="number" min="1" value={newPO.quantity} onChange={e => setNewPO({...newPO, quantity: parseInt(e.target.value) || 1})} className="w-full p-2 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600">Unit Cost (PKR)</label>
                    <input type="number" min="1" value={newPO.unitCost} onChange={e => setNewPO({...newPO, unitCost: parseFloat(e.target.value) || 0})} className="w-full p-2 text-xs border rounded" />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-neutral-900 text-white rounded text-xs font-bold uppercase">Generate PO</button>
              </form>

              <div className="md:col-span-2 bg-white border rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 border-b font-bold text-neutral-600">
                    <tr><th className="p-3">PO Number</th><th className="p-3">Supplier</th><th className="p-3">Total Value</th><th className="p-3">Status</th></tr>
                  </thead>
                  <tbody className="divide-y text-neutral-800">
                    {purchaseOrders.map(po => (
                      <tr key={po.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-mono font-bold">{po.poNumber}</td>
                        <td className="p-3">{po.supplier?.name}</td>
                        <td className="p-3 font-bold">Rs. {po.totalCost?.toLocaleString()}</td>
                        <td className="p-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">{po.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STOCK ADJUSTMENT & CYCLE COUNTS */}
        {activeTab === 'stock-adjust' && (
          <div className="bg-white border rounded-xl p-6 shadow-xs max-w-2xl space-y-4">
            <h2 className="text-base font-bold uppercase text-neutral-900">Stock Adjustment & Damaged Quarantine[cite: 14]</h2>
            <p className="text-xs text-neutral-500">Record physical count reconciliations, damaged shoe write-offs, or manual corrections.</p>
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">Select Shoe Variant</label>
                <select value={adjustData.variantId} onChange={e => setAdjustData({...adjustData, variantId: e.target.value})} className="mt-1 w-full p-2.5 text-xs border rounded bg-white">
                  {variants.map(v => <option key={v.variantId} value={v.variantId}>{v.name} (EU {v.sizeEU}) - Stock: {v.branchStock}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700">Adjustment Action</label>
                  <select value={adjustData.adjustmentType} onChange={e => setAdjustData({...adjustData, adjustmentType: e.target.value})} className="mt-1 w-full p-2.5 text-xs border rounded bg-white">
                    <option value="ADD_STOCK">Add Physical Stock (+)</option>
                    <option value="DAMAGE_WRITE_OFF">Damaged Quarantine Write-off (-)</option>
                    <option value="RECONCILIATION_CORRECTION">Cycle Count Absolute Override</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700">Quantity (Pairs)</label>
                  <input type="number" min="1" value={adjustData.quantity} onChange={e => setAdjustData({...adjustData, quantity: parseInt(e.target.value) || 1})} className="mt-1 w-full p-2.5 text-xs border rounded font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">Reason / Reference Note *</label>
                <input required type="text" placeholder="e.g. Scratched toe box leather during unloading" value={adjustData.reason} onChange={e => setAdjustData({...adjustData, reason: e.target.value})} className="mt-1 w-full p-2.5 text-xs border rounded" />
              </div>
              <button type="submit" className="w-full py-3 bg-neutral-900 text-white rounded text-xs font-bold uppercase">Apply Adjustment to Ledger</button>
            </form>
          </div>
        )}

        {/* TAB 5: BRANCH REPLENISHMENT REQUESTS */}
        {activeTab === 'replenishment-reqs' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase text-neutral-900">Branch Replenishment Requests[cite: 14]</h2>
            <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 border-b font-bold text-neutral-600">
                  <tr><th className="p-3">Transfer #</th><th className="p-3">Destination Branch</th><th className="p-3">Requested Footwear</th><th className="p-3">Requested By</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody className="divide-y text-neutral-800">
                  {transfers.filter(t => t.status === 'REQUESTED').map(t => (
                    <tr key={t.id} className="hover:bg-neutral-50/50">
                      <td className="p-3 font-mono font-bold">{t.transferNumber}</td>
                      <td className="p-3 font-bold">{t.destinationLocation?.name}</td>
                      <td className="p-3">{t.items?.map((i: any) => `${i.variant?.product?.name} (EU ${i.variant?.sizeEU}) × ${i.quantitySent}`).join(', ')}</td>
                      <td className="p-3 font-mono">{t.requestedBy}</td>
                      <td className="p-3"><span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">AWAITING WAREHOUSE PICK</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: STOCK TRANSFERS */}
        {activeTab === 'transfer-create' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase text-neutral-900">Stock Transfer Dispatching[cite: 14]</h2>
            <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 border-b font-bold text-neutral-600">
                  <tr><th className="p-3">Transfer #</th><th className="p-3">Destination Outlet</th><th className="p-3">Items Sent</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody className="divide-y text-neutral-800">
                  {transfers.map(t => (
                    <tr key={t.id} className="hover:bg-neutral-50/50">
                      <td className="p-3 font-mono font-bold">{t.transferNumber}</td>
                      <td className="p-3">{t.destinationLocation?.name}</td>
                      <td className="p-3">{t.items?.map((i: any) => `${i.variant?.product?.name} (EU ${i.variant?.sizeEU}) × ${i.quantitySent}`).join(', ')}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded font-bold text-[10px] ${t.status === 'DISPATCHED_IN_TRANSIT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: TRANSFER DISCREPANCIES */}
        {activeTab === 'discrepancy' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase text-neutral-900">Transfer Discrepancy Resolution[cite: 2, 14]</h2>
            <p className="text-xs text-neutral-500">Track and resolve differences between quantities dispatched by warehouse vs. quantities received by retail store[cite: 2, 7].</p>
            <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 border-b font-bold text-neutral-600">
                  <tr><th className="p-3">Transfer #</th><th className="p-3">Branch</th><th className="p-3">Discrepancy Notes</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
                </thead>
                <tbody className="divide-y text-neutral-800">
                  {transfers.filter(t => t.status === 'DISCREPANCY_FLAGGED').length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-neutral-400">Zero open transfer discrepancies. All branch shipments balanced.</td></tr>
                  ) : (
                    transfers.filter(t => t.status === 'DISCREPANCY_FLAGGED').map(t => (
                      <tr key={t.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-mono font-bold">{t.transferNumber}</td>
                        <td className="p-3">{t.destinationLocation?.name}</td>
                        <td className="p-3 text-red-600 font-bold">{t.discrepancyNote}</td>
                        <td className="p-3"><span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">FLAGGED</span></td>
                        <td className="p-3"><button className="px-3 py-1 bg-neutral-900 text-white rounded text-[10px] font-bold">Approve Write-off</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: RETURNS QUALITY CONTROL & RESTOCK INSPECTION DESK (4D) */}
        {activeTab === 'returns-inspection' && (
          <div className="bg-white border rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold uppercase text-neutral-900">
                  Footwear QC & Returns Inspection Desk
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Inspect physical returned boxes[cite: 19, 26]. Passing pairs restock into sellable inventory or allocate replacement sizes; rejected pairs route to quarantine[cite: 19, 24, 26].
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
                  <tr>
                    <th className="p-3">Ticket #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Footwear / Requested Action</th>
                    <th className="p-3">Condition & Verification</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-neutral-800">
                  <tr className="hover:bg-neutral-50/50">
                    <td className="p-3 font-mono font-bold text-neutral-900">RET-9821</td>
                    <td className="p-3 font-bold">Taimur Ali (03001234567)</td>
                    <td className="p-3">
                      <span className="font-bold text-neutral-900">Handcrafted Oxford Leather</span>
                      <span className="block text-[11px] text-amber-800 font-mono">Size Swap: EU 42 &rarr; EU 43</span>
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        INSPECTION_PENDING
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInspectReturn('RET-9821', 'EXCHANGE')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Pass & Allocate
                        </button>
                        <button
                          onClick={() => handleInspectReturn('RET-9821', 'REJECT')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] flex items-center gap-1 transition"
                        >
                          <X className="w-3.5 h-3.5" /> Reject to Quarantine
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}