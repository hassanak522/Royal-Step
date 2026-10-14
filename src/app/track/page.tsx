'use client';

import React, { useState } from 'react';
import { Search, PackageCheck, Truck, Clock, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

interface OrderRecord {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  itemSummary: string;
  total: number;
  paymentMethod: string;
  status: string;
  leopardCn?: string | null;
  createdAt: string;
}

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSearched(true);
    setOrder(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/orders?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();

      if (res.ok && data.orderNumber) {
        setOrder(data);
      } else {
        setErrorMessage(data.error || 'No matching order found.');
      }
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-bold tracking-widest text-neutral-400">
          Parcel Status & Tracking
        </span>
        <h1 className="text-3xl font-black uppercase tracking-tight text-neutral-900">
          Track Your Royal Step Order
        </h1>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          For your data privacy, enter both your Order Reference ID and the mobile number provided at checkout.
        </p>
      </div>

      {/* Dual Input Tracking Form */}
      <form onSubmit={handleTrack} className="mt-8 border border-neutral-200 rounded-xl p-6 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Order ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RS-104921"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-xs sm:text-sm border border-neutral-300 rounded-md focus:border-neutral-900 focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Registered Mobile Number *
            </label>
            <input
              type="tel"
              required
              placeholder="03001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-xs sm:text-sm border border-neutral-300 rounded-md focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-neutral-900 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Verifying Credentials...' : 'Lookup Delivery Status'}
        </button>
      </form>

      {/* Error / Not Found Message */}
      {searched && errorMessage && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Verified Order Progression Result */}
      {order && (
        <div className="mt-8 border border-neutral-200 rounded-xl p-6 bg-white shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-neutral-100 gap-2">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Verified Order</span>
              <h2 className="text-xl font-black text-neutral-900">{order.orderNumber}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Placed On</span>
              <p className="text-xs font-mono text-neutral-600">
                {new Date(order.createdAt).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          {/* Visual Progression Timeline */}
          <div className="grid grid-cols-4 gap-2 text-center py-2">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center mb-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Placed</span>
              <span className="text-[10px] text-neutral-400">Order recorded</span>
            </div>

            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  order.status === 'CONFIRMED' || order.status === 'DISPATCHED' || order.status === 'DELIVERED'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Packed</span>
              <span className="text-[10px] text-neutral-400">Inspected</span>
            </div>

            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  order.status === 'DISPATCHED' || order.status === 'DELIVERED'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Courier</span>
              <span className="text-[10px] text-neutral-400">In-transit</span>
            </div>

            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  order.status === 'DELIVERED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Delivered</span>
              <span className="text-[10px] text-neutral-400">Cash collected</span>
            </div>
          </div>

          {/* Delivery & Inspection Terms */}
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2.5 text-xs text-neutral-700">
            <div className="flex justify-between">
              <span className="text-neutral-500">Items:</span>
              <span className="font-semibold text-neutral-900">{order.itemSummary}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Destination:</span>
              <span className="font-semibold text-neutral-900">{order.address}, {order.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Amount Due:</span>
              <span className="font-black text-neutral-900">
                Rs. {order.total.toLocaleString()} ({order.paymentMethod})
              </span>
            </div>

            {order.leopardCn ? (
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-emerald-800">
                <span className="font-bold flex items-center gap-1">
                  <Truck className="w-4 h-4" /> Consignment #: {order.leopardCn}
                </span>
                <a
                  href={`https://www.leopardscourier.com/tracking?track_numbers=${order.leopardCn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-xs flex items-center gap-1"
                >
                  Courier Portal <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="pt-2 border-t border-neutral-200 text-[11px] text-amber-800">
                Your package is being prepared with open-parcel inspection authorization. Consignment number will appear once handed to the courier.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}