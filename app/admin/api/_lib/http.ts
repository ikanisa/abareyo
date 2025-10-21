import { NextResponse } from 'next/server';

export type AdminApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
  };
};

export const respond = <T>(data: T, init?: number) =>
  NextResponse.json({ data }, { status: init ?? 200 });

export const respondWithError = (code: string, message: string, status = 400, details?: Record<string, unknown>) =>
  NextResponse.json<AdminApiError>({ error: { code, message, details } }, { status });

export const respondWithSupabaseNotConfigured = () =>
  respondWithError('supabase_not_configured', 'Supabase service role credentials are missing', 500);
