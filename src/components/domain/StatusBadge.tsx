import React from 'react'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'

type BadgeVariant = NonNullable<BadgeProps['variant']>

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  'פעיל': 'active',
  'לא פעיל': 'inactive',
  'בוגר': 'graduated',
  'ממתין': 'pending',
  'הושלם': 'completed',   // Bagruts — completed exam
  'בתהליך': 'pending',    // Bagruts — in-progress (orange)
  'הצלחה': 'active',      // AuditTrail — success (green)
  'כשל': 'destructive',   // AuditTrail — failed (red)
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant: BadgeVariant = STATUS_VARIANT_MAP[status] ?? 'outline'

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}
