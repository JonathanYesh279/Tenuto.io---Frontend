/**
 * Hours Summary Tab Component
 *
 * Displays weekly hours (ש"ש) breakdown for a teacher,
 * fetched from GET /hours-summary/teacher/:teacherId.
 */

import { useState, useEffect } from 'react'

import { Teacher } from '../../types'
import { hoursSummaryService } from '../../../../../services/apiService'
import { useAuth } from '../../../../../services/authContext.jsx'
import { ArrowsClockwiseIcon, BookOpenIcon, BriefcaseIcon, CarIcon, ClockIcon, HourglassIcon, MusicNotesIcon, PathIcon, StackIcon, UsersIcon, WarningCircleIcon } from '@phosphor-icons/react'

interface HoursSummaryTabProps {
  teacher: Teacher
  teacherId: string
}

interface HoursTotals {
  totalWeeklyHours: number
  individualLessons: number
  orchestraConducting: number
  theoryTeaching: number
  management: number
  accompaniment: number
  ensembleCoordination: number
  coordination: number
  breakTime: number
  travelTime: number
}

interface StudentBreakdown {
  studentName: string
  instrument: string
  weeklyMinutes: number
}

interface OrchestraBreakdown {
  name: string
  type: string
  weeklyMinutes: number
}

interface TheoryBreakdown {
  category: string
  dayOfWeek: string
  weeklyMinutes: number
}

interface HoursSummaryData {
  totals: HoursTotals
  breakdown: {
    students: StudentBreakdown[]
    orchestras: OrchestraBreakdown[]
    theory: TheoryBreakdown[]
  }
  calculatedAt: string
}

const HoursSummaryTab: React.FC<HoursSummaryTabProps> = ({ teacher, teacherId }) => {
  const { user } = useAuth()
  const [data, setData] = useState<HoursSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user && (
    user.role === 'admin' || user.role === 'מנהל' ||
    user.roles?.includes('admin') || user.roles?.includes('מנהל')
  )

  useEffect(() => {
    fetchHoursSummary()
  }, [teacherId])

  const fetchHoursSummary = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await hoursSummaryService.getTeacherSummary(teacherId)
      setData(result)
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes('404') || err.message === 'Resource not found.') {
        setData(null)
      } else {
        setError(err.message || 'שגיאה בטעינת נתוני שעות')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true)
      setError(null)
      await hoursSummaryService.calculateTeacher(teacherId)
      await fetchHoursSummary()
    } catch (err: any) {
      setError(err.message || 'שגיאה בחישוב מחדש')
    } finally {
      setIsRecalculating(false)
    }
  }

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} דק'`
    if (mins === 0) return `${hours} שע'`
    return `${hours}:${mins.toString().padStart(2, '0')} שע'`
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <WarningCircleIcon className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">שגיאה בטעינת נתונים</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchHoursSummary}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <ArrowsClockwiseIcon className="w-4 h-4" />
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  // Empty state — no data calculated yet
  if (!data) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClockIcon className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">טרם חושבו שעות</h3>
          <p className="text-gray-600 mb-4">
            נתוני השעות השבועיות עבור מורה זה טרם חושבו
          </p>
          {isAdmin && (
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              <ArrowsClockwiseIcon className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'מחשב...' : 'חשב שעות'}
            </button>
          )}
        </div>
      </div>
    )
  }

  const { totals, breakdown, calculatedAt } = data

  const categoryCards = [
    { label: 'שיעורים פרטניים', value: totals.individualLessons, icon: UsersIcon, color: 'blue' },
    { label: 'ניצוח תזמורות', value: totals.orchestraConducting, icon: MusicNotesIcon, color: 'purple' },
    { label: 'הוראת תיאוריה', value: totals.theoryTeaching, icon: BookOpenIcon, color: 'green' },
    { label: 'ניהול', value: totals.management, icon: BriefcaseIcon, color: 'amber' },
    { label: 'ליווי', value: totals.accompaniment, icon: StackIcon, color: 'pink' },
    { label: 'תיאום הרכבים', value: totals.ensembleCoordination, icon: StackIcon, color: 'indigo' },
    { label: 'ריכוז', value: totals.coordination, icon: PathIcon, color: 'blue' },
    { label: 'ביטול זמן', value: totals.breakTime, icon: HourglassIcon, color: 'gray' },
    { label: 'נסיעות', value: totals.travelTime, icon: CarIcon, color: 'gray' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }

  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-green-500',
    amber: 'text-amber-500',
    pink: 'text-pink-500',
    indigo: 'text-indigo-500',
    gray: 'text-gray-500',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">סיכום שעות שבועיות (ש"ש)</h2>
        <div className="flex items-center gap-3">
          {calculatedAt && (
            <span className="text-xs text-gray-500">
              עדכון אחרון: {new Date(calculatedAt).toLocaleDateString('he-IL')} {new Date(calculatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {isAdmin && (
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-muted text-foreground border border-border rounded hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <ArrowsClockwiseIcon className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'מחשב...' : 'חשב מחדש'}
            </button>
          )}
        </div>
      </div>

      {/* Total hours — big card */}
      <div className="bg-primary rounded p-6 text-primary-foreground">
        <div className="flex items-center gap-3 mb-2">
          <ClockIcon className="w-6 h-6 opacity-80" />
          <span className="opacity-80 font-medium">סה"כ ש"ש</span>
        </div>
        <div className="text-4xl font-bold">{totals.totalWeeklyHours}</div>
        <div className="opacity-70 mt-1">שעות שבועיות</div>
      </div>

      {/* Category breakdown — grid of small cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categoryCards.filter(cat => cat.value > 0).map((cat) => {
          const Icon = cat.icon
          return (
            <div
              key={cat.label}
              className={`rounded border p-4 ${colorMap[cat.color]}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${iconColorMap[cat.color]}`} />
                <span className="text-sm font-medium">{cat.label}</span>
              </div>
              <div className="text-2xl font-bold">{cat.value}</div>
            </div>
          )
        })}
      </div>

      {/* Student breakdown table */}
      {breakdown.students?.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-blue-500" />
            פירוט תלמידים ({breakdown.students.length})
          </h3>
          <div className="bg-background border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">תלמיד</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">כלי</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">דקות שבועיות</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">ש"ש</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.students.map((student, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{student.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{student.instrument}</td>
                    <td className="px-4 py-3 text-gray-600">{student.weeklyMinutes}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatMinutesToHours(student.weeklyMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orchestra breakdown */}
      {breakdown.orchestras?.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MusicNotesIcon className="w-4 h-4 text-purple-500" />
            פירוט תזמורות ({breakdown.orchestras.length})
          </h3>
          <div className="bg-background border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">תזמורת</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">סוג</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">דקות שבועיות</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">ש"ש</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.orchestras.map((orch, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{orch.name}</td>
                    <td className="px-4 py-3 text-gray-600">{orch.type}</td>
                    <td className="px-4 py-3 text-gray-600">{orch.weeklyMinutes}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatMinutesToHours(orch.weeklyMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Theory breakdown */}
      {breakdown.theory?.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4 text-green-500" />
            פירוט תיאוריה ({breakdown.theory.length})
          </h3>
          <div className="bg-background border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">קטגוריה</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">יום</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">דקות שבועיות</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">ש"ש</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.theory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{item.category}</td>
                    <td className="px-4 py-3 text-gray-600">{item.dayOfWeek}</td>
                    <td className="px-4 py-3 text-gray-600">{item.weeklyMinutes}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatMinutesToHours(item.weeklyMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default HoursSummaryTab
