import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback-secret-minimum-32-chars-long';
export const AUTH_COOKIE_NAME = 'royal_step_staff_session';

export interface StaffJWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function signStaffToken(payload: StaffJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyStaffToken(token: string): StaffJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as StaffJWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentStaffSession(): Promise<StaffJWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStaffToken(token);
}