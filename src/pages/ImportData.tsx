import React, { useState, useRef, useCallback } from 'react'
import { importService } from '../services/apiService'
import { StepProgress } from '../components/feedback/ProgressIndicators'
import toast from 'react-hot-toast'
import {
  UploadIcon,
  FileXlsIcon,
  CheckCircleIcon,
  XCircleIcon,
  WarningIcon,
  UsersIcon,
  GraduationCapIcon,
  ArrowsClockwiseIcon,
  ArrowLeftIcon,
  PlusIcon,
  InfoIcon,
} from '@phosphor-icons/react'

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
    matched: any[]      // Backend returns full objects, not just PreviewRow
    notFound: any[]
    errors: any[]
    warnings: any[]
    headerRowIndex?: number     // NEW: detected header row (0 = standard)
    matchedColumns?: number     // NEW: how many columns matched
    instrumentColumnsDetected?: string[]  // existing for teachers
  }
}

interface ImportResult {
  totalRows: number
  successCount: number
  createdCount: number       // NEW: count of created students
  errorCount: number
  skippedCount: number
  matchedCount: number       // NEW: total matched rows
  notFoundCount: number      // NEW: total unmatched rows
  errors: Array<{ row?: number; message?: string; error?: string; studentName?: string }>
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

      // Show breakdown toast
      const parts = []
      if (result.successCount > 0) parts.push(`${result.successCount} עודכנו`)
      if (result.createdCount > 0) parts.push(`${result.createdCount} נוצרו`)
      toast.success(`הייבוא הושלם: ${parts.join(', ')}`)
    } catch (error: any) {
      console.error('Error executing import:', error)
      toast.error(error.message || 'שגיאה בביצוע הייבוא')
    } finally {
      setExecuting(false)
    }
  }

  const getRowStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircleIcon size={12} weight="fill" />
            עדכון
          </span>
        )
      case 'not_found':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <PlusIcon size={12} weight="bold" />
            יצירה
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircleIcon size={12} weight="fill" />
            שגיאה
          </span>
        )
      default:
        return null
    }
  }

  const allPreviewRows = previewData
    ? [
        ...previewData.preview.matched.map((r: any) => ({ ...r, status: 'matched' as const, name: r.importedName || r.studentName || r.teacherName })),
        ...previewData.preview.notFound.map((r: any) => ({ ...r, status: 'not_found' as const, name: r.importedName })),
        ...previewData.preview.errors.map((r: any) => ({ ...r, status: 'error' as const, name: '', error: r.message })),
      ].sort((a, b) => (a.row || 0) - (b.row || 0))
    : []

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
          <UploadIcon size={20} weight="regular" className="text-primary-600" />
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'teachers'
              ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <GraduationCapIcon size={16} weight="regular" />
          ייבוא מורים
        </button>
        <button
          onClick={() => handleTabChange('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <UsersIcon size={16} weight="regular" />
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
        <div className="space-y-6">
          {/* File Structure Guide — only show for students tab */}
          {activeTab === 'students' && (
            <div className="rounded-3xl shadow-sm bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">מבנה הקובץ הנדרש</h3>

              {/* Ministry compatibility banner */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
                <div className="flex items-start gap-2">
                  <InfoIcon size={20} weight="fill" className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">תומך בקבצי מימשק משרד החינוך</p>
                    <p className="text-xs text-blue-700 mt-0.5">המערכת מזהה אוטומטית שורות מטא-דאטה ועמודות משתנות</p>
                  </div>
                </div>
              </div>

              {/* Column guide */}
              <div className="space-y-0 text-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700 w-28">עמודה</span>
                  <span className="font-medium text-gray-700 flex-1">שמות אפשריים</span>
                  <span className="font-medium text-gray-700 w-24 text-center">סטטוס</span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">שם תלמיד</span>
                  <span className="text-gray-500 flex-1 text-xs">שם פרטי + שם משפחה, או שם ומשפחה</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">חובה</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">כלי נגינה</span>
                  <span className="text-gray-500 flex-1 text-xs">כלי, כלי נגינה, או עמודות מחלקות (כלי קשת, כלי נשיפה...)</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">מומלץ</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">כיתה</span>
                  <span className="text-gray-500 flex-1 text-xs">כיתה</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">שנות לימוד</span>
                  <span className="text-gray-500 flex-1 text-xs">שנות לימוד, שנת לימוד</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">שעה נוספת</span>
                  <span className="text-gray-500 flex-1 text-xs">שעה נוספת, שעה נוספת ל.., שעה נוספת לבחירת התלמיד</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">זיהוי אוטומטי</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5">
                  <span className="text-gray-700 w-28 font-medium">זמן שיעור</span>
                  <span className="text-gray-500 flex-1 text-xs">זמן שעור (שעות שבועיות: 0.75 = 45 דק')</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">זיהוי אוטומטי</span></span>
                </div>
              </div>
            </div>
          )}

          {/* Upload Zone */}
          <div className="rounded-3xl shadow-sm bg-white p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-4"></div>
                <p className="text-gray-600">מעבד את הקובץ...</p>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-3xl cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-500/5'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <FileXlsIcon size={48} weight="regular" className={`mb-4 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
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
          </div>
        </div>
      )}

      {/* Preview State */}
      {importState === 'preview' && previewData && (
        <div className="space-y-6">
          {/* Header Detection Banner — only show when header row > 0 */}
          {previewData.preview.headerRowIndex != null && previewData.preview.headerRowIndex > 0 && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start gap-2">
                <InfoIcon size={20} weight="fill" className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    שורת כותרות זוהתה בשורה {previewData.preview.headerRowIndex + 1}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {previewData.preview.headerRowIndex} שורות מטא-דאטה דולגו אוטומטית
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stat Cards — v4.0 gradient style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Rows */}
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{previewData.preview.totalRows}</p>
                <p className="text-sm text-gray-500">סה"כ שורות</p>
              </div>
            </div>

            {/* Updates (matched) */}
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{previewData.preview.matched.length}</p>
                <p className="text-sm text-gray-500">עדכונים</p>
              </div>
            </div>

            {/* Creates (notFound) */}
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{previewData.preview.notFound.length}</p>
                <p className="text-sm text-gray-500">יצירות חדשות</p>
              </div>
            </div>

            {/* Errors */}
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-red-500/10 to-red-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{previewData.preview.errors.length}</p>
                <p className="text-sm text-gray-500">שגיאות</p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {previewData.preview.warnings.length > 0 && (
            <div className="rounded-3xl shadow-sm bg-amber-50 border border-amber-200 p-6">
              <div className="flex items-start gap-2">
                <WarningIcon size={20} weight="fill" className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {previewData.preview.warnings.slice(0, 10).map((w: any, i: number) => (
                    <p key={i} className="text-sm text-amber-700">
                      {typeof w === 'string' ? w : `שורה ${w.row}: ${w.message}`}
                    </p>
                  ))}
                  {previewData.preview.warnings.length > 10 && (
                    <p className="text-xs text-amber-500">
                      ועוד {previewData.preview.warnings.length - 10} אזהרות...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="rounded-3xl shadow-sm bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">תצוגה מקדימה</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">שורה</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">סטטוס</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">שם</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">שינויים / הערות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allPreviewRows.slice(0, 50).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-4 text-gray-500 font-mono text-xs">{row.row}</td>
                      <td className="py-2.5 px-4">{getRowStatusBadge(row.status)}</td>
                      <td className="py-2.5 px-4 font-medium text-gray-900">{row.name || '---'}</td>
                      <td className="py-2.5 px-4 text-gray-600 text-xs">
                        {row.changes && row.changes.length > 0 && (
                          <span>{row.changes.map((c: any) => c.field || c).join(', ')}</span>
                        )}
                        {row.status === 'not_found' && !row.error && (
                          <span className="text-blue-600">תלמיד חדש - ייווצר ברשומה חדשה</span>
                        )}
                        {row.error && (
                          <span className="text-red-600">{row.error}</span>
                        )}
                        {row.status === 'matched' && (!row.changes || row.changes.length === 0) && (
                          <span className="text-gray-400">אין שינויים</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allPreviewRows.length > 50 && (
                <div className="text-center py-3 border-t border-gray-100">
                  <p className="text-sm text-gray-400">
                    מוצגות 50 מתוך {allPreviewRows.length} שורות
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon size={16} weight="regular" />
              ביטול
            </button>
            <button
              onClick={handleExecute}
              disabled={executing || (previewData.preview.matched.length === 0 && previewData.preview.notFound.length === 0)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              {executing ? (
                <>
                  <ArrowsClockwiseIcon size={16} weight="regular" className="animate-spin" />
                  מבצע ייבוא...
                </>
              ) : (
                <>
                  <CheckCircleIcon size={16} weight="fill" />
                  אשר ייבוא ({previewData.preview.matched.length + previewData.preview.notFound.length} שורות)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results State */}
      {importState === 'results' && results && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircleIcon size={32} weight="fill" className="text-green-600" />
              <h2 className="text-xl font-bold text-green-800">הייבוא הושלם</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{results.totalRows}</p>
                <p className="text-sm text-gray-600">סה"כ שורות</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{results.successCount}</p>
                <p className="text-sm text-gray-600">עודכנו</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{results.createdCount || 0}</p>
                <p className="text-sm text-gray-600">נוצרו</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{results.skippedCount}</p>
                <p className="text-sm text-gray-600">דולגו</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{results.errorCount}</p>
                <p className="text-sm text-gray-600">שגיאות</p>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {results.errors.length > 0 && (
            <div className="rounded-3xl shadow-sm bg-white border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
                <div className="flex items-center gap-2">
                  <XCircleIcon size={20} weight="fill" className="text-red-500" />
                  <h3 className="text-lg font-bold text-gray-900">פרטי שגיאות</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {results.errors.map((err: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {err.row && <span className="text-gray-400 font-mono text-xs">שורה {err.row}:</span>}
                      {err.studentName && <span className="text-gray-600 font-medium">{err.studentName}</span>}
                      <span className="text-red-600">{err.message || err.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              <UploadIcon size={16} weight="regular" />
              ייבוא קובץ נוסף
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
