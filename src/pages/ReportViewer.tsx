import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSchoolYear } from '../services/schoolYearContext.jsx'
import { reportsService } from '../services/apiService'
import DefaultTableRenderer from '../components/reports/DefaultTableRenderer'
import toast from 'react-hot-toast'
import { CaretRightIcon } from '@phosphor-icons/react'

export default function ReportViewer() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const { currentSchoolYear } = useSchoolYear()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (!reportId) return

    async function fetchReport() {
      try {
        setLoading(true)
        const response = await reportsService.getReport(reportId, {
          page,
          limit,
          sortBy,
          sortOrder,
          schoolYearId: currentSchoolYear?._id,
        })
        setData(response)
      } catch (error) {
        console.error('Error fetching report:', error)
        toast.error('שגיאה בטעינת הדוח')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId, page, limit, sortBy, sortOrder, currentSchoolYear?._id])

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
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <CaretRightIcon size={16} weight="bold" />
          חזרה לדוחות
        </button>
      </div>

      {data?.metadata && (
        <h1 className="text-2xl font-bold text-foreground">{data.metadata.title}</h1>
      )}

      {/* Table Renderer */}
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
    </div>
  )
}
