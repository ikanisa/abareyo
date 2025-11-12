"use client";

import type { Meta, StoryObj } from '@storybook/react';
import { Fragment, useMemo } from 'react';

import { AdminButton } from '../AdminButton';
import { AdminToastViewport } from '../AdminToast';
import { useToast } from '@/components/ui/use-toast';
import type { ToastIntent } from '@/hooks/use-toast';

const ToastGallery = () => {
  const { toast } = useToast();
  const variants = useMemo<Array<{ label: string; intent: ToastIntent; title: string; description: string }>>(
    () => [
      {
        label: 'Neutral',
        intent: 'neutral',
        title: 'Settings saved',
        description: 'The admin preferences were updated successfully.',
      },
      {
        label: 'Success',
        intent: 'success',
        title: 'Member activated',
        description: 'The account now has full club access.',
      },
      {
        label: 'Warning',
        intent: 'warning',
        title: 'Reconciliation delayed',
        description: 'Mobile money payout is still pending from MTN.',
      },
      {
        label: 'Danger',
        intent: 'danger',
        title: 'Sync failed',
        description: 'We could not reach the reporting API. Try again shortly.',
      },
      {
        label: 'Info',
        intent: 'info',
        title: 'New feature flag',
        description: 'Toggle the beta UI under Settings → Labs.',
      },
    ],
    [],
  );

  return (
    <Fragment>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => (
          <AdminButton
            key={variant.intent}
            variant={variant.intent === 'danger' ? 'destructive' : 'secondary'}
            onClick={() =>
              toast({
                title: variant.title,
                description: variant.description,
                intent: variant.intent as ToastIntent,
              })
            }
          >
            {variant.label}
          </AdminButton>
        ))}
      </div>
      <AdminToastViewport />
    </Fragment>
  );
};

const meta: Meta<typeof ToastGallery> = {
  title: 'Admin/Primitives/Toast',
  component: ToastGallery,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToastGallery>;

export const Playground: Story = {};
