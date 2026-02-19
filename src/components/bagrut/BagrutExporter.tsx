import { useState } from 'react'

import { Card } from '../ui/Card'
import { getDisplayName } from '../../utils/nameUtils'
import { CalendarIcon, CheckCircleIcon, DownloadSimpleIcon, EnvelopeIcon, FileTextIcon, MedalIcon, PrinterIcon, ShareNetworkIcon, WarningCircleIcon } from '@phosphor-icons/react'

interface BagrutData {
  _id?: string
  studentId: string
  teacherId: string
  program: Array<{
    pieceTitle: string
    composer: string
    duration: string
    movement?: string
    youtubeLink: string | null
  }>
  accompaniment: {
    type: 'נגן מלווה' | 'הרכב'
    accompanists: Array<{
      name: string
      instrument: string
      phone: string | null
    }>
  }
  presentations: Array<{
    completed: boolean
    status: 'לא נבחן' | 'עבר/ה' | 'לא עבר/ה'
    date: string | null
    review: string | null
    reviewedBy: string | null
    notes?: string
    recordingLinks?: string[]
    grade?: number | null
    gradeLevel?: string | null
    detailedGrading?: any
  }>
  documents: Array<{
    title: string
    fileUrl: string
    fileKey: string | null
    uploadDate: string
    uploadedBy: string
  }>
  finalGrade: number | null
  finalGradeLevel: string | null
  isCompleted: boolean
  testDate: string | null
  notes: string
}

interface Student {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone: string
    age: number
  }
}

interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
  }
}

interface BagrutExporterProps {
  bagrut: BagrutData
  student: Student | null
  teacher: Teacher | null
}

export default function BagrutExporter({ bagrut, student, teacher }: BagrutExporterProps) {
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<'summary' | 'detailed' | 'certificate' | 'progress'>('summary')

  const EXPORT_TYPES = [
    {
      key: 'summary',
      label: 'דוח סיכום',
      description: 'סיכום כללי של התקדמות הבגרות',
      icon: FileTextIcon,
      available: true
    },
    {
      key: 'detailed',
      label: 'דוח מפורט',
      description: 'דוח מלא הכולל את כל הפרטים והציונים',
      icon: FileTextIcon,
      available: bagrut.presentations.some(p => p.completed)
    },
    {
      key: 'certificate',
      label: 'תעודת בגרות',
      description: 'תעודה רשמית (זמינה רק לאחר השלמה)',
      icon: MedalIcon,
      available: bagrut.isCompleted && bagrut.finalGrade !== null
    },
    {
      key: 'progress',
      label: 'דוח התקדמות',
      description: 'דוח זמני להורים ולתלמיד',
      icon: CalendarIcon,
      available: true
    }
  ]

  const exportData = async (type: string, format: 'pdf' | 'excel' = 'pdf') => {
    setExporting(true)
    
    try {
      // In real implementation, this would call the API to generate the document
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate export time
      
      const filename = `bagrut_${type}_${getDisplayName(student?.personalInfo) || 'student'}_${new Date().toISOString().split('T')[0]}`
      
      // Mock download
      const link = document.createElement('a')
      link.href = '#' // In real app, this would be the generated file URL
      link.download = `${filename}.${format}`
      link.click()
      
      console.log(`Exported ${type} as ${format}`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('שגיאה בייצוא הדוח')
    } finally {
      setExporting(false)
    }
  }

  const shareProgress = async () => {
    try {
      // In real implementation, generate shareable link
      const shareableLink = `https://conservatory.app/bagrut/${bagrut._id}/view`
      
      if (navigator.share) {
        await navigator.share({
          title: `התקדמות בגרות - ${getDisplayName(student?.personalInfo)}`,
          text: 'צפה בהתקדמות הבגרות',
          url: shareableLink
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareableLink)
        alert('קישור הועתק ללוח')
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const sendByEmail = async (type: string) => {
    try {
      setExporting(true)
      
      // In real implementation, send email via API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      alert('הדוח נשלח בהצלחה בדואר אלקטרוני')
    } catch (error) {
      console.error('Email send failed:', error)
      alert('שגיאה בשליחת הדוח')
    } finally {
      setExporting(false)
    }
  }

  const printReport = () => {
    // In real implementation, open print dialog with formatted report
    window.print()
  }

  const getCompletionPercentage = () => {
    let completed = 0
    let total = 6 // 4 presentations + program + accompanist
    
    // Check presentations
    bagrut.presentations.forEach(p => {
      if (p.completed) completed += 1
    })
    
    // Check program (at least 3 pieces)
    if (bagrut.program.length >= 3) completed += 1
    
    // Check accompanist assignment
    if (bagrut.accompaniment.accompanists.length > 0) completed += 1
    
    return Math.round((completed / total) * 100)
  }

  const getTotalDuration = () => {
    return bagrut.program.reduce((total, piece) => {
      const parts = piece.duration.split(':')
      if (parts.length === 2) {
        return total + parseInt(parts[0]) * 60 + parseInt(parts[1])
      }
      return total
    }, 0)
  }

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <DownloadSimpleIcon className="w-6 h-6 mr-3 text-primary" />
            ייצוא ושיתוף
          </h3>
          
          <div className="flex items-center gap-3">
            <button
              onClick={shareProgress}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <ShareNetworkIcon className="w-4 h-4 mr-2" />
              שתף
            </button>
            
            <button
              onClick={printReport}
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <PrinterIcon className="w-4 h-4 mr-2" />
              הדפס
            </button>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {EXPORT_TYPES.map(type => {
            const Icon = type.icon
            return (
              <div
                key={type.key}
                className={`p-4 border-2 rounded cursor-pointer transition-colors ${
                  exportType === type.key
                    ? 'border-primary bg-muted'
                    : type.available
                    ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                }`}
                onClick={() => type.available && setExportType(type.key as any)}
              >
                <div className="flex items-start">
                  <Icon className={`w-5 h-5 mr-3 mt-0.5 ${
                    type.available ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h4 className={`font-medium ${
                        type.available ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {type.label}
                      </h4>
                      {type.available ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <WarningCircleIcon className="w-4 h-4 text-gray-400 mr-2" />
                      )}
                    </div>
                    <p className={`text-sm ${
                      type.available ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Export Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => exportData(exportType, 'pdf')}
            disabled={exporting || !EXPORT_TYPES.find(t => t.key === exportType)?.available}
            className="flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                מייצא...
              </>
            ) : (
              <>
                <FileTextIcon className="w-4 h-4 mr-2" />
                ייצא כ-PDF
              </>
            )}
          </button>
          
          <button
            onClick={() => exportData(exportType, 'excel')}
            disabled={exporting || !EXPORT_TYPES.find(t => t.key === exportType)?.available || exportType === 'certificate'}
            className="flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <DownloadSimpleIcon className="w-4 h-4 mr-2" />
            ייצא כ-Excel
          </button>
          
          <button
            onClick={() => sendByEmail(exportType)}
            disabled={exporting || !EXPORT_TYPES.find(t => t.key === exportType)?.available}
            className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            שלח במייל
          </button>
        </div>
      </Card>

      {/* Quick Stats for Export Preview */}
      <Card padding="md">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">תצוגה מקדימה לייצוא</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">פרטי התלמיד</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>שם: {getDisplayName(student?.personalInfo) || 'לא זמין'}</div>
              <div>גיל: {student?.personalInfo.age || 'לא זמין'}</div>
              <div>מורה: {getDisplayName(teacher?.personalInfo) || 'לא זמין'}</div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">סטטוס התקדמות</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>השלמה: {getCompletionPercentage()}%</div>
              <div>השמעות: {bagrut.presentations.filter(p => p.completed).length}/4</div>
              <div>יצירות: {bagrut.program.length}</div>
              <div>זמן כולל: {formatDuration(getTotalDuration())}</div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">ציונים</h5>
            <div className="text-sm text-gray-600 space-y-1">
              {bagrut.finalGrade ? (
                <>
                  <div>ציון סופי: {bagrut.finalGrade}</div>
                  <div>דירוג: {bagrut.finalGradeLevel}</div>
                  <div>סטטוס: הושלם</div>
                </>
              ) : (
                <>
                  <div>ציון סופי: טרם נקבע</div>
                  <div>מגן בגרות: {bagrut.presentations[3].grade || 'לא נבחן'}</div>
                  <div>סטטוס: בתהליך</div>
                </>
              )}
            </div>
          </div>
        </div>

        {bagrut.testDate && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <div className="flex items-center text-blue-800">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span className="font-medium">תאריך בחינה:</span>
              <span className="mr-2">{new Date(bagrut.testDate).toLocaleDateString('he-IL')}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Certificate Preview */}
      {bagrut.isCompleted && bagrut.finalGrade && (
        <Card padding="md" className="bg-yellow-50 border-yellow-200">
          <div className="text-center py-8">
            <MedalIcon className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-xl font-bold text-yellow-900 mb-2">תעודת בגרות במוזיקה</h3>
            <p className="text-yellow-800 mb-4">
              מוענקת בזה ל{getDisplayName(student?.personalInfo)}
            </p>
            <div className="bg-white p-6 rounded max-w-md mx-auto">
              <div className="text-3xl font-bold text-primary mb-2">
                {bagrut.finalGrade}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {bagrut.finalGradeLevel}
              </div>
            </div>
            <p className="text-sm text-yellow-700 mt-4">
              התעודה הרשמית תונפק לאחר אישור סופי של הנהלת בית הספר
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}