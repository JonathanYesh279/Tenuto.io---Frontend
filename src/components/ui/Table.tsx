import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { ArrowUpRightIcon, TrashIcon } from '@phosphor-icons/react'

interface Column {
  key: string
  label: string
  header?: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: Record<string, any>) => ReactNode
}

interface TableProps {
  columns: Column[]
  data: Record<string, ReactNode>[]
  className?: string
  onRowClick?: (row: Record<string, ReactNode>, index: number) => void
  rowClassName?: string | ((row: Record<string, ReactNode>, index: number) => string)
  actions?: boolean
  onView?: (row: Record<string, any>) => void
  onDelete?: (row: Record<string, any>) => void
  actionLabels?: {
    view?: string
    delete?: string
  }
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'in-progress'
  children: ReactNode
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusClasses = {
    active: 'bg-success-100 text-success-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-orange-100 text-orange-800',
    completed: 'bg-success-100 text-success-800',
    'in-progress': 'bg-muted text-foreground'
  }

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      statusClasses[status]
    )}>
      {children}
    </span>
  )
}

export default function Table({
  columns,
  data,
  className,
  onRowClick,
  rowClassName,
  actions = false,
  onView,
  onDelete,
  actionLabels = { view: 'צפה', delete: 'מחק' }
}: TableProps) {
  return (
    <div className={clsx('overflow-hidden bg-background border border-border flex flex-col h-full', className)}>
      <div className="overflow-x-auto flex-1 min-h-0">
        <div className="overflow-y-auto h-full">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted sticky top-0 z-10 shadow-[0_1px_0_0_theme(colors.border)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={clsx(
                      'px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider',
                      {
                        'text-start': column.align === 'left',
                        'text-center': column.align === 'center',
                        'text-end': column.align === 'right',
                      }
                    )}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.header || column.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-end">
                    פעולות
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {data.map((row, index) => {
                const computedRowClassName = typeof rowClassName === 'function'
                  ? rowClassName(row, index)
                  : rowClassName || ''

                const isClickable = !!onRowClick

                return (
                  <tr
                    key={index}
                    className={clsx(
                      'transition-colors duration-150',
                      isClickable && 'cursor-pointer hover:bg-muted',
                      !isClickable && 'hover:bg-muted',
                      computedRowClassName
                    )}
                    onClick={isClickable ? () => onRowClick(row, index) : undefined}
                    onKeyDown={isClickable ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(row, index)
                      }
                    } : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    role={isClickable ? 'button' : undefined}
                    aria-label={isClickable ? `צפה בפרטי ${row.name || 'הפריט'}` : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={clsx(
                          'px-4 py-3 whitespace-nowrap text-sm text-foreground',
                          {
                            'text-start': column.align === 'left',
                            'text-center': column.align === 'center',
                            'text-end': column.align === 'right',
                          },
                        )}
                      >
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-end">
                        <div className="flex items-center justify-end gap-0.5">
                          {onView && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onView(row)
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
                              title={actionLabels.view}
                            >
                              <ArrowUpRightIcon size={15} weight="regular" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(row)
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              title={actionLabels.delete}
                            >
                              <TrashIcon size={15} weight="regular" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
