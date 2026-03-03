import { Printer, FilePdf, CalendarBlank, Calendar } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ScheduleToolbarProps {
  viewMode: 'day' | 'week'
  onViewModeChange: (mode: 'day' | 'week') => void
  onPrint: () => void
  onExportPDF: () => void
}

export default function ScheduleToolbar({
  viewMode,
  onViewModeChange,
  onPrint,
  onExportPDF,
}: ScheduleToolbarProps) {
  return (
    <div className="flex items-center justify-between print:hidden">
      {/* View mode toggle (segmented control) */}
      <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => onViewModeChange('day')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
            viewMode === 'day'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <CalendarBlank size={16} />
          <span>יום</span>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('week')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm border-r border-gray-200 transition-colors',
            viewMode === 'week'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <Calendar size={16} />
          <span>שבוע</span>
        </button>
      </div>

      {/* Print & Export actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Printer size={16} />
          <span>הדפסה</span>
        </button>
        <button
          type="button"
          onClick={onExportPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FilePdf size={16} />
          <span>ייצוא PDF</span>
        </button>
      </div>
    </div>
  )
}
