'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { upsertAdminMembershipPlan, updateAdminMembershipStatus } from '@/lib/api/admin/membership';

export const MembershipActions = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Plan form state
  const [planId, setPlanId] = useState('');
  const [planName, setPlanName] = useState('');
  const [planSlug, setPlanSlug] = useState('');
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [planPerks, setPlanPerks] = useState('');
  const [planActive, setPlanActive] = useState(true);

  // Member status form
  const [membershipId, setMembershipId] = useState('');
  const [memberStatus, setMemberStatus] = useState('pending');
  const [autoRenew, setAutoRenew] = useState(false);

  const handleSavePlan = async () => {
    startTransition(async () => {
      try {
        await upsertAdminMembershipPlan({
          id: planId || undefined,
          name: planName,
          slug: planSlug,
          price: Number.isFinite(planPrice) ? planPrice : 0,
          perks: planPerks
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
          isActive: planActive,
        });
        toast({ title: 'Plan saved', description: 'Membership plan created/updated.' });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save plan';
        toast({ title: 'Save failed', description: message, variant: 'destructive' });
      }
    });
  };

  const handleUpdateMember = async () => {
    startTransition(async () => {
      try {
        if (!membershipId) throw new Error('Membership ID required');
        await updateAdminMembershipStatus(membershipId, { status: memberStatus, autoRenew });
        toast({ title: 'Member updated', description: 'Status changed successfully.' });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update member';
        toast({ title: 'Update failed', description: message, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-slate-100">Create/Update Plan</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="plan-id">Existing Plan ID (optional)</Label>
            <Input id="plan-id" value={planId} onChange={(e) => setPlanId(e.target.value)} placeholder="Leave blank to create" />
          </div>
          <div>
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" value={planName} onChange={(e) => setPlanName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="plan-slug">Slug</Label>
            <Input id="plan-slug" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="plan-price">Price (RWF)</Label>
            <Input id="plan-price" type="number" value={planPrice} onChange={(e) => setPlanPrice(parseInt(e.target.value || '0', 10))} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="plan-perks">Perks (comma-separated)</Label>
            <Input id="plan-perks" value={planPerks} onChange={(e) => setPlanPerks(e.target.value)} placeholder="e.g., Priority gate, Merch discount" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="plan-active" checked={planActive} onCheckedChange={setPlanActive} />
            <Label htmlFor="plan-active">Active</Label>
          </div>
        </div>
        <Button onClick={handleSavePlan} disabled={isPending}>Save Plan</Button>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-slate-100">Update Member Status</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="membership-id">Membership ID</Label>
            <Input id="membership-id" value={membershipId} onChange={(e) => setMembershipId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="member-status">Status</Label>
            <Input id="member-status" value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)} placeholder="pending | active | cancelled | expired" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
            <Label htmlFor="auto-renew">Auto‑renew</Label>
          </div>
        </div>
        <Button onClick={handleUpdateMember} disabled={isPending}>Update Member</Button>
      </div>
    </div>
  );
};

