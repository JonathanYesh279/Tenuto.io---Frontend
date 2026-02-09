/**
 * Confirm Delete Modal
 *
 * A reusable confirmation dialog for delete operations.
 * Replaces browser's default confirm() dialog with styled modal.
 */

import React from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 id="confirm-delete-title" className="text-xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-800 text-center leading-relaxed">
              {message}
            </p>
            {itemName && (
              <p className="text-center mt-2 font-bold text-red-700">
                "{itemName}"
              </p>
            )}
          </div>

          {/* Confirmation Question */}
          <p className="text-center text-gray-600 text-sm">
            פעולה זו אינה ניתנת לביטול.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
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
