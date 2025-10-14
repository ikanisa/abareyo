'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAdminSession } from '@/providers/admin-session-provider';

const now = () => new Date();
const tomorrow = () => new Date(Date.now() + 86_400_000);

const toDateTimeLocal = (iso: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const tzOffset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - tzOffset * 60_000);
  return adjusted.toISOString().slice(0, 16);
};

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  discount_pct: number | null;
  product_ids: string[];
  starts_at: string;
  ends_at: string;
  created_at: string;
  active: boolean;
};

type PromotionDraft = {
  title: string;
  description: string;
  discount_pct: number;
  product_ids: string;
  starts_at: string;
  ends_at: string;
};

const createEmptyDraft = (): PromotionDraft => ({
  title: 'New promotion',
  description: '',
  discount_pct: 10,
  product_ids: '',
  starts_at: now().toISOString(),
  ends_at: tomorrow().toISOString(),
});

const parseProductIds = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function PromotionsPage() {
  const { toast } = useToast();
  const { user } = useAdminSession();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<PromotionDraft>(() => createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PromotionDraft | null>(null);

  const adminId = user?.id ?? null;

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/admin/api/shop/promotions');
      if (!response.ok) {
        throw new Error('Failed to load promotions');
      }
      const payload = (await response.json()) as { promotions?: Promotion[] };
      setPromotions(payload.promotions ?? []);
    } catch (error) {
      console.error(error);
      toast({ title: 'Unable to load promotions', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

  const resetDraft = useCallback(() => {
    setDraft(createEmptyDraft());
  }, []);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        discount_pct: Number.isFinite(draft.discount_pct) ? draft.discount_pct : 0,
        product_ids: parseProductIds(draft.product_ids),
        starts_at: draft.starts_at,
        ends_at: draft.ends_at,
        adminId,
      };
      const response = await fetch('/admin/api/shop/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error ?? 'Unable to create promotion');
      }
      toast({ title: 'Promotion created' });
      resetDraft();
      await fetchPromotions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create promotion';
      toast({ title: 'Create failed', description: message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }, [adminId, draft, fetchPromotions, resetDraft, toast]);

  const beginEdit = useCallback((promotion: Promotion) => {
    setEditingId(promotion.id);
    setEditDraft({
      title: promotion.title,
      description: promotion.description ?? '',
      discount_pct: promotion.discount_pct ?? 0,
      product_ids: promotion.product_ids.join(', '),
      starts_at: promotion.starts_at,
      ends_at: promotion.ends_at,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft(null);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!editingId || !editDraft) return;
    setIsSaving(true);
    try {
      const payload = {
        id: editingId,
        title: editDraft.title.trim(),
        description: editDraft.description.trim() || null,
        discount_pct: Number.isFinite(editDraft.discount_pct) ? editDraft.discount_pct : null,
        product_ids: parseProductIds(editDraft.product_ids),
        starts_at: editDraft.starts_at,
        ends_at: editDraft.ends_at,
        adminId,
      };
      const response = await fetch('/admin/api/shop/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error ?? 'Unable to update promotion');
      }
      toast({ title: 'Promotion updated' });
      setEditingId(null);
      setEditDraft(null);
      await fetchPromotions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update promotion';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [adminId, editDraft, editingId, fetchPromotions, toast]);

  const handleDelete = useCallback(
    async (promotion: Promotion) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/admin/api/shop/promotions?id=${promotion.id}`, { method: 'DELETE' });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body?.error ?? 'Unable to delete promotion');
        }
        toast({ title: 'Promotion deleted' });
        await fetchPromotions();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete promotion';
        toast({ title: 'Delete failed', description: message, variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    },
    [fetchPromotions, toast],
  );

  const sortedPromotions = useMemo(
    () => promotions.slice().sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()),
    [promotions],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black gradient-text">Shop promotions</h1>
        <p className="text-sm text-muted-foreground">
          Schedule campaigns, set discount windows, and sync with matchday bundles.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-semibold text-foreground">Active & upcoming</h2>
          <Button onClick={resetDraft} variant="ghost" size="sm">
            Reset draft
          </Button>
        </div>
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`promo-skeleton-${index}`} className="h-48 w-full" />
            ))}
          </div>
        ) : sortedPromotions.length === 0 ? (
          <GlassCard className="p-8 text-center text-sm text-muted-foreground">
            No promotions yet. Use the composer below to launch a campaign.
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedPromotions.map((promotion) => {
              const isEditing = editingId === promotion.id && editDraft;
              const display = isEditing ? editDraft! : promotion;
              return (
                <GlassCard key={promotion.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {isEditing ? (
                            <Input
                              value={display.title}
                              onChange={(event) =>
                                setEditDraft((prev) =>
                                  prev ? { ...prev, title: event.target.value } : prev,
                                )
                              }
                              className="bg-white/5 text-foreground"
                            />
                          ) : (
                            promotion.title
                          )}
                        </h3>
                        {promotion.active ? <Badge variant="default">Active</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(promotion.starts_at).toLocaleString()} →{' '}
                        {new Date(promotion.ends_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => beginEdit(promotion)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => void handleDelete(promotion)} disabled={isSaving}>
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div>
                      <Label className="text-xs uppercase tracking-wide">Discount</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={display.discount_pct ?? ''}
                          onChange={(event) =>
                            setEditDraft((prev) =>
                              prev
                                ? { ...prev, discount_pct: Number(event.target.value) }
                                : prev,
                            )
                          }
                          className="mt-1 bg-white/5 text-foreground"
                        />
                      ) : (
                        <p className="mt-1 text-foreground font-medium">{promotion.discount_pct ?? 0}% off</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide">Description</Label>
                      {isEditing ? (
                        <Textarea
                          value={display.description ?? ''}
                          onChange={(event) =>
                            setEditDraft((prev) =>
                              prev ? { ...prev, description: event.target.value } : prev,
                            )
                          }
                          className="mt-1 min-h-[80px] bg-white/5 text-foreground"
                        />
                      ) : (
                        <p className="mt-1 text-foreground/80">
                          {promotion.description ? promotion.description : 'No description'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide">Products</Label>
                      {isEditing ? (
                        <Input
                          value={display.product_ids}
                          onChange={(event) =>
                            setEditDraft((prev) =>
                              prev ? { ...prev, product_ids: event.target.value } : prev,
                            )
                          }
                          className="mt-1 bg-white/5 text-foreground"
                          placeholder="Comma-separated UUIDs"
                        />
                      ) : (
                        <p className="mt-1 text-foreground/80">
                          {promotion.product_ids.length ? promotion.product_ids.join(', ') : 'All products'}
                        </p>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <Label className="text-xs uppercase tracking-wide">Starts at</Label>
                          <Input
                            type="datetime-local"
                            value={toDateTimeLocal(display.starts_at)}
                            onChange={(event) =>
                              setEditDraft((prev) =>
                                prev
                                  ? { ...prev, starts_at: new Date(event.target.value).toISOString() }
                                  : prev,
                              )
                            }
                            className="mt-1 bg-white/5 text-foreground"
                          />
                        </div>
                        <div>
                          <Label className="text-xs uppercase tracking-wide">Ends at</Label>
                          <Input
                            type="datetime-local"
                            value={toDateTimeLocal(display.ends_at)}
                            onChange={(event) =>
                              setEditDraft((prev) =>
                                prev
                                  ? { ...prev, ends_at: new Date(event.target.value).toISOString() }
                                  : prev,
                              )
                            }
                            className="mt-1 bg-white/5 text-foreground"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Compose promotion</h2>
            <p className="text-sm text-muted-foreground">
              Define the copy, targeted products, and discount window. Changes sync instantly to the fan shop.
            </p>
          </div>
        </div>
        <GlassCard className="p-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promo-title" className="text-xs uppercase tracking-wide">
                Title
              </Label>
              <Input
                id="promo-title"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="bg-white/5 text-foreground"
                placeholder="Example: Matchday merch drop"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-discount" className="text-xs uppercase tracking-wide">
                Discount (%)
              </Label>
              <Input
                id="promo-discount"
                type="number"
                min={1}
                max={90}
                value={draft.discount_pct}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, discount_pct: Number(event.target.value) || 0 }))
                }
                className="bg-white/5 text-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-description" className="text-xs uppercase tracking-wide">
              Description
            </Label>
            <Textarea
              id="promo-description"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              className="min-h-[100px] bg-white/5 text-foreground"
              placeholder="Include benefits, bundles, or checkout messaging."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-products" className="text-xs uppercase tracking-wide">
              Product IDs
            </Label>
            <Input
              id="promo-products"
              value={draft.product_ids}
              onChange={(event) => setDraft((prev) => ({ ...prev, product_ids: event.target.value }))}
              className="bg-white/5 text-foreground"
              placeholder="Comma-separated UUIDs. Leave blank for all products."
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promo-start" className="text-xs uppercase tracking-wide">
                Starts at
              </Label>
              <Input
                id="promo-start"
                type="datetime-local"
                value={toDateTimeLocal(draft.starts_at)}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, starts_at: new Date(event.target.value).toISOString() }))
                }
                className="bg-white/5 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-end" className="text-xs uppercase tracking-wide">
                Ends at
              </Label>
              <Input
                id="promo-end"
                type="datetime-local"
                value={toDateTimeLocal(draft.ends_at)}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, ends_at: new Date(event.target.value).toISOString() }))
                }
                className="bg-white/5 text-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={resetDraft}>
              Clear
            </Button>
            <Button onClick={handleCreate} disabled={creating || !draft.title.trim()}>
              {creating ? 'Creating…' : 'Publish promotion'}
            </Button>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
