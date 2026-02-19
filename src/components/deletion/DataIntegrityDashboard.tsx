/**
 * Data Integrity Monitoring Dashboard
 * 
 * Real-time monitoring of data integrity status with 
 * health metrics and automated cleanup suggestions
 */

import React, { useState } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Database,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Users,
  FileText,
  Settings,
  Zap,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { DataIntegrityStatus, IntegrityIssue, BatchOperation } from './types'
import { CircularProgress, ProgressBar } from '../feedback/ProgressIndicators'
import { Card } from '../ui/Card'

interface DataIntegrityDashboardProps {
  status: DataIntegrityStatus
  recentOperations: BatchOperation[]
  onRunIntegrityCheck?: () => Promise<void>
  onAutoFixIssues?: (issues: IntegrityIssue[]) => Promise<void>
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

const DataIntegrityDashboard: React.FC<DataIntegrityDashboardProps> = ({
  status,
  recentOperations,
  onRunIntegrityCheck,
  onAutoFixIssues,
  onRefresh,
  isLoading = false,
  className = ''
}) => {
  const [showIssueDetails, setShowIssueDetails] = useState(false)

  const getHealthColor = (score: number) => {
    if (score >= 90) return { color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' }
    if (score >= 70) return { color: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200' }
    if (score >= 50) return { color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200' }
    return { color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' }
  }

  const getHealthStatus = (score: number) => {
    if (score >= 90) return 'מצוין'
    if (score >= 70) return 'טוב'
    if (score >= 50) return 'בינוני'
    return 'דרוש טיפול'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="w-5 h-5 text-red-500" />
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'low': return <AlertCircle className="w-5 h-5 text-blue-500" />
      default: return <CheckCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'failed': return 'text-red-600 bg-red-50'
      case 'running': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const healthStyle = getHealthColor(status.healthScore)
  const autoFixableIssues = status.issues.filter(issue => issue.canAutoFix)
  const criticalIssues = status.issues.filter(issue => issue.severity === 'high')

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">
              מוניטור שלמות נתונים
            </h2>
            <p className="text-gray-600 font-reisinger-yonatan">
              ניטור ובקרה על איכות המידע במערכת
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="font-reisinger-yonatan">רענון</span>
            </button>
          )}

          {onRunIntegrityCheck && (
            <button
              onClick={onRunIntegrityCheck}
              className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span className="font-reisinger-yonatan">בדיקת שלמות</span>
            </button>
          )}
        </div>
      </div>

      {/* Health Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={`${healthStyle.bg} ${healthStyle.ring} ring-2`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 font-reisinger-yonatan mb-1">
                ציון בריאות כללי
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${healthStyle.color}`}>
                  {status.healthScore}
                </span>
                <span className="text-sm text-gray-600 font-reisinger-yonatan">
                  {getHealthStatus(status.healthScore)}
                </span>
              </div>
            </div>
            <CircularProgress
              value={status.healthScore}
              size={60}
              color={status.healthScore >= 90 ? 'green' : 
                     status.healthScore >= 70 ? 'orange' : 'red'}
              showValue={false}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 font-reisinger-yonatan mb-1">
                הפניות יתומות
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-600">
                  {status.orphanedCount.toLocaleString()}
                </span>
                {status.orphanedCount > 0 && <TrendingUp className="w-4 h-4 text-yellow-500" />}
              </div>
            </div>
            <Database className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 font-reisinger-yonatan mb-1">
                פעולות פעילות
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {status.pendingOperations}
                </span>
                {status.pendingOperations > 0 && <Activity className="w-4 h-4 text-blue-500" />}
              </div>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 font-reisinger-yonatan mb-1">
                ניקוי אחרון
              </h3>
              <div className="text-sm text-gray-600 font-reisinger-yonatan">
                {status.lastCleanup ? (
                  formatDate(status.lastCleanup)
                ) : (
                  'מעולם לא בוצע'
                )}
              </div>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Issues Summary */}
      {status.issues.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                    בעיות שלמות נתונים
                  </h3>
                  <p className="text-sm text-gray-600 font-reisinger-yonatan">
                    נמצאו {status.issues.length} בעיות, {autoFixableIssues.length} ניתנות לתיקון אוטומטי
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {autoFixableIssues.length > 0 && onAutoFixIssues && (
                  <button
                    onClick={() => onAutoFixIssues(autoFixableIssues)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="font-reisinger-yonatan">תקן אוטומטית</span>
                  </button>
                )}

                <button
                  onClick={() => setShowIssueDetails(!showIssueDetails)}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-reisinger-yonatan">צפה בפרטים</span>
                </button>
              </div>
            </div>

            {/* Issues Categories */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {status.issues.filter(i => i.severity === 'high').length}
                </div>
                <div className="text-sm text-gray-600 font-reisinger-yonatan">קריטיות</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {status.issues.filter(i => i.severity === 'medium').length}
                </div>
                <div className="text-sm text-gray-600 font-reisinger-yonatan">בינוניות</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {status.issues.filter(i => i.severity === 'low').length}
                </div>
                <div className="text-sm text-gray-600 font-reisinger-yonatan">נמוכות</div>
              </div>
            </div>

            {/* Detailed Issues List */}
            {showIssueDetails && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {status.issues.map((issue, index) => (
                  <div 
                    key={issue.id} 
                    className={`
                      flex items-center justify-between p-3 rounded border
                      ${getSeverityColor(issue.severity)}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-reisinger-yonatan">
                            {issue.table}
                          </span>
                          {issue.field && (
                            <span className="text-sm text-gray-600 font-reisinger-yonatan">
                              .{issue.field}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-xs font-medium bg-white bg-opacity-70 rounded-full">
                            {issue.count}
                          </span>
                        </div>
                        <p className="text-sm opacity-90 font-reisinger-yonatan">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {issue.canAutoFix && (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full font-reisinger-yonatan">
                          ניתן לתיקון
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recent Operations */}
      {recentOperations.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                  פעולות אחרונות
                </h3>
                <p className="text-sm text-gray-600 font-reisinger-yonatan">
                  {recentOperations.length} פעולות האחרונות במערכת
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {recentOperations.slice(0, 5).map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-3 h-3 rounded-full
                      ${operation.status === 'completed' ? 'bg-green-500' :
                        operation.status === 'failed' ? 'bg-red-500' :
                        operation.status === 'running' ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-400'}
                    `} />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 font-reisinger-yonatan">
                          {operation.type === 'cleanup_orphans' ? 'ניקוי הפניות יתומות' :
                           operation.type === 'bulk_delete' ? 'מחיקה מרובה' :
                           operation.type === 'integrity_check' ? 'בדיקת שלמות' : operation.type}
                        </span>
                        <span className={`
                          px-2 py-0.5 text-xs font-medium rounded-full
                          ${getOperationStatusColor(operation.status)}
                        `}>
                          <span className="font-reisinger-yonatan">
                            {operation.status === 'completed' ? 'הושלם' :
                             operation.status === 'failed' ? 'נכשל' :
                             operation.status === 'running' ? 'פעיל' : 'ממתין'}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-reisinger-yonatan">
                        {operation.processedItems} מתוך {operation.totalItems} פריטים
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                      {operation.progress}%
                    </div>
                    {operation.endTime && (
                      <div className="text-xs text-gray-500 font-reisinger-yonatan">
                        {formatDate(operation.endTime)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 font-reisinger-yonatan">
                פעולות מהירות
              </h3>
              <p className="text-sm text-blue-700 font-reisinger-yonatan">
                כלים למניעה ותחזוקה של שלמות הנתונים
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button className="flex items-center gap-2 p-3 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900 font-reisinger-yonatan">
                ניקוי הפניות יתומות
              </span>
            </button>

            <button className="flex items-center gap-2 p-3 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900 font-reisinger-yonatan">
                בדיקת אילוצים
              </span>
            </button>

            <button className="flex items-center gap-2 p-3 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900 font-reisinger-yonatan">
                דוח שלמות מלא
              </span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DataIntegrityDashboard