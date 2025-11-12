import type { Meta, StoryObj } from '@storybook/react';
import { ShieldCheck, Loader2 } from 'lucide-react';

import { AdminButton } from '../AdminButton';

const VARIANTS = ['primary', 'secondary', 'subtle', 'ghost', 'destructive', 'outline'] as const;

const meta: Meta<typeof AdminButton> = {
  title: 'Admin/Primitives/Button',
  component: AdminButton,
  tags: ['autodocs'],
  parameters: {
    controls: { expanded: true },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: VARIANTS,
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'pill'],
    },
    fullWidth: {
      control: 'boolean',
    },
    startIcon: { control: false },
    endIcon: { control: false },
  },
  args: {
    children: 'Save changes',
    variant: 'primary',
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof AdminButton>;

export const Playground: Story = {};

export const LoadingState: Story = {
  args: {
    isLoading: true,
  },
};

export const WithIcons: Story = {
  args: {
    startIcon: <ShieldCheck className="h-4 w-4" />,
    endIcon: <Loader2 className="h-4 w-4" />,
    children: 'Validate and sync',
    variant: 'secondary',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Continue to approvals',
  },
};
