"use client";

import { useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusCircle, RefreshCw } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  UssdTemplate,
  fetchUssdTemplates,
  createUssdTemplate,
  updateUssdTemplate,
  deleteUssdTemplate,
  activateUssdTemplate,
} from "@/lib/api/admin/ussd";

export default function AdminUssdView() {
  const { toast } = useToast();
  const templatesQuery = useQuery({
    queryKey: ["admin", "ussd", "templates"],
    queryFn: fetchUssdTemplates,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<UssdTemplate | null>(null);
  const [isMutating, startTransition] = useTransition();

  const createMutation = useMutation({
    mutationFn: createUssdTemplate,
    onSuccess: () => {
      toast({ title: "Template created" });
      templatesQuery.refetch();
      setIsCreating(false);
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to create template",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateUssdTemplate>[1] }) =>
      updateUssdTemplate(id, payload),
    onSuccess: () => {
      toast({ title: "Template updated" });
      templatesQuery.refetch();
      setSelectedTemplate(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUssdTemplate,
    onSuccess: () => {
      toast({ title: "Template deleted" });
      templatesQuery.refetch();
      setSelectedTemplate(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateUssdTemplate,
    onSuccess: () => {
      toast({ title: "Template activated" });
      templatesQuery.refetch();
    },
    onError: (error: unknown) => {
      toast({
        title: "Activation failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const templates = templatesQuery.data ?? [];
  const mtnTemplates = useMemo(() => templates.filter((tpl) => tpl.telco.toLowerCase().includes("mtn")), [templates]);
  const airtelTemplates = useMemo(
    () => templates.filter((tpl) => tpl.telco.toLowerCase().includes("airtel")),
    [templates],
  );

  return (
    <div className="space-y-8">
      <GlassCard className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">USSD Templates</h1>
          <p className="text-sm text-slate-400">
            Manage operator-specific USSD strings and placeholders used throughout the fan and admin flows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => templatesQuery.refetch()}
            disabled={templatesQuery.isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="default" size="sm" onClick={() => setIsCreating(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> New template
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-6 md:grid-cols-2">
        <TemplateColumn
          title="MTN"
          color="text-yellow-400"
          templates={mtnTemplates}
          onEdit={setSelectedTemplate}
          onActivate={(id) => activateMutation.mutate(id)}
        />
        <TemplateColumn
          title="Airtel"
          color="text-red-400"
          templates={airtelTemplates}
          onEdit={setSelectedTemplate}
          onActivate={(id) => activateMutation.mutate(id)}
        />
      </div>

      {(isCreating || selectedTemplate) && (
        <GlassCard className="p-6">
          <TemplateForm
            key={selectedTemplate?.id ?? 'create'}
            initial={selectedTemplate ?? undefined}
            isSubmitting={
              createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || isMutating
            }
            onCancel={() => {
              setIsCreating(false);
              setSelectedTemplate(null);
            }}
            onSubmit={(payload) => {
              if (selectedTemplate) {
                startTransition(() => {
                  updateMutation.mutate({ id: selectedTemplate.id, payload });
                });
              } else {
                createMutation.mutate(payload);
              }
            }}
            onDelete={selectedTemplate ? () => deleteMutation.mutate(selectedTemplate.id) : undefined}
          />
        </GlassCard>
      )}
    </div>
  );
}

const TemplateColumn = ({
  title,
  color,
  templates,
  onEdit,
  onActivate,
}: {
  title: string;
  color: string;
  templates: UssdTemplate[];
  onEdit: (template: UssdTemplate) => void;
  onActivate: (id: string) => void;
}) => (
  <GlassCard className="space-y-3 p-6">
    <h2 className={`text-lg font-semibold ${color}`}>{title}</h2>
    {templates.length === 0 ? (
      <p className="text-sm text-slate-400">No templates defined.</p>
    ) : (
      <div className="space-y-3">
        {templates.map((template) => (
          <div key={template.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">{template.name}</p>
                <p className="text-xs text-slate-400">{new Date(template.updatedAt).toLocaleString()}</p>
              </div>
              {template.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => onActivate(template.id)}>
                  Activate
                </Button>
              )}
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-200">{template.body}</pre>
            {template.variables && (
              <p className="mt-1 text-xs text-slate-400">
                Variables: {JSON.stringify(template.variables)}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}
  </GlassCard>
);

const TemplateForm = ({
  initial,
  isSubmitting,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial?: UssdTemplate;
  isSubmitting: boolean;
  onSubmit: (payload: { name: string; telco: string; body: string; variables?: Record<string, unknown>; isActive?: boolean }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [telco, setTelco] = useState(initial?.telco ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [variables, setVariables] = useState(
    initial?.variables ? JSON.stringify(initial.variables, null, 2) : '{\n  "placeholders": ["amount"]\n}',
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        let parsedVariables: Record<string, unknown> | undefined;
        if (variables.trim()) {
          try {
            parsedVariables = JSON.parse(variables);
          } catch (error) {
            window.alert('Variables must be valid JSON');
            return;
          }
        }
        onSubmit({ name, telco, body, variables: parsedVariables, isActive });
      }}
    >
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-slate-400">Name</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} required className="bg-white/5" />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-slate-400">Telco</label>
        <Input value={telco} onChange={(event) => setTelco(event.target.value)} required className="bg-white/5" />
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-xs uppercase tracking-wide text-slate-400">USSD body</label>
        <Input value={body} onChange={(event) => setBody(event.target.value)} required className="bg-white/5" />
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-xs uppercase tracking-wide text-slate-400">Variables JSON</label>
        <Textarea rows={4} value={variables} onChange={(event) => setVariables(event.target.value)} className="bg-white/5" />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-slate-400">Active</label>
        <Button type="button" variant={isActive ? "default" : "outline"} onClick={() => setIsActive((prev) => !prev)}>
          {isActive ? 'Active' : 'Inactive'}
        </Button>
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {initial ? 'Update template' : 'Create template'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        {initial && onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
};
