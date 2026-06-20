import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-[0.05em] whitespace-nowrap uppercase border',
  {
    variants: {
      variant: {
        escalation:     'bg-w-red/10 text-w-red border-w-red/25',
        empathy:        'bg-w-green/10 text-w-green border-w-green/25',
        dead_air:       'bg-w-orange/10 text-w-orange border-w-orange/25',
        long_monologue: 'bg-w-blue/10 text-w-blue border-w-blue/25',
        yellow:         'bg-w-yellow/10 text-w-yellow border-w-yellow/20',
        green:          'bg-w-green/10 text-w-green border-w-green/25',
        red:            'bg-w-red/10 text-w-red border-w-red/25',
        muted:          'bg-white/5 text-w-muted border-w-border',
        outline:        'bg-transparent text-w-hint border-w-border',
        improved:       'bg-w-green/10 text-w-green border-w-green/25',
        declined:       'bg-w-red/10 text-w-red border-w-red/25',
        neutral:        'bg-w-yellow/10 text-w-yellow border-w-yellow/20',
      },
    },
    defaultVariants: { variant: 'muted' },
  }
);

export function Badge({ className, variant, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
