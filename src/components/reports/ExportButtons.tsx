import { useState } from 'react'
import { DownloadSimpleIcon, FileTextIcon } from '@phosphor-icons/react'
import { reportsService } from '../../services/apiService'
import toast from 'react-hot-toast'

interface ExportButtonsProps {
  reportId: string
  currentFilters: Record<string, string>
  exports: string[]
}

export default function ExportButtons({
  reportId,
  currentFilters,
  exports: exportFormats,
}: ExportButtonsProps) {
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const isLoading = loadingExcel || loadingPdf

  const handleExportExcel = async () => {
    try {
      setLoadingExcel(true)
      await reportsService.exportExcel(reportId, currentFilters)
      toast.success('קובץ Excel הורד בהצלחה')
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('שגיאה בייצוא Excel')
    } finally {
      setLoadingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    try {
      setLoadingPdf(true)
      await reportsService.exportPdf(reportId, currentFilters)
      toast.success('קובץ PDF הורד בהצלחה')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('שגיאה בייצוא PDF')
    } finally {
      setLoadingPdf(false)
    }
  }

  if (!exportFormats || exportFormats.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {exportFormats.includes('excel') && (
        <button
          onClick={handleExportExcel}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingExcel ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700" />
          ) : (
            <DownloadSimpleIcon size={16} weight="bold" />
          )}
          ייצוא Excel
        </button>
      )}

      {exportFormats.includes('pdf') && (
        <button
          onClick={handleExportPdf}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingPdf ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700" />
          ) : (
            <FileTextIcon size={16} weight="bold" />
          )}
          ייצוא PDF
        </button>
      )}
    </div>
  )
}
