import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'success' | 'muted' }) {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-brand-100 text-brand-800',
    muted: 'bg-amber-100 text-amber-800',
  }[variant];
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles, className)}
      {...props}
    />
  );
}
