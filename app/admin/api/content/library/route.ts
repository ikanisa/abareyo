import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError, respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';
import type { Json } from '@/integrations/supabase/types';

type ContentUpsertPayload = {
  id?: string;
  title: string;
  slug?: string;
  type?: string;
  status?: string;
  body?: Json;
  published_at?: string | null;
};

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.content']);
    return await withAdminServiceClient(async (supabase) => {
      const { data, error } = await supabase
        .from('content_items')
        .select('id, title, slug, type, status, published_at, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      adminLogger.info('content.library.list', { admin: session.user.id, count: data?.length ?? 0 });
      return respond({ items: data ?? [] });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('content.library.list_failed', { error: (error as Error).message });
    return respondWithError('content_fetch_failed', 'Unable to load content library', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.content']);
    const payload = (await request.json()) as ContentUpsertPayload;

    if (!payload?.title) {
      return respondWithError('content_title_required', 'Title is required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      if (payload.id) {
        const { data: before, error: beforeError } = await supabase
          .from('content_items')
          .select('id, title, slug, status, type, body, published_at')
          .eq('id', payload.id)
          .maybeSingle();
        if (beforeError) throw beforeError;
        if (!before) {
          return respondWithError('content_not_found', 'Content not found', 404);
        }

        const { data, error } = await supabase
          .from('content_items')
          .update({
            title: payload.title,
            slug: payload.slug ?? before.slug,
            type: payload.type ?? before.type,
            status: payload.status ?? before.status,
            body: payload.body ?? before.body,
            published_at: payload.published_at ?? before.published_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.id)
          .select('id, title, slug, status, type, published_at, updated_at')
          .single();

        if (error) throw error;

        await recordAudit(supabase, {
          action: 'content.update',
          entityType: 'content_item',
          entityId: payload.id,
          before,
          after: data,
          userId: session.user.id,
          ip: session.ip,
          userAgent: session.userAgent,
        });

        adminLogger.info('content.library.updated', { admin: session.user.id, item: payload.id });
        return respond({ item: data });
      }

      const { data, error } = await supabase
        .from('content_items')
        .insert({
          title: payload.title,
          slug: payload.slug ?? null,
          type: payload.type ?? 'article',
          status: payload.status ?? 'draft',
          body: payload.body ?? {},
          published_at: payload.published_at ?? null,
        })
        .select('id, title, slug, status, type, published_at, created_at')
        .single();

      if (error) throw error;

      await recordAudit(supabase, {
        action: 'content.create',
        entityType: 'content_item',
        entityId: data.id,
        before: null,
        after: data,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('content.library.created', { admin: session.user.id, item: data.id });
      return respond({ item: data }, 201);
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('content.library.save_failed', { error: (error as Error).message });
    return respondWithError('content_save_failed', 'Unable to save content item', 500);
  }
}
