import { Printer, FilePdf, CalendarBlank, Calendar, ArrowsOut, Table } from '@phosphor-icons/react'
import { Button as HeroButton, Tabs, Tab } from '@heroui/react'

interface ScheduleToolbarProps {
  viewMode: 'day' | 'week'
  onViewModeChange: (mode: 'day' | 'week') => void
  onPrint: () => void
  onExportGridPDF: () => void
  onExportTabularPDF: () => void
}

export default function ScheduleToolbar({
  viewMode,
  onViewModeChange,
  onPrint,
  onExportGridPDF,
  onExportTabularPDF,
}: ScheduleToolbarProps) {
  return (
    <>
      {/* View mode toggle */}
      <Tabs
        aria-label="מצב תצוגה"
        selectedKey={viewMode}
        onSelectionChange={(key) => onViewModeChange(key as 'day' | 'week')}
        variant="solid"
        color="default"
        size="sm"
        classNames={{
          tab: "font-bold text-xs",
        }}
      >
        <Tab
          key="day"
          title={
            <div className="flex items-center gap-1">
              <CalendarBlank size={13} />
              <span>יום</span>
            </div>
          }
        />
        <Tab
          key="week"
          title={
            <div className="flex items-center gap-1">
              <Calendar size={13} />
              <span>שבוע</span>
            </div>
          }
        />
      </Tabs>

      {/* Action buttons */}
      <HeroButton
        color="default"
        variant="bordered"
        size="sm"
        isIconOnly
        onPress={() => window.open('/room-schedule/fullscreen', '_blank')}
        className="min-w-8 w-8 h-8"
        aria-label="מסך מלא"
      >
        <ArrowsOut size={14} />
      </HeroButton>
      <HeroButton
        color="default"
        variant="bordered"
        size="sm"
        isIconOnly
        onPress={onPrint}
        className="min-w-8 w-8 h-8"
        aria-label="הדפסה"
      >
        <Printer size={14} />
      </HeroButton>
      <HeroButton
        color="default"
        variant="bordered"
        size="sm"
        isIconOnly
        onPress={onExportGridPDF}
        className="min-w-8 w-8 h-8"
        aria-label="PDF חזותי"
      >
        <FilePdf size={14} />
      </HeroButton>
      <HeroButton
        color="default"
        variant="bordered"
        size="sm"
        isIconOnly
        onPress={onExportTabularPDF}
        className="min-w-8 w-8 h-8"
        aria-label="PDF טבלאי"
      >
        <Table size={14} />
      </HeroButton>
    </>
  )
}
