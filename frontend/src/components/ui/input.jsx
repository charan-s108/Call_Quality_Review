import { cn } from '@/lib/utils.js';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded border border-w-border bg-w-card px-3 py-2',
        'text-sm text-w-text placeholder:text-w-hint',
        'outline-none ring-0',
        'focus:border-w-yellow/50 focus:ring-1 focus:ring-w-yellow/30',
        'transition-colors',
        className
      )}
      {...props}
    />
  );
}
