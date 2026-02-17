import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Eye, Trash2 } from 'lucide-react'

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
    'in-progress': 'bg-primary-100 text-primary-800'
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
    <div className={clsx('overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200', className)}>
      <div className="overflow-x-auto">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_0_0_theme(colors.gray.200)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={clsx(
                      'px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
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
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-end">
                    פעולות
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
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
                      isClickable && 'cursor-pointer hover:bg-amber-50/60',
                      !isClickable && 'hover:bg-amber-50/60',
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
                          'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-end">
                        <div className="flex items-center justify-end gap-2">
                          {onView && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onView(row)
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              title={actionLabels.view}
                            >
                              <Eye className="w-3 h-3 ml-1" />
                              {actionLabels.view}
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(row)
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              title={actionLabels.delete}
                            >
                              <Trash2 className="w-3 h-3 ml-1" />
                              {actionLabels.delete}
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
