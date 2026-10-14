'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Barcode, 
  Search, 
  Store, 
  User, 
  Banknote, 
  CreditCard, 
  CheckCircle2, 
  Printer, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  cacheBranchProducts, 
  searchOfflineProducts, 
  queueSaleOffline, 
  getPendingOfflineCount, 
  replayOfflineQueue 
} from '@/lib/pos-offline';

interface CartItem {
  variantId: string;
  sku: string;
  name: string;
  sizeEU: number;
  price: number;
  quantity: number;
  branchStock: number;
}

export default function BranchPOSTerminal() {
  const [branchCode, setBranchCode] = useState('RET-KHI-01'); // Clifton
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [productsList, setProductsList] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tenderType, setTenderType] = useState<'CASH' | 'CARD' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Monitor Online / Offline Network Status & Auto-Sync
  const checkPendingQueue = useCallback(async () => {
    const count = await getPendingOfflineCount();
    setPendingSyncCount(count);
  }, []);

  const triggerReplay = useCallback(async () => {
    if (!navigator.onLine) return;
    const res = await replayOfflineQueue();
    if (res.count > 0) {
      await checkPendingQueue();
    }
  }, [checkPendingQueue]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    checkPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      triggerReplay();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkPendingQueue, triggerReplay]);

  // 2. Load and cache products
  const loadProducts = useCallback(async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch(`/api/pos/lookup?q=${encodeURIComponent(searchQuery || 'a')}&branchCode=${branchCode}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setProductsList(data);
          cacheBranchProducts(data); // Save into local IndexedDB
        }
      } catch {
        // Fallback to local cache on error
        const local = await searchOfflineProducts(searchQuery || '');
        setProductsList(local);
      }
    } else {
      const local = await searchOfflineProducts(searchQuery || '');
      setProductsList(local);
    }
  }, [branchCode, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 3. Cart Management
  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          variantId: item.variantId,
          sku: item.sku,
          name: item.name,
          sizeEU: item.sizeEU,
          price: item.price,
          quantity: 1,
          branchStock: item.branchStock || 10,
        },
      ];
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.variantId === variantId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const changeDue = Math.max(0, (parseFloat(cashTendered) || 0) - grandTotal);

  // 4. Complete Sale (Flow 4A: Online or Offline Queue)
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (tenderType === 'CASH' && (parseFloat(cashTendered) || 0) < grandTotal && cashTendered !== '') {
      alert('Tendered cash is less than total amount.');
      return;
    }

    setIsProcessing(true);

    const eventId = `EVT-POS-${crypto.randomUUID()}`;
    const branchPrefix = branchCode.replace('RET-KHI-', 'KHI');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RCP-${branchPrefix}-${Date.now().toString().slice(-4)}${randomSuffix}`;
    const idempotencyKey = `POS-KEY-${receiptNumber}`;

    const salePayload = {
      eventId,
      idempotencyKey,
      receiptNumber,
      locationCode: branchCode,
      cashierName: 'Desk 1 Cashier',
      lineItems: cart,
      tender: {
        type: tenderType,
        cashAmount: tenderType === 'CARD' ? 0 : (parseFloat(cashTendered) || grandTotal),
        cardAmount: tenderType === 'CASH' ? 0 : grandTotal,
        discount,
      },
    };

    if (navigator.onLine) {
      // ONLINE PATH: Direct commit to Central Backend API
      try {
        const res = await fetch('/api/pos/sale/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(salePayload),
        });

        if (res.ok) {
          setCompletedReceipt({
            receiptNumber,
            total: grandTotal,
            tenderType,
            itemsJson: cart,
            changeDue,
            offlineMode: false,
          });
          setCart([]);
          setCashTendered('');
          setDiscount(0);
        } else {
          // If server returns error, queue offline as safe fallback
          await queueSaleOffline(salePayload);
          await checkPendingQueue();
          setCompletedReceipt({
            receiptNumber,
            total: grandTotal,
            tenderType,
            itemsJson: cart,
            changeDue,
            offlineMode: true,
          });
          setCart([]);
          setCashTendered('');
          setDiscount(0);
        }
      } catch {
        // Network drop mid-request: save offline
        await queueSaleOffline(salePayload);
        await checkPendingQueue();
        setCompletedReceipt({
          receiptNumber,
          total: grandTotal,
          tenderType,
          itemsJson: cart,
          changeDue,
          offlineMode: true,
        });
        setCart([]);
        setCashTendered('');
        setDiscount(0);
      }
    } else {
      // OFFLINE PATH: Queue in local IndexedDB
      await queueSaleOffline(salePayload);
      await checkPendingQueue();
      setCompletedReceipt({
        receiptNumber,
        total: grandTotal,
        tenderType,
        itemsJson: cart,
        changeDue,
        offlineMode: true,
      });
      setCart([]);
      setCashTendered('');
      setDiscount(0);
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Top Header with Online/Offline Network Status Bar */}
      <header className="bg-neutral-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 text-neutral-950 px-2.5 py-1 rounded font-black text-xs uppercase">
            POS v2.08
          </div>
          <h1 className="font-black text-base uppercase tracking-tight">
            Royal Step Retail Terminal
          </h1>
          <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1 rounded text-xs">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="RET-KHI-01" className="bg-neutral-900">Clifton Branch (Park Towers)</option>
              <option value="RET-KHI-02" className="bg-neutral-900">Tariq Road PECHS Branch</option>
              <option value="RET-KHI-03" className="bg-neutral-900">Saddar Heritage Outlet</option>
              <option value="RET-KHI-04" className="bg-neutral-900">Gulshan-e-Iqbal Branch</option>
            </select>
          </div>
        </div>

        {/* Connectivity Indicator */}
        <div className="flex items-center gap-4 text-xs">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded">
              <Wifi className="w-3.5 h-3.5" /> Online (Sync Active)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded">
              <WifiOff className="w-3.5 h-3.5" /> Offline Mode (Saving Locally)
            </span>
          )}

          {pendingSyncCount > 0 && (
            <button
              onClick={triggerReplay}
              className="flex items-center gap-1 bg-amber-500 text-neutral-950 px-2 py-1 rounded font-bold hover:bg-amber-400 transition"
              title="Click to sync offline transactions"
            >
              <RefreshCw className="w-3 h-3 animate-spin" /> {pendingSyncCount} Queued
            </button>
          )}

          <span className="text-neutral-400 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Cashier Desk 01
          </span>
        </div>
      </header>

      {/* Main Terminal Grid */}
      <div className="flex-1 p-4 grid grid-cols-12 gap-4 max-w-[1600px] w-full mx-auto">
        {/* Left Column: Product Search & Direct Selector (7 Cols) */}
        <div className="col-span-7 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Search style name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm font-bold pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-neutral-900 focus:bg-white outline-none"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Manual Product Selector (Click to Add)
              </h3>
              <span className="text-[10px] text-neutral-500">
                {productsList.length} items available
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[550px] pr-1">
              {productsList.map((item) => (
                <button
                  key={item.variantId}
                  type="button"
                  onClick={() => addToCart(item)}
                  className="p-3 border border-neutral-200 rounded-xl text-left bg-neutral-50/50 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition group flex flex-col justify-between"
                >
                  <div>
                    <span className="block font-bold text-xs truncate group-hover:text-white">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300 font-mono">
                      EU {item.sizeEU} &bull; {item.sku}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-neutral-200/60 group-hover:border-neutral-700 flex justify-between items-center">
                    <span className="font-black text-xs">
                      Rs. {item.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold bg-neutral-200 text-neutral-800 group-hover:bg-amber-400 group-hover:text-neutral-950 px-1.5 py-0.5 rounded">
                      + Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Ticket, Tenders & Payment (5 Cols) */}
        <div className="col-span-5 bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b bg-neutral-50 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm uppercase text-neutral-900">Current Sale Ticket</h2>
              <span className="text-[10px] text-neutral-500">{cart.length} item(s) in ticket</span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-[11px] text-red-600 font-bold hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 divide-y">
            {cart.length === 0 ? (
              <div className="py-24 text-center text-neutral-400">
                <Barcode className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No items added to ticket yet.</p>
                <p className="text-[10px]">Click any item on the left to add.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variantId} className="py-3 flex items-center justify-between">
                  <div className="flex-1 pr-3">
                    <h4 className="font-bold text-xs text-neutral-900 leading-snug">{item.name}</h4>
                    <span className="text-[11px] font-mono text-neutral-500">
                      Size: EU {item.sizeEU} &bull; Rs. {item.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, -1)}
                      className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center font-bold text-xs hover:bg-neutral-200"
                    >
                      -
                    </button>
                    <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, 1)}
                      className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center font-bold text-xs hover:bg-neutral-200"
                    >
                      +
                    </button>
                  </div>

                  <span className="w-24 text-right font-black text-xs text-neutral-900">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Tender Controls */}
          <div className="p-4 border-t bg-neutral-50 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTenderType('CASH')}
                className={`py-2 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  tenderType === 'CASH' ? 'bg-neutral-900 text-white' : 'bg-white border text-neutral-700'
                }`}
              >
                <Banknote className="w-4 h-4" /> Cash Tender[cite: 6, 15]
              </button>
              <button
                type="button"
                onClick={() => setTenderType('CARD')}
                className={`py-2 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  tenderType === 'CARD' ? 'bg-neutral-900 text-white' : 'bg-white border text-neutral-700'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Card Machine[cite: 6, 15]
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Manager Discount (PKR):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 p-1 border rounded text-right font-bold text-xs bg-white"
                />
              </div>
              <div className="flex justify-between text-base font-black text-neutral-900 pt-1 border-t">
                <span>Payable Total:</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {tenderType === 'CASH' && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-600">Cash Received</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full p-2 border font-mono font-bold text-sm rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-600">Change Due</label>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono font-black text-sm rounded text-right">
                    Rs. {changeDue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={isProcessing || cart.length === 0}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg font-black text-xs uppercase tracking-wider transition"
            >
              {isProcessing
                ? 'Processing...'
                : isOnline
                ? `Charge Rs. ${grandTotal.toLocaleString()} & Commit Sale`
                : `Save Locally (Offline) & Print Receipt`}
            </button>
          </div>
        </div>
      </div>

      {/* Screen Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-2" />
            <h3 className="font-black text-base uppercase text-neutral-900">Sale Confirmed</h3>
            <span className="text-xs text-neutral-500 font-mono mb-1">{completedReceipt.receiptNumber}</span>
            {completedReceipt.offlineMode && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold mb-3">
                Saved to Offline Queue (Will auto-sync on reconnect)
              </span>
            )}

            <div className="w-full border-t border-b border-dashed py-4 font-mono text-[11px] space-y-1.5 text-neutral-700">
              <div className="text-center font-bold text-xs uppercase">Royal Step Footwear</div>
              <div className="text-center text-[10px] text-neutral-500 mb-2">Clifton Outlet, Karachi[cite: 1, 4]</div>
              {Array.isArray(completedReceipt.itemsJson) &&
                completedReceipt.itemsJson.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name} (EU {item.sizeEU}) x{item.quantity}</span>
                    <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              <div className="border-t pt-1 font-bold flex justify-between text-xs">
                <span>TOTAL:</span>
                <span>Rs. {completedReceipt.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 w-full mt-5">
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="flex-1 py-2.5 border rounded-lg text-xs font-bold uppercase text-neutral-700 hover:bg-neutral-50"
              >
                Close Ticket
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}