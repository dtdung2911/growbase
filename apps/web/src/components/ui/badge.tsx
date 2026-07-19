import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center min-h-[24px] rounded-[16px] px-2.5 py-0.5 text-xs font-semibold leading-none transition-colors motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/30",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        info: "bg-info/10 text-info border border-info/30",
        success: "bg-success/10 text-success border border-success/30",
        warning: "bg-warning/10 text-warning border border-warning/30",
        destructive: "bg-error/10 text-error border border-error/30",
        error: "bg-error/10 text-error border border-error/30",
        violet: "bg-violet/10 text-violet border border-violet/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
