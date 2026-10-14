import { prisma } from '@/lib/prisma';

export async function processOutboxBatch() {
  const batchSize = 50;

  // 1. Fetch pending events with pessimistic lock simulation
  const pendingEvents = await prisma.outboxEvent.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: batchSize,
  });

  for (const event of pendingEvents) {
    try {
      // Mark event as PROCESSING
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: 'PROCESSING' },
      });

      // 2. Dispatch event to respective domain adapters
      switch (event.eventType) {
        case 'POS.SALE_COMMITTED':
          await handlePosSaleCommitted(event.payload);
          break;

        case 'INVENTORY.TRANSFER_DISPATCHED':
          await notifyDestinationBranch(event.payload);
          break;

        case 'ORDER.PAYMENT_CONFIRMED':
          await notifyWarehouseForPicking(event.payload);
          break;

        case 'LOGISTICS.DISPATCHED':
          await sendCustomerTrackingNotification(event.payload);
          break;

        default:
          console.warn(`Unregistered event type: ${event.eventType}`);
      }

      // 3. Mark event as PUBLISHED
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'PUBLISHED',
          processedAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (err: any) {
      console.error(`Outbox dispatch failed for ${event.id}:`, err);

      const nextRetryCount = event.retryCount + 1;
      const isDeadLetter = nextRetryCount >= 5;

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          retryCount: nextRetryCount,
          status: isDeadLetter ? 'DEAD_LETTER' : 'PENDING',
          errorMessage: err.message || 'Unknown network error',
        },
      });
    }
  }
}

// Adapters
async function handlePosSaleCommitted(payload: any) {
  // Update HQ Live Analytics cache or socket stream
}

async function notifyDestinationBranch(payload: any) {
  // Trigger internal branch dashboard notification
}

async function notifyWarehouseForPicking(payload: any) {
  // Push order directly into WMS pick-queue
}

async function sendCustomerTrackingNotification(payload: any) {
  // Call WhatsApp / SMS API provider
}