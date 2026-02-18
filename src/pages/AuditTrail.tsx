import React, { useState, useEffect } from 'react'
import { adminAuditService } from '../services/apiService'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Table from '../components/ui/Table'
import Pagination from '../components/ui/Pagination'
import { TableSkeleton } from '../components/feedback/Skeleton'
import toast from 'react-hot-toast'
import {
  Shield,
  Calendar,
  AlertTriangle,
  FileText,
  RefreshCw,
} from 'lucide-react'

type ActiveTab = 'deletion-log' | 'past-activities'

interface AuditEntry {
  _id: string
  timestamp: string
  action: string
  entityType: 'teacher' | 'student' | 'orchestra'
  entityId: string
  entityName: string
  performedBy: {
    adminId: string
    adminName: string
  }
  status: 'success' | 'failed'
  reason?: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

interface AuditLogResponse {
  auditEntries: AuditEntry[]
  pagination: PaginationData
  summary: {
    totalOperations: number
    successfulOperations: number
  }
}

interface PastActivity {
  _id: string
  date: string
  type: 'rehearsal' | 'theory' | 'private-lesson'
  details: string
  teacher?: {
    _id: string
    firstName: string
    lastName: string
  }
  students?: Array<{
    _id: string
    firstName: string
    lastName: string
  }>
}

export default function AuditTrail() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('deletion-log')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Deletion Log state
  const [auditLog, setAuditLog] = useState<AuditLogResponse | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [entityType, setEntityType] = useState<'all' | 'teacher' | 'student' | 'orchestra'>('all')
  const [auditPage, setAuditPage] = useState(1)

  // Past Activities state
  const [pastActivities, setPastActivities] = useState<PastActivity[]>([])
  const [activityType, setActivityType] = useState<'all' | 'rehearsals' | 'theory' | 'private-lessons'>('all')
  const [activitiesPage, setActivitiesPage] = useState(1)
  const [activitiesPagination, setActivitiesPagination] = useState<PaginationData | null>(null)

  useEffect(() => {
    if (activeTab === 'deletion-log') {
      loadAuditLog()
    } else {
      loadPastActivities()
    }
  }, [activeTab, startDate, endDate, entityType, auditPage, activityType, activitiesPage])

  const loadAuditLog = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, any> = {
        page: auditPage,
        limit: 20,
      }

      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (entityType !== 'all') params.entityType = entityType

      const response = await adminAuditService.getAuditLog(params)
      setAuditLog(response.data)
    } catch (err: any) {
      console.error('Error loading audit log:', err)
      setError('שגיאה בטעינת יומן המחיקות')
      toast.error('שגיאה בטעינת יומן המחיקות')
    } finally {
      setLoading(false)
    }
  }

  const loadPastActivities = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, any> = {
        page: activitiesPage,
        limit: 20,
      }

      if (activityType !== 'all') {
        params.type = activityType
      }

      const response = await adminAuditService.getPastActivities(params)
      setPastActivities(response.data?.activities || [])
      setActivitiesPagination(response.data?.pagination || null)
    } catch (err: any) {
      console.error('Error loading past activities:', err)
      setError('שגיאה בטעינת פעילויות עבר')
      toast.error('שגיאה בטעינת פעילויות עבר')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    if (activeTab === 'deletion-log') {
      loadAuditLog()
    } else {
      loadPastActivities()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      teacher: 'מורה',
      student: 'תלמיד',
      orchestra: 'תזמורת',
    }
    return labels[type] || type
  }

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rehearsal: 'חזרה',
      theory: 'תיאוריה',
      'private-lesson': 'שיעור פרטי',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          הצלחה
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        כשל
      </span>
    )
  }

  const deletionLogColumns = [
    { key: 'timestamp', label: 'תאריך', render: (row: any) => formatDate(row.timestamp) },
    { key: 'action', label: 'פעולה' },
    { key: 'entityType', label: 'סוג', render: (row: any) => getEntityTypeLabel(row.entityType) },
    { key: 'entityName', label: 'שם' },
    { key: 'adminName', label: 'מנהל', render: (row: any) => row.performedBy?.adminName || '-' },
    { key: 'status', label: 'סטטוס', render: (row: any) => getStatusBadge(row.status) },
  ]

  const pastActivitiesColumns = [
    { key: 'date', label: 'תאריך', render: (row: any) => formatDate(row.date) },
    { key: 'type', label: 'סוג', render: (row: any) => getActivityTypeLabel(row.type) },
    { key: 'details', label: 'פרטים' },
    { key: 'teacher', label: 'מורה', render: (row: any) => row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : '-' },
    { key: 'students', label: 'תלמידים', render: (row: any) => row.students?.length > 0 ? row.students.map((s: any) => `${s.firstName} ${s.lastName}`).join(', ') : '-' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">יומן ביקורת</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('deletion-log')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'deletion-log'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            יומן מחיקות
          </button>
          <button
            onClick={() => setActiveTab('past-activities')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'past-activities'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            פעילויות עבר
          </button>
        </nav>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            נסה שוב
          </button>
        </div>
      )}

      {/* Deletion Log Tab */}
      {activeTab === 'deletion-log' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>יומן מחיקות</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מתאריך
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setAuditPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    עד תאריך
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setAuditPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סוג ישות
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => {
                      setEntityType(e.target.value as any)
                      setAuditPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="all">כל הסוגים</option>
                    <option value="teacher">מורה</option>
                    <option value="student">תלמיד</option>
                    <option value="orchestra">תזמורת</option>
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <TableSkeleton rows={5} cols={6} />
              )}

              {/* Empty State */}
              {!loading && auditLog && auditLog.auditEntries.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">לא נמצאו רשומות</p>
                </div>
              )}

              {/* Table */}
              {!loading && auditLog && auditLog.auditEntries.length > 0 && (
                <>
                  <Table
                    columns={deletionLogColumns}
                    data={auditLog.auditEntries}
                  />

                  {/* Pagination */}
                  <div className="mt-6">
                    <Pagination
                      currentPage={auditPage}
                      totalPages={auditLog.pagination.pages}
                      totalItems={auditLog.pagination.total}
                      itemsPerPage={20}
                      onPageChange={setAuditPage}
                      entityLabel="רשומות"
                      showItemsPerPage={false}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Past Activities Tab */}
      {activeTab === 'past-activities' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>פעילויות עבר</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סוג פעילות
                </label>
                <select
                  value={activityType}
                  onChange={(e) => {
                    setActivityType(e.target.value as any)
                    setActivitiesPage(1)
                  }}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="all">הכל</option>
                  <option value="rehearsals">חזרות</option>
                  <option value="theory">תיאוריה</option>
                  <option value="private-lessons">שיעורים פרטיים</option>
                </select>
              </div>

              {/* Loading State */}
              {loading && (
                <TableSkeleton rows={5} cols={5} />
              )}

              {/* Empty State */}
              {!loading && pastActivities.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">לא נמצאו רשומות</p>
                </div>
              )}

              {/* Table */}
              {!loading && pastActivities.length > 0 && (
                <>
                  <Table
                    columns={pastActivitiesColumns}
                    data={pastActivities}
                  />

                  {/* Pagination */}
                  {activitiesPagination && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={activitiesPage}
                        totalPages={activitiesPagination.pages}
                        totalItems={activitiesPagination.total}
                        itemsPerPage={20}
                        onPageChange={setActivitiesPage}
                        entityLabel="רשומות"
                        showItemsPerPage={false}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
