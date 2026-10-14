'use client';

import React, { useState } from 'react';
import { Truck, Check, X, AlertTriangle } from 'lucide-react';

interface TransferDispatchModalProps {
  transfer: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferDispatchModal({ transfer, onClose, onSuccess }: TransferDispatchModalProps) {
  const [manifestNumber, setManifestNumber] = useState(`TRK-KHI-${Math.floor(1000 + Math.random() * 9000)}`);
  const [loading, setLoading] = useState(false);

  const handleDispatch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/warehouse/transfers/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: transfer.id,
          vehicleManifestNumber: manifestNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Transfer ${transfer.transferNumber} marked IN-TRANSIT! Stock deducted from warehouse.`);
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to dispatch transfer.');
      }
    } catch {
      alert('Network failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-sm uppercase text-neutral-900">
              Dispatch Replenishment Shipment
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs space-y-2">
          <p className="text-neutral-600">
            <strong>Transfer #:</strong> <span className="font-mono text-neutral-900">{transfer.transferNumber}</span>
          </p>
          <p className="text-neutral-600">
            <strong>Destination:</strong> <span className="font-bold text-neutral-900">{transfer.destinationLocation?.name}</span>
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
            Delivery Van / Courier Manifest # *
          </label>
          <input
            type="text"
            value={manifestNumber}
            onChange={(e) => setManifestNumber(e.target.value)}
            className="w-full p-2.5 text-xs font-mono font-bold border rounded-lg bg-neutral-50 focus:bg-white outline-none"
          />
        </div>

        <div className="border rounded-lg p-3 bg-neutral-50 max-h-48 overflow-y-auto space-y-2">
          <span className="text-[10px] font-bold uppercase text-neutral-500 block">Pairs to be Dispatched:</span>
          {transfer.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-xs font-medium">
              <span>{item.variant?.product?.name} (EU {item.variant?.sizeEU})</span>
              <strong className="font-mono">{item.quantitySent} Pairs</strong>
            </div>
          ))}
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Dispatching immediately decrements warehouse on-hand stock and flags shipment as In-Transit.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-bold uppercase text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={loading}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-lg text-xs font-black uppercase tracking-wider transition"
          >
            {loading ? 'Dispatching...' : 'Confirm Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
}