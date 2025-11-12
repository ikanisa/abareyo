import type { ElementType, HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type AdminSectionVariant = 'surface' | 'soft' | 'plain';
type AdminSectionWidth = 'md' | 'lg' | 'xl' | '2xl' | 'full';

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  variant?: AdminSectionVariant;
  padded?: boolean;
  maxWidth?: AdminSectionWidth;
  bleed?: boolean;
} & HTMLAttributes<HTMLElement>;

const VARIANT_CLASS: Record<AdminSectionVariant, string> = {
  surface: 'rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-primary/5',
  soft: 'rounded-2xl border border-white/5 bg-white/[0.02]',
  plain: '',
};

const WIDTH_CLASS: Record<AdminSectionWidth, string> = {
  md: 'mx-auto w-full max-w-[var(--content-width-md)]',
  lg: 'mx-auto w-full max-w-[var(--content-width-lg)]',
  xl: 'mx-auto w-full max-w-[var(--content-width-xl)]',
  '2xl': 'mx-auto w-full max-w-[var(--content-width-2xl)]',
  full: 'w-full',
};

export const AdminSection = <T extends ElementType = 'section'>({
  as,
  children,
  className,
  variant = 'surface',
  padded = variant !== 'plain',
  maxWidth = '2xl',
  bleed = false,
  ...props
}: PolymorphicProps<T>) => {
  const Component = (as ?? 'section') as ElementType;
  return (
    <Component
      className={cn(
        'relative flex flex-col gap-[var(--space-4)]',
        VARIANT_CLASS[variant],
        padded && 'px-[var(--space-6)] py-[var(--space-6)] sm:px-[var(--space-7)]',
        !bleed && WIDTH_CLASS[maxWidth],
        bleed && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
