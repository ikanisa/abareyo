"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rayon/ui";
import { Flag, FlagOff, Laugh, Meh, Angry, MoreHorizontal } from "lucide-react";

import { useAuditLogger } from "@/audit/use-audit-logger";
import { DataTable } from "@/components/data-table/data-table";
import type { CommunityPost } from "@/data/types";

const sentimentCopy: Record<CommunityPost["sentiment"], { label: string; variant: "success" | "secondary" | "warning" }> = {
  positive: { label: "Positive", variant: "success" },
  neutral: { label: "Neutral", variant: "secondary" },
  negative: { label: "Negative", variant: "warning" },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const CommunityTable = ({
  data,
  source,
  error,
}: {
  data: CommunityPost[];
  source?: "supabase" | "mock";
  error?: string;
}) => {
  const [rows, setRows] = useState(data);
  const [isPending, startTransition] = useTransition();
  const audit = useAuditLogger();

  const mutate = (id: string, payload: Partial<CommunityPost>) => {
    startTransition(async () => {
      let previous: CommunityPost[] = [];
      setRows((current) => {
        previous = current;
        return current.map((post) => (post.id === id ? { ...post, ...payload } : post));
      });
      try {
        const response = await fetch(`/api/community/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await audit({ resource: "community_posts", action: "moderate", entityId: id, metadata: payload });
      } catch (mutationError) {
        console.error("Failed to update community post", mutationError);
        setRows(previous);
      }
    });
  };

  const columns: ColumnDef<CommunityPost>[] = useMemo(
    () => [
      {
        accessorKey: "topic",
        header: "Topic",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.topic}</p>
            <p className="text-xs text-muted-foreground">Post {row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "author",
        header: "Author",
        cell: ({ row }) => row.original.author,
      },
      {
        accessorKey: "sentiment",
        header: "Sentiment",
        cell: ({ row }) => {
          const meta = sentimentCopy[row.original.sentiment];
          return <Badge variant={meta.variant}>{meta.label}</Badge>;
        },
        filterFn: (row, _, value) => (value ? row.getValue<string>("sentiment") === value : true),
      },
      {
        accessorKey: "flagged",
        header: "Flagged",
        cell: ({ row }) =>
          row.original.flagged ? (
            <Badge variant="warning" className="bg-amber-500/20 text-amber-100">Flagged</Badge>
          ) : (
            <Badge variant="secondary">Clean</Badge>
          ),
      },
      {
        accessorKey: "created_at",
        header: "Submitted",
        cell: ({ row }) => dateFormatter.format(new Date(row.original.created_at)),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9" disabled={isPending}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => mutate(row.original.id, { flagged: !row.original.flagged })}>
                {row.original.flagged ? (
                  <FlagOff className="mr-2 size-4" />
                ) : (
                  <Flag className="mr-2 size-4" />
                )}
                {row.original.flagged ? "Remove flag" : "Flag post"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => mutate(row.original.id, { sentiment: "positive" })}>
                <Laugh className="mr-2 size-4" /> Mark positive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => mutate(row.original.id, { sentiment: "neutral" })}>
                <Meh className="mr-2 size-4" /> Mark neutral
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => mutate(row.original.id, { sentiment: "negative" })}>
                <Angry className="mr-2 size-4" /> Mark negative
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isPending],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      error={error}
      source={source}
      filterables={[
        {
          id: "sentiment",
          title: "Sentiment",
          options: Object.entries(sentimentCopy).map(([value, meta]) => ({ value, label: meta.label })),
        },
      ]}
      emptyState={{
        title: "No community reports",
        description: "Fan-generated insights will populate this view as soon as new posts are ingested.",
      }}
      globalSearchPlaceholder="Search by author or topic"
    />
  );
};
