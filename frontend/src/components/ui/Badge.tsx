'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'active' | 'won' | 'lost';
}

const variantClasses = {
  default: 'badge bg-gray-100 text-gray-800',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  active: 'badge-active',
  won: 'badge-won',
  lost: 'badge-lost',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('badge', variantClasses[variant], className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

// Helper function to get badge variant from deal group
export function getDealGroupVariant(group: string): BadgeProps['variant'] {
  switch (group) {
    case 'active':
      return 'active';
    case 'won':
      return 'won';
    case 'lost':
      return 'lost';
    default:
      return 'default';
  }
}

// Helper function to get badge variant from lead status
export function getLeadStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'new':
      return 'primary';
    case 'contacted':
      return 'warning';
    case 'qualified':
      return 'success';
    case 'converted':
      return 'won';
    case 'lost':
      return 'danger';
    default:
      return 'default';
  }
}
