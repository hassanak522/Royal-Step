'use client';

import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Truck,
  Printer,
  CheckCircle2,
  Barcode,
  Search,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function OnlineFulfillmentQueue() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'packed' | 'shipped'>('pending');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePackOrder = async (orderId: string) => {
    const res = await fetch('/api/warehouse/fulfillment/pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action: 'COMPLETE_PACKING' }),
    });
    if (res.ok) {
      alert('Order inspected and packed successfully!');
      fetchOrders();
    }
  };

  const handleBookLeopards = async (orderId: string) => {
    const res = await fetch('/api/integrations/leopards/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, weightKg: 1.0 }),
    });
    const data = await res.json();
    if (res.ok && data.cnNumber) {
      alert(`Booked with Leopards! CN: ${data.cnNumber}`);
      fetchOrders();
    } else {
      alert(data.error || 'Booking failed.');
    }
  };

  const handleHandover = async (orderId: string) => {
    if (!confirm('Confirm courier pickup and commit physical stock deduction?')) return;
    const res = await fetch('/api/warehouse/fulfillment/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds: [orderId] }),
    });
    if (res.ok) {
      alert('Handover confirmed! Inventory permanently deducted from warehouse.');
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'pending')
      return o.fulfillmentStatus === 'ALLOCATED' || o.fulfillmentStatus === 'PICKING' || o.fulfillmentStatus === 'AWAITING_CONFIRMATION';
    if (activeTab === 'packed')
      return o.fulfillmentStatus === 'PACKED' || o.fulfillmentStatus === 'READY_FOR_DISPATCH';
    return o.fulfillmentStatus === 'SHIPPED' || o.fulfillmentStatus === 'DELIVERED';
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase text-neutral-900 tracking-tight">
              Online Order Fulfillment Queue
            </h1>
            <span className="bg-amber-500 text-neutral-950 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              WMS
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Pick, pack, book Leopards consignments, and commit inventory handovers.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-bold uppercase hover:bg-neutral-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mt-6 border-b pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'pending' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          1. To Pick & Pack ({orders.filter((o) => ['ALLOCATED', 'PICKING', 'AWAITING_CONFIRMATION'].includes(o.fulfillmentStatus)).length})
        </button>
        <button
          onClick={() => setActiveTab('packed')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'packed' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          2. Ready for Leopards ({orders.filter((o) => ['PACKED', 'READY_FOR_DISPATCH'].includes(o.fulfillmentStatus)).length})
        </button>
        <button
          onClick={() => setActiveTab('shipped')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'shipped' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          3. Dispatched & Delivered ({orders.filter((o) => ['SHIPPED', 'DELIVERED'].includes(o.fulfillmentStatus)).length})
        </button>
      </div>

      {/* Orders Table */}
      <div className="mt-6 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
            <tr>
              <th className="p-3">Order Number</th>
              <th className="p-3">Customer & Destination</th>
              <th className="p-3">Footwear Items</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Fulfillment Status</th>
              <th className="p-3">Leopards CN</th>
              <th className="p-3 text-right">Operational Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-neutral-800">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-400">
                  No orders in this queue.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-neutral-50/50">
                  <td className="p-3 font-mono font-bold text-neutral-900">{ord.orderNumber}</td>
                  <td className="p-3">
                    <span className="font-bold block">{ord.customerName}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {ord.city} &bull; {ord.phone}
                    </span>
                  </td>
                  <td className="p-3 font-medium max-w-xs">{ord.itemSummary}</td>
                  <td className="p-3">
                    <span className="font-bold">{ord.paymentMethod}</span>
                    <span className="block text-[10px] text-neutral-500">Rs. {ord.total.toLocaleString()}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800">
                      {ord.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-amber-900">
                    {ord.leopardCn || <span className="text-neutral-400 font-normal">Not Booked</span>}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {ord.fulfillmentStatus === 'ALLOCATED' && (
                      <button
                        onClick={() => handlePackOrder(ord.id)}
                        className="px-3 py-1.5 bg-neutral-900 text-white rounded font-bold text-[10px] uppercase hover:bg-neutral-800"
                      >
                        Pack & QC
                      </button>
                    )}

                    {ord.fulfillmentStatus === 'PACKED' && !ord.leopardCn && (
                      <button
                        onClick={() => handleBookLeopards(ord.id)}
                        className="px-3 py-1.5 bg-amber-600 text-white rounded font-bold text-[10px] uppercase hover:bg-amber-700"
                      >
                        Book Leopards
                      </button>
                    )}

                    {ord.leopardCn && ord.fulfillmentStatus === 'READY_FOR_DISPATCH' && (
                      <button
                        onClick={() => handleHandover(ord.id)}
                        className="px-3 py-1.5 bg-emerald-700 text-white rounded font-bold text-[10px] uppercase hover:bg-emerald-800"
                      >
                        Confirm Handover
                      </button>
                    )}

                    {ord.fulfillmentStatus === 'SHIPPED' && (
                      <span className="text-[10px] text-neutral-500 font-bold">En Route</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}