/**
 * Shared Modal Component — backward-compatible wrapper around shadcn Dialog
 *
 * This component preserves the existing isOpen/onClose prop API so all
 * existing callsites (ConfirmationModal, BulkTheoryUpdateTab, StudentDeletionModal,
 * CascadeDeletionWorkflow, OrphanedReferenceCleanup, AuditLogViewer, TheoryLessons,
 * Rehearsals) continue to work without changes until individually migrated to shadcn Dialog.
 *
 * Internal implementation: uses Radix Dialog (via shadcn) which provides:
 * - Focus trap and focus restoration
 * - Escape key to close
 * - Scroll lock while open
 * - ARIA attributes (role="dialog", aria-modal="true")
 * - 200ms entrance/exit animation via tailwindcss-animate
 * - RTL support via DirectionProvider context from main.tsx
 */

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl"
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  darkBackdrop?: boolean
  className?: string
}

const maxWidthClasses: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  darkBackdrop: _darkBackdrop = false,
  className = "",
}) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={[
          maxWidthClasses[maxWidth],
          "duration-200",
          !showCloseButton ? "[&>button]:hidden" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onInteractOutside={
          closeOnBackdrop
            ? undefined
            : (e) => {
                e.preventDefault()
              }
        }
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}

        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Modal
