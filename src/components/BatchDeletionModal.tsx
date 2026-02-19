import React, { useState, useEffect } from 'react'
import { X, Users, Trash2, Shield, AlertTriangle, CheckCircle, XCircle, Loader, Clock, Database } from 'lucide-react'
import { cascadeDeletionService } from '../services/cascadeDeletionService'

interface BatchDeletionModalProps {
  isOpen: boolean
  selectedStudentIds: string[]
  onClose: () => void
  onComplete: () => void
}

interface BatchPreview {
  studentId: string
  studentName?: string
  canDelete: boolean
  riskLevel: 'low' | 'medium' | 'high'
  totalRecords: number
  warnings: string[]
  errors: string[]
}

const BatchDeletionModal: React.FC<BatchDeletionModalProps> = ({
  isOpen,
  selectedStudentIds,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState<'preview' | 'confirm' | 'progress' | 'complete'>('preview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<BatchPreview[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: '' })
  const [results, setResults] = useState<{ success: number, failed: number, details: any[] }>({ success: 0, failed: 0, details: [] })

  useEffect(() => {
    if (isOpen && selectedStudentIds.length > 0) {
      loadPreviews()
    }
  }, [isOpen, selectedStudentIds])

  const loadPreviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const previewPromises = selectedStudentIds.map(async (studentId) => {
        try {
          const preview = await cascadeDeletionService.previewDeletion(studentId)
          return {
            studentId,
            studentName: `תלמיד ${studentId}`, // You might want to fetch actual name
            canDelete: preview.canProceed,
            riskLevel: preview.summary?.riskLevel || 'low',
            totalRecords: preview.summary?.totalRecords || 0,
            warnings: preview.warnings || [],
            errors: []
          }
        } catch (err) {
          return {
            studentId,
            studentName: `תלמיד ${studentId}`,
            canDelete: false,
            riskLevel: 'high' as const,
            totalRecords: 0,
            warnings: [],
            errors: [err.message || 'שגיאה בטעינת תצוגה מקדימה']
          }
        }
      })

      const previewResults = await Promise.all(previewPromises)
      setPreviews(previewResults)
    } catch (err) {
      console.error('Error loading batch previews:', err)
      setError(err.message || 'שגיאה בטעינת תצוגות מקדימות')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBatch = async () => {
    const deletableStudents = previews.filter(p => p.canDelete)
    if (deletableStudents.length === 0) {
      setError('אין תלמידים שניתן למחוק')
      return
    }

    setStep('progress')
    setProgress({ current: 0, total: deletableStudents.length, stage: 'מתחיל מחיקה...' })

    const deleteResults = []
    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < deletableStudents.length; i++) {
      const student = deletableStudents[i]
      setProgress({ 
        current: i + 1, 
        total: deletableStudents.length, 
        stage: `מוחק ${student.studentName}...` 
      })

      try {
        await cascadeDeletionService.executeDelete(student.studentId, {
          createSnapshot: true,
          batchMode: true,
          batchIndex: i + 1,
          batchTotal: deletableStudents.length
        })
        
        successCount++
        deleteResults.push({
          studentId: student.studentId,
          studentName: student.studentName,
          success: true,
          error: null
        })
      } catch (err) {
        failedCount++
        deleteResults.push({
          studentId: student.studentId,
          studentName: student.studentName,
          success: false,
          error: err.message || 'שגיאה במחיקה'
        })
      }

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setResults({ success: successCount, failed: failedCount, details: deleteResults })
    setStep('complete')
  }

  const handleClose = () => {
    if (step === 'progress') {
      // Don't allow closing during deletion
      return
    }
    
    if (step === 'complete' && results.success > 0) {
      onComplete() // Trigger refresh
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  const deletableCount = previews.filter(p => p.canDelete).length
  const highRiskCount = previews.filter(p => p.riskLevel === 'high').length
  const totalRecords = previews.reduce((sum, p) => sum + p.totalRecords, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              מחיקה מרובת תלמידים ({selectedStudentIds.length})
            </h2>
          </div>
          <button 
            onClick={handleClose} 
            disabled={step === 'progress'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Preview Step */}
          {step === 'preview' && (
            <div className="p-6">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-gray-600">טוען תצוגות מקדימות...</span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">שגיאה</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              )}

              {previews.length > 0 && !loading && (
                <>
                  {/* Summary */}
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded text-center">
                      <div className="text-2xl font-bold text-blue-900">{selectedStudentIds.length}</div>
                      <div className="text-sm text-blue-600">נבחרו</div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
                      <div className="text-2xl font-bold text-green-900">{deletableCount}</div>
                      <div className="text-sm text-green-600">ניתן למחוק</div>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded text-center">
                      <div className="text-2xl font-bold text-red-900">{highRiskCount}</div>
                      <div className="text-sm text-red-600">סיכון גבוה</div>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
                      <div className="text-2xl font-bold text-gray-900">{totalRecords}</div>
                      <div className="text-sm text-gray-600">סה"כ רשומות</div>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="space-y-3">
                    {previews.map((preview) => (
                      <div key={preview.studentId} className="border border-gray-200 rounded p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {preview.canDelete ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-medium">{preview.studentName}</span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              preview.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                              preview.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {preview.riskLevel === 'high' ? 'סיכון גבוה' :
                               preview.riskLevel === 'medium' ? 'סיכון בינוני' :
                               'סיכון נמוך'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {preview.totalRecords} רשומות
                          </div>
                        </div>

                        {preview.warnings.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {preview.warnings.map((warning, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-yellow-700">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {preview.errors.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {preview.errors.map((error, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-red-700">
                                <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Progress Step */}
          {step === 'progress' && (
            <div className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <Loader className="w-12 h-12 animate-spin text-red-600 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">מבצע מחיקה...</h3>
                <p className="text-gray-600 mb-6">{progress.stage}</p>
                
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{progress.current} מתוך {progress.total}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  אנא המתן עד לסיום הפעולה. אל תסגור את החלון.
                </p>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">המחיקה הושלמה</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
                  <div className="text-2xl font-bold text-green-900">{results.success}</div>
                  <div className="text-sm text-green-600">נמחקו בהצלחה</div>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded text-center">
                  <div className="text-2xl font-bold text-red-900">{results.failed}</div>
                  <div className="text-sm text-red-600">נכשלו</div>
                </div>
              </div>

              {results.details.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">פירוט מלא:</h4>
                  {results.details.map((detail, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded ${
                      detail.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      {detail.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="flex-1">{detail.studentName}</span>
                      {detail.error && (
                        <span className="text-sm text-red-600">{detail.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'progress' && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {step === 'preview' && (
                <>
                  <Database className="w-4 h-4" />
                  <span>מוכן למחיקת {deletableCount} תלמידים</span>
                </>
              )}
              {step === 'complete' && (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>הושלמו {results.success} מחיקות</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                {step === 'complete' ? 'סגור' : 'ביטול'}
              </button>
              
              {step === 'preview' && deletableCount > 0 && (
                <button
                  onClick={handleConfirmBatch}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  מחק {deletableCount} תלמידים
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchDeletionModal