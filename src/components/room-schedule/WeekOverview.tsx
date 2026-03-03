import { useMemo } from 'react'
import WeekMiniGrid from './WeekMiniGrid'
import { computeRoomUtilization, DAY_NAMES, TOTAL_SLOTS } from './utils'
import { cn } from '@/lib/utils'

// ==================== Types ====================

/** Local interface to avoid circular import with RoomSchedule.tsx */
interface RoomScheduleDay {
  rooms: Array<{
    room: string
    activities: Array<{
      source: 'timeBlock' | 'rehearsal' | 'theory'
      startTime: string
      endTime: string
      teacherName: string
      label: string
      hasConflict: boolean
    }>
  }>
}

interface WeekOverviewProps {
  weekData: RoomScheduleDay[] | null
  tenantRooms: Array<{ name: string; isActive: boolean }>
  loading: boolean
}

// ==================== Component ====================

export default function WeekOverview({ weekData, tenantRooms, loading }: WeekOverviewProps) {
  // Collect all unique room names from week data + active tenant rooms
  const allRooms = useMemo(() => {
    const names = new Set<string>()
    if (weekData) {
      for (const day of weekData) {
        for (const room of day.rooms || []) {
          names.add(room.room)
        }
      }
    }
    for (const tr of tenantRooms) {
      if (tr.isActive) names.add(tr.name)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'he'))
  }, [weekData, tenantRooms])

  // Compute utilization per room
  const utilization = useMemo(() => {
    const map = new Map<string, number>()
    if (!weekData) return map
    for (const roomName of allRooms) {
      map.set(roomName, computeRoomUtilization(roomName, weekData, TOTAL_SLOTS))
    }
    return map
  }, [weekData, allRooms])

  // Loading state
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div
          className="grid"
          style={{ gridTemplateColumns: '120px repeat(6, 1fr) 80px' }}
        >
          {/* Skeleton header */}
          <div className="bg-gray-50 border-b border-l h-10" />
          {DAY_NAMES.map((_, i) => (
            <div key={i} className="bg-gray-50 border-b border-l h-10 animate-pulse" />
          ))}
          <div className="bg-gray-50 border-b border-l h-10" />

          {/* Skeleton rows */}
          {Array.from({ length: 4 }).map((_, rowIdx) => (
            <div key={rowIdx} className="contents">
              <div className="bg-gray-50 border-b border-l h-12 px-3 py-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              {DAY_NAMES.map((_, colIdx) => (
                <div key={colIdx} className="border-b border-l h-12 animate-pulse" />
              ))}
              <div className="border-b border-l h-12 px-2 py-3">
                <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Null state -- parent handles when weekData is null
  if (!weekData) return null

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <div
        className="grid"
        style={{ gridTemplateColumns: '120px repeat(6, 1fr) 80px' }}
      >
        {/* ====== Header Row ====== */}
        <div className="bg-gray-50 border-b border-l p-2 text-sm font-medium text-gray-500">
          חדר
        </div>
        {DAY_NAMES.map((dayName) => (
          <div
            key={dayName}
            className="bg-gray-50 border-b border-l p-2 text-sm font-medium text-gray-500 text-center"
          >
            {dayName}
          </div>
        ))}
        <div className="bg-gray-50 border-b border-l p-2 text-sm font-medium text-gray-500 text-center">
          ניצולת
        </div>

        {/* ====== Room Rows ====== */}
        {allRooms.map((roomName) => {
          const pct = utilization.get(roomName) || 0
          const barColor = pct >= 70 ? 'bg-red-400' : pct >= 30 ? 'bg-yellow-400' : 'bg-green-400'

          return (
            <div key={roomName} className="contents">
              {/* Room name cell */}
              <div className="bg-white border-b border-l px-3 py-2 flex items-center sticky right-0 z-10">
                <span className="text-sm font-medium truncate">{roomName}</span>
              </div>

              {/* 6 day cells */}
              {DAY_NAMES.map((_, dayIdx) => {
                const dayData = weekData[dayIdx]
                const roomData = dayData?.rooms?.find((r) => r.room === roomName)
                return (
                  <WeekMiniGrid
                    key={dayIdx}
                    activities={roomData?.activities || []}
                  />
                )
              })}

              {/* Utilization cell */}
              <div className="border-b border-l px-2 py-2 flex items-center gap-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-left">{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
