import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Buttons on the board. `default` is ink; `commit` is the amber family mark
 * and belongs only to the committing action (Sell, Print, Approve-and-process,
 * Sign in); the state variants map onto the magnet colours.
 *
 * 36px default, 32px small, 44px large — a little taller than the old 32px so
 * the desktop shell is comfortable to tap.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-ink text-white hover:bg-ink/90',
        // Amber ground with ink lettering (5.1:1); hover underlines in the deep
        // amber like a second marker stroke, active fills with it.
        commit:
          'bg-amber text-ink font-semibold hover:shadow-[inset_0_-3px_0_hsl(var(--amber-deep))] active:bg-amber-deep',
        commitOutline:
          'border border-amber-deep bg-amber/10 text-ink hover:bg-amber/25 active:bg-amber/40',
        destructive: 'bg-magnet-rejected text-white hover:bg-magnet-rejected/90',
        warning: 'bg-magnet-pending text-ink hover:bg-magnet-pending/85',
        info: 'bg-magnet-info text-white hover:bg-magnet-info/90',
        success: 'bg-magnet-done text-white hover:bg-magnet-done/90',
        outline: 'border border-rule bg-card text-ink hover:bg-tray',
        secondary: 'bg-tray text-ink hover:bg-rule/70',
        ghost: 'text-ink hover:bg-tray',
        link: 'text-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3 py-1',
        sm: 'h-8 px-2.5 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
export default Button;
