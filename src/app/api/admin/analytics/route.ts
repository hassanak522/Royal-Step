import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'all'; // 'all', 'online', 'branches'

    // 1. Online Sales Totals
    const onlineOrders = await prisma.order.findMany({
      where: { fulfillmentStatus: { not: 'CANCELLED' } },
      include: { items: true },
    });

    const onlineGrossSales = onlineOrders.reduce((acc, o) => acc + o.total, 0);
    const onlineShippingCollected = onlineOrders.reduce((acc, o) => acc + o.deliveryFee, 0);
    const onlineItemRevenue = onlineGrossSales - onlineShippingCollected;

    // Online Cost of Goods Sold (COGS)
    let onlineCOGS = 0;
    for (const o of onlineOrders) {
      for (const item of o.items) {
        const itemCost = (item as any).costPrice ?? (item.unitPrice * 0.55); // Uses costPrice or estimates standard footwear cost basis
        onlineCOGS += itemCost * item.quantity;
      }
    }
    const onlineGrossMargin = onlineItemRevenue > 0 ? (((onlineItemRevenue - onlineCOGS) / onlineItemRevenue) * 100).toFixed(1) : '0';

    // 2. Physical POS Sales Totals
    const posReceipts = await prisma.posReceipt.findMany({
      include: { location: true },
    });

    const posGrossSales = posReceipts.reduce((acc, r) => acc + r.total, 0);

    // Group POS Sales By Physical Branch
    const branchBreakdown: Record<string, { name: string; sales: number; transactions: number }> = {};
    for (const r of posReceipts) {
      const code = r.location.code;
      if (!branchBreakdown[code]) {
        branchBreakdown[code] = { name: r.location.name, sales: 0, transactions: 0 };
      }
      branchBreakdown[code].sales += r.total;
      branchBreakdown[code].transactions += 1;
    }

    // 3. Consolidated Group Totals
    const consolidatedRevenue = onlineGrossSales + posGrossSales;

    // 4. Leopards COD Remittance Pipeline
    const pendingCodCollection = onlineOrders
      .filter((o) => o.paymentMethod === 'COD' && !o.codSettled)
      .reduce((acc, o) => acc + o.total, 0);

    const settledCodAmount = onlineOrders
      .filter((o) => o.paymentMethod === 'COD' && o.codSettled)
      .reduce((acc, o) => acc + o.total, 0);

    return NextResponse.json({
      consolidatedRevenue,
      online: {
        grossSales: onlineGrossSales,
        netProductSales: onlineItemRevenue,
        shippingRevenue: onlineShippingCollected,
        cogs: onlineCOGS,
        grossMarginPercentage: onlineGrossMargin,
        orderCount: onlineOrders.length,
        pendingCodCollection,
        settledCodAmount,
      },
      physicalRetail: {
        grossSales: posGrossSales,
        transactionCount: posReceipts.length,
        branches: Object.values(branchBreakdown),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to aggregate omnichannel metrics.' }, { status: 500 });
  }
}