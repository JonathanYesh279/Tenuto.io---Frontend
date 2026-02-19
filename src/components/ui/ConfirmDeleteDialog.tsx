/**
 * ConfirmDeleteDialog
 *
 * Domain-specific delete confirmation dialog built on shadcn Dialog.
 * Replaces the custom ConfirmDeleteModal with Radix-based focus trap,
 * Escape key handling, and entrance/exit animations.
 *
 * Features:
 * - Hebrew default text ("אישור מחיקה" / "מחק" / "ביטול")
 * - Optional cascade consequences list with destructive bullet points
 * - Optional item name displayed in bold
 * - Loading state with spinner inside confirm button
 * - Three severity variants: danger (red), warning (yellow), info (blue)
 * - RTL-aware: inherits direction from Radix DirectionProvider in main.tsx
 */

import * as React from "react"

import { WarningIcon } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  consequences?: string[]
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  isLoading?: boolean
  variant?: "danger" | "warning" | "info"
}

const variantIconColors = {
  danger: "text-red-600",
  warning: "text-yellow-500",
  info: "text-blue-600",
} as const

const variantBgColors = {
  danger: "bg-red-50",
  warning: "bg-yellow-50",
  info: "bg-blue-50",
} as const

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "אישור מחיקה",
  description,
  itemName,
  consequences,
  confirmText = "מחק",
  cancelText = "ביטול",
  onConfirm,
  isLoading = false,
  variant = "danger",
}: ConfirmDeleteDialogProps) {
  const iconColorClass = variantIconColors[variant]
  const bgColorClass = variantBgColors[variant]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md duration-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${bgColorClass}`}>
              <WarningIcon className={`h-5 w-5 ${iconColorClass}`} />
            </div>
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription className="text-right">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {itemName && (
            <div className={`rounded-lg ${bgColorClass} border border-current/10 p-3 text-center`}>
              <p className="text-sm text-muted-foreground">מחיקת:</p>
              <p className="font-bold text-gray-900 mt-0.5">"{itemName}"</p>
            </div>
          )}

          {consequences && consequences.length > 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive mb-2">
                פעולה זו תגרום גם ל:
              </p>
              <ul className="space-y-1">
                {consequences.map((consequence, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-destructive mt-0.5 shrink-0">•</span>
                    {consequence}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            פעולה זו אינה ניתנת לביטול.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {/* Destructive confirm button is first in JSX = visually prominent on right in RTL */}
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            {confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDeleteDialog
