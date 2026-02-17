import toast from 'react-hot-toast'

/**
 * Show a warning toast notification.
 * Uses toast() with custom icon and style since react-hot-toast has no built-in warning variant.
 * Picks up the Toaster's slideFromRight animation via the render prop in App.tsx.
 */
export function showWarning(message: string, options?: { duration?: number }) {
  return toast(message, {
    duration: options?.duration ?? 4000,
    icon: '⚠️',
    style: {
      background: '#FFFBEB',
      color: '#92400E',
      border: '1px solid #FCD34D',
      padding: '16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    },
  })
}

/**
 * Show an info toast notification.
 * Uses toast() with custom icon and style since react-hot-toast has no built-in info variant.
 * Picks up the Toaster's slideFromRight animation via the render prop in App.tsx.
 */
export function showInfo(message: string, options?: { duration?: number }) {
  return toast(message, {
    duration: options?.duration ?? 4000,
    icon: 'ℹ️',
    style: {
      background: '#EFF6FF',
      color: '#1E40AF',
      border: '1px solid #93C5FD',
      padding: '16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    },
  })
}
