/**
 * Custom Confirmation Modal Component
 *
 * A styled confirmation dialog that wraps shadcn Dialog.
 * Replaces the previous Modal-based implementation with Radix-based
 * focus trap, Escape key handling, and entrance/exit animations.
 *
 * Prop interface is unchanged — all callsites continue to work:
 *   isOpen, onCancel, onConfirm, title, message, confirmText, cancelText, variant
 */

import React from 'react'
import { WarningCircleIcon } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmVariant: 'destructive' as const,
        }
      case 'warning':
        return {
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          confirmVariant: 'default' as const,
        }
      case 'info':
        return {
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmVariant: 'default' as const,
        }
      default:
        return {
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmVariant: 'destructive' as const,
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-md duration-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
              <WarningCircleIcon className={`w-5 h-5 ${styles.icon}`} weight="fill" />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription className="text-right text-gray-700 text-sm leading-relaxed pt-1">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            variant={styles.confirmVariant}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmationModal
