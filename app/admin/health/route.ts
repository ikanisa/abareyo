import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendConfigured = Boolean(process.env.NEXT_PUBLIC_BACKEND_URL);
  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    backendConfigured,
  });
}
