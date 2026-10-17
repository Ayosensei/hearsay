import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Slot } from "@radix-ui/react-slot"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors active:scale-96 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:bg-primary-hover",
        destructive:
          "bg-danger text-background hover:bg-danger/90",
        outline:
          "border border-border bg-background text-text-primary hover:bg-surface-3",
        secondary:
          "bg-surface-3 text-text-primary hover:bg-surface-2",
        ghost:
          "text-text-secondary hover:bg-surface-3 hover:text-text-primary",
        link: "text-signal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        xs: "h-11 gap-1 px-2 text-xs",
        sm: "h-11 gap-2 px-3",
        lg: "h-11 px-6",
        icon: "size-11",
        "icon-xs": "size-11",
        "icon-sm": "size-11",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
