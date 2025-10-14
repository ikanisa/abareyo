import { NextRequest, NextResponse } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

const PRODUCT_SELECT = 'id, name, category, price, stock, description, image_url, images, badge, created_at';

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdmin();
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category') ?? undefined;
    const query = searchParams.get('q') ?? undefined;

    let builder = supabase.from('shop_products').select(PRODUCT_SELECT).order('name', { ascending: true });

    if (category) {
      builder = builder.eq('category', category);
    }

    if (query) {
      const sanitized = query.replace(/'/g, "''");
      builder = builder.or([
        `name.ilike.%${sanitized}%`,
        `description.ilike.%${sanitized}%`,
        `badge.ilike.%${sanitized}%`,
      ].join(','));
    }

    const { data, error } = await builder;
    if (error) throw error;

    return NextResponse.json({ products: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to load shop products', error);
    return NextResponse.json({ error: 'products_fetch_failed' }, { status: 500 });
  }
}

type ProductPayload = {
  id?: string;
  name?: string;
  category?: string | null;
  price?: number;
  stock?: number;
  description?: string | null;
  badge?: string | null;
  image_url?: string | null;
  images?: string[];
};

export async function POST(request: NextRequest) {
  let payload: ProductPayload | null = null;

  try {
    const session = await requireAdminSession();
    const supabase = getSupabaseAdmin();

    payload = (await request.json().catch(() => null)) as ProductPayload | null;
    if (!payload?.name || typeof payload.price !== 'number') {
      return NextResponse.json({ error: 'name_and_price_required' }, { status: 400 });
    }

    const gallery = Array.isArray(payload.images) ? payload.images.filter(Boolean) : [];
    const insert = {
      name: payload.name,
      category: payload.category ?? 'general',
      price: payload.price,
      stock: payload.stock ?? 0,
      description: payload.description ?? null,
      badge: payload.badge ?? null,
      image_url: payload.image_url ?? gallery[0] ?? null,
      images: gallery,
    };

    const { data, error } = await supabase
      .from('shop_products')
      .insert(insert)
      .select(PRODUCT_SELECT)
      .single();

    if (error) throw error;

    await recordAudit(supabase, {
      action: 'shop_products.insert',
      entityType: 'shop_product',
      entityId: data.id,
      before: null,
      after: data,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    return NextResponse.json({ product: data });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to create product', error, payload);
    return NextResponse.json({ error: 'product_create_failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let payload: ProductPayload | null = null;

  try {
    const session = await requireAdminSession();
    const supabase = getSupabaseAdmin();

    payload = (await request.json().catch(() => null)) as ProductPayload | null;
    if (!payload?.id) {
      return NextResponse.json({ error: 'id_required' }, { status: 400 });
    }

    const { data: before, error: beforeError } = await supabase
      .from('shop_products')
      .select(PRODUCT_SELECT)
      .eq('id', payload.id)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'product_not_found' }, { status: 404 });

    const gallery = Array.isArray(payload.images) ? payload.images.filter(Boolean) : (before.images as string[] | null) ?? [];

    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.category !== undefined) updates.category = payload.category;
    if (payload.price !== undefined) updates.price = payload.price;
    if (payload.stock !== undefined) updates.stock = payload.stock;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.badge !== undefined) updates.badge = payload.badge;
    if (payload.image_url !== undefined) updates.image_url = payload.image_url;
    updates.images = gallery;
    if (updates.image_url === undefined && gallery.length > 0) {
      updates.image_url = gallery[0];
    }

    const { data: updated, error: updateError } = await supabase
      .from('shop_products')
      .update(updates)
      .eq('id', payload.id)
      .select(PRODUCT_SELECT)
      .single();

    if (updateError) throw updateError;

    await recordAudit(supabase, {
      action: 'shop_products.update',
      entityType: 'shop_product',
      entityId: payload.id,
      before,
      after: updated,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to update product', error, payload);
    return NextResponse.json({ error: 'product_update_failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const supabase = getSupabaseAdmin();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id_required' }, { status: 400 });
    }

    const { data: before, error: beforeError } = await supabase
      .from('shop_products')
      .select(PRODUCT_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'product_not_found' }, { status: 404 });

    const { error } = await supabase.from('shop_products').delete().eq('id', id);
    if (error) throw error;

    await recordAudit(supabase, {
      action: 'shop_products.delete',
      entityType: 'shop_product',
      entityId: id,
      before,
      after: null,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to delete product', error);
    return NextResponse.json({ error: 'product_delete_failed' }, { status: 500 });
  }
}
