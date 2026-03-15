import { Tabs, Tab } from '@heroui/react'
import { DAY_NAMES } from './utils'

interface DaySelectorProps {
  selectedDay: number
  onDayChange: (day: number) => void
  disabled?: boolean
}

export default function DaySelector({ selectedDay, onDayChange, disabled }: DaySelectorProps) {
  return (
    <Tabs
      aria-label="בחירת יום"
      selectedKey={String(selectedDay)}
      onSelectionChange={(key) => onDayChange(Number(key))}
      variant="solid"
      color="default"
      isDisabled={disabled}
      classNames={{
        tab: "font-bold text-sm min-w-[60px]",
      }}
    >
      {DAY_NAMES.map((name, index) => (
        <Tab key={String(index)} title={name} />
      ))}
    </Tabs>
  )
}
