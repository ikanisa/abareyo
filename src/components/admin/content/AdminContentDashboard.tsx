'use client';

import { useState } from 'react';

import { AdminInlineMessage, AdminList } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLocale } from '@/providers/admin-locale-provider';
import { adminFetch } from '@/lib/admin/csrf';

export type AdminContentDashboardProps = {
  initialItems: Array<{
    id: string;
    title: string;
    slug: string | null;
    status: string;
    type: string;
    updated_at: string;
  }>;
};

export const AdminContentDashboard = ({ initialItems }: AdminContentDashboardProps) => {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const { toast } = useToast();
  const { t } = useAdminLocale();

  const refresh = async () => {
    const data = await adminFetch('/admin/api/content/library').then((res) => res.json());
    setItems(data.data?.items ?? data.items ?? []);
  };

  const save = async () => {
    try {
      const response = await adminFetch('/admin/api/content/library', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, slug, body: { markdown: body } }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'content_save_failed');
      toast({
        title: t('admin.toast.content.saved', 'Content saved'),
        description: t('admin.toast.content.draftCreated', 'Draft created successfully.'),
      });
      setTitle('');
      setSlug('');
      setBody('');
      await refresh();
    } catch (error) {
      toast({
        title: t('admin.toast.content.saveFailed', 'Failed to save content'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminInlineMessage
        tone="info"
        title={t('admin.content.inline.title', 'Content library')}
        description={t(
          'admin.content.inline.description',
          'Manage articles and media scheduled for the fan-facing experience.',
        )}
      />
      <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/60 p-4">
        <p className="text-sm font-semibold text-slate-100">{t('admin.content.create.heading', 'Create draft')}</p>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('admin.form.content.title.placeholder', 'Title')}
          className="bg-slate-900/70"
        />
        <Input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder={t('admin.form.content.slug.placeholder', 'Slug (optional)')}
          className="bg-slate-900/70"
        />
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('admin.form.content.body.placeholder', 'Body markdown')}
          className="min-h-[120px] bg-slate-900/70"
        />
        <div className="flex justify-end">
          <Button onClick={save} disabled={!title}>
            {t('admin.content.create.saveButton', 'Save draft')}
          </Button>
        </div>
      </div>
      <AdminList
        title={t('admin.content.list.title', 'Recent drafts')}
        description={t('admin.content.list.description', 'Draft and published content sorted by last update.')}
        items={items}
        renderItem={(item) => (
          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200">
            <p className="font-semibold text-slate-100">{item.title}</p>
            <p className="text-xs text-slate-400">Slug: {item.slug ?? 'auto-generated'} · Type: {item.type}</p>
            <p className="text-xs text-slate-500">Status: {item.status}</p>
            <p className="text-[11px] text-slate-500">Updated: {new Date(item.updated_at).toLocaleString()}</p>
          </div>
        )}
      />
    </div>
  );
};
