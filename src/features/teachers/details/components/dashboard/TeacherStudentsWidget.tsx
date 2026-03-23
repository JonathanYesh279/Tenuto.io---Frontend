/**
 * TeacherStudentsWidget - Scrolling student list for Teacher Dashboard.
 *
 * Displays assigned students in a vertically scrolling card list,
 * matching the StudentAgendaWidget design from the student dashboard.
 */

import { useRef, useCallback } from 'react'
import { Chip } from '@heroui/react'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  MusicNote as MusicNoteIcon,
  GraduationCap as GraduationCapIcon,
} from '@phosphor-icons/react'
import { VerticalAutoScroll } from '@/components/animations/VerticalAutoScroll'
import { useNavigate } from 'react-router-dom'

const GLASS_CARD_STYLE = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,210,230,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow:
    '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
} as const

interface StudentEntry {
  _id: string
  name: string
  instrument: string
  class: string
  hasActiveLessons: boolean
}

interface TeacherStudentsWidgetProps {
  students: StudentEntry[]
  isLoading: boolean
}

export function TeacherStudentsWidget({ students, isLoading }: TeacherStudentsWidgetProps) {
  const navigate = useNavigate()

  // Hooks must be before any early returns
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const DRAG_THRESHOLD = 8

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleCardClick = useCallback((studentId: string, e: React.MouseEvent) => {
    if (!pointerStart.current) return
    const dx = Math.abs(e.clientX - pointerStart.current.x)
    const dy = Math.abs(e.clientY - pointerStart.current.y)
    pointerStart.current = null
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      navigate(`/students/${studentId}`)
    }
  }, [navigate])

  if (isLoading) {
    return (
      <div className="rounded-card p-5 border border-border shadow-1" style={GLASS_CARD_STYLE}>
        <h3 className="font-bold text-sm text-foreground mb-4">תלמידים</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="rounded-card p-5 border border-border shadow-1" style={GLASS_CARD_STYLE}>
        <h3 className="font-bold text-sm text-foreground mb-4">תלמידים</h3>
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <UserIcon className="w-8 h-8 mb-2 opacity-40" />
          <span className="text-xs">אין תלמידים משויכים</span>
        </div>
      </div>
    )
  }

  const cards = students.map((student, idx) => (
    <motion.div
      key={student._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.05 }}
      onPointerDown={handlePointerDown}
      onClick={(e) => handleCardClick(student._id, e)}
      className="rounded-xl bg-blue-50/50 border border-blue-100/50 p-3 cursor-pointer hover:bg-blue-50/80 transition-colors select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-foreground/80 font-medium text-xs block truncate">{student.name}</span>
          <div className="flex items-center gap-1.5 mt-1">
            {student.instrument && (
              <div className="flex items-center gap-0.5 text-blue-600/70">
                <MusicNoteIcon className="w-3 h-3" />
                <span className="text-[10px]">{student.instrument}</span>
              </div>
            )}
            {student.class && (
              <div className="flex items-center gap-0.5 text-blue-600/70">
                <GraduationCapIcon className="w-3 h-3" />
                <span className="text-[10px]">כיתה {student.class}</span>
              </div>
            )}
          </div>
        </div>
        {student.hasActiveLessons && (
          <Chip size="sm" variant="flat" color="success" className="text-[10px]">שיעור פעיל</Chip>
        )}
      </div>
    </motion.div>
  ))

  return (
    <div
      className="rounded-card p-4 border border-border shadow-1 overflow-hidden flex flex-col h-full"
      style={GLASS_CARD_STYLE}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-foreground">תלמידים</h3>
        <Chip size="sm" variant="flat" color="default">{students.length}</Chip>
      </div>

      <VerticalAutoScroll speed={12} className="flex-1 min-h-0" itemCount={students.length} minItems={4}>
        <div className="space-y-2 pb-2">
          {cards}
        </div>
      </VerticalAutoScroll>
    </div>
  )
}
