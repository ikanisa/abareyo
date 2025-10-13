import { NextResponse } from 'next/server';

export const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export const successResponse = <T>(data: T, status = 200) =>
  NextResponse.json({ data }, { status });
