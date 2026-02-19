import React, { useState, useRef, useCallback } from 'react'
import { importService } from '../services/apiService'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { StepProgress } from '../components/feedback/ProgressIndicators'
import toast from 'react-hot-toast'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  GraduationCap,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'

type ImportTab = 'teachers' | 'students'
type ImportState = 'upload' | 'preview' | 'results'

interface PreviewRow {
  row: number
  status: 'matched' | 'not_found' | 'error'
  name?: string
  data?: Record<string, any>
  changes?: string[]
  error?: string
}

interface PreviewData {
  importLogId: string
  preview: {
    totalRows: number
    matched: PreviewRow[]
    notFound: PreviewRow[]
    errors: PreviewRow[]
    warnings: string[]
  }
}

interface ImportResult {
  totalRows: number
  successCount: number
  errorCount: number
  skippedCount: number
  errors: Array<{ row: number; message: string }>
}

const IMPORT_STEPS = [
  { id: 'upload', label: 'העלאת קובץ' },
  { id: 'preview', label: 'תצוגה מקדימה' },
  { id: 'results', label: 'תוצאות' },
] as const

export default function ImportData() {
  const [activeTab, setActiveTab] = useState<ImportTab>('teachers')
  const [importState, setImportState] = useState<ImportState>('upload')
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [results, setResults] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setImportState('upload')
    setPreviewData(null)
    setResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab)
    resetState()
  }

  const getImportSteps = () => {
    const order = ['upload', 'preview', 'results'] as const
    const currentIdx = order.indexOf(importState)
    return IMPORT_STEPS.map((step, idx) => ({
      ...step,
      description: undefined as string | undefined,
      status: (idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'pending') as 'completed' | 'current' | 'pending',
    }))
  }

  const handleFile = useCallback(async (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      toast.error('יש להעלות קובץ Excel בלבד (.xlsx / .xls)')
      return
    }

    try {
      setLoading(true)
      const result = activeTab === 'teachers'
        ? await importService.previewTeacherImport(file)
        : await importService.previewStudentImport(file)

      setPreviewData(result)
      setImportState('preview')
    } catch (error: any) {
      console.error('Error previewing import:', error)
      toast.error(error.message || 'שגיאה בעיבוד הקובץ')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleExecute = async () => {
    if (!previewData?.importLogId) return

    try {
      setExecuting(true)
      const result = await importService.executeImport(previewData.importLogId)
      setResults(result)
      setImportState('results')
      toast.success(`הייבוא הושלם: ${result.successCount} עודכנו`)
    } catch (error: any) {
      console.error('Error executing import:', error)
      toast.error(error.message || 'שגיאה בביצוע הייבוא')
    } finally {
      setExecuting(false)
    }
  }

  const getRowStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'bg-green-50 border-green-200'
      case 'not_found': return 'bg-yellow-50 border-yellow-200'
      case 'error': return 'bg-red-50 border-red-200'
      default: return 'bg-white'
    }
  }

  const getRowStatusLabel = (status: string) => {
    switch (status) {
      case 'matched': return 'יעודכן'
      case 'not_found': return 'לא נמצא'
      case 'error': return 'שגיאה'
      default: return status
    }
  }

  const getRowStatusIcon = (status: string) => {
    switch (status) {
      case 'matched': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'not_found': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />
      default: return null
    }
  }

  const allPreviewRows: PreviewRow[] = previewData
    ? [...previewData.preview.matched, ...previewData.preview.notFound, ...previewData.preview.errors]
        .sort((a, b) => a.row - b.row)
    : []

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ייבוא נתונים</h1>
          <p className="text-sm text-gray-500">ייבוא מורים ותלמידים מקובץ Excel</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTabChange('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'teachers'
              ? 'bg-muted text-primary border border-border'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          ייבוא מורים
        </button>
        <button
          onClick={() => handleTabChange('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-muted text-primary border border-border'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          ייבוא תלמידים
        </button>
      </div>

      {/* Step Progress Indicator */}
      <div className="mb-6">
        <StepProgress
          steps={getImportSteps()}
          direction="horizontal"
        />
      </div>

      {/* Upload State */}
      {importState === 'upload' && (
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-600">מעבד את הקובץ...</p>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-primary bg-muted'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className={`w-12 h-12 mb-4 ${dragActive ? 'text-primary' : 'text-gray-400'}`} />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  גרור קובץ לכאן או לחץ לבחירה
                </p>
                <p className="text-sm text-gray-500">
                  קבצים נתמכים: .xlsx, .xls
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview State */}
      {importState === 'preview' && previewData && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{previewData.preview.totalRows}</p>
                  <p className="text-sm text-gray-500">סה"כ שורות</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{previewData.preview.matched.length}</p>
                  <p className="text-sm text-gray-500">נמצאו</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{previewData.preview.notFound.length}</p>
                  <p className="text-sm text-gray-500">לא נמצאו</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{previewData.preview.errors.length}</p>
                  <p className="text-sm text-gray-500">שגיאות</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warnings */}
          {previewData.preview.warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {previewData.preview.warnings.map((w, i) => (
                      <p key={i} className="text-sm text-amber-700">{w}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">תצוגה מקדימה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-3 font-medium text-gray-700">שורה</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-700">סטטוס</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-700">שם</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-700">שינויים / הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPreviewRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 ${getRowStatusColor(row.status)}`}>
                        <td className="py-2 px-3 text-gray-600">{row.row}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            {getRowStatusIcon(row.status)}
                            <span className="text-xs font-medium">{getRowStatusLabel(row.status)}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-medium text-gray-900">{row.name || '—'}</td>
                        <td className="py-2 px-3 text-gray-600">
                          {row.changes && row.changes.length > 0 && (
                            <span className="text-xs">{row.changes.join(', ')}</span>
                          )}
                          {row.error && (
                            <span className="text-xs text-red-600">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allPreviewRows.length > 50 && (
                  <p className="text-sm text-gray-400 text-center py-3">
                    מוצגות 50 מתוך {allPreviewRows.length} שורות
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              ביטול
            </button>
            <button
              onClick={handleExecute}
              disabled={executing || previewData.preview.matched.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {executing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  מבצע ייבוא...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  אשר ייבוא ({previewData.preview.matched.length} שורות)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results State */}
      {importState === 'results' && results && (
        <div className="space-y-4">
          {/* Results Summary */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <h2 className="text-xl font-bold text-green-800">הייבוא הושלם</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{results.totalRows}</p>
                  <p className="text-sm text-gray-600">סה"כ שורות</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{results.successCount}</p>
                  <p className="text-sm text-gray-600">עודכנו</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{results.skippedCount}</p>
                  <p className="text-sm text-gray-600">דולגו</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{results.errorCount}</p>
                  <p className="text-sm text-gray-600">שגיאות</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Details */}
          {results.errors.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-lg">פרטי שגיאות</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.errors.map((err, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-500 font-mono">שורה {err.row}:</span>
                      <span className="text-red-600">{err.message}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Reset Button */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              ייבוא קובץ נוסף
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
