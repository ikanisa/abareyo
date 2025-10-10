'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { upsertAdminFundraisingProject, updateAdminFundraisingDonationStatus } from '@/lib/api/admin/fundraising';

export const FundraisingActions = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Project form
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState('draft');
  const [coverImage, setCoverImage] = useState('');

  // Donation status form
  const [donationId, setDonationId] = useState('');
  const [donationStatus, setDonationStatus] = useState('pending');

  const handleSaveProject = async () => {
    startTransition(async () => {
      try {
        await upsertAdminFundraisingProject({
          id: projectId || undefined,
          title,
          goal: Number.isFinite(goal) ? goal : 0,
          progress: Number.isFinite(progress) ? progress : 0,
          status,
          coverImage: coverImage || undefined,
        });
        toast({ title: 'Project saved', description: 'Fundraising project created/updated.' });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save project';
        toast({ title: 'Save failed', description: message, variant: 'destructive' });
      }
    });
  };

  const handleUpdateDonation = async () => {
    startTransition(async () => {
      try {
        if (!donationId) throw new Error('Donation ID required');
        await updateAdminFundraisingDonationStatus(donationId, { status: donationStatus });
        toast({ title: 'Donation updated', description: 'Status changed successfully.' });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update donation';
        toast({ title: 'Update failed', description: message, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-slate-100">Create/Update Project</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="project-id">Existing Project ID (optional)</Label>
            <Input id="project-id" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Leave blank to create" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="project-title">Title</Label>
            <Input id="project-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="project-goal">Goal (RWF)</Label>
            <Input id="project-goal" type="number" value={goal} onChange={(e) => setGoal(parseInt(e.target.value || '0', 10))} />
          </div>
          <div>
            <Label htmlFor="project-progress">Progress (RWF)</Label>
            <Input id="project-progress" type="number" value={progress} onChange={(e) => setProgress(parseInt(e.target.value || '0', 10))} />
          </div>
          <div>
            <Label htmlFor="project-status">Status</Label>
            <Input id="project-status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="draft | active | paused" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="cover-image">Cover image key (optional)</Label>
            <Input id="cover-image" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="e.g., s3 path or key" />
          </div>
        </div>
        <Button onClick={handleSaveProject} disabled={isPending}>Save Project</Button>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-slate-100">Update Donation Status</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="donation-id">Donation ID</Label>
            <Input id="donation-id" value={donationId} onChange={(e) => setDonationId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="donation-status">Status</Label>
            <Input id="donation-status" value={donationStatus} onChange={(e) => setDonationStatus(e.target.value)} placeholder="pending | confirmed | failed | manual_review" />
          </div>
        </div>
        <Button onClick={handleUpdateDonation} disabled={isPending}>Update Donation</Button>
      </div>
    </div>
  );
};

