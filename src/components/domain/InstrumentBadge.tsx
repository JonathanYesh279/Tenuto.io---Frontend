import React from 'react'
import { Badge } from '@/components/ui/badge'

interface InstrumentBadgeProps {
  instrument: string
  className?: string
}

export function InstrumentBadge({ instrument, className }: InstrumentBadgeProps) {
  return (
    <Badge variant="secondary" className={className}>
      {instrument}
    </Badge>
  )
}
