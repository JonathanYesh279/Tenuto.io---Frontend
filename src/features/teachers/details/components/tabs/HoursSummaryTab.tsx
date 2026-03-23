/**
 * Hours Summary Tab Component
 *
 * Displays weekly hours (ש"ש) breakdown for a teacher,
 * fetched from GET /hours-summary/teacher/:teacherId.
 */

import { useState, useEffect } from 'react'
import {
  Accordion,
  AccordionItem,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react'

import { Teacher } from '../../types'
import { hoursSummaryService } from '../../../../../services/apiService'
import { useAuth } from '../../../../../services/authContext.jsx'
import {
  ArrowsClockwise as ArrowsClockwiseIcon,
  BookOpen as BookOpenIcon,
  Briefcase as BriefcaseIcon,
  Car as CarIcon,
  Clock as ClockIcon,
  Hourglass as HourglassIcon,
  MusicNotes as MusicNotesIcon,
  Path as PathIcon,
  Stack as StackIcon,
  Users as UsersIcon,
  WarningCircle as WarningCircleIcon,
} from '@phosphor-icons/react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shared glass morphism style
// ---------------------------------------------------------------------------

const glassStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,210,230,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow:
    '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Skeleton placeholder used while loading */
function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-5 w-48 bg-muted rounded-card" />
        <div className="h-8 w-24 bg-muted rounded-card" />
      </div>
      {/* Total card skeleton */}
      <div className="h-20 bg-muted rounded-card animate-pulse" />
      {/* Category grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-[70px] bg-muted rounded-card animate-pulse" />
        ))}
      </div>
      {/* Accordion skeletons */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-12 bg-muted rounded-card animate-pulse" />
      ))}
    </div>
  )
}

/** Empty state when no data has been calculated yet */
function EmptyState({
  isAdmin,
  isRecalculating,
  onRecalculate,
}: {
  isAdmin: boolean
  isRecalculating: boolean
  onRecalculate: () => void
}) {
  return (
    <div className="p-4">
      <div
        className="flex flex-col items-center justify-center py-10 text-center rounded-card"
        style={glassStyle}
      >
        <ClockIcon className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">טרם חושבו שעות</h3>
        <p className="text-xs text-muted-foreground mb-4">
          נתוני השעות השבועיות עבור מורה זה טרם חושבו
        </p>
        {isAdmin && (
          <Button
            color="primary"
            variant="solid"
            size="sm"
            isLoading={isRecalculating}
            onPress={onRecalculate}
            startContent={
              !isRecalculating ? (
                <ArrowsClockwiseIcon className="w-4 h-4" />
              ) : undefined
            }
          >
            {isRecalculating ? 'מחשב...' : 'חשב שעות'}
          </Button>
        )}
      </div>
    </div>
  )
}

/** Error state */
function ErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="p-4">
      <div
        className="flex flex-col items-center justify-center py-10 text-center rounded-card"
        style={glassStyle}
      >
        <WarningCircleIcon className="w-12 h-12 text-danger/60 mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">שגיאה בטעינת נתונים</h3>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <Button
          color="primary"
          variant="solid"
          size="sm"
          onPress={onRetry}
          startContent={<ArrowsClockwiseIcon className="w-4 h-4" />}
        >
          נסה שוב
        </Button>
      </div>
    </div>
  )
}

/** Single category glass card — compact ~70px height */
function CategoryCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string
  value: number
  icon: React.ElementType
  iconColor: string
}) {
  return (
    <div
      className="rounded-card px-3 py-2 flex items-center gap-2.5 min-h-[70px]"
      style={glassStyle}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground leading-tight truncate">{label}</div>
        <div className="text-base font-bold text-foreground leading-snug mt-0.5">{value}</div>
      </div>
    </div>
  )
}

/** Accordion title row with icon + name + count chip */
function AccordionTitle({
  icon: Icon,
  iconColor,
  title,
  count,
}: {
  icon: React.ElementType
  iconColor: string
  title: string
  count: number
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <Chip size="sm" variant="flat" color="default" className="mr-1">
        {count}
      </Chip>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
      if (
        err.status === 404 ||
        err.message?.includes('404') ||
        err.message === 'Resource not found.'
      ) {
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

  // ------------------------------------------------------------------
  // Guard states
  // ------------------------------------------------------------------

  if (isLoading) return <LoadingSkeleton />

  if (error) return <ErrorState error={error} onRetry={fetchHoursSummary} />

  if (!data) {
    return (
      <EmptyState
        isAdmin={!!isAdmin}
        isRecalculating={isRecalculating}
        onRecalculate={handleRecalculate}
      />
    )
  }

  // ------------------------------------------------------------------
  // Data ready
  // ------------------------------------------------------------------

  const { totals, breakdown, calculatedAt } = data

  const categoryCards = [
    { label: 'שיעורים פרטניים', value: totals.individualLessons, icon: UsersIcon, iconColor: 'text-blue-500' },
    { label: 'ניצוח תזמורות', value: totals.orchestraConducting, icon: MusicNotesIcon, iconColor: 'text-violet-500' },
    { label: 'הוראת תיאוריה', value: totals.theoryTeaching, icon: BookOpenIcon, iconColor: 'text-emerald-500' },
    { label: 'ניהול', value: totals.management, icon: BriefcaseIcon, iconColor: 'text-amber-500' },
    { label: 'ליווי', value: totals.accompaniment, icon: StackIcon, iconColor: 'text-pink-500' },
    { label: 'תיאום הרכבים', value: totals.ensembleCoordination, icon: StackIcon, iconColor: 'text-indigo-500' },
    { label: 'ריכוז', value: totals.coordination, icon: PathIcon, iconColor: 'text-sky-500' },
    { label: 'ביטול זמן', value: totals.breakTime, icon: HourglassIcon, iconColor: 'text-muted-foreground' },
    { label: 'נסיעות', value: totals.travelTime, icon: CarIcon, iconColor: 'text-muted-foreground' },
  ].filter((cat) => cat.value > 0)

  const tableClassNames = {
    th: 'text-right bg-transparent text-muted-foreground text-xs font-semibold',
    td: 'text-right text-sm',
  }

  // Build accordion items only for non-empty sections
  const accordionItems: {
    key: string
    title: React.ReactNode
    content: React.ReactNode
  }[] = []

  if (breakdown.students?.length > 0) {
    accordionItems.push({
      key: 'students',
      title: (
        <AccordionTitle
          icon={UsersIcon}
          iconColor="text-blue-500"
          title="פירוט תלמידים"
          count={breakdown.students.length}
        />
      ),
      content: (
        <Table
          aria-label="פירוט שעות לפי תלמיד"
          isStriped
          removeWrapper
          classNames={tableClassNames}
        >
          <TableHeader>
            <TableColumn>תלמיד</TableColumn>
            <TableColumn>כלי</TableColumn>
            <TableColumn>דקות שבועיות</TableColumn>
            <TableColumn>ש&quot;ש</TableColumn>
          </TableHeader>
          <TableBody>
            {breakdown.students.map((student, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium text-foreground">
                  {student.studentName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.instrument}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.weeklyMinutes}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="primary">
                    {formatMinutesToHours(student.weeklyMinutes)}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ),
    })
  }

  if (breakdown.orchestras?.length > 0) {
    accordionItems.push({
      key: 'orchestras',
      title: (
        <AccordionTitle
          icon={MusicNotesIcon}
          iconColor="text-violet-500"
          title="פירוט תזמורות"
          count={breakdown.orchestras.length}
        />
      ),
      content: (
        <Table
          aria-label="פירוט שעות לפי תזמורת"
          isStriped
          removeWrapper
          classNames={tableClassNames}
        >
          <TableHeader>
            <TableColumn>תזמורת</TableColumn>
            <TableColumn>סוג</TableColumn>
            <TableColumn>דקות שבועיות</TableColumn>
            <TableColumn>ש&quot;ש</TableColumn>
          </TableHeader>
          <TableBody>
            {breakdown.orchestras.map((orch, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium text-foreground">
                  {orch.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {orch.type}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {orch.weeklyMinutes}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="secondary">
                    {formatMinutesToHours(orch.weeklyMinutes)}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ),
    })
  }

  if (breakdown.theory?.length > 0) {
    accordionItems.push({
      key: 'theory',
      title: (
        <AccordionTitle
          icon={BookOpenIcon}
          iconColor="text-emerald-500"
          title="פירוט תיאוריה"
          count={breakdown.theory.length}
        />
      ),
      content: (
        <Table
          aria-label="פירוט שעות תיאוריה"
          isStriped
          removeWrapper
          classNames={tableClassNames}
        >
          <TableHeader>
            <TableColumn>קטגוריה</TableColumn>
            <TableColumn>יום</TableColumn>
            <TableColumn>דקות שבועיות</TableColumn>
            <TableColumn>ש&quot;ש</TableColumn>
          </TableHeader>
          <TableBody>
            {breakdown.theory.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium text-foreground">
                  {item.category}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.dayOfWeek}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.weeklyMinutes}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="success">
                    {formatMinutesToHours(item.weeklyMinutes)}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ),
    })
  }

  return (
    <div className="p-4 space-y-4">

      {/* ------------------------------------------------------------------ */}
      {/* Header row                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-foreground">
          סיכום שעות שבועיות (ש&quot;ש)
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {calculatedAt && (
            <span className="text-xs text-muted-foreground">
              עדכון:{' '}
              {new Date(calculatedAt).toLocaleDateString('he-IL')}{' '}
              {new Date(calculatedAt).toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {isAdmin && (
            <Button
              size="sm"
              variant="flat"
              color="default"
              isLoading={isRecalculating}
              onPress={handleRecalculate}
              startContent={
                !isRecalculating ? (
                  <ArrowsClockwiseIcon className="w-3.5 h-3.5" />
                ) : undefined
              }
              className="border border-border"
            >
              {isRecalculating ? 'מחשב...' : 'חשב מחדש'}
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Total hours — compact glass stat card (~80px max)                   */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="rounded-card px-4 py-3 flex items-center gap-4"
        style={glassStyle}
      >
        {/* Icon circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0,140,210,0.12) 0%, rgba(0,140,210,0.06) 100%)',
            border: '1px solid rgba(0,140,210,0.18)',
          }}
        >
          <ClockIcon className="w-5 h-5 text-primary" />
        </div>

        {/* Label + number */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground leading-none mb-1">
            סה&quot;כ ש&quot;ש
          </div>
          <div className="text-2xl font-bold text-foreground leading-none">
            {totals.totalWeeklyHours}
          </div>
        </div>

        {/* Secondary label on the far side */}
        <div className="text-xs text-muted-foreground text-left">
          שעות<br />שבועיות
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Category breakdown grid                                             */}
      {/* ------------------------------------------------------------------ */}
      {categoryCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {categoryCards.map((cat) => (
            <CategoryCard
              key={cat.label}
              label={cat.label}
              value={cat.value}
              icon={cat.icon}
              iconColor={cat.iconColor}
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Breakdown accordion sections                                        */}
      {/* ------------------------------------------------------------------ */}
      {accordionItems.length > 0 && (
        <Accordion
          selectionMode="multiple"
          defaultExpandedKeys={accordionItems.map((item) => item.key)}
          className="px-0"
          itemClasses={{
            base: 'rounded-card mb-2 overflow-hidden',
            heading: 'px-4 py-0',
            trigger: 'py-3 data-[hover=true]:bg-muted/30 rounded-card',
            content: 'px-0 pt-0 pb-2',
            title: 'text-sm',
          }}
          style={glassStyle}
        >
          {accordionItems.map((item) => (
            <AccordionItem
              key={item.key}
              aria-label={item.key}
              title={item.title}
            >
              {item.content}
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

export default HoursSummaryTab
