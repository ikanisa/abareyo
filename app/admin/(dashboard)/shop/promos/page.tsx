'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const initialForm = {
  name: '',
  description: '',
  discountCode: '',
};

export default function AdminShopPromosPage() {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return true;
    },
    onSuccess: () => {
      toast({ title: 'Draft saved', description: 'Coordinate with marketing to launch this promo.' });
      setForm(initialForm);
    },
  });

  return (
    <div className="space-y-6">
      <GlassCard className="flex items-center gap-3 p-4">
        <Megaphone className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Promotions planner</h2>
          <p className="text-sm text-slate-400">
            Capture draft campaigns before syncing with the marketing automation stack.
          </p>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4 p-6">
        <div>
          <Label htmlFor="promo-name">Name</Label>
          <Input
            id="promo-name"
            value={form.name}
            onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            placeholder="Holiday flash sale"
            className="mt-1 bg-slate-900/60 text-slate-100"
          />
        </div>
        <div>
          <Label htmlFor="promo-description">Description</Label>
          <Textarea
            id="promo-description"
            value={form.description}
            onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
            rows={4}
            placeholder="Key talking points, eligible products, and audience segments"
          />
        </div>
        <div>
          <Label htmlFor="promo-code">Discount code</Label>
          <Input
            id="promo-code"
            value={form.discountCode}
            onChange={(event) => setForm((state) => ({ ...state, discountCode: event.target.value }))}
            placeholder="RAYON25"
            className="mt-1 bg-slate-900/60 text-slate-100"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name.trim()}>
            Save draft
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
