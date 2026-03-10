import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const pageShellVariants = cva(
  "space-y-spacing-section",
  {
    variants: {
      width: {
        constrained: "max-w-7xl mx-auto",
        narrow: "max-w-4xl mx-auto",
        full: "",
      },
    },
    defaultVariants: {
      width: "constrained",
    },
  }
)

interface PageShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageShellVariants> {}

const PageShell = React.forwardRef<
  HTMLDivElement,
  PageShellProps
>(({ className, width, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(pageShellVariants({ width }), className)}
    {...props}
  />
))
PageShell.displayName = "PageShell"

export { PageShell, pageShellVariants }
