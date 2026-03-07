import { useNavigate } from 'react-router-dom'
import StatsCard from '../ui/StatsCard'
import {
  UsersIcon,
  GraduationCapIcon,
  ClockIcon,
  MusicNotesIcon,
  LinkIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react'

interface KpiTrend {
  delta: number
  direction: 'up' | 'down' | 'stable'
}

interface Kpi {
  id: string
  label: string
  value: number
  unit: 'count' | 'hours' | 'percentage' | 'score'
  trend: KpiTrend | null
  drillTo: string
}

interface Alert {
  id: string
  type: string
  severity: 'warning' | 'info'
  message: string
  drillTo: string
}

interface KpiDashboardProps {
  kpis: Kpi[]
  alerts: Alert[]
}

const UNIT_ICON_MAP: Record<string, React.ReactNode> = {
  activeStudents: <UsersIcon size={24} weight="duotone" />,
  activeTeachers: <GraduationCapIcon size={24} weight="duotone" />,
  totalWeeklyHours: <ClockIcon size={24} weight="duotone" />,
  orchestraCount: <MusicNotesIcon size={24} weight="duotone" />,
  assignmentRate: <LinkIcon size={24} weight="duotone" />,
  dataQualityScore: <ShieldCheckIcon size={24} weight="duotone" />,
}

const KPI_COLOR_MAP: Record<string, 'students' | 'teachers' | 'orchestras' | 'blue' | 'green' | 'teal'> = {
  activeStudents: 'students',
  activeTeachers: 'teachers',
  totalWeeklyHours: 'blue',
  orchestraCount: 'orchestras',
  assignmentRate: 'green',
  dataQualityScore: 'teal',
}

function formatKpiValue(value: number, unit: string): string {
  switch (unit) {
    case 'hours':
      return `${value.toLocaleString('he-IL')} ש"ע`
    case 'percentage':
      return `${value}%`
    case 'score':
      return `${value}/100`
    default:
      return value.toLocaleString('he-IL')
  }
}

export default function KpiDashboard({ kpis, alerts }: KpiDashboardProps) {
  const navigate = useNavigate()

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            onClick={() => navigate(`/reports/${kpi.drillTo}`)}
            className="cursor-pointer"
          >
            <StatsCard
              title={kpi.label}
              value={formatKpiValue(kpi.value, kpi.unit)}
              icon={UNIT_ICON_MAP[kpi.id] || <UsersIcon size={24} weight="duotone" />}
              color={KPI_COLOR_MAP[kpi.id] || 'blue'}
              trend={
                kpi.trend && kpi.trend.direction !== 'stable'
                  ? {
                      value: Math.abs(kpi.trend.delta),
                      label: 'לעומת שנה קודמת',
                      direction: kpi.trend.direction as 'up' | 'down',
                    }
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mt-6 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => navigate(`/reports/${alert.drillTo}`)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                alert.severity === 'warning'
                  ? 'bg-amber-50 border-r-4 border-amber-400 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30'
                  : 'bg-blue-50 border-r-4 border-blue-400 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  alert.severity === 'warning'
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}
              >
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
