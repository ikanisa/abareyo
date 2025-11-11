import type { Meta, StoryObj } from "@storybook/react";

import { AdminStatCard } from "../AdminStatCard";

const meta: Meta<typeof AdminStatCard> = {
  title: "Admin/UI/AdminStatCard",
  component: AdminStatCard,
  parameters: {
    layout: "centered",
  },
  args: {
    title: "Active members",
    value: "4,820",
    valueLabel: "Last 7 days",
    stats: [{ label: "30d", value: "19,204" }],
  },
};

export default meta;

type Story = StoryObj<typeof AdminStatCard>;

export const Default: Story = {
  args: {
    trend: {
      label: "+6.2% vs projection",
      tone: "positive",
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    stats: [{ label: "30d", value: "—" }],
  },
};

export const WithDescription: Story = {
  args: {
    description: "Projected season ticket conversions based on gate scans.",
    stats: [
      { label: "Projected", value: "5,020" },
      { label: "Variance", value: "-200" },
    ],
    trend: {
      label: "Holding steady",
      tone: "neutral",
    },
  },
};

export const WithChildren: Story = {
  args: {
    description: "SMS Parser Health",
    value: undefined,
    valueLabel: undefined,
    stats: undefined,
    children: (
      <div className="space-y-2 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span>Parsed</span>
          <span>1,927</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Avg latency</span>
          <span>42s</span>
        </div>
      </div>
    ),
    footer: "Last synced 5 minutes ago",
  },
};
