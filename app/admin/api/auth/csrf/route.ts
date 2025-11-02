import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

import { applySecurityHeaders } from '@/config/security-headers.mjs';
import { ADMIN_CSRF_COOKIE } from '@/lib/admin/csrf';
const TOKEN_LENGTH_BYTES = 32;

const generateToken = () => randomBytes(TOKEN_LENGTH_BYTES).toString('hex');

export async function GET() {
  const token = generateToken();
  const response = NextResponse.json({ token });

  response.cookies.set({
    name: ADMIN_CSRF_COOKIE,
    value: token,
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });

  return applySecurityHeaders(response);
}

