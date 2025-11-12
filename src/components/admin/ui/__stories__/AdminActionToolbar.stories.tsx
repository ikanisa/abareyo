import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/components/ui/button";

import { AdminActionToolbar } from "../AdminActionToolbar";

const meta: Meta<typeof AdminActionToolbar> = {
  title: "Admin/UI/AdminActionToolbar",
  component: AdminActionToolbar,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof AdminActionToolbar>;

export const Default: Story = {
  render: () => (
    <AdminActionToolbar>
      <AdminActionToolbar.Section
        title="Update order status"
        description="Set fulfillment status and optionally add a note."
        footer={
          <div className="flex gap-2">
            <Button size="sm">Update</Button>
            <Button size="sm" variant="outline">
              Add note
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Order ID
            <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status
            <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Note
            <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100" />
          </label>
        </div>
      </AdminActionToolbar.Section>
      <AdminActionToolbar.Section
        title="Update tracking"
        description="Attach a carrier tracking number for the shipment."
        footer={<Button size="sm">Save tracking</Button>}
      >
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Order ID
            <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tracking number
            <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100" />
          </label>
        </div>
      </AdminActionToolbar.Section>
    </AdminActionToolbar>
  ),
};

export const Stacked: Story = {
  render: () => (
    <AdminActionToolbar columns={1}>
      <AdminActionToolbar.Section
        title="Batch update"
        description="Apply the same status to multiple orders at once."
        footer={<Button size="sm">Run batch update</Button>}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Order IDs
            <textarea className="mt-1 min-h-[100px] w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status
            <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100" />
          </label>
        </div>
      </AdminActionToolbar.Section>
    </AdminActionToolbar>
  ),
};
