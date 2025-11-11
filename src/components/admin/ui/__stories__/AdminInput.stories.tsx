import type { Meta, StoryObj } from '@storybook/react';
import { Search, Mail, CheckCircle2 } from 'lucide-react';

import { AdminInput } from '../AdminInput';

const meta: Meta<typeof AdminInput> = {
  title: 'Admin/Primitives/Input',
  component: AdminInput,
  tags: ['autodocs'],
  parameters: {
    controls: { expanded: true },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    startIcon: { control: false },
    endIcon: { control: false },
  },
  args: {
    placeholder: 'Search by email or phone…',
    status: 'default',
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof AdminInput>;

export const Playground: Story = {};

export const WithIcons: Story = {
  args: {
    startIcon: <Search className="h-4 w-4" />,
    endIcon: <Mail className="h-4 w-4" />,
    placeholder: 'Primary contact email',
  },
};

export const SuccessState: Story = {
  args: {
    status: 'success',
    defaultValue: 'membership@gikundiro.com',
    endIcon: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
    isFilled: true,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    placeholder: 'Fetching data…',
    disabled: true,
  },
};
