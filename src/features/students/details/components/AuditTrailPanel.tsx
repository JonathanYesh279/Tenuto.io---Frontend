/**
 * Audit Trail Panel Component
 * 
 * Displays audit trail and recent activity for student data access and modifications.
 */

import { useState, useEffect } from 'react'
import { 
  History, 
  Eye, 
  Edit, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Mail, 
  Printer,
  Calendar,
  User,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from 'lucide-react'
import { 
  auditTrailService, 
  AuditEntry, 
  AuditAction, 
  AuditResourceType,
  AuditQuery 
} from '@/services/auditTrailService'
import { usePermissionsAndAudit } from '../hooks/usePermissionsAndAudit'

interface AuditTrailPanelProps {
  studentId: string
  className?: string
}

const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({ 
  studentId, 
  className = '' 
}) => {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  
  // Filters
  const [filters, setFilters] = useState({
    action: '' as AuditAction | '',
    resourceType: '' as AuditResourceType | '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    success: '' as 'true' | 'false' | ''
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const { hasPermission } = usePermissionsAndAudit(studentId)

  // Check if user can view audit trail
  const canViewAudit = hasPermission('view_audit_trail')

  useEffect(() => {
    if (canViewAudit) {
      loadAuditEntries()
    }
  }, [studentId, canViewAudit])

  useEffect(() => {
    applyFilters()
  }, [entries, filters, searchTerm])

  const loadAuditEntries = async () => {
    setIsLoading(true)
    try {
      const query: AuditQuery = {
        resourceId: studentId,
        limit: 100
      }
      
      const result = await auditTrailService.query(query)
      setEntries(result.entries)
    } catch (error) {
      console.error('Failed to load audit entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...entries]

    // Apply filters
    if (filters.action) {
      filtered = filtered.filter(entry => entry.action === filters.action)
    }
    
    if (filters.resourceType) {
      filtered = filtered.filter(entry => entry.resourceType === filters.resourceType)
    }
    
    if (filters.userId) {
      filtered = filtered.filter(entry => entry.userId.includes(filters.userId))
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(entry => entry.timestamp >= fromDate)
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(entry => entry.timestamp <= toDate)
    }
    
    if (filters.success !== '') {
      const success = filters.success === 'true'
      filtered = filtered.filter(entry => entry.success === success)
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.userName.toLowerCase().includes(term) ||
        entry.action.toLowerCase().includes(term) ||
        entry.resourceType.toLowerCase().includes(term) ||
        (entry.resourceName && entry.resourceName.toLowerCase().includes(term)) ||
        (entry.errorMessage && entry.errorMessage.toLowerCase().includes(term))
      )
    }

    setFilteredEntries(filtered)
  }

  const toggleEntryExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedEntries(newExpanded)
  }

  const getActionIcon = (action: AuditAction) => {
    const iconMap: Record<AuditAction, React.ComponentType<any>> = {
      view: Eye,
      create: Plus,
      update: Edit,
      delete: Trash2,
      upload: Upload,
      download: Download,
      export: Download,
      email: Mail,
      print: Printer,
      login: User,
      logout: User,
      permission_change: User
    }
    
    return iconMap[action] || Activity
  }

  const getActionLabel = (action: AuditAction) => {
    const labelMap: Record<AuditAction, string> = {
      view: 'צפייה',
      create: 'יצירה',
      update: 'עדכון',
      delete: 'מחיקה',
      upload: 'העלאה',
      download: 'הורדה',
      export: 'ייצוא',
      email: 'שליחת אימייל',
      print: 'הדפסה',
      login: 'כניסה למערכת',
      logout: 'יציאה מהמערכת',
      permission_change: 'שינוי הרשאות'
    }
    
    return labelMap[action] || action
  }

  const getResourceTypeLabel = (resourceType: AuditResourceType) => {
    const labelMap: Record<AuditResourceType, string> = {
      student: 'תלמיד',
      personal_info: 'פרטים אישיים',
      academic_info: 'פרטים אקדמיים',
      attendance: 'נוכחות',
      schedule: 'לוח זמנים',
      orchestra: 'תזמורת',
      theory: 'תיאוריה',
      document: 'מסמך',
      report: 'דוח',
      user: 'משתמש',
      permission: 'הרשאה'
    }
    
    return labelMap[resourceType] || resourceType
  }

  const exportAuditTrail = async () => {
    const csv = auditTrailService.exportAsCSV(filteredEntries)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_trail_${studentId}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!canViewAudit) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <span>אין הרשאה לצפות בלוג הפעילות</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">לוג פעילות</h3>
            <span className="text-sm text-gray-500">({filteredEntries.length} פעולות)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportAuditTrail}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Download className="w-4 h-4" />
              ייצא CSV
            </button>
            <button
              onClick={loadAuditEntries}
              className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
            >
              <Activity className="w-4 h-4" />
              רענן
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value as AuditAction }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">כל הפעולות</option>
            <option value="view">צפייה</option>
            <option value="update">עדכון</option>
            <option value="create">יצירה</option>
            <option value="delete">מחיקה</option>
            <option value="upload">העלאה</option>
            <option value="download">הורדה</option>
            <option value="export">ייצוא</option>
          </select>
          
          <select
            value={filters.resourceType}
            onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value as AuditResourceType }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">כל המשאבים</option>
            <option value="personal_info">פרטים אישיים</option>
            <option value="academic_info">פרטים אקדמיים</option>
            <option value="attendance">נוכחות</option>
            <option value="schedule">לוח זמנים</option>
            <option value="document">מסמכים</option>
          </select>
          
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="מתאריך"
          />
          
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="עד תאריך"
          />
          
          <select
            value={filters.success}
            onChange={(e) => setFilters(prev => ({ ...prev, success: e.target.value as 'true' | 'false' | '' }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">הכל</option>
            <option value="true">הצליח</option>
            <option value="false">נכשל</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span>טוען נתונים...</span>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <History className="w-8 h-8 mb-2" />
            <span>לא נמצאו פעולות</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => {
              const ActionIcon = getActionIcon(entry.action)
              const isExpanded = expandedEntries.has(entry.id)
              
              return (
                <div key={entry.id} className="p-4 hover:bg-gray-50">
                  <div 
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggleEntryExpansion(entry.id)}
                  >
                    {/* Expand/Collapse Button */}
                    <button className="mt-1 text-gray-400 hover:text-gray-600">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {/* Action Icon */}
                    <div className={`mt-1 p-1 rounded-full ${
                      entry.success 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <ActionIcon className="w-3 h-3" />
                    </div>

                    {/* Entry Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-900">
                              {entry.userName}
                            </span>
                            <span className="text-gray-500">
                              {getActionLabel(entry.action)}
                            </span>
                            <span className="text-gray-500">
                              {getResourceTypeLabel(entry.resourceType)}
                            </span>
                            {entry.resourceName && (
                              <span className="text-gray-700 font-medium">
                                "{entry.resourceName}"
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{entry.timestamp.toLocaleDateString('he-IL')}</span>
                              <span>{entry.timestamp.toLocaleTimeString('he-IL', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{entry.userRole}</span>
                            </div>
                            
                            {entry.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{entry.duration}ms</span>
                              </div>
                            )}
                          </div>

                          {entry.errorMessage && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                              {entry.errorMessage}
                            </div>
                          )}
                        </div>

                        {/* Status Icon */}
                        <div className="ml-2">
                          {entry.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <strong>מזהה פעולה:</strong> {entry.id}
                            </div>
                            <div>
                              <strong>מזהה משתמש:</strong> {entry.userId}
                            </div>
                            <div>
                              <strong>מזהה משאב:</strong> {entry.resourceId}
                            </div>
                            {entry.ipAddress && (
                              <div>
                                <strong>כתובת IP:</strong> {entry.ipAddress}
                              </div>
                            )}
                          </div>

                          {entry.details && Object.keys(entry.details).length > 0 && (
                            <div className="mt-3">
                              <strong className="text-xs">פרטים נוספים:</strong>
                              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(entry.details, null, 2)}
                              </pre>
                            </div>
                          )}

                          {entry.metadata && (
                            <div className="mt-3">
                              <strong className="text-xs">מטאדטה:</strong>
                              
                              {entry.metadata.changedFields && (
                                <div className="mt-1 text-xs">
                                  <span className="font-medium">שדות שהשתנו: </span>
                                  <span className="bg-blue-100 text-blue-800 px-1 rounded">
                                    {entry.metadata.changedFields.join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              {entry.metadata.oldValues && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium">ערכים קודמים:</div>
                                  <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(entry.metadata.oldValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {entry.metadata.newValues && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium">ערכים חדשים:</div>
                                  <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(entry.metadata.newValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditTrailPanel