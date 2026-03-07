import { CaretUpIcon, CaretDownIcon } from '@phosphor-icons/react'
import Pagination from '../ui/Pagination'

interface Column {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'percentage' | 'currency'
}

interface ColumnGroup {
  label: string
  columns: string[]
}

interface SummaryItem {
  label: string
  value: any
  type: string
}

interface Metadata {
  reportId: string
  title: string
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
  filters: Record<string, any>
  exports: string[]
}

interface DefaultTableRendererProps {
  columns: Column[]
  columnGroups?: ColumnGroup[]
  rows: Record<string, any>[]
  summary: { items: SummaryItem[] }
  metadata: Metadata
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

function formatCellValue(value: any, type: string): string {
  if (value === null || value === undefined || value === '') return '-'

  switch (type) {
    case 'number':
      return Number(value).toLocaleString('he-IL')
    case 'date':
      try {
        return new Date(value).toLocaleDateString('he-IL')
      } catch {
        return String(value)
      }
    case 'percentage':
      return `${Number(value).toFixed(1)}%`
    case 'currency':
      return Number(value).toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })
    default:
      return String(value)
  }
}

function getCellAlignment(type: string): string {
  switch (type) {
    case 'number':
    case 'percentage':
    case 'currency':
      return 'text-left'
    default:
      return 'text-right'
  }
}

export default function DefaultTableRenderer({
  columns,
  columnGroups,
  rows,
  summary,
  metadata,
  sortBy,
  sortOrder = 'asc',
  onSortChange,
  onPageChange,
  onLimitChange,
}: DefaultTableRendererProps) {
  const handleHeaderClick = (columnKey: string) => {
    if (sortBy === columnKey) {
      onSortChange(columnKey, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(columnKey, 'asc')
    }
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">אין נתונים להצגה</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border bg-card text-card-foreground">
          {/* Column Groups Header */}
          {columnGroups && columnGroups.length > 0 && (
            <thead>
              <tr className="bg-muted/50">
                {columnGroups.map((group, i) => (
                  <th
                    key={i}
                    colSpan={group.columns.length}
                    className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground border-b border-border"
                  >
                    {group.label}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Column Headers */}
          <thead>
            <tr className="bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col.key)}
                  className={`px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap ${getCellAlignment(col.type)}`}
                >
                  <div className={`flex items-center gap-1 ${col.type === 'number' || col.type === 'percentage' || col.type === 'currency' ? 'flex-row-reverse justify-end' : ''}`}>
                    <span>{col.label}</span>
                    {sortBy === col.key && (
                      sortOrder === 'asc' ? (
                        <CaretUpIcon size={14} weight="bold" className="text-primary" />
                      ) : (
                        <CaretDownIcon size={14} weight="bold" className="text-primary" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border">
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 1 ? 'bg-muted/20' : ''}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm whitespace-nowrap ${getCellAlignment(col.type)}`}
                  >
                    {formatCellValue(row[col.key], col.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      {summary?.items?.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex flex-wrap gap-6">
            {summary.items.map((item, i) => (
              <div key={i} className="min-w-[120px]">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCellValue(item.value, item.type)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {metadata?.pagination && metadata.pagination.totalPages > 0 && (
        <Pagination
          currentPage={metadata.pagination.page}
          totalPages={metadata.pagination.totalPages}
          totalItems={metadata.pagination.totalCount}
          itemsPerPage={metadata.pagination.limit}
          onPageChange={onPageChange}
          onItemsPerPageChange={onLimitChange}
          entityLabel="רשומות"
        />
      )}
    </div>
  )
}
