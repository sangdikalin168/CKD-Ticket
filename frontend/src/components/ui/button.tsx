import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * One button for the whole app. `default` is ink — the ordinary primary
 * action. `commit` is the amber family mark and belongs only to the committing
 * action on a surface (Sell, Approve and process, Sign in); there is at most
 * one on a screen. `paid` / `void` are the two decisions a request flow needs.
 *
 * 36px default, 32px small, 44px large, sized for a 1366×768 counter laptop —
 * CKD-POS runs the same variants at 40px for a standing cashier's tablet.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-ink text-chalk hover:bg-ink/90 disabled:opacity-50',
        // Amber ground with INK lettering (5.8:1); white would read 3.1:1 and
        // fail. Hover draws the deep amber as an inset underline, active fills
        // with it. Disabled is the wash ground rather than a fade, because a
        // faded amber under a pale label is unreadable exactly when the seller
        // is deciding whether they can take the money.
        commit:
          'bg-amber text-ink font-semibold hover:shadow-[inset_0_-3px_0_rgb(var(--amber-deep))] active:bg-amber-deep disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none',
        commitOutline:
          'border border-amber-deep bg-amber-tint text-ink hover:bg-amber/25 active:bg-amber/40 disabled:opacity-50',
        destructive: 'bg-void text-chalk hover:bg-void/90 disabled:opacity-50',
        paid: 'bg-paid text-chalk hover:bg-paid/90 disabled:opacity-50',
        outline: 'border border-rule bg-card text-ink hover:bg-wash disabled:opacity-50',
        secondary: 'bg-wash text-ink hover:bg-rule/70 disabled:opacity-50',
        ghost: 'text-ink hover:bg-wash disabled:opacity-50',
        link: 'text-ink underline-offset-4 hover:underline disabled:opacity-50',
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
