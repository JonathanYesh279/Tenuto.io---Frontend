import React, { useMemo } from 'react'
import { GlassStatCard } from '../ui/GlassStatCard'
import { ScrollReveal } from '../ui/ScrollReveal'

interface RehearsalStatsRowProps {
  rehearsals: Array<{
    date: string
    attendance?: {
      present: string[]
      absent: string[]
      late: string[]
    }
    orchestra?: {
      memberIds?: string[]
      members?: Array<{ _id: string }>
    }
    isActive?: boolean
  }>
}

export const RehearsalStatsRow: React.FC<RehearsalStatsRowProps> = ({ rehearsals }) => {
  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const total = rehearsals.length

    const completed = rehearsals.filter(r => {
      const rDate = new Date(r.date)
      rDate.setHours(0, 0, 0, 0)
      return rDate < today
    }).length

    const todayCount = rehearsals.filter(r => {
      return r.date.startsWith(todayStr)
    }).length

    let totalRate = 0
    let countWithData = 0
    rehearsals.forEach(r => {
      if (r.attendance && (r.attendance.present.length > 0 || r.attendance.absent.length > 0)) {
        const totalMembers = r.orchestra?.memberIds?.length || r.orchestra?.members?.length ||
          (r.attendance.present.length + r.attendance.absent.length + r.attendance.late.length)
        if (totalMembers > 0) {
          totalRate += (r.attendance.present.length / totalMembers) * 100
          countWithData++
        }
      }
    })
    const avgAttendance = countWithData > 0 ? Math.round(totalRate / countWithData) : 0

    return { total, completed, todayCount, avgAttendance }
  }, [rehearsals])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <ScrollReveal delay={0}>
        <GlassStatCard value={stats.total} label='סה"כ חזרות' size="sm" />
      </ScrollReveal>
      <ScrollReveal delay={0.08}>
        <GlassStatCard value={stats.completed} label="הושלמו" size="sm" />
      </ScrollReveal>
      <ScrollReveal delay={0.16}>
        <GlassStatCard value={stats.todayCount} label="היום" size="sm" />
      </ScrollReveal>
      <ScrollReveal delay={0.24}>
        <GlassStatCard
          value={stats.avgAttendance > 0 ? `${stats.avgAttendance}%` : '—'}
          label="נוכחות ממוצעת"
          size="sm"
        />
      </ScrollReveal>
    </div>
  )
}
