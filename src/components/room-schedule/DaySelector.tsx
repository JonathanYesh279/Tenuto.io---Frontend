import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']

interface DaySelectorProps {
  selectedDay: number
  onDayChange: (day: number) => void
  disabled?: boolean
}

export default function DaySelector({ selectedDay, onDayChange, disabled }: DaySelectorProps) {
  return (
    <Tabs
      value={String(selectedDay)}
      onValueChange={(v) => onDayChange(Number(v))}
    >
      <TabsList className="gap-1">
        {DAY_NAMES.map((name, index) => (
          <TabsTrigger
            key={index}
            value={String(index)}
            disabled={disabled}
            className="min-w-[60px]"
          >
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
