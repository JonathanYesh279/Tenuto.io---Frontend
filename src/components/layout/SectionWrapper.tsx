import * as React from "react"

import { cn } from "@/lib/utils"

interface SectionWrapperProps
  extends React.HTMLAttributes<HTMLElement> {
  title?: string
  description?: string
}

const SectionWrapper = React.forwardRef<
  HTMLElement,
  SectionWrapperProps
>(({ className, title, description, children, ...props }, ref) => (
  <section
    ref={ref}
    className={cn("space-y-spacing-element", className)}
    {...props}
  >
    {(title || description) && (
      <div>
        {title && <h2 className="text-h2">{title}</h2>}
        {description && (
          <p className="text-small text-muted-foreground">{description}</p>
        )}
      </div>
    )}
    {children}
  </section>
))
SectionWrapper.displayName = "SectionWrapper"

export { SectionWrapper }
