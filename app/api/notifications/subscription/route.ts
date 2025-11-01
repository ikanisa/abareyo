import { NextResponse } from 'next/server';
import { z } from 'zod';

import { tryGetServiceSupabaseClient } from '@/app/api/_lib/supabase';

const BODY_SCHEMA = z.object({
  platform: z.enum(['web', 'expo']),
  token: z.string().min(1).optional(),
  subscription: z.unknown().optional(),
  deviceId: z.string().optional(),
  build: z.string().optional(),
});

const memoryStore = new Map<string, unknown>();

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = BODY_SCHEMA.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const userId = DEFAULT_USER_ID;

  const supabase = tryGetServiceSupabaseClient();

  if (payload.platform === 'expo') {
    if (!payload.token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 });
    }

    if (!supabase) {
      memoryStore.set(`expo:${payload.token}`, {
        token: payload.token,
        deviceId: payload.deviceId,
        build: payload.build,
      });
      return NextResponse.json({ ok: true, mode: 'memory' });
    }

    const { error } = await supabase
      .from('notification_devices')
      .upsert(
        {
          user_id: userId,
          platform: 'expo',
          expo_token: payload.token,
          web_endpoint: null,
          subscription: null,
          device_id: payload.deviceId ?? null,
          build: payload.build ?? null,
          enabled: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'expo_token' },
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const subscription = payload.subscription as PushSubscriptionJSON | undefined;
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'missing_subscription' }, { status: 400 });
  }

  if (!supabase) {
    memoryStore.set(`web:${subscription.endpoint}`, subscription);
    return NextResponse.json({ ok: true, mode: 'memory' });
  }

  const { error } = await supabase
    .from('notification_devices')
    .upsert(
      {
        user_id: userId,
        platform: 'web',
        web_endpoint: subscription.endpoint,
        subscription,
        expo_token: null,
        device_id: payload.deviceId ?? null,
        build: payload.build ?? null,
        enabled: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'web_endpoint' },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

const DELETE_SCHEMA = z.object({
  platform: z.enum(['web', 'expo']).optional(),
  token: z.string().optional(),
  endpoint: z.string().optional(),
});

export async function DELETE(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = DELETE_SCHEMA.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { platform, token, endpoint } = parsed.data;
  const supabase = tryGetServiceSupabaseClient();

  if (!supabase) {
    if (platform === 'expo' && token) {
      memoryStore.delete(`expo:${token}`);
    }
    if (platform === 'web' && endpoint) {
      memoryStore.delete(`web:${endpoint}`);
    }
    return NextResponse.json({ ok: true, mode: 'memory' });
  }

  if (platform === 'expo' && token) {
    await supabase.from('notification_devices').update({ enabled: false }).eq('expo_token', token);
  } else if (platform === 'web' && endpoint) {
    await supabase.from('notification_devices').update({ enabled: false }).eq('web_endpoint', endpoint);
  }

  return NextResponse.json({ ok: true });
}
