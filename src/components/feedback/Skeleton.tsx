import React from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Skeleton — base animate-pulse primitive
// ---------------------------------------------------------------------------

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  )
}

// ---------------------------------------------------------------------------
// TableSkeleton — table-shaped skeleton for list pages
// ---------------------------------------------------------------------------

interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 8, cols = 5 }: TableSkeletonProps) {
  const colWidths = (index: number, total: number): string => {
    if (index === 0) return 'w-1/4'
    if (index === total - 1) return 'w-1/6'
    return 'w-1/5'
  }

  return (
    <div role="status" aria-label="טוען נתונים...">
      {/* Header row */}
      <div className="border-b border-gray-100 flex gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn('h-4', colWidths(i, cols))} />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 px-4 py-3 border-b border-gray-100/50"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className={cn('h-4', colWidths(colIndex, cols))} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CardSkeleton — grid of card-shaped skeletons for grid views
// ---------------------------------------------------------------------------

interface CardSkeletonProps {
  count?: number
}

export function CardSkeleton({ count = 6 }: CardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="טוען נתונים..."
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          {/* Avatar circle */}
          <Skeleton className="h-10 w-10 rounded-full" />
          {/* Text lines */}
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}
