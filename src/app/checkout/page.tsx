'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { 
  Truck, 
  CreditCard, 
  Wallet, 
  PackageOpen, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

type PaymentMode = 'COD' | 'EASYPAISA' | 'JAZZCASH' | 'NAYAPAY' | 'CARD';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>('COD');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    altPhone: '',
    address: '',
    city: 'Karachi',
    notes: '',
  });

  const subtotal = getTotalPrice();
  const deliveryFee = subtotal >= 4999 ? 0 : 199;
  const grandTotal = subtotal + deliveryFee;

  const handleOrderSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: formData,
          paymentMethod,
          subtotal,
          deliveryFee,
          total: grandTotal,
          items,
        }),
      });

      const createdOrder = await res.json();

      if (createdOrder.orderNumber) {
        sessionStorage.setItem('latestOrder', JSON.stringify(createdOrder));
        clearCart();
        router.push(`/order-success?orderId=${createdOrder.orderNumber}`);
      }
    } catch (err) {
      alert('Failed to place order. Please check connection.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Inspection Guarantee Banner */}
      <div className="mb-8 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg flex items-start gap-3">
        <PackageOpen className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-bold text-emerald-950">
            Open Parcel Before Payment Guaranteed
          </h2>
          <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
            All shipments through our courier partners (Leopard/Trax) are authorized for opening and checking size/quality before handing cash over.
          </p>
        </div>
      </div>

      <form onSubmit={handleOrderSubmission} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="border border-neutral-200 rounded-lg p-6 bg-white shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-4">
              1. Delivery Address & Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Usman Tariq"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 w-full p-2.5 text-xs border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">WhatsApp / Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="03001234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 w-full p-2.5 text-xs border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700">Complete Street Address / House # *</label>
                <input
                  type="text"
                  required
                  placeholder="House # 12, Street 3, Sector..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full p-2.5 text-xs border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Destination City *</label>
                <input
                  type="text"
                  required
                  placeholder="Karachi, Karachi, Islamabad..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 w-full p-2.5 text-xs border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Nearest Landmark / Instructions</label>
                <input
                  type="text"
                  placeholder="Near Meezan Bank..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 w-full p-2.5 text-xs border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Localized Payment Selection */}
          <div className="border border-neutral-200 rounded-lg p-6 bg-white shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-4">
              2. Select Payment Method
            </h2>
            <div className="space-y-3">
              {/* COD */}
              <label className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition ${
                paymentMethod === 'COD' ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' : 'border-neutral-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-neutral-800" />
                      Cash on Delivery (Pay When You Receive)
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold uppercase">
                      Most Popular
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Pay the courier in cash after inspecting the shoes at your doorstep.
                  </p>
                </div>
              </label>

              {/* Easypaisa */}
              <label className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition ${
                paymentMethod === 'EASYPAISA' ? 'border-[#00A859] bg-emerald-50/40 ring-1 ring-[#00A859]' : 'border-neutral-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'EASYPAISA'}
                  onChange={() => setPaymentMethod('EASYPAISA')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-[#00A859]" />
                    Easypaisa Direct Mobile Account
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Instant prompt on your mobile wallet or via Easypaisa Till QR.
                  </p>
                </div>
              </label>

              {/* JazzCash */}
              <label className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition ${
                paymentMethod === 'JAZZCASH' ? 'border-[#ED1C24] bg-red-50/30 ring-1 ring-[#ED1C24]' : 'border-neutral-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'JAZZCASH'}
                  onChange={() => setPaymentMethod('JAZZCASH')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-[#ED1C24]" />
                    JazzCash Wallet & Debit Card
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Approve directly from your JazzCash app with standard MPIN.
                  </p>
                </div>
              </label>

              {/* NayaPay */}
              <label className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition ${
                paymentMethod === 'NAYAPAY' ? 'border-[#FF6600] bg-orange-50/30 ring-1 ring-[#FF6600]' : 'border-neutral-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'NAYAPAY'}
                  onChange={() => setPaymentMethod('NAYAPAY')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-[#FF6600]" />
                    NayaPay Wallet / Visa Card
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Seamless checkout with biometric approval on NayaPay.
                  </p>
                </div>
              </label>

              {/* Credit/Debit Cards */}
              <label className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition ${
                paymentMethod === 'CARD' ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' : 'border-neutral-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-neutral-700" />
                    Pakistani Bank Cards (PayFast / Safepay Gateway)
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Visa, Mastercard, PayPak, and UnionPay with 3D Secure OTP verification.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Review Box */}
        <div className="border border-neutral-200 rounded-lg p-6 bg-white shadow-xs h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
            Payment Summary
          </h3>
          <div className="space-y-2 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className="font-semibold text-neutral-900">
                {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
              </span>
            </div>
          </div>

          <div className="h-px bg-neutral-200 my-4" />

          <div className="flex justify-between items-baseline mb-6">
            <span className="text-sm font-bold text-neutral-900">Total Payable</span>
            <span className="text-xl font-black text-neutral-900">Rs. {grandTotal.toLocaleString()}</span>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold text-xs uppercase tracking-widest transition"
          >
            Confirm Order & Open Parcel
          </button>
        </div>
      </form>
    </div>
  );
}