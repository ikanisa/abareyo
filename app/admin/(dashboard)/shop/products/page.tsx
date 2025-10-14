'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminShopProduct,
  createAdminShopProduct,
  deleteAdminShopProduct,
  listAdminShopProducts,
  updateAdminShopProduct,
  uploadAdminMedia,
} from '@/lib/api/admin/shop-console';

const CATEGORY_OPTIONS = ['jerseys', 'training', 'lifestyle', 'accessories', 'kids', 'bundles', 'misc'] as const;

type FormState = {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  badge: string;
  images: string[];
};

const emptyForm: FormState = {
  name: '',
  category: 'jerseys',
  price: 0,
  stock: 0,
  description: '',
  badge: '',
  images: [],
};

export default function AdminShopProductsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminShopProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const productsQuery = useQuery({
    queryKey: ['admin', 'shop', 'products'],
    queryFn: () => listAdminShopProducts(),
  });

  useEffect(() => {
    if (!dialogOpen) {
      setForm(emptyForm);
      setEditingProduct(null);
    }
  }, [dialogOpen]);

  const products = useMemo(() => {
    return (productsQuery.data ?? []).map((product) => ({
      ...product,
      images: Array.isArray(product.images) ? product.images : [],
    }));
  }, [productsQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => createAdminShopProduct(form),
    onSuccess: () => {
      toast({ title: 'Product created' });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop', 'products'] }).catch(() => undefined);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to create product';
      toast({ title: 'Creation failed', description: message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminShopProduct({ id: editingProduct!.id, ...form }),
    onSuccess: () => {
      toast({ title: 'Product updated' });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop', 'products'] }).catch(() => undefined);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to update product';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminShopProduct(id),
    onSuccess: () => {
      toast({ title: 'Product removed' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop', 'products'] }).catch(() => undefined);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to delete product';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    },
  });

  const saveDisabled = form.name.trim().length === 0 || Number.isNaN(form.price);

  const handleUpload = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const binary = String.fromCharCode(...new Uint8Array(arrayBuffer));
    const base64 = btoa(binary);
    const dataUrl = `data:${file.type};base64,${base64}`;
    const url = await uploadAdminMedia({ fileName: file.name, dataUrl });
    setForm((current) => ({ ...current, images: [...current.images, url] }));
  };

  const startEdit = (product: AdminShopProduct) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category ?? 'misc',
      price: product.price,
      stock: product.stock,
      description: product.description ?? '',
      badge: product.badge ?? '',
      images: product.images ?? [],
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Catalog</h2>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New product
        </Button>
      </div>

      {productsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <GlassCard className="p-6 text-center text-sm text-slate-400">No products yet.</GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <GlassCard key={product.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-100">{product.name}</div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">{product.category ?? 'misc'}</div>
                </div>
                <Badge variant="secondary" className="bg-white/10 text-xs text-slate-100">
                  {product.price.toLocaleString()} RWF
                </Badge>
              </div>
              {product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.name} className="h-32 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-slate-400">
                  No image
                </div>
              )}
              <div className="text-xs text-slate-400">Stock {product.stock}</div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => startEdit(product)} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(product.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit product' : 'Create product'}</DialogTitle>
            <DialogDescription>Manage catalog entry details and media assets.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4 py-2">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm((state) => ({ ...state, category: value }))}
                  >
                    <SelectTrigger id="category" className="bg-slate-900/60 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-slate-100">
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option} className="capitalize">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="price">Price (RWF)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(event) => setForm((state) => ({ ...state, price: Number(event.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={form.stock}
                    onChange={(event) => setForm((state) => ({ ...state, stock: Number(event.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="badge">Badge</Label>
                <Input id="badge" value={form.badge} onChange={(event) => setForm((state) => ({ ...state, badge: event.target.value }))} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Images</Label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-slate-200">
                    <ImagePlus className="h-4 w-4" /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        try {
                          await handleUpload(file);
                          toast({ title: 'Image uploaded' });
                        } catch (error) {
                          const message = error instanceof Error ? error.message : 'Upload failed';
                          toast({ title: 'Upload failed', description: message, variant: 'destructive' });
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((image) => (
                    <div key={image} className="group relative">
                      <img src={image} alt="Product" className="h-20 w-20 rounded-xl object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white group-hover:block"
                        onClick={() =>
                          setForm((state) => ({ ...state, images: state.images.filter((url) => url !== image) }))
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => (editingProduct ? updateMutation.mutate() : createMutation.mutate())}
              disabled={saveDisabled || createMutation.isPending || updateMutation.isPending}
            >
              {editingProduct ? 'Update' : 'Create'} product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
