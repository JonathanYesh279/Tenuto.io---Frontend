import { useState, useEffect } from 'react'
import { SquaresFour as RoomIcon } from '@phosphor-icons/react'
import { roomScheduleService } from '../../../services/apiService'
import { VerticalAutoScroll } from '../../animations/VerticalAutoScroll'

interface RoomStatus {
  name: string
  isVacant: boolean
  currentActivity?: string
  vacantUntil?: string
  nextActivity?: string
}

/** Map JS getDay() (0=Sun) to room-schedule API day param (0=Sun..5=Fri) */
function getTodayDayIndex(): number {
  const jsDay = new Date().getDay() // 0=Sun, 6=Sat
  // API uses 0=Sun..5=Fri; Sat=6 has no schedule
  return jsDay
}

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function computeRoomStatuses(schedule: any): RoomStatus[] {
  if (!schedule?.rooms) return []

  const now = getCurrentTime()
  const nowMin = timeToMinutes(now)

  return schedule.rooms.map((room: any) => {
    const activities = (room.activities || [])
      .filter((a: any) => a.startTime && a.endTime)
      .sort((a: any, b: any) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

    // Find current activity (overlapping now)
    const currentAct = activities.find((a: any) =>
      timeToMinutes(a.startTime) <= nowMin && timeToMinutes(a.endTime) > nowMin
    )

    if (currentAct) {
      // Room is occupied — find when it becomes free
      // Check for consecutive activities after this one
      let freeAt = currentAct.endTime
      for (const a of activities) {
        if (timeToMinutes(a.startTime) <= timeToMinutes(freeAt) && timeToMinutes(a.endTime) > timeToMinutes(freeAt)) {
          freeAt = a.endTime
        }
      }
      return {
        name: room.room,
        isVacant: false,
        currentActivity: currentAct.label || currentAct.teacherName || 'תפוס',
        vacantUntil: freeAt,
      }
    }

    // Room is vacant — find next activity
    const nextAct = activities.find((a: any) => timeToMinutes(a.startTime) > nowMin)

    return {
      name: room.room,
      isVacant: true,
      nextActivity: nextAct
        ? `${nextAct.startTime} — ${nextAct.label || nextAct.teacherName || 'פעילות'}`
        : undefined,
    }
  }).sort((a: RoomStatus, b: RoomStatus) => {
    // Vacant rooms first, then occupied
    if (a.isVacant !== b.isVacant) return a.isVacant ? -1 : 1
    return a.name.localeCompare(b.name, 'he')
  })
}

export function VacantRoomsWidget() {
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadRoomData()
    // Refresh every 5 minutes
    const interval = setInterval(loadRoomData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadRoomData = async () => {
    try {
      const dayIndex = getTodayDayIndex()
      // No schedule on Sat (6)
      if (dayIndex === 6) {
        setRoomStatuses([])
        setLoading(false)
        return
      }
      const schedule = await roomScheduleService.getRoomSchedule(dayIndex)
      setRoomStatuses(computeRoomStatuses(schedule))
      setError(false)
    } catch (err) {
      console.error('Error loading room schedule:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const vacantCount = roomStatuses.filter(r => r.isVacant).length
  const now = getCurrentTime()

  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-6 rounded-md shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-sm">חדרים פנויים</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-6 rounded-md shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-sm">חדרים פנויים</h3>
        </div>
        <p className="text-center text-sm text-slate-400 py-8">שגיאה בטעינת נתוני חדרים</p>
      </div>
    )
  }

  return (
    <div className="relative bg-white dark:bg-sidebar-dark p-6 rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm">חדרים פנויים</h3>
        <span className="text-[10px] text-slate-400">{now} • {vacantCount}/{roomStatuses.length} פנויים</span>
      </div>

      {roomStatuses.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-8">אין נתוני חדרים</p>
      ) : (
        <VerticalAutoScroll speed={15} height={220} itemCount={roomStatuses.length}>
          <div className="space-y-3">
            {roomStatuses.map((room) => (
              <div
                key={room.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  room.isVacant
                    ? 'bg-emerald-50/60 dark:bg-emerald-900/10'
                    : 'bg-slate-50/60 dark:bg-slate-800/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  room.isVacant
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}>
                  <RoomIcon size={16} weight={room.isVacant ? 'fill' : 'regular'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold truncate">{room.name}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        room.isVacant ? 'bg-emerald-500' : 'bg-red-400'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                    {room.isVacant
                      ? room.nextActivity
                        ? `הבא: ${room.nextActivity}`
                        : 'פנוי כל היום'
                      : `${room.currentActivity} • פנוי מ-${room.vacantUntil}`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </VerticalAutoScroll>
      )}
    </div>
  )
}
