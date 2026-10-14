import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface QueuedSale {
  eventId: string;
  idempotencyKey: string;
  receiptNumber: string;
  locationCode: string;
  cashierName: string;
  lineItems: any[];
  tender: {
    type: string;
    cashAmount: number;
    cardAmount: number;
    discount: number;
  };
  timestamp: number;
  synced: boolean;
}

interface RoyalStepPOSDB extends DBSchema {
  productsCache: {
    key: string; // SKU
    value: {
      variantId: string;
      sku: string;
      barcode?: string;
      name: string;
      sizeEU: number;
      price: number;
      branchStock: number;
    };
  };
  offlineSalesQueue: {
    key: string; // eventId
    value: QueuedSale;
  };
}

export async function getPOSDb(): Promise<IDBPDatabase<RoyalStepPOSDB>> {
  return openDB<RoyalStepPOSDB>('royal-step-pos-local', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('productsCache')) {
        db.createObjectStore('productsCache', { keyPath: 'sku' });
      }
      if (!db.objectStoreNames.contains('offlineSalesQueue')) {
        db.createObjectStore('offlineSalesQueue', { keyPath: 'eventId' });
      }
    },
  });
}

// 1. Cache products locally for offline search
export async function cacheBranchProducts(products: any[]) {
  const db = await getPOSDb();
  const tx = db.transaction('productsCache', 'readwrite');
  for (const item of products) {
    await tx.store.put(item);
  }
  await tx.done;
}

// 2. Search local offline cache
export async function searchOfflineProducts(query: string) {
  const db = await getPOSDb();
  const all = await db.getAll('productsCache');
  const q = query.toLowerCase().trim();
  return all.filter(
    (p) =>
      p.sku.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q))
  );
}

// 3. Queue an offline sale
export async function queueSaleOffline(sale: Omit<QueuedSale, 'timestamp' | 'synced'>) {
  const db = await getPOSDb();
  const record: QueuedSale = {
    ...sale,
    timestamp: Date.now(),
    synced: false,
  };
  await db.put('offlineSalesQueue', record);
  return record;
}

// 4. Get count of pending offline sales
export async function getPendingOfflineCount(): Promise<number> {
  const db = await getPOSDb();
  const all = await db.getAll('offlineSalesQueue');
  return all.length;
}

// 5. Replay pending offline queue to central backend
export async function replayOfflineQueue(onProgress?: (synced: number, total: number) => void) {
  const db = await getPOSDb();
  const queue = await db.getAll('offlineSalesQueue');
  if (queue.length === 0) return { count: 0 };

  let successCount = 0;

  for (const sale of queue) {
    try {
      const res = await fetch('/api/pos/sale/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': sale.idempotencyKey,
        },
        body: JSON.stringify(sale),
      });

      if (res.ok) {
        // Remove successfully synced transaction from IndexedDB
        await db.delete('offlineSalesQueue', sale.eventId);
        successCount++;
        if (onProgress) onProgress(successCount, queue.length);
      } else {
        console.error('Failed syncing event:', sale.eventId, await res.text());
      }
    } catch (err) {
      // Still offline or server unreachable; keep in queue
      console.warn('Network unreachable during replay, remaining in queue.');
      break;
    }
  }

  return { count: successCount, remaining: queue.length - successCount };
}