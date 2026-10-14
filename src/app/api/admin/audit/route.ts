import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        staffUser: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load audit logs.' }, { status: 500 });
  }
}