import * as React from "react"
import { cn } from "../../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-border bg-surface-3 px-3 py-1 text-sm text-text-primary placeholder:text-text-tertiary disabled:opacity-40 transition-colors",
        className
      )}
      {...props}
    />
  )
}

export { Input }
