import { cn } from '@/lib/utils.js';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn('bg-w-card border border-w-border rounded-lg', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div className={cn('px-4 pt-4 pb-0', className)} {...props} />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <div
      className={cn(
        'text-[10px] font-bold tracking-[0.08em] uppercase text-w-hint mb-3',
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return (
    <div className={cn('px-4 pb-4', className)} {...props} />
  );
}
