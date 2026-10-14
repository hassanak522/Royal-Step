import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signStaffToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, action } = body;

    // Logout Action
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    // Input Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Database lookup for active staff
    const staff = await prisma.staffUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!staff || !staff.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials or inactive account.' },
        { status: 401 }
      );
    }

    // Verify Password Hash
    const isValidPassword = await bcrypt.compare(password, staff.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials or inactive account.' },
        { status: 401 }
      );
    }

    // Update Last Login timestamp & write audit log
    await prisma.$transaction([
      prisma.staffUser.update({
        where: { id: staff.id },
        data: { lastLoginAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          staffUserId: staff.id,
          action: 'STAFF_LOGIN',
          entity: 'StaffUser',
          entityId: staff.id,
          newValue: `Staff user ${staff.name} (${staff.role}) logged in.`,
        },
      }),
    ]);

    // Issue Secure Signed JWT
    const token = signStaffToken({
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: staff.id, name: staff.name, email: staff.email, role: staff.role },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Admin auth route error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}