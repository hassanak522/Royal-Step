import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';

export async function GET() {
  try {
    let settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const staff = await getCurrentStaffSession();
    if (!staff || (staff.role !== 'SUPER_ADMIN' && staff.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();

    const dataPayload = {
      brandName: body.brandName,
      tagline: body.tagline,
      supportEmail: body.supportEmail,
      supportPhone: body.supportPhone,
      whatsappNumber: body.whatsappNumber,
      businessAddress: body.businessAddress || 'Plot 48, Sector 15, Korangi Industrial Area, Karachi',
      freeShippingThreshold: parseFloat(body.freeShippingThreshold) || 4999,
      flatShippingRate: parseFloat(body.flatShippingRate) || 200,
      announcementText: body.announcementText || 'Cash on Delivery Across Pakistan • Open Parcel Inspection Authorized',
    };

    const updated = await prisma.storeSetting.upsert({
      where: { id: 'default' },
      update: dataPayload,
      create: {
        id: 'default',
        ...dataPayload,
      },
    });

    await prisma.auditLog.create({
      data: {
        staffUserId: staff.id,
        action: 'UPDATE_SETTINGS',
        entity: 'StoreSetting',
        entityId: 'default',
        newValue: JSON.stringify(dataPayload),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}