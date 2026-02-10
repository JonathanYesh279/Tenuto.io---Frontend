import React, { useState, useEffect } from 'react'
import { exportService } from '../services/apiService'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import StatsCard from '../components/ui/StatsCard'
import { Progress } from '../components/ui/progress'
import toast from 'react-hot-toast'
import {
  FileText,
  Download,
  Users,
  GraduationCap,
  Music,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'

interface ExportStatus {
  completionPercentage: number
  missing: Array<{ type: string; id: string; name: string; field: string; message: string }>
  counts: {
    teachers: number
    students: number
    orchestras: number
    theoryLessons: number
  }
}

interface ValidationResult {
  warnings: Array<{ type: string; message: string }>
  errors: Array<{ type: string; message: string }>
  isValid: boolean
}

const REPORT_SECTIONS = [
  { key: 'teachers', title: 'מצבת כח-אדם להוראה', icon: GraduationCap, color: 'blue' as const },
  { key: 'students', title: 'נתוני תלמידים', icon: Users, color: 'green' as const },
  { key: 'orchestras', title: 'שיבוץ תלמידים להרכבים', icon: Music, color: 'purple' as const },
  { key: 'theory', title: 'תורת המוזיקה', icon: BookOpen, color: 'orange' as const },
  { key: 'schedule', title: 'לוח הרכבי ביצוע', icon: Calendar, color: 'teal' as const },
]

export default function MinistryReports() {
  const [status, setStatus] = useState<ExportStatus | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statusData, validationData] = await Promise.allSettled([
        exportService.getStatus(),
        exportService.validate(),
      ])

      if (statusData.status === 'fulfilled') {
        setStatus(statusData.value)
      }
      if (validationData.status === 'fulfilled') {
        setValidation(validationData.value)
      }
    } catch (error) {
      console.error('Error loading report data:', error)
      toast.error('שגיאה בטעינת נתוני הדוח')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast.success('הנתונים עודכנו')
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const blob = await exportService.download()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ministry-report-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('הדוח הורד בהצלחה')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('שגיאה בהורדת הדוח')
    } finally {
      setDownloading(false)
    }
  }

  // Group missing items by type
  const groupedMissing = (status?.missing || []).reduce<Record<string, typeof status.missing>>((acc, item) => {
    const type = item.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(item)
    return acc
  }, {})

  const missingTypeLabels: Record<string, string> = {
    teacher: 'מורים',
    student: 'תלמידים',
    orchestra: 'תזמורות',
    other: 'אחר',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען נתוני דוחות...</div>
        </div>
      </div>
    )
  }

  const completionPct = status?.completionPercentage ?? 0

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוחות משרד החינוך</h1>
            <p className="text-sm text-gray-500">סטטוס השלמת הנתונים והורדת דוח</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          רענן
        </button>
      </div>

      {/* Overall Completion */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">אחוז השלמה כולל</span>
            <span className="text-2xl font-bold text-primary-600">{completionPct}%</span>
          </div>
          <Progress value={completionPct} />
          <p className="text-xs text-gray-500 mt-2">
            {completionPct === 100
              ? 'כל הנתונים מלאים — ניתן להוריד את הדוח'
              : 'יש להשלים את הנתונים החסרים לפני הורדת הדוח'}
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {status?.counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="מורים"
            value={status.counts.teachers}
            icon={<GraduationCap className="w-6 h-6" />}
            color="blue"
          />
          <StatsCard
            title="תלמידים"
            value={status.counts.students}
            icon={<Users className="w-6 h-6" />}
            color="green"
          />
          <StatsCard
            title="תזמורות"
            value={status.counts.orchestras}
            icon={<Music className="w-6 h-6" />}
            color="purple"
          />
          <StatsCard
            title="שיעורי תיאוריה"
            value={status.counts.theoryLessons}
            icon={<BookOpen className="w-6 h-6" />}
            color="orange"
          />
        </div>
      )}

      {/* Report Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {REPORT_SECTIONS.map(section => {
          const Icon = section.icon
          return (
            <Card key={section.key} hover>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${section.color === 'blue' ? 'primary' : section.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${section.color === 'blue' ? 'primary' : section.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{section.title}</h3>
                    <p className="text-xs text-gray-500">גיליון דוח</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Missing Data */}
      {Object.keys(groupedMissing).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg">נתונים חסרים</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedMissing).map(([type, items]) => (
                <div key={type}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {missingTypeLabels[type] || type} ({items.length})
                  </h4>
                  <ul className="space-y-1">
                    {items.slice(0, 10).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <span className="font-medium">{item.name || item.id}</span>
                          {item.message && <span className="text-gray-400"> — {item.message}</span>}
                        </span>
                      </li>
                    ))}
                    {items.length > 10 && (
                      <li className="text-sm text-gray-400 pr-6">
                        ועוד {items.length - 10} פריטים...
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Warnings */}
      {validation && (validation.warnings.length > 0 || validation.errors.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <CardTitle className="text-lg">אימות נתונים</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validation.errors.map((err, idx) => (
                <div key={`err-${idx}`} className="flex items-start gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700">{err.message}</span>
                </div>
              ))}
              {validation.warnings.map((warn, idx) => (
                <div key={`warn-${idx}`} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-amber-700">{warn.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Success */}
      {validation?.isValid && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">כל הנתונים תקינים</h3>
                <p className="text-sm text-green-600">ניתן להוריד את הדוח למשרד החינוך</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Button */}
      <div className="flex justify-center pb-8">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium shadow-sm"
        >
          <Download className="w-5 h-5" />
          {downloading ? 'מוריד...' : 'הורד דוח מלא'}
        </button>
      </div>
    </div>
  )
}
