import type { Meta, StoryObj } from '@storybook/react';

import { AdminCard } from '../AdminCard';
import { AdminButton } from '../AdminButton';

const meta: Meta<typeof AdminCard> = {
  title: 'Admin/Primitives/Card',
  component: AdminCard,
  tags: ['autodocs'],
  args: {
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">New ticketing policy</h3>
        <p className="text-sm text-slate-300">
          Review the policy before publishing to ensure SLA and refund settings are correct.
        </p>
        <div className="flex gap-2">
          <AdminButton size="sm">Review draft</AdminButton>
          <AdminButton size="sm" variant="ghost">
            Dismiss
          </AdminButton>
        </div>
      </div>
    ),
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['base', 'muted', 'success', 'warning', 'danger', 'info'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    interactive: { control: 'boolean' },
    elevated: { control: 'boolean' },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;
type Story = StoryObj<typeof AdminCard>;

export const Playground: Story = {
  args: {
    tone: 'base',
    padding: 'md',
    interactive: true,
    elevated: true,
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
    padding: 'md',
    interactive: false,
    elevated: true,
  },
};

export const Warning: Story = {
  args: {
    tone: 'warning',
    padding: 'md',
    interactive: false,
  },
};
