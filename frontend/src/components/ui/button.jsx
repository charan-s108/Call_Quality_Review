import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-w-yellow/50 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-w-yellow text-w-bg hover:bg-w-yellow/90',
        ghost:   'text-w-muted hover:text-w-text hover:bg-white/5',
        outline: 'border border-w-border text-w-muted hover:border-w-yellow/40 hover:text-w-text',
        link:    'text-w-yellow underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 text-sm',
        sm:      'h-7 px-3 text-xs',
        icon:    'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
