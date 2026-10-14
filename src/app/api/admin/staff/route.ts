import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentStaffSession } from '@/lib/auth';

// List all staff members (Restricted to SUPER_ADMIN / OWNER)
export async function GET() {
  try {
    const session = await getCurrentStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Access denied: Requires administrator privileges.' }, { status: 403 });
    }

    const staffMembers = await prisma.staffUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(staffMembers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve staff team.' }, { status: 500 });
  }
}

// Create new staff account
export async function POST(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are mandatory.' }, { status: 400 });
    }

    const existing = await prisma.staffUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'A staff member with this email already exists.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createdStaff = await prisma.$transaction(async (tx) => {
      const user = await tx.staffUser.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          staffUserId: session.id,
          action: 'CREATE_STAFF_USER',
          entity: 'StaffUser',
          entityId: user.id,
          newValue: `Created ${user.name} (${user.email}) as ${user.role}`,
        },
      });

      return user;
    });

    return NextResponse.json({
      id: createdStaff.id,
      name: createdStaff.name,
      email: createdStaff.email,
      role: createdStaff.role,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create staff member.' }, { status: 500 });
  }
}

// Toggle staff active state or update role
export async function PATCH(req: Request) {
  try {
    const session = await getCurrentStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const { id, isActive, role } = await req.json();

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.staffUser.update({
        where: { id },
        data: {
          ...(typeof isActive === 'boolean' && { isActive }),
          ...(role && { role }),
        },
      });

      await tx.auditLog.create({
        data: {
          staffUserId: session.id,
          action: 'UPDATE_STAFF_PERMISSIONS',
          entity: 'StaffUser',
          entityId: id,
          newValue: `Updated staff permissions: Active=${user.isActive}, Role=${user.role}`,
        },
      });

      return user;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update staff permissions.' }, { status: 500 });
  }
}