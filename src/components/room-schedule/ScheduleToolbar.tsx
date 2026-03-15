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
    <div className="flex items-center justify-between print:hidden">
      {/* View mode toggle */}
      <Tabs
        aria-label="מצב תצוגה"
        selectedKey={viewMode}
        onSelectionChange={(key) => onViewModeChange(key as 'day' | 'week')}
        variant="solid"
        color="default"
        classNames={{
          tab: "font-bold text-sm",
        }}
      >
        <Tab
          key="day"
          title={
            <div className="flex items-center gap-1.5">
              <CalendarBlank size={14} />
              <span>יום</span>
            </div>
          }
        />
        <Tab
          key="week"
          title={
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>שבוע</span>
            </div>
          }
        />
      </Tabs>

      {/* Print, Export & Fullscreen actions */}
      <div className="flex items-center gap-2">
        <HeroButton
          color="default"
          variant="bordered"
          size="sm"
          onPress={() => window.open('/room-schedule/fullscreen', '_blank')}
          startContent={<ArrowsOut size={14} />}
          className="font-bold"
        >
          מסך מלא
        </HeroButton>
        <HeroButton
          color="default"
          variant="bordered"
          size="sm"
          onPress={onPrint}
          startContent={<Printer size={14} />}
          className="font-bold"
        >
          הדפסה
        </HeroButton>
        <HeroButton
          color="default"
          variant="bordered"
          size="sm"
          onPress={onExportGridPDF}
          startContent={<FilePdf size={14} />}
          className="font-bold"
        >
          PDF חזותי
        </HeroButton>
        <HeroButton
          color="default"
          variant="bordered"
          size="sm"
          onPress={onExportTabularPDF}
          startContent={<Table size={14} />}
          className="font-bold"
        >
          PDF טבלאי
        </HeroButton>
      </div>
    </div>
  )
}
