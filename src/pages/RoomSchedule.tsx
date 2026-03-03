import { useState, useEffect, useCallback, useMemo } from 'react'
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { roomScheduleService, tenantService, teacherService } from '@/services/apiService'
import { useAuth } from '@/services/authContext'
import DaySelector from '@/components/room-schedule/DaySelector'
import RoomGrid from '@/components/room-schedule/RoomGrid'
import SummaryBar from '@/components/room-schedule/SummaryBar'
import UnassignedRow from '@/components/room-schedule/UnassignedRow'
import FilterBar from '@/components/room-schedule/FilterBar'
import type { Filters } from '@/components/room-schedule/FilterBar'
import CreateLessonDialog from '@/components/room-schedule/CreateLessonDialog'
import type { CreateDialogState } from '@/components/room-schedule/CreateLessonDialog'
import DragOverlayContent from '@/components/room-schedule/DragOverlayContent'
import type { ActivityData } from '@/components/room-schedule/ActivityCell'
import { timeToMinutes, minutesToTime, extractBlockId, DAY_NAMES, GRID_START_HOUR, TOTAL_SLOTS, SLOT_DURATION } from '@/components/room-schedule/utils'
import ScheduleToolbar from '@/components/room-schedule/ScheduleToolbar'
import WeekOverview from '@/components/room-schedule/WeekOverview'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import toast from 'react-hot-toast'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

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
  const [teachers, setTeachers] = useState<any[]>([])
  const [createDialogState, setCreateDialogState] = useState<CreateDialogState>({
    open: false,
    room: '',
    day: selectedDay,
    startTime: '08:00',
    endTime: '08:30',
  })

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [weekData, setWeekData] = useState<RoomScheduleResponse[] | null>(null)
  const [weekLoading, setWeekLoading] = useState(false)

  // Drag-and-drop state
  const [activeActivity, setActiveActivity] = useState<ActivityData | null>(null)

  // Configure dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },  // 8px before drag starts (prevents click/drag conflict)
    }),
    useSensor(KeyboardSensor)
  )

  // Fetch teachers for create dialog dropdown
  useEffect(() => {
    teacherService.getTeachers()
      .then((result: any) => {
        const list = Array.isArray(result) ? result : result?.data || result || []
        setTeachers(list)
      })
      .catch((err: unknown) => console.error('Error fetching teachers:', err))
  }, [])

  // Fetch tenant rooms for empty room display
  useEffect(() => {
    if (user?.tenantId) {
      tenantService.getRooms(user.tenantId)
        .then((res: any) => setTenantRooms(Array.isArray(res) ? res : res?.data || []))
        .catch((err: unknown) => console.error('Error fetching rooms:', err))
    }
  }, [user?.tenantId])

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true)
      const result = await roomScheduleService.getRoomSchedule(selectedDay)
      setSchedule(result)
      setWeekData(null) // Invalidate week cache on day-mode data reload
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

  // Load all 6 days for week overview
  const loadWeekData = useCallback(async () => {
    setWeekLoading(true)
    try {
      const days = await Promise.all(
        [0, 1, 2, 3, 4, 5].map(day => roomScheduleService.getRoomSchedule(day))
      )
      setWeekData(days)
    } catch (err) {
      console.error('Error loading week data:', err)
      toast.error('שגיאה בטעינת מבט שבועי')
    } finally {
      setWeekLoading(false)
    }
  }, [])

  // Auto-fetch week data when switching to week view (if not cached)
  useEffect(() => {
    if (viewMode === 'week' && weekData === null) {
      loadWeekData()
    }
  }, [viewMode, weekData, loadWeekData])

  // Handle empty cell click -- open create lesson dialog
  const handleEmptyCellClick = useCallback((room: string, timeSlot: string) => {
    const startMinutes = timeToMinutes(timeSlot)
    const endMinutes = startMinutes + 30
    setCreateDialogState({
      open: true,
      room,
      day: selectedDay,
      startTime: timeSlot,
      endTime: minutesToTime(endMinutes),
    })
  }, [selectedDay])

  // Refresh grid after lesson creation
  const handleLessonCreated = useCallback(() => {
    loadSchedule()
  }, [loadSchedule])

  // Drag start handler -- store the active activity for DragOverlay
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activity = event.active.data.current as ActivityData
    setActiveActivity(activity)
  }, [])

  // Drag end handler -- call move API and refresh grid
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveActivity(null)

    if (!over) return  // dropped outside any droppable

    const activity = active.data.current as ActivityData & { room: string; teacherId: string }
    const droppableId = over.id as string

    // Parse droppable ID: "roomName::HH:MM"
    const separatorIndex = droppableId.lastIndexOf('::')
    if (separatorIndex === -1) return
    const targetRoom = droppableId.slice(0, separatorIndex)
    const targetStartTime = droppableId.slice(separatorIndex + 2)

    // Calculate target end time preserving activity duration
    const durationMinutes = timeToMinutes(activity.endTime) - timeToMinutes(activity.startTime)
    const targetEndMinutes = timeToMinutes(targetStartTime) + durationMinutes
    const targetEndTime = minutesToTime(targetEndMinutes)

    // Skip if dropped on same cell (same room and same start time)
    if (targetRoom === activity.room && targetStartTime === activity.startTime) return

    try {
      const moveData: Record<string, string> = {
        activityId: activity.id,
        source: activity.source,
        targetRoom,
        targetStartTime,
        targetEndTime,
      }

      // TimeBlock source requires teacherId and blockId
      if (activity.source === 'timeBlock') {
        moveData.teacherId = activity.teacherId
        moveData.blockId = extractBlockId(activity.id)
      }

      await roomScheduleService.moveActivity(moveData)
      toast.success('הפעילות הועברה בהצלחה')
      loadSchedule()  // Refresh grid with server state
    } catch (err: any) {
      if (err?.code === 'CONFLICT' && err?.conflicts?.length > 0) {
        // Show conflict details in Hebrew
        const conflictNames = err.conflicts
          .map((c: any) => `${c.teacherName} (${c.startTime}-${c.endTime})`)
          .join(', ')
        toast.error(`התנגשות בחדר: ${conflictNames}`)
      } else if (err?.message === 'Resource not found.') {
        toast.error('הפעילות לא נמצאה')
      } else {
        toast.error('שגיאה בהעברת הפעילות')
      }
      loadSchedule()  // Reload to reset to server state
    }
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

  // Print handler -- relies on print:hidden classes on toolbar/filters and Layout.tsx no-print on sidebar/header
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // PDF export handler
  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' })

      const activityTypeLabels: Record<string, string> = {
        timeBlock: 'שיעור פרטי',
        rehearsal: 'חזרה',
        theory: 'תאוריה',
      }

      // Title and metadata (right-aligned for Hebrew)
      const pageWidth = doc.internal.pageSize.getWidth()
      doc.setFontSize(16)
      doc.text(`לוח חדרים - יום ${DAY_NAMES[selectedDay]}`, pageWidth - 14, 15, { align: 'right' })
      doc.setFontSize(10)
      doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, pageWidth - 14, 22, { align: 'right' })
      doc.text(
        `חדרים: ${stats.totalRooms} | תפוסות: ${stats.occupiedSlots} | פנויות: ${stats.freeSlots} | התנגשויות: ${stats.conflictCount}`,
        pageWidth - 14,
        28,
        { align: 'right' }
      )

      // Build table body from filtered rooms
      const tableBody: string[][] = []
      for (const room of filteredRooms) {
        for (const activity of room.activities) {
          tableBody.push([
            room.room,
            activity.startTime,
            activity.endTime,
            activity.teacherName,
            activity.label,
            activityTypeLabels[activity.source] || activity.source,
            activity.hasConflict ? 'כן' : '',
          ])
        }
      }

      doc.autoTable({
        startY: 33,
        head: [['חדר', 'התחלה', 'סיום', 'מורה', 'תלמיד/קבוצה', 'סוג', 'התנגשות']],
        body: tableBody,
        styles: { fontSize: 8, cellPadding: 2, halign: 'right' },
        headStyles: { fillColor: [63, 126, 223], halign: 'right' },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          6: { cellWidth: 18 },
        },
      })

      doc.save(`room-schedule-${DAY_NAMES[selectedDay]}.pdf`)
    } catch {
      toast.error('שגיאה בייצוא PDF')
    }
  }, [selectedDay, filteredRooms, stats])

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">לוח חדרים</h1>
        {viewMode === 'day' && (
          <DaySelector
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            disabled={loading}
          />
        )}
      </div>

      {/* Schedule toolbar (print/export/view mode) */}
      <ScheduleToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrint={handlePrint}
        onExportPDF={handleExportPDF}
      />

      {/* Day view content */}
      {viewMode === 'day' && (
        <>
          {/* Filter controls */}
          <div className="print:hidden">
            <FilterBar filters={filters} onFiltersChange={setFilters} rooms={roomNames} />
          </div>

          {/* Summary statistics bar */}
          <SummaryBar
            totalRooms={stats.totalRooms}
            occupiedSlots={stats.occupiedSlots}
            freeSlots={stats.freeSlots}
            conflictCount={stats.conflictCount}
            loading={loading}
          />

          {/* Room grid with drag-and-drop */}
          <div className="print:overflow-visible print:max-h-none">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <RoomGrid
                rooms={filteredRooms}
                loading={loading}
                onEmptyCellClick={handleEmptyCellClick}
                isDragEnabled={true}
              />
              <DragOverlay>
                {activeActivity ? <DragOverlayContent activity={activeActivity} /> : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Unassigned activities (no room) */}
          <UnassignedRow activities={schedule?.unassigned || []} />

          {/* Create lesson dialog */}
          <CreateLessonDialog
            state={createDialogState}
            onOpenChange={(open) => setCreateDialogState((prev) => ({ ...prev, open }))}
            teachers={teachers}
            onCreated={handleLessonCreated}
          />
        </>
      )}

      {/* Week overview */}
      {viewMode === 'week' && (
        <WeekOverview
          weekData={weekData}
          tenantRooms={tenantRooms}
          loading={weekLoading}
        />
      )}
    </div>
  )
}
