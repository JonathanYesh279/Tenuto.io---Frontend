import { useState, useEffect, useCallback, useMemo } from 'react'
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { roomScheduleService, tenantService, teacherService, teacherScheduleService, studentService } from '@/services/apiService'
import { useAuth } from '@/services/authContext'
import DaySelector from '@/components/room-schedule/DaySelector'
import RoomGrid from '@/components/room-schedule/RoomGrid'
import SummaryBar from '@/components/room-schedule/SummaryBar'
import UnassignedRow from '@/components/room-schedule/UnassignedRow'
import FilterBar from '@/components/room-schedule/FilterBar'
import type { Filters } from '@/components/room-schedule/FilterBar'
import CreateLessonDialog from '@/components/room-schedule/CreateLessonDialog'
import type { CreateDialogState } from '@/components/room-schedule/CreateLessonDialog'
import ActivityDetailModal from '@/components/room-schedule/ActivityDetailModal'
import DragOverlayContent from '@/components/room-schedule/DragOverlayContent'
import type { ActivityData } from '@/components/room-schedule/ActivityCell'
import { timeToMinutes, minutesToTime, extractBlockId, doTimesOverlap, DAY_NAMES, GRID_START_HOUR, GRID_END_HOUR, TOTAL_SLOTS, SLOT_DURATION } from '@/components/room-schedule/utils'
import ScheduleToolbar from '@/components/room-schedule/ScheduleToolbar'
import WeekOverview from '@/components/room-schedule/WeekOverview'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import toast from 'react-hot-toast'
import { registerHebrewFont } from '@/utils/pdfHebrewFont'

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

interface RoomScheduleProps {
  isFullscreen?: boolean
}

export default function RoomSchedule({ isFullscreen = false }: RoomScheduleProps) {
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
  const [students, setStudents] = useState<any[]>([])
  const [createDialogState, setCreateDialogState] = useState<CreateDialogState>({
    open: false,
    room: '',
    day: selectedDay,
    startTime: '08:00',
    endTime: '08:30',
  })

  // Detail modal state
  const [detailActivity, setDetailActivity] = useState<(ActivityData & { room: string }) | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

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

  // Fetch students for create dialog student picker
  useEffect(() => {
    studentService.getStudents()
      .then((result: any) => {
        const list = Array.isArray(result) ? result : result?.data || result || []
        setStudents(list)
      })
      .catch((err: unknown) => console.error('Error fetching students:', err))
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

  // Assign room to an unassigned activity
  const handleAssignRoom = useCallback(async (activity: any, room: string) => {
    try {
      if (activity.source === 'timeBlock' && activity.blockId) {
        if (activity.lessonId) {
          // Move a single lesson — use rescheduleLesson to avoid moving the whole block
          await roomScheduleService.rescheduleLesson({
            teacherId: activity.teacherId,
            sourceBlockId: activity.blockId,
            lessonId: activity.lessonId,
            targetRoom: room,
            targetDay: selectedDay,
            targetStartTime: activity.startTime,
            targetEndTime: activity.endTime,
          })
        } else {
          // No individual lesson — move the entire block
          await roomScheduleService.moveActivity({
            activityId: activity.id,
            source: 'timeBlock',
            targetRoom: room,
            targetStartTime: activity.startTime,
            targetEndTime: activity.endTime,
            teacherId: activity.teacherId,
            blockId: activity.blockId,
          })
        }
      }
      toast.success('הפעילות שובצה לחדר בהצלחה')
      loadSchedule()
    } catch {
      toast.error('שגיאה בשיבוץ חדר')
      throw new Error()
    }
  }, [loadSchedule, selectedDay])

  // Delete an unassigned activity
  const handleDeleteUnassigned = useCallback(async (activity: any) => {
    try {
      if (activity.source === 'timeBlock') {
        if (activity.lessonId && activity.blockId) {
          await roomScheduleService.deleteLessonFromBlock(
            activity.teacherId,
            activity.blockId,
            activity.lessonId,
          )
        } else if (activity.blockId) {
          await teacherScheduleService.deleteTimeBlock(
            activity.teacherId,
            activity.blockId,
          )
        }
      }
      toast.success('הפעילות נמחקה בהצלחה')
      loadSchedule()
    } catch {
      toast.error('שגיאה במחיקת הפעילות')
      throw new Error()
    }
  }, [loadSchedule])

  // Activity click handler -- open detail modal
  const handleActivityClick = useCallback((activity: ActivityData & { room: string }) => {
    setDetailActivity(activity)
    setDetailModalOpen(true)
  }, [])

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

    // Client-side room conflict pre-check -- block drop if target slot is occupied
    if (schedule) {
      const targetRoomData = schedule.rooms.find(r => r.room === targetRoom)
      if (targetRoomData) {
        const hasRoomConflict = targetRoomData.activities.some(a => {
          if (a.id === activity.id) return false  // skip self
          return doTimesOverlap(targetStartTime, targetEndTime, a.startTime, a.endTime)
        })
        if (hasRoomConflict) {
          toast.error('לא ניתן להעביר — התנגשות בחדר')
          return
        }
      }
    }

    // Determine if this is a lesson-level activity (blockId_N format)
    const isLessonLevel = activity.source === 'timeBlock' &&
      activity.id.includes('_') &&
      /^\d+$/.test(activity.id.split('_').pop() || '')

    if (isLessonLevel && activity.lessonId) {
      // Single-lesson reschedule -- skip optimistic update (new entity IDs created server-side)
      try {
        await roomScheduleService.rescheduleLesson({
          teacherId: activity.teacherId,
          sourceBlockId: extractBlockId(activity.id),
          lessonId: activity.lessonId,
          targetRoom,
          targetDay: selectedDay,
          targetStartTime,
          targetEndTime,
        })
        toast.success('\u05D4\u05E9\u05D9\u05E2\u05D5\u05E8 \u05D4\u05D5\u05E2\u05D1\u05E8 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4')
        silentReloadSchedule()
      } catch (err: any) {
        if (err?.code === 'CONFLICT' && err?.conflicts?.length > 0) {
          const conflictNames = err.conflicts
            .map((c: any) => `${c.teacherName} (${c.startTime}-${c.endTime})`)
            .join(', ')
          toast.error(`\u05D4\u05EA\u05E0\u05D2\u05E9\u05D5\u05EA \u05D1\u05D7\u05D3\u05E8: ${conflictNames}`)
        } else if (err?.message === 'Resource not found.') {
          toast.error('\u05D4\u05E9\u05D9\u05E2\u05D5\u05E8 \u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0')
        } else {
          toast.error('\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D4\u05E2\u05D1\u05E8\u05EA \u05D4\u05E9\u05D9\u05E2\u05D5\u05E8')
        }
        silentReloadSchedule()
      }
      return  // Exit early -- don't fall through to block-level move
    }

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
  }, [silentReloadSchedule, selectedDay, schedule])

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

  // Print handler -- relies on print:hidden classes on toolbar/filters and Layout.tsx no-print on sidebar/header
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // Tabular PDF export handler (activity rows -- existing format with week support)
  const handleExportTabularPDF = useCallback(async () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' })
      await registerHebrewFont(doc)
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
    } catch (err) {
      console.error('PDF tabular export error:', err)
      toast.error('שגיאה בייצוא PDF')
    }
  }, [selectedDay, filteredRooms, viewMode, weekData, filters, tenantRooms])

  // Grid-style visual PDF export handler (rooms x time slots, color-coded)
  const handleExportGridPDF = useCallback(async () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' })
      await registerHebrewFont(doc)
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
    } catch (err) {
      console.error('PDF grid export error:', err)
      toast.error('שגיאה בייצוא PDF')
    }
  }, [selectedDay, filteredRooms, viewMode, weekData, filters, tenantRooms])

  return (
    <div className={isFullscreen ? 'p-2 space-y-2 h-full flex flex-col' : 'flex flex-col gap-2 min-h-full relative p-6'}>
      {/* Compact header: title + day selector + view mode + actions */}
      {isFullscreen ? (
        <div className="flex items-center gap-2 print:hidden shrink-0">
          {viewMode === 'day' && (
            <DaySelector selectedDay={selectedDay} onDayChange={setSelectedDay} disabled={loading} />
          )}
        </div>
      ) : (
        <div className="print:hidden space-y-2">
          {/* Row 1: Title + Day selector + View mode */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white whitespace-nowrap">לוח חדרים</h1>
              {viewMode === 'day' && (
                <DaySelector
                  selectedDay={selectedDay}
                  onDayChange={setSelectedDay}
                  disabled={loading}
                />
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ScheduleToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onPrint={handlePrint}
                onExportGridPDF={handleExportGridPDF}
                onExportTabularPDF={handleExportTabularPDF}
              />
            </div>
          </div>

          {/* Row 2: Filters + Statistics inline summary (day mode only) */}
          {viewMode === 'day' && (
            <div className="flex items-center gap-3 relative z-10">
              <FilterBar filters={filters} onFiltersChange={setFilters} rooms={roomNames} />
            </div>
          )}
          {/* Row 3: Expandable room insights */}
          {viewMode === 'day' && (
            <SummaryBar
              rooms={filteredRooms}
              loading={loading}
            />
          )}
        </div>
      )}

      {/* Day view content */}
      {viewMode === 'day' && (
        <>

          {/* Room grid with drag-and-drop */}
          <div className={`print:overflow-visible print:max-h-none relative z-10 ${isFullscreen ? 'flex-1 min-h-0' : ''}`}>
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
                isFullscreen={isFullscreen}
                onActivityClick={handleActivityClick}
              />
              <DragOverlay>
                {activeActivity ? <DragOverlayContent activity={activeActivity} /> : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Unassigned activities (no room) */}
          <div className="mb-6 relative z-40">
            <UnassignedRow
              activities={schedule?.unassigned || []}
              rooms={[
                ...tenantRooms,
                // Also include rooms from the current schedule that aren't in tenant settings
                ...(schedule?.rooms || [])
                  .filter(r => !tenantRooms.some(tr => tr.name === r.room))
                  .map(r => ({ name: r.room, isActive: true })),
              ]}
              scheduleRooms={schedule?.rooms || []}
              onAssignRoom={handleAssignRoom}
              onDelete={handleDeleteUnassigned}
            />
          </div>

          {/* Create lesson dialog */}
          <CreateLessonDialog
            state={createDialogState}
            onOpenChange={(open) => setCreateDialogState((prev) => ({ ...prev, open }))}
            teachers={teachers}
            students={students}
            onCreated={handleLessonCreated}
            scheduleData={schedule}
          />

          {/* Activity detail modal */}
          <ActivityDetailModal
            activity={detailActivity}
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            onReschedule={() => { setDetailModalOpen(false); silentReloadSchedule() }}
            onDelete={() => { setDetailModalOpen(false); silentReloadSchedule() }}
            day={selectedDay}
            rooms={tenantRooms}
            scheduleData={schedule}
            getScheduleForDay={(d) => roomScheduleService.getRoomSchedule(d)}
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
