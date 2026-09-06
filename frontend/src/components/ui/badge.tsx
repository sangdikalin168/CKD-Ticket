import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * A neutral label (an age group, a count, a tag). Record state is NOT a badge:
 * it renders through `Chip` on one of the four marks — see ui/Chip.tsx.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium leading-[1.4] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-ink text-chalk",
        secondary: "bg-wash text-ink",
        destructive: "bg-void text-chalk",
        outline: "border border-rule bg-card text-ink",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
