/**
 * Confirm Delete Modal
 *
 * A reusable confirmation dialog for delete operations.
 * Replaces browser's default confirm() dialog with styled modal.
 */

import React from 'react'
import { XIcon, WarningCircleIcon, TrashIcon } from '@phosphor-icons/react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title?: string
  message: string
  itemName?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'אישור מחיקה',
  message,
  itemName,
  confirmText = 'מחק',
  cancelText = 'ביטול',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-background border border-border rounded w-full max-w-md animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded">
              <WarningCircleIcon className="w-6 h-6 text-red-600" weight="fill" />
            </div>
            <h2 id="confirm-delete-title" className="text-xl font-bold text-foreground">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-50"
            aria-label="סגור"
          >
            <XIcon className="w-5 h-5" weight="regular" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-foreground text-center leading-relaxed">
              {message}
            </p>
            {itemName && (
              <p className="text-center mt-2 font-bold text-red-700">
                "{itemName}"
              </p>
            )}
          </div>

          {/* Confirmation Question */}
          <p className="text-center text-muted-foreground text-sm">
            פעולה זו אינה ניתנת לביטול.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 bg-muted border-t border-border rounded-b">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-background border border-border text-foreground rounded font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <TrashIcon className="w-4 h-4" weight="fill" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
