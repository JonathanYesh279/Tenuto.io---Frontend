import React, { useState, useEffect } from 'react'
import { exportService, schoolYearService } from '../services/apiService'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import StatsCard from '../components/ui/StatsCard'
import { Progress } from '../components/ui/progress'
import { StepProgress } from '../components/feedback/ProgressIndicators'
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
  Clock,
  Info,
} from 'lucide-react'

interface MissingItem {
  type: string
  name: string
  field: string
}

interface PreExportItem {
  type: string
  message: string
}

interface ExportStatus {
  completionPercentage: number
  missing: MissingItem[]
  preExportErrors: PreExportItem[]
  preExportWarnings: PreExportItem[]
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

interface SchoolYear {
  _id: string
  name: string
  startDate: string
  endDate: string
  isCurrent?: boolean
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
  const [endpointsAvailable, setEndpointsAvailable] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')

  useEffect(() => {
    loadSchoolYears()
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const loadSchoolYears = async () => {
    try {
      const years = await schoolYearService.getSchoolYears()
      setSchoolYears(years)
      const current = years.find((y: SchoolYear) => y.isCurrent)
      if (current) {
        setSelectedYear(current._id)
      } else if (years.length > 0) {
        setSelectedYear(years[0]._id)
      }
    } catch (error) {
      console.error('Error loading school years:', error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setEndpointsAvailable(true)
      const [statusData, validationData] = await Promise.allSettled([
        exportService.getStatus(),
        exportService.validate(),
      ])

      let anySucceeded = false

      if (statusData.status === 'fulfilled') {
        setStatus(statusData.value)
        anySucceeded = true
      }
      if (validationData.status === 'fulfilled') {
        setValidation(validationData.value)
        anySucceeded = true
      }

      if (!anySucceeded) {
        setEndpointsAvailable(false)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading report data:', error)
      setEndpointsAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    if (endpointsAvailable) {
      toast.success('הנתונים עודכנו')
    }
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

  const getMinistrySteps = () => {
    const steps = [
      {
        id: 'year',
        label: 'בחר שנה',
        description: 'שנת לימודים',
        status: selectedYear ? 'completed' as const : 'current' as const,
      },
      {
        id: 'validate',
        label: 'בדוק סטטוס',
        description: 'נתונים ואימות',
        status: (!selectedYear
          ? 'pending' as const
          : endpointsAvailable && (status?.preExportErrors?.length ?? 0) === 0
            ? 'completed' as const
            : 'current' as const),
      },
      {
        id: 'download',
        label: 'הורד דוח',
        description: 'ייצוא למשרד',
        status: (endpointsAvailable && (status?.missing?.length === 0) && validation?.isValid
          ? 'current' as const
          : 'pending' as const),
      },
    ]
    return steps
  }

  // Group missing items by type
  const groupedMissing = (status?.missing || []).reduce<Record<string, MissingItem[]>>((acc, item) => {
    const type = item.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(item)
    return acc
  }, {})

  const missingTypeLabels: Record<string, string> = {
    teacher: 'מורים',
    student: 'תלמידים',
    orchestra: 'תזמורות',
    tenant: 'פרופיל קונסרבטוריון',
    other: 'אחר',
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">טוען נתוני דוחות...</div>
        </div>
      </div>
    )
  }

  const completionPct = status?.completionPercentage ?? 0

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוחות משרד החינוך</h1>
            <p className="text-sm text-gray-500">סטטוס השלמת הנתונים והורדת דוח</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              עודכן {formatTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            רענן
          </button>
        </div>
      </div>

      {/* School Year Selector */}
      {schoolYears.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">שנת לימודים</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-64 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-ring focus:border-ring bg-white"
          >
            {schoolYears.map((year) => (
              <option key={year._id} value={year._id}>
                {year.name}{year.isCurrent ? ' (נוכחית)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step Progress Indicator */}
      <div className="mb-6">
        <StepProgress
          steps={getMinistrySteps()}
          direction="horizontal"
        />
      </div>

      {/* Export Service Unavailable Banner */}
      {!endpointsAvailable && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">שירות ייצוא אינו זמין עדיין</h3>
                <p className="text-sm text-blue-600 mt-1">
                  שירות הייצוא למשרד החינוך נמצא בפיתוח. הורדת דוחות ואימות נתונים יהיו זמינים בקרוב.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Completion — only show when endpoints available */}
      {endpointsAvailable && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">אחוז השלמה כולל</span>
              <span className="text-2xl font-bold text-primary">{completionPct}%</span>
            </div>
            <Progress value={completionPct} />
            <p className="text-xs text-gray-500 mt-2">
              {completionPct === 100
                ? 'כל הנתונים מלאים — ניתן להוריד את הדוח'
                : 'יש נתונים חסרים — מומלץ להשלים לפני הגשת הדוח'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards — only show when endpoints available */}
      {endpointsAvailable && status?.counts && (
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
                  <div className={`w-10 h-10 rounded ${section.color === 'blue' ? 'bg-muted' : `bg-${section.color}-100`} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${section.color === 'blue' ? 'text-primary' : `text-${section.color}-600`}`} />
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

      {/* Missing Data — only show when endpoints available */}
      {endpointsAvailable && Object.keys(groupedMissing).length > 0 && (
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
                          <span className="font-medium">{item.name}</span>
                          {item.field && <span className="text-gray-400"> — חסר: {item.field}</span>}
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

      {/* Pre-Export Errors (blocking) — only show when endpoints available */}
      {endpointsAvailable && (status?.preExportErrors?.length ?? 0) > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg text-red-800">שגיאות חוסמות ייצוא</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status!.preExportErrors.map((err, idx) => (
                <div key={`pre-err-${idx}`} className="flex items-start gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700">{err.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-Export Warnings (non-blocking) — only show when endpoints available */}
      {endpointsAvailable && (status?.preExportWarnings?.length ?? 0) > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-lg text-amber-800">אזהרות</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status!.preExportWarnings.map((warn, idx) => (
                <div key={`pre-warn-${idx}`} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-amber-700">{warn.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cross-Validation Results — only show when endpoints available */}
      {endpointsAvailable && validation && (validation.warnings.length > 0 || validation.errors.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <CardTitle className="text-lg">אימות צולב</CardTitle>
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

      {/* All Valid — only when no missing data AND no blocking errors AND endpoints available */}
      {endpointsAvailable && (status?.missing?.length === 0) && (status?.preExportErrors?.length === 0) && validation?.isValid && (
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
      <div className="flex flex-col items-center pb-8 gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading || !endpointsAvailable || (status?.preExportErrors?.length ?? 0) > 0}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
        >
          <Download className="w-5 h-5" />
          {downloading ? 'מוריד...' : 'הורד דוח מלא'}
        </button>
        {!endpointsAvailable && (
          <p className="text-sm text-gray-500">הורדת דוח תהיה זמינה כאשר שירות הייצוא יופעל</p>
        )}
        {endpointsAvailable && (status?.preExportErrors?.length ?? 0) > 0 && (
          <p className="text-sm text-red-600">יש לתקן את השגיאות החוסמות לפני הורדת הדוח</p>
        )}
      </div>
    </div>
  )
}
