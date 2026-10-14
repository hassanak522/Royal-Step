'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, PackageCheck, MapPin, Truck, MessageSquare } from 'lucide-react';

interface StoredOrder {
  orderNumber: string;
  customer: {
    fullName: string;
    phone: string;
    address: string;
    area: string;
    city: string;
    paymentMethod: string;
  };
  pricing: {
    total: number;
  };
}

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<StoredOrder | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('latestOrder');
    if (raw) {
      setOrder(JSON.parse(raw));
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <span className="text-xs uppercase tracking-widest text-emerald-800 font-bold mt-4 inline-block">
        Order Received Successfully
      </span>

      <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
        Thank You for Your Order!
      </h1>

      <p className="text-xs text-neutral-500 mt-2">
        We have initiated booking with Leopard Courier from our central warehouse.
      </p>

      {order && (
        <div className="mt-8 border border-neutral-200 rounded-lg p-6 bg-white text-left shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
            <div>
              <span className="text-[11px] text-neutral-400 uppercase font-semibold">Order Tracking ID</span>
              <p className="text-base font-black text-neutral-900">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-neutral-400 uppercase font-semibold">Total Amount</span>
              <p className="text-base font-black text-neutral-900">Rs. {order.pricing.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="text-xs space-y-2 text-neutral-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-neutral-800 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Shipping To:</strong> {order.customer.fullName} &bull; {order.customer.address}, {order.customer.area}, {order.customer.city} ({order.customer.phone})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-800 flex-shrink-0" />
              <span>
                <strong>Payment Mode:</strong> {order.customer.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Paid Online'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Estimated Delivery:</strong> 24–48 Hours within Karachi.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Actions */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-neutral-800 transition"
        >
          Continue Shopping
        </Link>
        <a
          href={`https://wa.me/923001234567?text=Hello,%20I%20just%20placed%20order%20${order?.orderNumber || ''}%20and%20wanted%20to%20confirm%20delivery.`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:bg-emerald-700 transition"
        >
          <MessageSquare className="w-4 h-4" /> WhatsApp Order Support
        </a>
      </div>
    </div>
  );
}