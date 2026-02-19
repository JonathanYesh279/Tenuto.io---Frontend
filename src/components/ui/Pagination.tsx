import { CaretLeftIcon, CaretRightIcon, CaretDoubleLeftIcon, CaretDoubleRightIcon } from '@phosphor-icons/react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  className?: string
  entityLabel?: string  // e.g. "תלמידים" | "מורים" | "חזרות" | "רשומות"
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 20, 50, 100],
  className = '',
  entityLabel
}: PaginationProps) {
  // Calculate displayed items range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust range if near start or end
      if (currentPage <= 3) {
        endPage = 5
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4
      }

      // Add ellipsis before if needed
      if (startPage > 2) {
        pages.push('...')
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis after if needed
      if (endPage < totalPages - 1) {
        pages.push('...')
      }

      // Show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage)
    }
  }

  if (totalPages <= 0) {
    return null
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Items per page selector */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>הצג</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
            className="px-3 py-1 border border-input rounded focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>פריטים בעמוד</span>
        </div>
      )}

      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        מציג {startItem}–{endItem} מתוך {totalItems} {entityLabel ?? 'פריטים'}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page button */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="עמוד ראשון"
        >
          <CaretDoubleRightIcon className="w-4 h-4" weight="regular" />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="עמוד קודם"
        >
          <CaretRightIcon className="w-4 h-4" weight="regular" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-1 text-muted-foreground"
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`min-w-[40px] px-3 py-1 rounded font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-muted text-foreground'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Next page button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="עמוד הבא"
        >
          <CaretLeftIcon className="w-4 h-4" weight="regular" />
        </button>

        {/* Last page button */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="עמוד אחרון"
        >
          <CaretDoubleLeftIcon className="w-4 h-4" weight="regular" />
        </button>
      </div>
    </div>
  )
}
