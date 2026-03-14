import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  UsersIcon,
  ChartBarIcon,
  WarningIcon,
  CalendarIcon,
  MusicNoteIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CaretLeftIcon,
} from '@phosphor-icons/react'
import {
  Table as HeroTable,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Button as HeroButton,
  Chip,
} from '@heroui/react'
import { GlassStatCard } from '../components/ui/GlassStatCard'
import { GlassSelect } from '../components/ui/GlassSelect'
import { SearchInput } from '../components/ui/SearchInput'
import { Badge } from '../components/ui/badge'
import AttendanceManager from '../components/AttendanceManager'
import { BarChart } from '../components/charts/HebrewCharts'
import { TableSkeleton } from '../components/feedback/Skeleton'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'
import { attendanceAlertService, rehearsalService, orchestraService } from '../services/apiService'

// Types for dashboard API response
interface OrchestraStats {
  orchestraId: string
  orchestraName: string
  conductorName: string
  totalRehearsals: number
  memberCount: number
  averageAttendanceRate: number
  flaggedStudentCount: number
}

interface MonthlyTrend {
  month: string
  totalSessions: number
  attendanceRate: number
}

interface FlaggedStudent {
  studentId: string
  studentName: string
  flags: Array<{ reason: string; value: number }>
  attendanceRate: number
  totalRehearsals: number
  consecutiveAbsences: number
  orchestraName: string
  orchestraId: string
}

interface DashboardSummary {
  totalOrchestras: number
  totalStudentsTracked: number
  overallAttendanceRate: number
  totalFlagged: number
}

interface DashboardData {
  perOrchestra: OrchestraStats[]
  monthlyTrends: MonthlyTrend[]
  flaggedStudents: FlaggedStudent[]
  summary: DashboardSummary
}

type ActiveTab = 'overview' | 'flagged' | 'trends'

// Hebrew month names for chart labels
const HEBREW_MONTHS: Record<string, string> = {
  '01': 'ינואר', '02': 'פברואר', '03': 'מרץ', '04': 'אפריל',
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוגוסט',
  '09': 'ספטמבר', '10': 'אוקטובר', '11': 'נובמבר', '12': 'דצמבר',
}

function formatMonthLabel(month: string): string {
  // month format: "2026-03" or similar
  const parts = month.split('-')
  if (parts.length >= 2) {
    return HEBREW_MONTHS[parts[1]] || month
  }
  return month
}

function getAttendanceRateColor(rate: number): string {
  if (rate >= 80) return '#10b981' // green
  if (rate >= 60) return '#f59e0b' // yellow
  return '#ef4444' // red
}

function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 3)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export default function AttendanceManagement() {
  // Core data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [orchestraFilter, setOrchestraFilter] = useState('')
  const [dateRange, setDateRange] = useState(getDefaultDateRange)
  const [searchQuery, setSearchQuery] = useState('')

  // Tab navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  // Drill-down state
  const [selectedOrchestra, setSelectedOrchestra] = useState<string | null>(null)
  const [selectedOrchestraName, setSelectedOrchestraName] = useState('')
  const [orchestraRehearsals, setOrchestraRehearsals] = useState<any[]>([])
  const [rehearsalsLoading, setRehearsalsLoading] = useState(false)

  // AttendanceManager modal
  const [selectedRehearsal, setSelectedRehearsal] = useState<any>(null)
  const [showAttendanceManager, setShowAttendanceManager] = useState(false)

  // Pagination
  const [orchestraPage, setOrchestraPage] = useState(1)
  const [flaggedPage, setFlaggedPage] = useState(1)
  const ROWS_PER_PAGE = 10

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await attendanceAlertService.getDashboard({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      setDashboardData(data)
    } catch (err: any) {
      console.error('Error loading attendance dashboard:', err)
      setError(err.message || 'שגיאה בטעינת נתוני נוכחות')
    } finally {
      setLoading(false)
    }
  }, [dateRange.startDate, dateRange.endDate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // Load rehearsals for drill-down
  const loadRehearsals = useCallback(async (orchestraId: string) => {
    try {
      setRehearsalsLoading(true)
      const rehearsals = await rehearsalService.getOrchestraRehearsals(orchestraId)
      // Sort: upcoming/today first (ascending), then past (descending)
      const now = new Date().setHours(0, 0, 0, 0)
      const sorted = (rehearsals || []).sort((a: any, b: any) => {
        const aTime = new Date(a.date).getTime()
        const bTime = new Date(b.date).getTime()
        const aUpcoming = aTime >= now
        const bUpcoming = bTime >= now
        // Upcoming before past
        if (aUpcoming && !bUpcoming) return -1
        if (!aUpcoming && bUpcoming) return 1
        // Within upcoming: soonest first (ascending)
        if (aUpcoming && bUpcoming) return aTime - bTime
        // Within past: most recent first (descending)
        return bTime - aTime
      })
      setOrchestraRehearsals(sorted)
    } catch (err) {
      console.error('Error loading rehearsals:', err)
      setOrchestraRehearsals([])
    } finally {
      setRehearsalsLoading(false)
    }
  }, [])

  // Handle drill-down into orchestra
  const handleDrillDown = useCallback((orchestraId: string, orchestraName: string) => {
    setSelectedOrchestra(orchestraId)
    setSelectedOrchestraName(orchestraName)
    loadRehearsals(orchestraId)
  }, [loadRehearsals])

  // Handle back from drill-down
  const handleBackFromDrillDown = useCallback(() => {
    setSelectedOrchestra(null)
    setSelectedOrchestraName('')
    setOrchestraRehearsals([])
  }, [])

  // Open AttendanceManager for a rehearsal
  const handleOpenAttendance = useCallback(async (rehearsal: any) => {
    try {
      // Fetch orchestra data to get members (required by AttendanceManager)
      const orchestraData = await orchestraService.getOrchestra(rehearsal.groupId || selectedOrchestra)
      const enrichedRehearsal = {
        ...rehearsal,
        orchestra: orchestraData,
      }
      setSelectedRehearsal(enrichedRehearsal)
      setShowAttendanceManager(true)
    } catch (err) {
      console.error('Error loading orchestra data for attendance:', err)
    }
  }, [selectedOrchestra])

  // Filtered per-orchestra data
  const filteredOrchestras = useMemo(() => {
    if (!dashboardData?.perOrchestra) return []
    let filtered = dashboardData.perOrchestra
    if (orchestraFilter) {
      filtered = filtered.filter(o => o.orchestraId === orchestraFilter)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o =>
        o.orchestraName.toLowerCase().includes(query) ||
        o.conductorName?.toLowerCase().includes(query)
      )
    }
    return filtered
  }, [dashboardData?.perOrchestra, orchestraFilter, searchQuery])

  // Paginated orchestras
  const orchestraPages = Math.ceil(filteredOrchestras.length / ROWS_PER_PAGE)
  const paginatedOrchestras = useMemo(() => {
    const start = (orchestraPage - 1) * ROWS_PER_PAGE
    return filteredOrchestras.slice(start, start + ROWS_PER_PAGE)
  }, [filteredOrchestras, orchestraPage])

  // Filtered flagged students
  const filteredFlagged = useMemo(() => {
    if (!dashboardData?.flaggedStudents) return []
    let filtered = dashboardData.flaggedStudents
    if (orchestraFilter) {
      filtered = filtered.filter(s => s.orchestraId === orchestraFilter)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.studentName.toLowerCase().includes(query) ||
        s.orchestraName.toLowerCase().includes(query)
      )
    }
    return filtered
  }, [dashboardData?.flaggedStudents, orchestraFilter, searchQuery])

  // Paginated flagged students
  const flaggedPages = Math.ceil(filteredFlagged.length / ROWS_PER_PAGE)
  const paginatedFlagged = useMemo(() => {
    const start = (flaggedPage - 1) * ROWS_PER_PAGE
    return filteredFlagged.slice(start, start + ROWS_PER_PAGE)
  }, [filteredFlagged, flaggedPage])

  // Chart data for trends
  const chartData = useMemo(() => {
    if (!dashboardData?.monthlyTrends) return []
    return dashboardData.monthlyTrends.map(t => ({
      label: formatMonthLabel(t.month),
      value: Math.round(t.attendanceRate),
      color: getAttendanceRateColor(t.attendanceRate),
    }))
  }, [dashboardData?.monthlyTrends])

  // Reset pagination when filters change
  useEffect(() => { setOrchestraPage(1) }, [filteredOrchestras.length])
  useEffect(() => { setFlaggedPage(1) }, [filteredFlagged.length])

  // Orchestra filter options
  const orchestraOptions = useMemo(() => {
    if (!dashboardData?.perOrchestra) return []
    return dashboardData.perOrchestra.map(o => ({
      value: o.orchestraId,
      label: o.orchestraName,
    }))
  }, [dashboardData?.perOrchestra])

  const summary = dashboardData?.summary

  // Loading state
  if (loading) {
    return (
      <div className="animate-fade-in">
        <TableSkeleton rows={5} cols={4} />
      </div>
    )
  }

  // Error state
  if (error && !dashboardData) {
    return <ErrorState message={error} onRetry={loadDashboard} />
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">ניהול נוכחות</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">מעקב נוכחות, התראות וסטטיסטיקות לכלל התזמורות</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassStatCard
          value={summary?.overallAttendanceRate != null ? `${summary.overallAttendanceRate}%` : '--'}
          label="שיעור נוכחות כללי"
          size="sm"
        />
        <GlassStatCard
          value={summary?.totalOrchestras ?? 0}
          label="תזמורות פעילות"
          size="sm"
        />
        <GlassStatCard
          value={orchestraFilter || searchQuery ? filteredFlagged.length : (summary?.totalFlagged ?? 0)}
          label="תלמידים בסיכון"
          size="sm"
          valueClassName={(orchestraFilter || searchQuery ? filteredFlagged.length : (summary?.totalFlagged ?? 0)) > 0 ? 'text-red-600' : undefined}
        />
        <GlassStatCard
          value={summary?.totalStudentsTracked ?? 0}
          label="תלמידים במעקב"
          size="sm"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MusicNoteIcon size={14} weight="regular" />
          סקירת תזמורות
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
            activeTab === 'flagged'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <WarningIcon size={14} weight="regular" />
          תלמידים בסיכון
          {filteredFlagged.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-red-500 text-white">
              {filteredFlagged.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
            activeTab === 'trends'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ChartBarIcon size={14} weight="regular" />
          מגמות חודשיות
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap px-1">
        <div className="w-64 flex-none">
          <SearchInput
            value={searchQuery}
            onChange={(value: string) => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            placeholder="חיפוש..."
          />
        </div>
        <GlassSelect
          value={orchestraFilter || '__all__'}
          onValueChange={(v: string) => setOrchestraFilter(v === '__all__' ? '' : v)}
          placeholder="כל התזמורות"
          options={[
            { value: '__all__', label: 'כל התזמורות' },
            ...orchestraOptions,
          ]}
        />
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          className="border border-border rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-foreground"
        />
        <span className="text-sm text-muted-foreground">עד</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          className="border border-border rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-foreground"
        />
        <span className="text-xs font-medium text-slate-400 mr-auto">
          {activeTab === 'overview' ? `${filteredOrchestras.length} תזמורות` :
           activeTab === 'flagged' ? `${filteredFlagged.length} תלמידים` : ''}
        </span>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && !selectedOrchestra && (
        <>
          {filteredOrchestras.length === 0 ? (
            <EmptyState
              title="אין נתוני נוכחות"
              description="לא נמצאו נתוני נוכחות לתקופה שנבחרה"
              icon={<CalendarIcon size={48} weight="regular" />}
            />
          ) : (
            <HeroTable
              aria-label="טבלת נוכחות תזמורות"
              isHeaderSticky
              bottomContent={
                orchestraPages > 1 ? (
                  <div className="flex w-full justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="primary"
                      page={orchestraPage}
                      total={orchestraPages}
                      onChange={setOrchestraPage}
                    />
                  </div>
                ) : null
              }
              bottomContentPlacement="outside"
              classNames={{
                base: 'animate-table-rows',
                wrapper: 'bg-transparent shadow-none',
                th: 'bg-default-100 text-default-600',
                thead: '[&>tr]:border-b-0',
                tr: 'transition-colors duration-150 hover:bg-primary/5',
                td: 'py-3',
              }}
            >
              <TableHeader>
                <TableColumn key="name">תזמורת</TableColumn>
                <TableColumn key="conductor">מנצח</TableColumn>
                <TableColumn key="rehearsals" align="center">חזרות</TableColumn>
                <TableColumn key="members" align="center">חברים</TableColumn>
                <TableColumn key="rate" align="center">שיעור נוכחות</TableColumn>
                <TableColumn key="flagged" align="center">בסיכון</TableColumn>
                <TableColumn key="actions" align="end">פעולות</TableColumn>
              </TableHeader>
              <TableBody items={paginatedOrchestras} emptyContent="אין תזמורות להצגה">
                {(item: OrchestraStats) => (
                  <TableRow key={item.orchestraId}>
                    {(columnKey) => {
                      switch (columnKey) {
                        case 'name':
                          return (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orchestras-bg text-orchestras-fg flex items-center justify-center flex-shrink-0">
                                  <MusicNoteIcon size={16} weight="regular" />
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white">{item.orchestraName}</span>
                              </div>
                            </TableCell>
                          )
                        case 'conductor':
                          return <TableCell><span className="text-sm text-slate-600">{item.conductorName || '--'}</span></TableCell>
                        case 'rehearsals':
                          return <TableCell><span className="text-sm">{item.totalRehearsals}</span></TableCell>
                        case 'members':
                          return <TableCell><span className="text-sm">{item.memberCount}</span></TableCell>
                        case 'rate': {
                          const rate = item.averageAttendanceRate
                          return (
                            <TableCell>
                              <Chip
                                size="sm"
                                variant="flat"
                                style={{
                                  backgroundColor: `${getAttendanceRateColor(rate)}20`,
                                  color: getAttendanceRateColor(rate),
                                }}
                                classNames={{ content: 'text-xs font-bold' }}
                              >
                                {Math.round(rate)}%
                              </Chip>
                            </TableCell>
                          )
                        }
                        case 'flagged':
                          return (
                            <TableCell>
                              {item.flaggedStudentCount > 0 ? (
                                <Chip size="sm" color="danger" variant="flat" classNames={{ content: 'text-xs font-bold' }}>
                                  {item.flaggedStudentCount}
                                </Chip>
                              ) : (
                                <span className="text-sm text-slate-400">0</span>
                              )}
                            </TableCell>
                          )
                        case 'actions':
                          return (
                            <TableCell>
                              <HeroButton
                                size="sm"
                                variant="light"
                                isIconOnly
                                onPress={() => handleDrillDown(item.orchestraId, item.orchestraName)}
                                aria-label={`פירוט ${item.orchestraName}`}
                              >
                                <CaretLeftIcon size={16} weight="bold" />
                              </HeroButton>
                            </TableCell>
                          )
                        default:
                          return <TableCell>--</TableCell>
                      }
                    }}
                  </TableRow>
                )}
              </TableBody>
            </HeroTable>
          )}
        </>
      )}

      {/* Orchestra Drill-Down: Rehearsals List */}
      {activeTab === 'overview' && selectedOrchestra && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <HeroButton
              size="sm"
              variant="light"
              onPress={handleBackFromDrillDown}
              startContent={<CaretRightIcon size={14} weight="bold" />}
            >
              חזרה לרשימה
            </HeroButton>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedOrchestraName}</h2>
          </div>

          {rehearsalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner color="primary" label="טוען חזרות..." />
            </div>
          ) : orchestraRehearsals.length === 0 ? (
            <EmptyState
              title="אין חזרות"
              description="לא נמצאו חזרות לתזמורת זו"
              icon={<CalendarIcon size={48} weight="regular" />}
            />
          ) : (
            <div className="space-y-2">
              {orchestraRehearsals.map((rehearsal: any) => {
                const date = new Date(rehearsal.date)
                const dateStr = date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                const present = rehearsal.attendanceCount?.present ?? '?'
                const total = rehearsal.attendanceCount?.total ?? '?'
                const hasAttendance = rehearsal.attendanceCount?.total > 0

                return (
                  <div
                    key={rehearsal._id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <CalendarIcon size={20} weight="regular" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{dateStr}</div>
                        <div className="text-xs text-slate-500">
                          {rehearsal.startTime} - {rehearsal.endTime}
                          {rehearsal.location && ` | ${rehearsal.location}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasAttendance ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon size={16} weight="fill" className="text-green-500" />
                          <span className="text-sm font-medium text-slate-700">{present}/{total}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <ClockIcon size={16} weight="regular" className="text-slate-400" />
                          <span className="text-xs text-slate-400">לא סומן</span>
                        </div>
                      )}
                      <HeroButton
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleOpenAttendance(rehearsal)}
                      >
                        סמן נוכחות
                      </HeroButton>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Flagged Students Tab */}
      {activeTab === 'flagged' && (
        <>
          {filteredFlagged.length === 0 ? (
            <EmptyState
              title="אין תלמידים בסיכון"
              description="לא נמצאו תלמידים עם התראות נוכחות לתקופה שנבחרה"
              icon={<CheckCircleIcon size={48} weight="regular" />}
            />
          ) : (
            <HeroTable
              aria-label="טבלת תלמידים בסיכון"
              isHeaderSticky
              bottomContent={
                flaggedPages > 1 ? (
                  <div className="flex w-full justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="primary"
                      page={flaggedPage}
                      total={flaggedPages}
                      onChange={setFlaggedPage}
                    />
                  </div>
                ) : null
              }
              bottomContentPlacement="outside"
              classNames={{
                base: 'animate-table-rows',
                wrapper: 'bg-transparent shadow-none',
                th: 'bg-default-100 text-default-600',
                thead: '[&>tr]:border-b-0',
                tr: 'transition-colors duration-150 hover:bg-primary/5',
                td: 'py-3',
              }}
            >
              <TableHeader>
                <TableColumn key="student">תלמיד</TableColumn>
                <TableColumn key="orchestra">תזמורת</TableColumn>
                <TableColumn key="rate" align="center">שיעור נוכחות</TableColumn>
                <TableColumn key="consecutive" align="center">היעדרויות ברצף</TableColumn>
                <TableColumn key="flags">סיבות</TableColumn>
              </TableHeader>
              <TableBody items={paginatedFlagged} emptyContent="אין תלמידים בסיכון">
                {(item: FlaggedStudent) => (
                  <TableRow key={`${item.studentId}-${item.orchestraId}`}>
                    {(columnKey) => {
                      switch (columnKey) {
                        case 'student':
                          return (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                  <UsersIcon size={16} weight="regular" />
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white">{item.studentName}</span>
                              </div>
                            </TableCell>
                          )
                        case 'orchestra':
                          return <TableCell><span className="text-sm text-slate-600">{item.orchestraName}</span></TableCell>
                        case 'rate': {
                          const rate = item.attendanceRate
                          return (
                            <TableCell>
                              <Chip
                                size="sm"
                                variant="flat"
                                style={{
                                  backgroundColor: `${getAttendanceRateColor(rate)}20`,
                                  color: getAttendanceRateColor(rate),
                                }}
                                classNames={{ content: 'text-xs font-bold' }}
                              >
                                {Math.round(rate)}%
                              </Chip>
                            </TableCell>
                          )
                        }
                        case 'consecutive':
                          return (
                            <TableCell>
                              <span className={`text-sm font-medium ${item.consecutiveAbsences >= 3 ? 'text-red-600' : 'text-slate-600'}`}>
                                {item.consecutiveAbsences}
                              </span>
                            </TableCell>
                          )
                        case 'flags':
                          return (
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {item.flags.map((flag, idx) => (
                                  <Badge
                                    key={idx}
                                    variant={flag.reason === 'consecutive_absences' ? 'destructive' : 'pending'}
                                    className="text-[10px]"
                                  >
                                    {flag.reason === 'consecutive_absences'
                                      ? `${flag.value} היעדרויות ברצף`
                                      : `שיעור היעדרות ${flag.value}%`}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          )
                        default:
                          return <TableCell>--</TableCell>
                      }
                    }}
                  </TableRow>
                )}
              </TableBody>
            </HeroTable>
          )}
        </>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="border border-border rounded-lg p-5 bg-white dark:bg-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">מגמות נוכחות חודשיות</h3>
          {chartData.length === 0 ? (
            <EmptyState
              title="אין נתוני מגמות"
              description="לא נמצאו נתוני נוכחות חודשיים לתקופה שנבחרה"
              icon={<ChartBarIcon size={48} weight="regular" />}
            />
          ) : (
            <BarChart
              data={chartData}
              showValues
            />
          )}
        </div>
      )}

      {/* AttendanceManager Modal */}
      {showAttendanceManager && selectedRehearsal && (
        <AttendanceManager
          rehearsal={selectedRehearsal}
          orchestraId={selectedRehearsal.groupId || selectedOrchestra || ''}
          onSaved={() => {
            loadDashboard()
            if (selectedOrchestra) {
              loadRehearsals(selectedOrchestra)
            }
          }}
          onClose={() => {
            setShowAttendanceManager(false)
            setSelectedRehearsal(null)
          }}
        />
      )}
    </div>
  )
}
