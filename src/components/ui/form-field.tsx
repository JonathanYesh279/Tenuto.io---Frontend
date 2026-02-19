import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { WarningCircleIcon } from '@phosphor-icons/react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, htmlFor, error, required, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ms-1" aria-hidden="true">*</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1 text-sm text-destructive">
          <WarningCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
