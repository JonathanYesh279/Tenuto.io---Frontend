import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const formLayoutVariants = cva(
  "grid gap-spacing-element",
  {
    variants: {
      columns: {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      },
    },
    defaultVariants: {
      columns: 2,
    },
  }
)

interface FormLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formLayoutVariants> {}

const FormLayout = React.forwardRef<
  HTMLDivElement,
  FormLayoutProps
>(({ className, columns, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(formLayoutVariants({ columns }), className)}
    {...props}
  />
))
FormLayout.displayName = "FormLayout"

export { FormLayout, formLayoutVariants }
