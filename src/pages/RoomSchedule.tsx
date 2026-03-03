import { useState, useEffect, useCallback, useMemo } from 'react'
import { roomScheduleService } from '@/services/apiService'
import DaySelector from '@/components/room-schedule/DaySelector'
import RoomGrid from '@/components/room-schedule/RoomGrid'
import SummaryBar from '@/components/room-schedule/SummaryBar'
import UnassignedRow from '@/components/room-schedule/UnassignedRow'
import { timeToMinutes, GRID_START_HOUR, TOTAL_SLOTS, SLOT_DURATION } from '@/components/room-schedule/utils'
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
  unassigned: Array<{
    id: string
    source: 'timeBlock' | 'rehearsal' | 'theory'
    startTime: string
    endTime: string
    teacherName: string
    label: string
    activityType: string
  }>
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

  // Compute summary statistics from API response
  const stats = useMemo(() => {
    if (!schedule) return { totalRooms: 0, occupiedSlots: 0, freeSlots: 0, conflictCount: 0 }

    const totalRooms = schedule.summary.totalRooms
    const totalSlots = totalRooms * TOTAL_SLOTS

    // Count unique occupied slots per room (an activity spanning 2 slots = 2 occupied)
    let occupiedSlotCount = 0
    const gridStartMinutes = GRID_START_HOUR * 60

    for (const room of schedule.rooms) {
      const occupied = new Set<number>()
      for (const activity of room.activities) {
        const startMinutes = timeToMinutes(activity.startTime)
        const endMinutes = timeToMinutes(activity.endTime)
        for (let t = startMinutes; t < endMinutes; t += SLOT_DURATION) {
          const slotIndex = Math.floor((t - gridStartMinutes) / SLOT_DURATION)
          if (slotIndex >= 0 && slotIndex < TOTAL_SLOTS) {
            occupied.add(slotIndex)
          }
        }
      }
      occupiedSlotCount += occupied.size
    }

    return {
      totalRooms,
      occupiedSlots: occupiedSlotCount,
      freeSlots: totalSlots - occupiedSlotCount,
      conflictCount: schedule.summary.conflictCount,
    }
  }, [schedule])

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

      {/* Summary statistics bar */}
      <SummaryBar
        totalRooms={stats.totalRooms}
        occupiedSlots={stats.occupiedSlots}
        freeSlots={stats.freeSlots}
        conflictCount={stats.conflictCount}
        loading={loading}
      />

      {/* Room grid */}
      <RoomGrid
        rooms={schedule?.rooms || []}
        loading={loading}
      />

      {/* Unassigned activities (no room) */}
      <UnassignedRow activities={schedule?.unassigned || []} />
    </div>
  )
}
