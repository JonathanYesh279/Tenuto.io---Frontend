import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'אירעה שגיאה בטעינת הנתונים',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">שגיאה בטעינת הנתונים</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>נסה שוב</Button>
      )}
    </div>
  )
}
