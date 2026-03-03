import { useState, useEffect, useCallback, useMemo } from 'react'
import { roomScheduleService, tenantService } from '@/services/apiService'
import { useAuth } from '@/services/authContext'
import DaySelector from '@/components/room-schedule/DaySelector'
import RoomGrid from '@/components/room-schedule/RoomGrid'
import SummaryBar from '@/components/room-schedule/SummaryBar'
import UnassignedRow from '@/components/room-schedule/UnassignedRow'
import FilterBar from '@/components/room-schedule/FilterBar'
import type { Filters } from '@/components/room-schedule/FilterBar'
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
  const [filters, setFilters] = useState<Filters>({
    teacherName: '',
    roomName: '',
    activityTypes: ['timeBlock', 'rehearsal', 'theory'],
  })
  const { user } = useAuth()
  const [tenantRooms, setTenantRooms] = useState<Array<{ name: string; isActive: boolean }>>([])

  // Fetch tenant rooms for empty room display
  useEffect(() => {
    if (user?.tenantId) {
      tenantService.getRooms(user.tenantId)
        .then((rooms: Array<{ name: string; isActive: boolean }>) => setTenantRooms(rooms || []))
        .catch((err: unknown) => console.error('Error fetching rooms:', err))
    }
  }, [user?.tenantId])

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

  // Room names for FilterBar dropdown (schedule rooms + active tenant rooms)
  const roomNames = useMemo(() => {
    const names = new Set<string>()
    for (const room of schedule?.rooms || []) names.add(room.room)
    for (const tr of tenantRooms) if (tr.isActive) names.add(tr.name)
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'he'))
  }, [schedule, tenantRooms])

  // Filter rooms + merge empty tenant rooms
  const filteredRooms = useMemo(() => {
    if (!schedule) return []

    const scheduleRoomNames = new Set((schedule.rooms || []).map((r) => r.room))

    // Start with schedule rooms, filter activities within each room
    let rooms = (schedule.rooms || []).map((room) => ({
      ...room,
      activities: room.activities.filter((activity) => {
        // Activity type filter
        if (!filters.activityTypes.includes(activity.source)) return false
        // Teacher name filter
        if (filters.teacherName && !activity.teacherName.includes(filters.teacherName)) return false
        return true
      }),
    }))

    // Filter by room name
    if (filters.roomName) {
      rooms = rooms.filter((room) => room.room === filters.roomName)
    } else {
      // When no room filter: remove rooms with no matching activities
      rooms = rooms.filter((room) => room.activities.length > 0)
    }

    // Merge empty tenant rooms (rooms in tenant settings not already in schedule)
    for (const tr of tenantRooms) {
      if (!tr.isActive) continue
      if (scheduleRoomNames.has(tr.name)) continue
      // Only include when no room filter is active OR the room matches the filter
      if (filters.roomName && filters.roomName !== tr.name) continue
      rooms.push({ room: tr.name, activities: [], hasConflicts: false })
    }

    // Sort alphabetically by room name
    rooms.sort((a, b) => a.room.localeCompare(b.room, 'he'))

    return rooms
  }, [schedule, filters, tenantRooms])

  // Compute summary statistics from filtered rooms
  const stats = useMemo(() => {
    if (!schedule) return { totalRooms: 0, occupiedSlots: 0, freeSlots: 0, conflictCount: 0 }

    const totalRooms = filteredRooms.length
    const totalSlots = totalRooms * TOTAL_SLOTS

    // Count unique occupied slots per room (an activity spanning 2 slots = 2 occupied)
    let occupiedSlotCount = 0
    let conflictCount = 0
    const gridStartMinutes = GRID_START_HOUR * 60

    for (const room of filteredRooms) {
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
        if (activity.hasConflict) conflictCount++
      }
      occupiedSlotCount += occupied.size
    }

    return {
      totalRooms,
      occupiedSlots: occupiedSlotCount,
      freeSlots: totalSlots - occupiedSlotCount,
      conflictCount,
    }
  }, [schedule, filteredRooms])

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

      {/* Filter controls */}
      <FilterBar filters={filters} onFiltersChange={setFilters} rooms={roomNames} />

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
        rooms={filteredRooms}
        loading={loading}
      />

      {/* Unassigned activities (no room) */}
      <UnassignedRow activities={schedule?.unassigned || []} />
    </div>
  )
}
