'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { upsertAdminMembershipPlan, updateAdminMembershipStatus } from '@/lib/api/admin/membership';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

  const [planOpen, setPlanOpen] = useState(true);
  const [memberOpen, setMemberOpen] = useState(false);

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
    <div className="grid gap-4 lg:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]">
      <Collapsible
        open={planOpen}
        onOpenChange={setPlanOpen}
        className="rounded-xl border border-white/10 bg-white/5"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="text-sm font-semibold text-slate-100">Create/Update Plan</div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              {planOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-3 border-t border-white/10 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
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
          <Button onClick={handleSavePlan} disabled={isPending} className="w-full sm:w-auto">
            Save Plan
          </Button>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible
        open={memberOpen}
        onOpenChange={setMemberOpen}
        className="rounded-xl border border-white/10 bg-white/5"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="text-sm font-semibold text-slate-100">Update Member Status</div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              {memberOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-3 border-t border-white/10 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
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
          <Button onClick={handleUpdateMember} disabled={isPending} className="w-full sm:w-auto">
            Update Member
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

