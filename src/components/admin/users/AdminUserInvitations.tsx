'use client';

import { useMemo, useState } from 'react';
import { Ban, MailPlus, RefreshCcw, RefreshCw } from 'lucide-react';

import { AdminCard, AdminInlineMessage } from '@/components/admin/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ADMIN_ROLE_PRESETS } from '@/config/admin-rbac';
import { adminFetch } from '@/lib/admin/csrf';

export type AdminUserInvite = {
  id: string;
  email: string;
  status: 'pending' | 'accepted';
  invitedAt: string | null;
  confirmedAt: string | null;
  lastSignInAt: string | null;
  rolePreset: string | null;
  invitedBy: string | null;
};

export type AdminUserInvitationsProps = {
  initialInvites: AdminUserInvite[];
};

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

const buildErrorMessage = (payload: unknown, fallback: string) => {
  const error = (payload as { error?: { message?: string } })?.error;
  return error?.message ?? fallback;
};

const ROLE_PRESET_KEYS = Object.keys(ADMIN_ROLE_PRESETS);

export const AdminUserInvitations = ({ initialInvites }: AdminUserInvitationsProps) => {
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rolePreset, setRolePreset] = useState<string>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const { toast } = useToast();

  const sortedInvites = useMemo(
    () => invites.slice().sort((a, b) => {
      if (!a.invitedAt || !b.invitedAt) return 0;
      return new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime();
    }),
    [invites],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await adminFetch('/admin/api/users/invitations');
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { invitations?: AdminUserInvite[] };
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(buildErrorMessage(payload, 'Failed to reload invites'));
      setInvites(payload.data?.invitations ?? []);
      toast({ title: 'Invites refreshed', description: 'Latest invitation states loaded.' });
    } catch (error) {
      toast({ title: 'Unable to refresh', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const submitInvite = async () => {
    if (!email) {
      toast({ title: 'Email required', description: 'Provide a staff email to send an invite.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await adminFetch('/admin/api/users/invitations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, displayName, rolePreset: rolePreset || null, note }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { invitation?: AdminUserInvite | null };
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(buildErrorMessage(payload, 'Failed to send invitation'));

      const invitation = payload.data?.invitation;
      if (invitation) {
        setInvites((prev) => [invitation, ...prev.filter((item) => item.id !== invitation.id)]);
      }

      toast({ title: 'Invitation sent', description: `Email sent to ${email}.` });
      setEmail('');
      setDisplayName('');
      setNote('');
    } catch (error) {
      toast({ title: 'Invite failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendInvite = async (invite: AdminUserInvite) => {
    setActiveInviteId(invite.id);
    try {
      const response = await adminFetch('/admin/api/users/invitations', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: invite.id, email: invite.email }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { invitation?: AdminUserInvite | null };
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(buildErrorMessage(payload, 'Failed to resend invitation'));

      const updated = payload.data?.invitation;
      if (updated) {
        setInvites((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
      }

      toast({ title: 'Invite resent', description: `A fresh invite was emailed to ${invite.email}.` });
    } catch (error) {
      toast({ title: 'Resend failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setActiveInviteId(null);
    }
  };

  const revokeInvite = async (invite: AdminUserInvite) => {
    setActiveInviteId(invite.id);
    try {
      const response = await adminFetch('/admin/api/users/invitations', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: invite.id }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!response.ok) throw new Error(buildErrorMessage(payload, 'Failed to revoke invitation'));

      setInvites((prev) => prev.filter((item) => item.id !== invite.id));
      toast({ title: 'Invitation revoked', description: `${invite.email} can no longer accept this link.` });
    } catch (error) {
      toast({ title: 'Revoke failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setActiveInviteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminInlineMessage
        tone="info"
        title="Staff invitations"
        description="Send time-limited invites via Supabase Auth, then monitor confirmations or revoke stale links."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard className="lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-50">Invite a teammate</p>
              <p className="text-xs text-slate-400">Set initial metadata and deliver an email invite.</p>
            </div>
            <MailPlus className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-xs uppercase tracking-wide text-slate-400">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="staff@rayon.rw"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-slate-900/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name" className="text-xs uppercase tracking-wide text-slate-400">
                Display name (optional)
              </Label>
              <Input
                id="invite-name"
                placeholder="Operations Lead"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="bg-slate-900/70"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-slate-400">Role preset</Label>
              <Select value={rolePreset} onValueChange={setRolePreset}>
                <SelectTrigger className="bg-slate-900/70 text-left text-sm text-slate-100">
                  <SelectValue placeholder="Optional permission preset" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_PRESET_KEYS.map((key) => (
                    <SelectItem key={key} value={key} className="text-sm">
                      {key.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-note" className="text-xs uppercase tracking-wide text-slate-400">
                Notes (metadata)
              </Label>
              <Textarea
                id="invite-note"
                placeholder="Shift coverage or context to include in metadata"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-[96px] bg-slate-900/70"
              />
            </div>
            <Button onClick={submitInvite} disabled={isSubmitting} className="w-full">
              {isSubmitting ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send invite
            </Button>
          </div>
        </AdminCard>
        <AdminCard className="lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-50">Recent invites</p>
              <p className="text-xs text-slate-400">Track confirmations or resend reminders.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {sortedInvites.length === 0 ? (
              <p className="text-sm text-slate-300">No invites have been sent from the console yet.</p>
            ) : (
              sortedInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-xl border border-white/5 bg-slate-950/50 p-4 shadow-inner"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-100">{invite.email}</p>
                      <p className="text-xs text-slate-400">Invited: {formatDate(invite.invitedAt)}</p>
                      <p className="text-xs text-slate-500">Last seen: {formatDate(invite.lastSignInAt)}</p>
                      {invite.rolePreset ? (
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Role preset: {invite.rolePreset}
                        </p>
                      ) : null}
                      {invite.invitedBy ? (
                        <p className="text-[11px] text-slate-500">Invited by {invite.invitedBy}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <Badge variant={invite.status === 'accepted' ? 'default' : 'outline'}>
                        {invite.status === 'accepted'
                          ? `Accepted ${formatDate(invite.confirmedAt)}`
                          : 'Pending confirmation'}
                      </Badge>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={invite.status === 'accepted' || activeInviteId === invite.id}
                          onClick={() => resendInvite(invite)}
                        >
                          {activeInviteId === invite.id && invite.status !== 'accepted' ? (
                            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Resend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-rose-200 hover:text-rose-50"
                          disabled={activeInviteId === invite.id}
                          onClick={() => revokeInvite(invite)}
                        >
                          {activeInviteId === invite.id ? (
                            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="mr-2 h-4 w-4" />
                          )}
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
};
