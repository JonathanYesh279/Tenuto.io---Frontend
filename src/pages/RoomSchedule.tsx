import { useState, useEffect, useCallback } from 'react'
import { roomScheduleService } from '@/services/apiService'
import DaySelector from '@/components/room-schedule/DaySelector'
import RoomGrid from '@/components/room-schedule/RoomGrid'
import toast from 'react-hot-toast'

// Determine initial day: current weekday capped at Friday (5).
// Saturday (6) wraps to Sunday (0).
function getInitialDay(): number {
  const today = new Date().getDay()
  // JS getDay: 0=Sunday, 1=Monday, ..., 6=Saturday
  // Our mapping: 0=Sunday, 1=Monday, ..., 5=Friday
  return today >= 6 ? 0 : today
}

interface RoomScheduleResponse {
  day: number
  dayName: string
  rooms: Array<{
    room: string
    activities: Array<{
      id: string
      source: 'timeBlock' | 'rehearsal' | 'theory'
      room: string
      day: number
      startTime: string
      endTime: string
      teacherName: string
      teacherId: string
      label: string
      activityType: string
      hasConflict: boolean
      conflictGroupId: string | null
    }>
    hasConflicts: boolean
  }>
  unassigned: Array<unknown>
  summary: {
    totalRooms: number
    totalActivities: number
    conflictCount: number
    sources: {
      timeBlock: number
      rehearsal: number
      theory: number
    }
  }
  timing: {
    queryMs: number
    sourceMs: {
      timeBlock: number
      rehearsal: number
      theory: number
    }
  }
}

export default function RoomSchedule() {
  const [selectedDay, setSelectedDay] = useState(getInitialDay)
  const [schedule, setSchedule] = useState<RoomScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true)
      const result = await roomScheduleService.getRoomSchedule(selectedDay)
      setSchedule(result)
    } catch (err) {
      console.error('Error loading room schedule:', err)
      toast.error('שגיאה בטעינת לוח החדרים')
    } finally {
      setLoading(false)
    }
  }, [selectedDay])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">לוח חדרים</h1>
        <DaySelector
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
          disabled={loading}
        />
      </div>

      {/* Room grid */}
      <RoomGrid
        rooms={schedule?.rooms || []}
        loading={loading}
      />
    </div>
  )
}
