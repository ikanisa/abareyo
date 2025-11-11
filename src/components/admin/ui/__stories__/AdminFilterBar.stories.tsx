import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/components/ui/button";

import { AdminFilterBar } from "../AdminFilterBar";

const meta: Meta<typeof AdminFilterBar> = {
  title: "Admin/UI/AdminFilterBar",
  component: AdminFilterBar,
  args: {
    segments: [
      {
        label: "Status",
        content: (
          <select className="rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100">
            <option>All</option>
            <option>Pending</option>
            <option>Confirmed</option>
          </select>
        ),
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof AdminFilterBar>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    segments: [
      {
        label: "Status",
        content: (
          <select className="rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100">
            <option>All</option>
            <option>Pending</option>
            <option>Confirmed</option>
          </select>
        ),
      },
      {
        label: "Type",
        content: (
          <select className="rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100">
            <option>Ticket</option>
            <option>Merch</option>
          </select>
        ),
      },
    ],
    actions: <Button size="sm">Apply</Button>,
    children: (
      <input
        className="w-48 rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
        placeholder="Search orders"
      />
    ),
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
