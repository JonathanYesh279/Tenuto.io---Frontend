import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import {
  Card,
  CardBody,
  Button as HeroButton,
  Chip,
} from '@heroui/react'
import { MapPin, Trash, CheckCircle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import {
  Menu,
  MenuTrigger,
  MenuPanel,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
} from '@/components/animate-ui/components/base/menu'
import { ACTIVITY_COLORS } from './ActivityCell'
import toast from 'react-hot-toast'

// ==================== Types ====================

interface UnassignedActivity {
  id: string
  source: 'timeBlock' | 'rehearsal' | 'theory'
  startTime: string
  endTime: string
  teacherName: string
  teacherId: string
  label: string
  activityType: string
  blockId?: string | null
  lessonId?: string | null
}

interface ScheduleRoom {
  room: string
  activities: Array<{
    startTime: string
    endTime: string
  }>
}

interface UnassignedRowProps {
  activities: UnassignedActivity[]
  rooms: Array<{ name: string; isActive: boolean }>
  scheduleRooms?: ScheduleRoom[]
  onAssignRoom: (activity: UnassignedActivity, room: string) => Promise<void>
  onDelete: (activity: UnassignedActivity) => Promise<void>
}

// ==================== Helpers ====================

function timeToMin(time: string): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function hasTimeConflict(
  activityStart: string,
  activityEnd: string,
  roomActivities: Array<{ startTime: string; endTime: string }>,
): boolean {
  const aStart = timeToMin(activityStart)
  const aEnd = timeToMin(activityEnd)
  return roomActivities.some(ra => {
    const rStart = timeToMin(ra.startTime)
    const rEnd = timeToMin(ra.endTime)
    return aStart < rEnd && aEnd > rStart
  })
}

// ==================== Room Picker Button ====================

function RoomPickerButton({
  room,
  available,
  selected,
  onClick,
}: {
  room: string
  available: boolean
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      disabled={!available}
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold text-right
        transition-colors duration-150
        ${!available
          ? 'bg-slate-50 text-slate-300 cursor-not-allowed line-through'
          : selected
            ? 'bg-primary/10 text-primary border-2 border-primary'
            : 'bg-white border border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
        }
      `}
      whileHover={available && !selected ? { scale: 1.03 } : {}}
      whileTap={available ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {selected && <CheckCircle size={14} weight="fill" className="text-primary shrink-0" />}
      <MapPin size={12} weight="duotone" className={available ? 'text-slate-400' : 'text-slate-200'} />
      <span>{room}</span>
      {!available && (
        <span className="text-[10px] font-normal text-red-400 mr-auto">תפוס</span>
      )}
    </motion.button>
  )
}

// ==================== Component ====================

export default function UnassignedRow({ activities, rooms, scheduleRooms = [], onAssignRoom, onDelete }: UnassignedRowProps) {
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [saving, setSaving] = useState(false)

  const activeRooms = rooms.filter(r => r.isActive)

  // Build availability map for the currently assigning activity
  const assigningActivity = assigningId ? activities.find(a => a.id === assigningId) : null
  const roomAvailability = useMemo(() => {
    if (!assigningActivity) return new Map<string, boolean>()
    const map = new Map<string, boolean>()
    for (const room of activeRooms) {
      const scheduleRoom = scheduleRooms.find(sr => sr.room === room.name)
      if (!scheduleRoom) {
        map.set(room.name, true)
      } else {
        map.set(room.name, !hasTimeConflict(assigningActivity.startTime, assigningActivity.endTime, scheduleRoom.activities))
      }
    }
    return map
  }, [assigningActivity, activeRooms, scheduleRooms])

  if (activities.length === 0) return null

  const handleAssign = async (activity: UnassignedActivity) => {
    if (!selectedRoom) {
      toast.error('בחר חדר')
      return
    }
    setSaving(true)
    try {
      await onAssignRoom(activity, selectedRoom)
      setAssigningId(null)
      setSelectedRoom('')
    } catch {
      // error handled by parent
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (activity: UnassignedActivity) => {
    setSaving(true)
    try {
      await onDelete(activity)
    } catch {
      // error handled by parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      shadow="none"
      classNames={{
        base: 'border border-red-300 rounded-card overflow-visible',
        body: 'p-4 overflow-visible',
      }}
    >
      <CardBody>
        {/* Header with count badge */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-red-600">(ללא חדר)</h3>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
            {activities.length}
          </span>
        </div>

        {/* Activity cards */}
        <div className="flex flex-wrap gap-2">
          {activities.map((activity) => {
            const colors = ACTIVITY_COLORS[activity.source] || ACTIVITY_COLORS.timeBlock
            const isAssigning = assigningId === activity.id

            if (isAssigning) {
              const availableCount = [...roomAvailability.values()].filter(Boolean).length
              return (
                <ActivityAssignCard
                  key={activity.id}
                  activity={activity}
                  activeRooms={activeRooms}
                  roomAvailability={roomAvailability}
                  availableCount={availableCount}
                  selectedRoom={selectedRoom}
                  saving={saving}
                  onSelectRoom={setSelectedRoom}
                  onAssign={() => handleAssign(activity)}
                  onCancel={() => { setAssigningId(null); setSelectedRoom('') }}
                />
              )
            }

            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                colors={colors}
                onAssign={() => { setAssigningId(activity.id); setSelectedRoom('') }}
                onDelete={() => handleDelete(activity)}
              />
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

// ==================== Activity Card with animate-ui Menu ====================

function ActivityCard({
  activity,
  colors,
  onAssign,
  onDelete,
}: {
  activity: UnassignedActivity
  colors: { bg: string; text: string; label: string }
  onAssign: () => void
  onDelete: () => void
}) {
  return (
    <Menu>
      <MenuTrigger
        nativeButton={false}
        render={
          <motion.div
            className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-card p-2.5 text-xs cursor-pointer ${colors.text} outline-none`}
            whileHover={{
              scale: 1.03,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderColor: 'rgb(252, 165, 165)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="font-bold">{activity.teacherName}</div>
            <div className="opacity-80">{activity.label}</div>
            <div className="text-slate-500 dark:text-slate-400 mt-0.5">
              {activity.startTime} - {activity.endTime}
            </div>
            <div className="mt-0.5">
              <span className={`inline-block px-1 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text}`}>
                {colors.label}
              </span>
            </div>
          </motion.div>
        }
      />
      <MenuPanel
        className="w-56 rounded-card p-1.5 [&_[data-slot=motion-highlight]]:!bg-transparent"
        side="top"
        sideOffset={6}
        align="start"
      >
        <MenuGroup>
          <MenuGroupLabel className="text-xs font-bold text-slate-500 px-2 py-1">פעולות</MenuGroupLabel>
          <MenuItem
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-800 font-semibold cursor-pointer border border-transparent transition-colors duration-200 hover:border-blue-400 data-[highlighted]:border-blue-400"
            onClick={onAssign}
          >
            <MapPin size={18} weight="duotone" className="text-blue-500" />
            <div className="flex flex-col">
              <span className="text-sm">שבץ חדר</span>
              <span className="text-[11px] text-slate-400 font-normal">שבץ פעילות לחדר</span>
            </div>
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            variant="destructive"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold cursor-pointer border border-transparent transition-colors duration-200 hover:border-red-400 data-[highlighted]:border-red-400"
            onClick={onDelete}
          >
            <Trash size={18} weight="duotone" className="text-red-400" />
            <div className="flex flex-col">
              <span className="text-sm">מחק</span>
              <span className="text-[11px] text-red-400 font-normal">מחק פעילות לצמיתות</span>
            </div>
          </MenuItem>
        </MenuGroup>
      </MenuPanel>
    </Menu>
  )
}

// ==================== Assign Room Card ====================

function ActivityAssignCard({
  activity,
  activeRooms,
  roomAvailability,
  availableCount,
  selectedRoom,
  saving,
  onSelectRoom,
  onAssign,
  onCancel,
}: {
  activity: UnassignedActivity
  activeRooms: Array<{ name: string; isActive: boolean }>
  roomAvailability: Map<string, boolean>
  availableCount: number
  selectedRoom: string
  saving: boolean
  onSelectRoom: (room: string) => void
  onAssign: () => void
  onCancel: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (containerRef.current) {
      const triggerRect = containerRef.current.getBoundingClientRect()
      const cardWidth = 384 // w-96
      const cardHeight = 350 // approximate card height
      // Find the main content boundary (sidebar starts after it)
      const mainContent = containerRef.current.closest('main') || containerRef.current.closest('[class*="flex-1"]')
      const maxRight = mainContent ? mainContent.getBoundingClientRect().right : window.innerWidth
      const minLeft = mainContent ? mainContent.getBoundingClientRect().left : 0

      // Horizontal: try right-aligned first (card extends left from trigger's right edge)
      let left = triggerRect.right - cardWidth
      if (left < minLeft) left = triggerRect.left
      if (left + cardWidth > maxRight) left = maxRight - cardWidth - 8

      // Vertical: position above trigger, but clamp to stay in viewport
      let top = triggerRect.top - cardHeight - 8
      if (top < 8) top = 8

      setCardPos({ top, left })
    }
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      {/* Invisible spacer to hold position in flex layout */}
      <div className="invisible w-28 h-20" />
      {/* Card positioned fixed to viewport, always within main content bounds */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed z-[60]"
        style={cardPos ? { top: cardPos.top, left: cardPos.left } : { visibility: 'hidden' as const }}
      >
      <Card
        shadow="lg"
        classNames={{
          base: 'border border-primary/30 rounded-card w-96',
          body: 'p-4',
        }}
      >
        <CardBody>
          {/* Activity info header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-base text-slate-800">{activity.teacherName}</div>
              <div className="text-xs text-slate-500">{activity.label}</div>
            </div>
            <Chip size="sm" variant="flat" classNames={{ base: 'bg-primary/10', content: 'text-primary text-xs font-bold' }}>
              {activity.startTime} - {activity.endTime}
            </Chip>
          </div>

          {/* Room selection */}
          <div className="text-xs font-bold text-slate-500 mb-2">
            בחר חדר פנוי ({availableCount}/{activeRooms.length})
          </div>
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
            {activeRooms.map((r) => {
              const available = roomAvailability.get(r.name) ?? true
              return (
                <RoomPickerButton
                  key={r.name}
                  room={r.name}
                  available={available}
                  selected={selectedRoom === r.name}
                  onClick={() => onSelectRoom(r.name)}
                />
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <HeroButton
              color="primary"
              size="sm"
              variant="solid"
              onPress={onAssign}
              isDisabled={!selectedRoom || saving}
              isLoading={saving}
              className="font-bold text-sm flex-1"
            >
              שבץ
            </HeroButton>
            <HeroButton
              color="default"
              size="sm"
              variant="bordered"
              onPress={onCancel}
              className="font-bold text-sm"
            >
              ביטול
            </HeroButton>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  </div>
  )
}
