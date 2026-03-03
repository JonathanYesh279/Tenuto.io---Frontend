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
import { timeToMinutes, minutesToTime, extractBlockId, DAY_NAMES, GRID_START_HOUR, GRID_END_HOUR, TOTAL_SLOTS, SLOT_DURATION } from '@/components/room-schedule/utils'
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

/**
 * Apply activity/room filters to a day's schedule response.
 * Reusable for both the main filteredRooms useMemo and week PDF pages.
 */
function applyFilters(
  daySchedule: RoomScheduleResponse,
  currentFilters: Filters,
  rooms: Array<{ name: string; isActive: boolean }>
) {
  const scheduleRoomNames = new Set((daySchedule.rooms || []).map((r) => r.room))

  // Filter activities within each room
  let filtered = (daySchedule.rooms || []).map((room) => ({
    ...room,
    activities: room.activities.filter((activity) => {
      if (!currentFilters.activityTypes.includes(activity.source)) return false
      if (currentFilters.teacherName && !activity.teacherName.includes(currentFilters.teacherName)) return false
      return true
    }),
  }))

  // Filter by room name
  if (currentFilters.roomName) {
    filtered = filtered.filter((room) => room.room === currentFilters.roomName)
  } else {
    filtered = filtered.filter((room) => room.activities.length > 0)
  }

  // Merge empty tenant rooms not already in schedule
  for (const tr of rooms) {
    if (!tr.isActive) continue
    if (scheduleRoomNames.has(tr.name)) continue
    if (currentFilters.roomName && currentFilters.roomName !== tr.name) continue
    filtered.push({ room: tr.name, activities: [], hasConflicts: false })
  }

  filtered.sort((a, b) => a.room.localeCompare(b.room, 'he'))
  return filtered
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

  // Silent reload: sync with server without showing skeleton (grid stays mounted, scroll preserved)
  const silentReloadSchedule = useCallback(async () => {
    try {
      const result = await roomScheduleService.getRoomSchedule(selectedDay)
      setSchedule(result)
      setWeekData(null)
    } catch (err) {
      console.error('Error reloading room schedule:', err)
    }
    // Note: NO setLoading -- grid stays rendered, no skeleton
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

    // Optimistic update: move activity in local state immediately
    setSchedule((prev: RoomScheduleResponse | null): RoomScheduleResponse | null => {
      if (!prev) return prev
      return {
        ...prev,
        rooms: prev.rooms.map(room => {
          // Remove activity from source room
          const withoutActivity = room.activities.filter(a => a.id !== activity.id)
          if (room.room === targetRoom) {
            // Add activity to target room with updated times
            return {
              ...room,
              activities: [...withoutActivity, {
                id: activity.id,
                source: activity.source,
                room: targetRoom,
                day: prev.day,
                startTime: targetStartTime,
                endTime: targetEndTime,
                teacherName: activity.teacherName,
                teacherId: activity.teacherId,
                label: activity.label,
                activityType: activity.activityType,
                hasConflict: false,
                conflictGroupId: null as string | null,
              }],
            }
          }
          return { ...room, activities: withoutActivity }
        }),
      }
    })

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
      silentReloadSchedule()  // Sync with server without unmounting grid
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
      silentReloadSchedule()  // Reload server state without skeleton (rolls back optimistic update)
    }
  }, [silentReloadSchedule])

  // Room names for FilterBar dropdown (schedule rooms + active tenant rooms)
  const roomNames = useMemo(() => {
    const names = new Set<string>()
    for (const room of schedule?.rooms || []) names.add(room.room)
    for (const tr of tenantRooms) if (tr.isActive) names.add(tr.name)
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'he'))
  }, [schedule, tenantRooms])

  // Filter rooms + merge empty tenant rooms (delegates to shared applyFilters helper)
  const filteredRooms = useMemo(() => {
    if (!schedule) return []
    return applyFilters(schedule, filters, tenantRooms)
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

  // Tabular PDF export handler (activity rows -- existing format with week support)
  const handleExportTabularPDF = useCallback(() => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' })
      const pageWidth = doc.internal.pageSize.getWidth()

      const activityTypeLabels: Record<string, string> = {
        timeBlock: 'שיעור פרטי',
        rehearsal: 'חזרה',
        theory: 'תאוריה',
      }

      const exportTabularPage = (
        dayRooms: typeof filteredRooms,
        dayName: string
      ) => {
        doc.setFontSize(16)
        doc.text(`לוח חדרים - יום ${dayName}`, pageWidth - 14, 15, { align: 'right' })
        doc.setFontSize(10)
        doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, pageWidth - 14, 22, { align: 'right' })

        const tableBody: string[][] = []
        for (const room of dayRooms) {
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
          startY: 28,
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
      }

      if (viewMode === 'week' && weekData) {
        // Week mode: 6 pages, one per day
        for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
          if (dayIdx > 0) doc.addPage()
          const dayData = weekData[dayIdx]
          const dayFilteredRooms = dayData ? applyFilters(dayData, filters, tenantRooms) : []
          exportTabularPage(dayFilteredRooms, DAY_NAMES[dayIdx])
        }
        doc.save('room-schedule-week.pdf')
      } else {
        // Day mode: single page
        exportTabularPage(filteredRooms, DAY_NAMES[selectedDay])
        doc.save(`room-schedule-${DAY_NAMES[selectedDay]}.pdf`)
      }
    } catch {
      toast.error('שגיאה בייצוא PDF')
    }
  }, [selectedDay, filteredRooms, viewMode, weekData, filters, tenantRooms])

  // Grid-style visual PDF export handler (rooms x time slots, color-coded)
  const handleExportGridPDF = useCallback(() => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' })
      const pageWidth = doc.internal.pageSize.getWidth()

      // Generate time slot headers for the grid columns
      const timeHeaders: string[] = []
      for (let min = GRID_START_HOUR * 60; min < GRID_END_HOUR * 60; min += SLOT_DURATION) {
        const h = Math.floor(min / 60)
        const m = min % 60
        timeHeaders.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      }

      const exportGridPage = (dayRooms: typeof filteredRooms, dayName: string) => {
        // Title
        doc.setFontSize(14)
        doc.text(`לוח חדרים - יום ${dayName}`, pageWidth - 14, 12, { align: 'right' })
        doc.setFontSize(8)
        doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, pageWidth - 14, 18, { align: 'right' })

        if (dayRooms.length === 0) {
          doc.setFontSize(10)
          doc.text('אין פעילויות להצגה', pageWidth / 2, 40, { align: 'center' })
          return
        }

        // Build body: each room = one row. Each cell = activity text or empty.
        const body: string[][] = []
        for (const room of dayRooms) {
          const row: string[] = [room.room]

          // Fill in slot cells
          for (let s = 0; s < timeHeaders.length; s++) {
            // Find activity that starts at this slot
            const activity = room.activities.find((a) => {
              const aStart = Math.floor((timeToMinutes(a.startTime) - GRID_START_HOUR * 60) / SLOT_DURATION)
              return aStart === s
            })

            if (activity) {
              // Show compact info: teacher + label
              row.push(`${activity.teacherName}\n${activity.label}`)
            } else {
              // Check if an activity spans over this slot (continuation)
              const spanning = room.activities.find((a) => {
                const aStart = Math.floor((timeToMinutes(a.startTime) - GRID_START_HOUR * 60) / SLOT_DURATION)
                const aEnd = Math.ceil((timeToMinutes(a.endTime) - GRID_START_HOUR * 60) / SLOT_DURATION)
                return s > aStart && s < aEnd
              })
              row.push(spanning ? '...' : '')
            }
          }

          body.push(row)
        }

        doc.autoTable({
          startY: 22,
          head: [['חדר', ...timeHeaders]],
          body,
          styles: { fontSize: 5, cellPadding: 1, halign: 'right', valign: 'middle', lineWidth: 0.1 },
          headStyles: { fillColor: [63, 126, 223], halign: 'center', fontSize: 5 },
          columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold' } },
          theme: 'grid',
          didParseCell: (data: any) => {
            // Color code activity cells based on source type
            if (data.section === 'body' && data.column.index > 0 && data.cell.raw) {
              const roomIdx = data.row.index
              const slotIdx = data.column.index - 1
              const room = dayRooms[roomIdx]
              if (room) {
                // Find activity that starts at or spans this slot
                const activity = room.activities.find((a: any) => {
                  const aStart = Math.floor((timeToMinutes(a.startTime) - GRID_START_HOUR * 60) / SLOT_DURATION)
                  const aEnd = Math.ceil((timeToMinutes(a.endTime) - GRID_START_HOUR * 60) / SLOT_DURATION)
                  return slotIdx >= aStart && slotIdx < aEnd
                })
                if (activity) {
                  if (activity.source === 'timeBlock') data.cell.styles.fillColor = [219, 234, 254] // blue-100
                  else if (activity.source === 'rehearsal') data.cell.styles.fillColor = [243, 232, 255] // purple-100
                  else if (activity.source === 'theory') data.cell.styles.fillColor = [255, 237, 213] // orange-100
                }
              }
            }
          },
        })
      }

      if (viewMode === 'week' && weekData) {
        // Week: 6 pages
        for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
          if (dayIdx > 0) doc.addPage()
          const dayData = weekData[dayIdx]
          const dayFilteredRooms = dayData ? applyFilters(dayData, filters, tenantRooms) : []
          exportGridPage(dayFilteredRooms, DAY_NAMES[dayIdx])
        }
        doc.save('room-schedule-grid-week.pdf')
      } else {
        // Day: single page
        exportGridPage(filteredRooms, DAY_NAMES[selectedDay])
        doc.save(`room-schedule-grid-${DAY_NAMES[selectedDay]}.pdf`)
      }
    } catch {
      toast.error('שגיאה בייצוא PDF')
    }
  }, [selectedDay, filteredRooms, viewMode, weekData, filters, tenantRooms])

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
        onExportGridPDF={handleExportGridPDF}
        onExportTabularPDF={handleExportTabularPDF}
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
            scheduleData={schedule}
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
