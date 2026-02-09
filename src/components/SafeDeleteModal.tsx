import React, { useState, useEffect } from 'react'
import { X, AlertTriangle, Shield, Database, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import { cascadeDeletionService } from '../services/cascadeDeletionService'

interface SafeDeleteModalProps {
  isOpen: boolean
  studentId: string
  studentName: string
  onClose: () => void
  onConfirm: (studentId: string, options: any) => void
}

const SafeDeleteModal: React.FC<SafeDeleteModalProps> = ({
  isOpen,
  studentId,
  studentName,
  onClose,
  onConfirm
}) => {
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteOptions, setDeleteOptions] = useState({
    createSnapshot: true,
    skipValidation: false,
    deleteDocuments: true,
    notifyUsers: false,
    reason: 'Safe deletion via UI'
  })

  useEffect(() => {
    if (isOpen && studentId) {
      loadPreview()
    }
  }, [isOpen, studentId])

  const loadPreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const previewData = await cascadeDeletionService.previewDeletion(studentId)
      setPreview(previewData)
    } catch (err) {
      console.error('Error loading deletion preview:', err)
      setError(err.message || 'שגיאה בטעינת תצוגה מקדימה')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onConfirm(studentId, deleteOptions)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">מחיקה מאובטחת</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Student Info */}
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-900">
                מחיקת התלמיד: {studentName}
              </span>
            </div>
            <p className="text-sm text-orange-700">
              פעולה זו תמחק את התלמיד וכל הנתונים הקשורים אליו. המערכת תבצע בדיקות בטיחות ותיצור גיבוי לפני המחיקה.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">טוען תצוגה מקדימה...</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">שגיאה</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {preview && (
            <>
              {/* Impact Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">סיכום השפעה</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">סה"כ רשומות</div>
                    <div className="text-xl font-bold text-gray-900">
                      {preview.summary?.totalRecords || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">זמן משוער</div>
                    <div className="text-xl font-bold text-gray-900">
                      {preview.summary?.estimatedDuration || 0} שניות
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Level */}
              <div className="mb-6">
                <div className={`p-4 rounded-lg border ${
                  preview.summary?.riskLevel === 'high' ? 'bg-red-50 border-red-200' :
                  preview.summary?.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Database className={`w-5 h-5 ${
                      preview.summary?.riskLevel === 'high' ? 'text-red-600' :
                      preview.summary?.riskLevel === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    <span className="font-medium">
                      רמת סיכון: {
                        preview.summary?.riskLevel === 'high' ? 'גבוהה' :
                        preview.summary?.riskLevel === 'medium' ? 'בינונית' :
                        'נמוכה'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Affected Collections */}
              {preview.summary?.affectedCollections?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">אזורים מושפעים</h3>
                  <div className="space-y-2">
                    {preview.summary.affectedCollections.map((collection: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{collection}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {preview.warnings?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">אזהרות</h3>
                  <div className="space-y-2">
                    {preview.warnings.map((warning: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-yellow-800">{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Delete Options */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">אפשרויות מחיקה</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deleteOptions.createSnapshot}
                  onChange={(e) => setDeleteOptions(prev => ({ 
                    ...prev, 
                    createSnapshot: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">צור גיבוי לפני המחיקה (מומלץ)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteDocuments}
                  onChange={(e) => setDeleteOptions(prev => ({ 
                    ...prev, 
                    deleteDocuments: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">מחק גם קבצים ומסמכים</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deleteOptions.notifyUsers}
                  onChange={(e) => setDeleteOptions(prev => ({ 
                    ...prev, 
                    notifyUsers: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">שלח התראות למורים קשורים</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deleteOptions.skipValidation}
                  onChange={(e) => setDeleteOptions(prev => ({ 
                    ...prev, 
                    skipValidation: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">דלג על בדיקות תקינות (לא מומלץ)</span>
              </label>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיבת המחיקה
            </label>
            <textarea
              value={deleteOptions.reason}
              onChange={(e) => setDeleteOptions(prev => ({ 
                ...prev, 
                reason: e.target.value 
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="הזן סיבה למחיקה..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>המחיקה תחל לאחר אישור</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={loading || !preview?.canProceed}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-4 h-4" />
              מחק באופן מאובטח
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SafeDeleteModal