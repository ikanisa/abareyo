import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

import { AdminInlineMessage } from '../AdminInlineMessage';
import { AdminButton } from '../AdminButton';

const meta: Meta<typeof AdminInlineMessage> = {
  title: 'Admin/Primitives/InlineMessage',
  component: AdminInlineMessage,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger', 'neutral'],
    },
    layout: {
      control: 'select',
      options: ['stacked', 'inline'],
    },
    icon: { control: false },
    actions: { control: false },
  },
  args: {
    tone: 'info',
    layout: 'stacked',
    title: 'System maintenance',
    description: 'We will pause ticket reconciliation for 20 minutes while applying migrations.',
    icon: <Info className="h-4 w-4" />,
    actions: <AdminButton size="sm">View status page</AdminButton>,
  },
};

export default meta;
type Story = StoryObj<typeof AdminInlineMessage>;

export const Playground: Story = {};

export const Warning: Story = {
  args: {
    tone: 'warning',
    icon: <AlertTriangle className="h-4 w-4" />,
    actions: (
      <div className="flex gap-2">
        <AdminButton size="sm" variant="secondary">
          Snooze alerts
        </AdminButton>
        <AdminButton size="sm" variant="ghost">
          Dismiss
        </AdminButton>
      </div>
    ),
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
    icon: <CheckCircle2 className="h-4 w-4" />,
    title: 'All caught up',
    description: 'All refunds have been reconciled in the last 24 hours.',
    layout: 'inline',
  },
};

export const Danger: Story = {
  args: {
    tone: 'danger',
    icon: <ShieldAlert className="h-4 w-4" />,
    title: 'Incident detected',
    description: 'Payment processing is degraded. Investigate the queue backlog immediately.',
  },
};
