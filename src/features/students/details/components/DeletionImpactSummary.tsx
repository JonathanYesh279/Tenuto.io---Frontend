import React, { useState, useEffect } from 'react'
import { AlertTriangle, Database, Users, Calendar, Music, FileText, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { cascadeDeletionService } from '../../../../services/cascadeDeletionService'

interface DeletionImpactSummaryProps {
  studentId: string
  studentName: string
  isVisible: boolean
  onClose: () => void
}

const DeletionImpactSummary: React.FC<DeletionImpactSummaryProps> = ({
  studentId,
  studentName,
  isVisible,
  onClose
}) => {
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (isVisible && studentId) {
      loadPreview()
    }
  }, [isVisible, studentId])

  const loadPreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const previewData = await cascadeDeletionService.previewDeletion(studentId)
      setPreview(previewData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error loading deletion preview:', err)
      setError(err.message || 'שגיאה בטעינת תצוגה מקדימה')
    } finally {
      setLoading(false)
    }
  }

  const getImpactColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getImpactTextColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-800'
      case 'medium': return 'text-yellow-800'
      case 'low': return 'text-green-800'
      default: return 'text-gray-800'
    }
  }

  if (!isVisible) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-orange-50 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-orange-600" />
          <span className="font-medium text-orange-900">השפעת מחיקה - {studentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPreview}
            disabled={loading}
            className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded transition-colors disabled:opacity-50"
            title="רענן נתונים"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded transition-colors"
            title="סגור"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="w-5 h-5 animate-spin text-orange-600 mr-2" />
            <span className="text-gray-600">טוען השפעת מחיקה...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-red-900">שגיאה בטעינת נתונים</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {preview && !loading && (
          <>
            {/* Risk Level & Summary */}
            <div className={`border rounded-lg p-4 mb-4 ${getImpactColor(preview.summary?.riskLevel)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${
                    preview.summary?.riskLevel === 'high' ? 'text-red-600' :
                    preview.summary?.riskLevel === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                  <span className={`font-medium ${getImpactTextColor(preview.summary?.riskLevel)}`}>
                    רמת סיכון: {
                      preview.summary?.riskLevel === 'high' ? 'גבוהה' :
                      preview.summary?.riskLevel === 'medium' ? 'בינונית' :
                      'נמוכה'
                    }
                  </span>
                </div>
                {preview.canProceed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" title="ניתן לבצע מחיקה" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" title="לא ניתן לבצע מחיקה" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">סה״כ רשומות:</span>
                  <span className="font-medium ml-2">{preview.summary?.totalRecords || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">זמן משוער:</span>
                  <span className="font-medium ml-2">{preview.summary?.estimatedDuration || 0} שניות</span>
                </div>
              </div>
            </div>

            {/* Affected Collections */}
            {preview.summary?.affectedCollections?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">אזורים מושפעים:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {preview.summary.affectedCollections.map((collection: string, index: number) => {
                    const getIcon = () => {
                      switch (collection) {
                        case 'lessons': return <Calendar className="w-4 h-4" />
                        case 'attendance': return <Users className="w-4 h-4" />
                        case 'orchestras': return <Music className="w-4 h-4" />
                        case 'documents': return <FileText className="w-4 h-4" />
                        default: return <Database className="w-4 h-4" />
                      }
                    }
                    
                    const getName = () => {
                      switch (collection) {
                        case 'lessons': return 'שיעורים'
                        case 'attendance': return 'נוכחות'
                        case 'orchestras': return 'תזמורות'
                        case 'documents': return 'מסמכים'
                        case 'theoryClasses': return 'תיאוריה'
                        case 'payments': return 'תשלומים'
                        default: return collection
                      }
                    }

                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        {getIcon()}
                        <span>{getName()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Detailed Numbers */}
            {Object.keys(preview.details || {}).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">פירוט מדויק:</h4>
                <div className="space-y-2">
                  {Object.entries(preview.details).map(([key, items]: [string, any]) => {
                    const count = Array.isArray(items) ? items.length : items.count || 0
                    if (count === 0) return null

                    return (
                      <div key={key} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span className="capitalize">
                          {key === 'lessons' ? 'שיעורים' :
                           key === 'attendance' ? 'נוכחות' :
                           key === 'orchestras' ? 'תזמורות' :
                           key === 'documents' ? 'מסמכים' :
                           key === 'theoryClasses' ? 'תיאוריה' :
                           key}:
                        </span>
                        <span className="font-medium">{count} רשומות</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Warnings */}
            {preview.warnings?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">אזהרות:</h4>
                <div className="space-y-2">
                  {preview.warnings.map((warning: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span className="text-yellow-800">{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {preview.dependencies?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">תלויות קריטיות:</h4>
                <div className="space-y-2">
                  {preview.dependencies.map((dependency: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-900">{dependency.type}: {dependency.entity}</div>
                        <div className="text-red-700">{dependency.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Info */}
            {lastUpdated && (
              <div className="text-xs text-gray-500 text-center pt-2 border-t">
                עודכן לאחרונה: {lastUpdated.toLocaleString('he-IL')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DeletionImpactSummary