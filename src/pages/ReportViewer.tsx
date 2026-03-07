import { useState, useEffect, useCallback, lazy, Suspense, ComponentType } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSchoolYear } from '../services/schoolYearContext.jsx'
import { reportsService } from '../services/apiService'
import DefaultTableRenderer from '../components/reports/DefaultTableRenderer'
import ReportFiltersBar from '../components/reports/ReportFiltersBar'
import ExportButtons from '../components/reports/ExportButtons'
import YearComparisonToggle from '../components/reports/YearComparisonToggle'
import toast from 'react-hot-toast'
import { CaretRightIcon } from '@phosphor-icons/react'

// Lazy-loaded custom renderers
const TeacherHoursChart = lazy(() => import('../components/reports/TeacherHoursChart'))
const MinistryReadinessGauge = lazy(() => import('../components/reports/MinistryReadinessGauge'))

// Custom renderer map: reportId -> component
const CUSTOM_RENDERERS: Record<string, ComponentType<any>> = {
  'teacher-hours-summary': TeacherHoursChart,
  'ministry-readiness-audit': MinistryReadinessGauge,
}

export default function ReportViewer() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const { currentSchoolYear, schoolYears, setCurrentSchoolYearById } = useSchoolYear()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Year comparison state
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonYearId, setComparisonYearId] = useState<string | null>(null)

  const schoolYearId = currentSchoolYear?._id || ''

  const fetchReport = useCallback(async () => {
    if (!reportId) return

    try {
      setLoading(true)
      const params: Record<string, any> = {
        page,
        limit,
        sortBy,
        sortOrder,
        schoolYearId,
        ...filters,
      }

      if (comparisonEnabled && comparisonYearId) {
        params.comparisonYearId = comparisonYearId
      }

      const response = await reportsService.getReport(reportId, params)
      setData(response)
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('שגיאה בטעינת הדוח')
    } finally {
      setLoading(false)
    }
  }, [reportId, page, limit, sortBy, sortOrder, schoolYearId, filters, comparisonEnabled, comparisonYearId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (value === '') {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
    setPage(1)
  }

  const handleSchoolYearChange = (yearId: string) => {
    setCurrentSchoolYearById(yearId)
    setPage(1)
  }

  const handleComparisonToggle = (enabled: boolean) => {
    setComparisonEnabled(enabled)
    if (!enabled) {
      setComparisonYearId(null)
    }
  }

  const handleComparisonYearChange = (yearId: string) => {
    setComparisonYearId(yearId)
  }

  // Build export params (current filters + schoolYearId)
  const exportParams: Record<string, string> = {
    ...filters,
    schoolYearId,
  }

  // Custom renderer lookup
  const CustomRenderer = reportId ? CUSTOM_RENDERERS[reportId] : undefined

  // Comparison years: all except current
  const comparisonYears = schoolYears.filter((sy: any) => sy._id !== schoolYearId)

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">טוען דוח...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CaretRightIcon size={16} weight="bold" />
            חזרה לדוחות
          </button>

          {data?.metadata && (
            <h1 className="text-2xl font-bold text-foreground">{data.metadata.title}</h1>
          )}
        </div>

        {/* Export Buttons */}
        {data?.metadata?.exports && reportId && (
          <ExportButtons
            reportId={reportId}
            currentFilters={exportParams}
            exports={data.metadata.exports}
          />
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <ReportFiltersBar
          reportParams={data?.metadata?.params}
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          schoolYearId={schoolYearId}
          onSchoolYearChange={handleSchoolYearChange}
        />

        {/* Year Comparison Toggle */}
        <YearComparisonToggle
          enabled={comparisonEnabled}
          onToggle={handleComparisonToggle}
          comparisonYearId={comparisonYearId}
          onComparisonYearChange={handleComparisonYearChange}
          excludeYearId={schoolYearId}
        />
      </div>

      {/* Custom Renderer (above table, if exists) */}
      {CustomRenderer && data && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          }
        >
          <CustomRenderer
            rows={data.rows || []}
            columns={data.columns || []}
            summary={data.summary || { items: [] }}
            metadata={data.metadata || {}}
          />
        </Suspense>
      )}

      {/* Main Table Renderer */}
      {data && (
        <DefaultTableRenderer
          columns={data.columns || []}
          columnGroups={data.columnGroups}
          rows={data.rows || []}
          summary={data.summary || { items: [] }}
          metadata={data.metadata || {}}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Comparison Data */}
      {comparisonEnabled && data?.comparisonRows && data.comparisonRows.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            נתוני השוואה — {comparisonYears.find((sy: any) => sy._id === comparisonYearId)?.name || 'שנה קודמת'}
          </h2>
          <div className="opacity-80">
            <DefaultTableRenderer
              columns={data.columns || []}
              columnGroups={data.columnGroups}
              rows={data.comparisonRows}
              summary={data.comparisonSummary || { items: [] }}
              metadata={{ ...data.metadata, pagination: undefined } as any}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              onPageChange={() => {}}
              onLimitChange={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  )
}
