'use client';

import React, { useState } from 'react';
import { PackageCheck, AlertTriangle, X } from 'lucide-react';

interface ReceiveTransferModalProps {
  transfer: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceiveTransferModal({ transfer, onClose, onSuccess }: ReceiveTransferModalProps) {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    transfer.items?.forEach((i: any) => {
      initial[i.variantId] = i.quantitySent;
    });
    return initial;
  });

  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [loading, setLoading] = useState(false);

  const isDiscrepant = transfer.items?.some((i: any) => counts[i.variantId] !== i.quantitySent);

  const handleReceive = async () => {
    if (isDiscrepant && !discrepancyNote.trim()) {
      alert('A discrepancy note is required explaining missing/damaged shoes.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        transferId: transfer.id,
        itemsReceived: transfer.items.map((i: any) => ({
          variantId: i.variantId,
          quantityReceived: counts[i.variantId],
        })),
        discrepancyNote: isDiscrepant ? discrepancyNote : null,
      };

      const res = await fetch('/api/warehouse/transfers/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert(isDiscrepant ? 'Shipment received with discrepancy flagged.' : 'Transfer received in full! Branch stock updated.');
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to complete receipt.');
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
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-sm uppercase text-neutral-900">
              Verify & Accept Delivery
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-500">
          Verify physical shoe pairs received against dispatched quantities.
        </p>

        {/* Item verification list */}
        <div className="border rounded-xl divide-y max-h-56 overflow-y-auto">
          {transfer.items?.map((item: any) => {
            const sent = item.quantitySent;
            const received = counts[item.variantId];
            const hasVariance = received !== sent;

            return (
              <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-neutral-900 block">{item.variant?.product?.name}</span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Size: EU {item.variant?.sizeEU} &bull; Sent by WMS: <strong>{sent}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Counted:</label>
                  <input
                    type="number"
                    min="0"
                    max={sent}
                    value={received}
                    onChange={(e) =>
                      setCounts({ ...counts, [item.variantId]: parseInt(e.target.value, 10) || 0 })
                    }
                    className={`w-16 p-1.5 text-center font-bold border rounded ${
                      hasVariance ? 'border-red-500 bg-red-50 text-red-700' : 'bg-white'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Variance warning & note */}
        {isDiscrepant && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Discrepancy Detected</span>
            </div>
            <textarea
              required
              rows={2}
              placeholder="Explain discrepancy (e.g. 1 pair box crushed / 1 pair missing)..."
              value={discrepancyNote}
              onChange={(e) => setDiscrepancyNote(e.target.value)}
              className="w-full p-2 text-xs border rounded bg-white outline-none"
            />
          </div>
        )}

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
            onClick={handleReceive}
            disabled={loading}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-neutral-400 text-white rounded-lg text-xs font-black uppercase tracking-wider transition"
          >
            {loading ? 'Reconciling...' : 'Confirm Stock Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}