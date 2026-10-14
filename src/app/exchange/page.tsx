'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Store 
} from 'lucide-react';

export default function CustomerExchangePortal() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [orderData, setOrderData] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [requestType, setRequestType] = useState<'EXCHANGE' | 'REFUND'>('EXCHANGE');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [currentSize, setCurrentSize] = useState('42');
  const [requestedSize, setRequestedSize] = useState('43');
  const [reason, setReason] = useState('Size is too tight across the instep');
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();

      if (res.ok && data.id) {
        // Validate Policy Eligibility (7 Days)
        const orderDate = new Date(data.createdAt);
        const daysDiff = (Date.now() - orderDate.getTime()) / (1000 * 3600 * 24);

        if (daysDiff > 7) {
          setLookupError('This order exceeds the 7-day return and exchange policy window.');
          setLoading(false);
          return;
        }

        setOrderData(data);
        if (data.items?.[0]) {
          setSelectedProduct(data.items[0].productName);
          setCurrentSize(data.items[0].sizeEU.toString());
        }
      } else {
        setLookupError(data.error || 'No matching order found for this phone number and order ID.');
      }
    } catch {
      setLookupError('Network failure connecting to Royal Step server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderData.orderNumber,
          phone,
          productName: selectedProduct,
          currentSize,
          requestedSize: requestType === 'EXCHANGE' ? requestedSize : null,
          requestType,
          reason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.returnRequest) {
        setSubmittedTicket(data.returnRequest);
      } else {
        alert(data.error || 'Failed to submit request.');
      }
    } catch {
      alert('Error submitting exchange ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 font-sans">
      <div className="text-center mb-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
          Omnichannel Care
        </span>
        <h1 className="text-3xl font-black uppercase text-neutral-900 mt-2 tracking-tight">
          Returns & Size Exchanges[cite: 19]
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          7-Day nationwide doorstep courier pickup or direct exchange at any Karachi outlet[cite: 1, 4].
        </p>
      </div>

      {!submittedTicket ? (
        <div className="space-y-6">
          {/* STEP 1: ORDER LOOKUP */}
          {!orderData ? (
            <form onSubmit={handleLookup} className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                1. Identify Your Order
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">Order Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RS-ON-108291 or RCP-KHI-CLIFTON-..."
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="mt-1 w-full p-2.5 border rounded-lg font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full p-2.5 border rounded-lg font-mono font-bold text-xs"
                />
              </div>

              {lookupError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {lookupError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition"
              >
                {loading ? 'Validating Policy...' : 'Find Order & Check Eligibility'}
              </button>
            </form>
          ) : (
            /* STEP 2: CHOOSE SIZE OR REFUND */
            <form onSubmit={handleSubmitRequest} className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Policy Validated (&lt; 7 Days)</span>
                  <h3 className="font-bold text-sm text-neutral-900">{orderData.orderNumber}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderData(null)}
                  className="text-xs text-neutral-500 underline"
                >
                  Change Order
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType('EXCHANGE')}
                  className={`p-3 rounded-xl border text-left transition ${
                    requestType === 'EXCHANGE' ? 'border-neutral-900 bg-neutral-50 shadow-xs' : 'border-neutral-200'
                  }`}
                >
                  <span className="block font-black text-xs uppercase text-neutral-900">Size Exchange</span>
                  <span className="text-[11px] text-neutral-500">Swap for larger or smaller size</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType('REFUND')}
                  className={`p-3 rounded-xl border text-left transition ${
                    requestType === 'REFUND' ? 'border-neutral-900 bg-neutral-50 shadow-xs' : 'border-neutral-200'
                  }`}
                >
                  <span className="block font-black text-xs uppercase text-neutral-900">Store Refund</span>
                  <span className="text-[11px] text-neutral-500">Return item for payment reversal</span>
                </button>
              </div>

              {requestType === 'EXCHANGE' && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-neutral-700 uppercase mb-1">Current Size</label>
                    <input type="text" disabled value={`EU ${currentSize}`} className="w-full p-2 border rounded bg-neutral-50 font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 uppercase mb-1">Requested New Size *</label>
                    <select
                      value={requestedSize}
                      onChange={(e) => setRequestedSize(e.target.value)}
                      className="w-full p-2 border rounded bg-white font-bold"
                    >
                      <option value="39">EU 39</option>
                      <option value="40">EU 40</option>
                      <option value="41">EU 41</option>
                      <option value="42">EU 42</option>
                      <option value="43">EU 43</option>
                      <option value="44">EU 44</option>
                      <option value="45">EU 45</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">Reason for Request *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full p-2.5 text-xs border rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider"
              >
                {loading ? 'Submitting...' : 'Submit Exchange Ticket'}
              </button>
            </form>
          )}

          {/* Karachi Store Exchange Callout */}
          <div className="p-4 bg-neutral-50 border rounded-xl flex items-center justify-between text-xs text-neutral-700">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-amber-700 shrink-0" />
              <span>In Karachi? You can bring unworn shoes directly to our Clifton, Tariq Road, Saddar, or Gulshan outlets for an instant swap[cite: 1, 4].</span>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 3: TICKET CONFIRMATION */
        <div className="bg-white border rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-black uppercase text-neutral-900">Exchange Ticket Logged</h2>
          <span className="font-mono text-base font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded">
            {submittedTicket.ticketNumber}
          </span>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Our central warehouse team will contact you for pickup via Leopards Courier[cite: 1, 6]. Please pack the shoes in their original box with tags intact.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-bold uppercase"
            >
              Back to Storefront
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}