import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

type ResponsiveColumns = 'single' | 'sidebar' | 'double' | 'triple';
type ResponsiveAlign = 'start' | 'center' | 'end' | 'stretch';
type ResponsiveGap = 'sm' | 'md' | 'lg';

const columnTemplates: Record<ResponsiveColumns, string> = {
  single: 'md:grid-cols-1',
  sidebar: 'md:grid-cols-[minmax(0,1fr)_auto]',
  double: 'md:grid-cols-2',
  triple: 'md:grid-cols-[minmax(0,1fr)_auto_auto]',
};

const gapClasses: Record<ResponsiveGap, string> = {
  sm: 'gap-2 md:gap-3',
  md: 'gap-3 md:gap-4',
  lg: 'gap-4 md:gap-6',
};

const alignClasses: Record<ResponsiveAlign, string> = {
  start: 'md:items-start',
  center: 'md:items-center',
  end: 'md:items-end',
  stretch: 'md:items-stretch',
};

export type ResponsiveSectionProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
  columns?: ResponsiveColumns;
  align?: ResponsiveAlign;
  gap?: ResponsiveGap;
};

export const ResponsiveSection = React.forwardRef<HTMLDivElement, ResponsiveSectionProps>(
  (
    { className, asChild, columns = 'sidebar', align = 'start', gap = 'md', ...props },
    ref,
  ) => {
    const Component = asChild ? Slot : 'div';
    return (
      <Component
        ref={ref}
        className={cn(
          'grid grid-cols-1',
          columnTemplates[columns],
          gapClasses[gap],
          alignClasses[align],
          className,
        )}
        {...props}
      />
    );
  },
);
ResponsiveSection.displayName = 'ResponsiveSection';

// eslint-disable-next-line react-refresh/only-export-components
export const responsiveSection = {
  controlGroup: 'flex flex-wrap items-center gap-2 md:gap-3',
  actionGroup: 'flex flex-wrap items-center justify-start gap-2 md:justify-end',
  stack: 'flex flex-col gap-2',
};
