import React from 'react'
import { X, Database, AlertCircle, Users, Calendar, Music, FileText, CreditCard, BookOpen } from 'lucide-react'

interface DeletionImpactModalProps {
  isOpen: boolean
  preview: any
  onClose: () => void
}

const DeletionImpactModal: React.FC<DeletionImpactModalProps> = ({
  isOpen,
  preview,
  onClose
}) => {
  if (!isOpen || !preview) return null

  const getCollectionIcon = (collection: string) => {
    switch (collection) {
      case 'lessons': return <Calendar className="w-4 h-4" />
      case 'attendance': return <Users className="w-4 h-4" />
      case 'orchestras': return <Music className="w-4 h-4" />
      case 'theoryClasses': return <BookOpen className="w-4 h-4" />
      case 'documents': return <FileText className="w-4 h-4" />
      case 'payments': return <CreditCard className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const getCollectionName = (collection: string) => {
    switch (collection) {
      case 'lessons': return 'שיעורים'
      case 'attendance': return 'נוכחות'
      case 'orchestras': return 'תזמורות'
      case 'theoryClasses': return 'תיאוריה'
      case 'documents': return 'מסמכים'
      case 'payments': return 'תשלומים'
      case 'rehearsals': return 'חזרות'
      case 'assignments': return 'הקצאות'
      default: return collection
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">השפעת המחיקה</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">סיכום כללי</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm text-blue-600 mb-1">סה"כ רשומות</div>
                <div className="text-2xl font-bold text-blue-900">
                  {preview.summary?.totalRecords || 0}
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="text-sm text-green-600 mb-1">זמן משוער</div>
                <div className="text-2xl font-bold text-green-900">
                  {preview.summary?.estimatedDuration || 0}s
                </div>
              </div>
              
              <div className={`p-4 border rounded ${
                preview.summary?.riskLevel === 'high' ? 'bg-red-50 border-red-200' :
                preview.summary?.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className={`text-sm mb-1 ${
                  preview.summary?.riskLevel === 'high' ? 'text-red-600' :
                  preview.summary?.riskLevel === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  רמת סיכון
                </div>
                <div className={`text-2xl font-bold ${
                  preview.summary?.riskLevel === 'high' ? 'text-red-900' :
                  preview.summary?.riskLevel === 'medium' ? 'text-yellow-900' :
                  'text-green-900'
                }`}>
                  {preview.summary?.riskLevel === 'high' ? 'גבוהה' :
                   preview.summary?.riskLevel === 'medium' ? 'בינונית' : 'נמוכה'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">פירוט מפורט</h3>
            <div className="space-y-4">
              {Object.entries(preview.details || {}).map(([collection, items]: [string, any]) => {
                if (!items || (Array.isArray(items) && items.length === 0)) return null
                
                const count = Array.isArray(items) ? items.length : items.count || 0
                if (count === 0) return null

                return (
                  <div key={collection} className="border border-gray-200 rounded overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50">
                      <div className="flex items-center gap-3">
                        {getCollectionIcon(collection)}
                        <span className="font-medium text-gray-900">
                          {getCollectionName(collection)}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {count} רשומות
                      </div>
                    </div>
                    
                    {Array.isArray(items) && items.length > 0 && (
                      <div className="p-4 max-h-40 overflow-y-auto">
                        <div className="space-y-2">
                          {items.slice(0, 10).map((item: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                              {item.title || item.name || item.date || `פריט ${index + 1}`}
                            </div>
                          ))}
                          {items.length > 10 && (
                            <div className="text-sm text-gray-500 text-center py-2">
                              ועוד {items.length - 10} פריטים...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dependencies */}
          {preview.dependencies?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">תלויות</h3>
              <div className="space-y-2">
                {preview.dependencies.map((dependency: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-orange-900">
                        {dependency.type}: {dependency.entity}
                      </div>
                      <div className="text-sm text-orange-700">
                        {dependency.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {preview.warnings?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">אזהרות</h3>
              <div className="space-y-2">
                {preview.warnings.map((warning: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-yellow-800">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="border-t pt-4">
            <div className={`p-4 rounded ${
              preview.canProceed 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  preview.canProceed ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={`font-medium ${
                  preview.canProceed ? 'text-green-900' : 'text-red-900'
                }`}>
                  {preview.canProceed 
                    ? 'ניתן לבצע מחיקה' 
                    : 'לא ניתן לבצע מחיקה עקב תלויות קריטיות'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-neutral-800 transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeletionImpactModal