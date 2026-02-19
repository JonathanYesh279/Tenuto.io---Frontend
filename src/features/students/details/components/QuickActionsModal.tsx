/**
 * Quick Actions Modal Component
 * 
 * Provides comprehensive quick actions interface for printing, exporting,
 * and emailing student reports and data.
 */

import { useState, useRef } from 'react'

import { StudentDetails } from '../types'
import { ArchiveIcon, CalendarIcon, ChartBarIcon, CheckIcon, DatabaseIcon, DownloadSimpleIcon, EnvelopeIcon, FileImageIcon, FileSpreadsheetIcon, FileTextIcon, MedalIcon, MusicNotesIcon, PlusIcon, PrinterIcon, SendIcon, ShieldIcon, TrashIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import {
  quickActionsService, 
  ExportOptions, 
  PrintOptions, 
  EmailOptions 
} from '@/services/quickActionsService'
import toast from 'react-hot-toast'
import { getDisplayName } from '../../../../utils/nameUtils'
import { cascadeDeletionService } from '../../../../services/cascadeDeletionService'
import { useCascadeDeletion } from '../../../../hooks/useCascadeDeletion'

interface QuickActionsModalProps {
  student: StudentDetails
  isOpen: boolean
  onClose: () => void
  onDelete?: () => void
}

type ActionType = 'print' | 'export' | 'email' | 'certificate' | 'deletion' | 'archive'

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  student,
  isOpen,
  onClose,
  onDelete
}) => {
  const [activeAction, setActiveAction] = useState<ActionType>('print')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Cascade deletion states
  const [deletionPreview, setDeletionPreview] = useState<any>(null)
  const [deletionMethod, setDeletionMethod] = useState<'safe' | 'force' | 'archive'>('safe')
  const [archiveReason, setArchiveReason] = useState('')
  
  // Cascade deletion hooks
  const { previewDeletion, executeDeletion, isDeleting } = useCascadeDeletion()
  
  // Print options state
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    type: 'summary',
    orientation: 'portrait',
    includePhotos: true,
    includeCharts: true
  })
  
  // Export options state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includePersonal: true,
    includeAcademic: true,
    includeAttendance: true,
    includeOrchestra: true,
    includeTheory: true,
    includeDocuments: false
  })
  
  // Email options state
  const [emailOptions, setEmailOptions] = useState<EmailOptions>({
    recipients: [student.personalInfo.parentEmail || ''].filter(Boolean),
    subject: `דוח תלמיד: ${getDisplayName(student.personalInfo)}`,
    message: `שלום,\n\nמצורף דוח מפורט על התקדמות התלמיד/ה ${getDisplayName(student.personalInfo)}.\n\nבברכה,\nצוות הקונסרבטוריון`,
    attachments: [{ type: 'summary', format: 'pdf' }]
  })
  
  // Certificate options state
  const [certificateData, setCertificateData] = useState({
    title: 'הישג מצוין בלימודי מוזיקה',
    description: 'על התמדה ומצוינות בלימודים',
    signedBy: 'מנהל הקונסרבטוריון'
  })
  
  const emailRecipientsRef = useRef<HTMLTextAreaElement>(null)

  if (!isOpen) return null

  const handlePrint = async () => {
    setIsProcessing(true)
    try {
      await quickActionsService.printReport(student, printOptions)
      onClose()
    } catch (error) {
      console.error('Print failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = async () => {
    setIsProcessing(true)
    try {
      await quickActionsService.downloadExport(student, exportOptions)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEmail = async () => {
    if (emailOptions.recipients.length === 0) {
      toast.error('יש להוסיף לפחות נמען אחד')
      return
    }
    
    setIsProcessing(true)
    try {
      await quickActionsService.sendEmail(student, emailOptions)
      onClose()
    } catch (error) {
      console.error('Email failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateCertificate = async () => {
    setIsProcessing(true)
    try {
      const blob = await quickActionsService.generateCertificate(student, {
        ...certificateData,
        date: new Date()
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `תעודה_${getDisplayName(student.personalInfo) || 'תלמיד'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('תעודה נוצרה בהצלחה')
      onClose()
    } catch (error) {
      console.error('Certificate generation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Cascade deletion handlers
  const handleLoadDeletionPreview = async () => {
    if (!student?.id) return
    
    setIsProcessing(true)
    try {
      const preview = await cascadeDeletionService.previewDeletion(student.id)
      setDeletionPreview(preview)
      toast.success('תצוגה מקדימה נטענה בהצלחה')
    } catch (error) {
      console.error('Preview loading failed:', error)
      toast.error('שגיאה בטעינת תצוגה מקדימה')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExecuteDeletion = async () => {
    if (!student?.id) return
    
    setIsProcessing(true)
    try {
      const options = {
        createSnapshot: deletionMethod === 'safe',
        skipValidation: deletionMethod === 'force',
        archive: deletionMethod === 'archive',
        archiveReason: archiveReason,
        reason: `Quick action deletion via UI - Method: ${deletionMethod}`
      }
      
      await cascadeDeletionService.executeDelete(student.id, options)
      
      if (deletionMethod === 'archive') {
        toast.success('תלמיד הועבר לארכיון בהצלחה')
      } else {
        toast.success('תלמיד נמחק בהצלחה')
      }
      
      onDelete?.()
      onClose()
    } catch (error) {
      console.error('Deletion failed:', error)
      toast.error(`שגיאה ב${deletionMethod === 'archive' ? 'העברה לארכיון' : 'מחיקה'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const addEmailRecipient = () => {
    const newEmail = prompt('הזן כתובת אימייל:')
    if (newEmail && newEmail.includes('@')) {
      setEmailOptions(prev => ({
        ...prev,
        recipients: [...prev.recipients, newEmail]
      }))
    }
  }

  const removeEmailRecipient = (index: number) => {
    setEmailOptions(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }))
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{
        position: 'fixed !important',
        top: '0 !important',
        left: '0 !important',
        right: '0 !important',
        bottom: '0 !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        zIndex: 9999
      }}
    >
      <div className="bg-white rounded max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">פעולות מהירות</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex">
          {/* Action Type Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveAction('print')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'print' 
                    ? 'bg-primary text-primary-foreground-700 border border-border' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <PrinterIcon className="w-5 h-5" />
                הדפסה
              </button>
              
              <button
                onClick={() => setActiveAction('export')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'export' 
                    ? 'bg-primary text-primary-foreground-700 border border-border' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <DownloadSimpleIcon className="w-5 h-5" />
                ייצוא
              </button>
              
              <button
                onClick={() => setActiveAction('email')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'email' 
                    ? 'bg-primary text-primary-foreground-700 border border-border' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <EnvelopeIcon className="w-5 h-5" />
                שליחת אימייל
              </button>
              
              <button
                onClick={() => setActiveAction('certificate')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'certificate' 
                    ? 'bg-primary text-primary-foreground-700 border border-border' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MedalIcon className="w-5 h-5" />
                תעודת הוקרה
              </button>
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>
              
              <button
                onClick={() => setActiveAction('deletion')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'deletion' 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <ShieldIcon className="w-5 h-5" />
                מחיקה מאובטחת
              </button>
              
              <button
                onClick={() => setActiveAction('archive')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'archive' 
                    ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                    : 'text-orange-600 hover:bg-orange-50'
                }`}
              >
                <ArchiveIcon className="w-5 h-5" />
                העברה לארכיון
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Print Options */}
            {activeAction === 'print' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">אפשרויות הדפסה</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">סוג דוח</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'summary', label: 'דוח קצר', icon: FileTextIcon },
                          { value: 'detailed', label: 'דוח מפורט', icon: ChartBarIcon },
                          { value: 'attendance', label: 'דוח נוכחות', icon: CalendarIcon },
                          { value: 'schedule', label: 'לוח זמנים', icon: CalendarIcon }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setPrintOptions(prev => ({ ...prev, type: option.value as any }))}
                            className={`flex items-center gap-2 p-3 border rounded-lg text-right transition-colors ${
                              printOptions.type === option.value
                                ? 'border-border bg-muted/50 text-primary'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">כיוון עמוד</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setPrintOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            printOptions.orientation === 'portrait'
                              ? 'border-border bg-muted/50 text-primary'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          לאורך
                        </button>
                        <button
                          onClick={() => setPrintOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            printOptions.orientation === 'landscape'
                              ? 'border-border bg-muted/50 text-primary'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          לרוחב
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={printOptions.includePhotos}
                          onChange={(e) => setPrintOptions(prev => ({ ...prev, includePhotos: e.target.checked }))}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">כלול תמונות</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={printOptions.includeCharts}
                          onChange={(e) => setPrintOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">כלול גרפים וטבלאות</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Options */}
            {activeAction === 'export' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">אפשרויות ייצוא</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">פורמט קובץ</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'pdf', label: 'PDF', icon: FileImageIcon },
                          { value: 'excel', label: 'Excel', icon: FileSpreadsheetIcon },
                          { value: 'csv', label: 'CSV', icon: FileTextIcon },
                          { value: 'json', label: 'JSON', icon: FileTextIcon }
                        ].map(format => (
                          <button
                            key={format.value}
                            onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                            className={`flex items-center gap-2 p-3 border rounded-lg text-right transition-colors ${
                              exportOptions.format === format.value
                                ? 'border-border bg-muted/50 text-primary'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <format.icon className="w-4 h-4" />
                            {format.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">נתונים לייצוא</label>
                      <div className="space-y-2">
                        {[
                          { key: 'includePersonal', label: 'פרטים אישיים' },
                          { key: 'includeAcademic', label: 'פרטים אקדמיים' },
                          { key: 'includeAttendance', label: 'נתוני נוכחות' },
                          { key: 'includeOrchestra', label: 'תזמורות והרכבים' },
                          { key: 'includeTheory', label: 'שיעורי תיאוריה' },
                          { key: 'includeDocuments', label: 'רשימת מסמכים' }
                        ].map(option => (
                          <label key={option.key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                              onChange={(e) => setExportOptions(prev => ({ 
                                ...prev, 
                                [option.key]: e.target.checked 
                              }))}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Options */}
            {activeAction === 'email' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">שליחת אימייל</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">נמענים</label>
                      <div className="space-y-2">
                        {emailOptions.recipients.map((email, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700 flex-1">{email}</span>
                            <button
                              onClick={() => removeEmailRecipient(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addEmailRecipient}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                          הוסף נמען
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">נושא</label>
                      <input
                        type="text"
                        value={emailOptions.subject}
                        onChange={(e) => setEmailOptions(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">הודעה</label>
                      <textarea
                        value={emailOptions.message}
                        onChange={(e) => setEmailOptions(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">קבצים מצורפים</label>
                      <div className="space-y-2">
                        {emailOptions.attachments?.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700 flex-1">
                              {attachment.type === 'summary' ? 'דוח קצר' : 
                               attachment.type === 'detailed' ? 'דוח מפורט' : 'תעודה'} 
                              ({attachment.format.toUpperCase()})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Options */}
            {activeAction === 'certificate' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">תעודת הוקרה</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">כותרת התעודה</label>
                      <input
                        type="text"
                        value={certificateData.title}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">תיאור ההישג</label>
                      <textarea
                        value={certificateData.description}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">חתימה</label>
                      <input
                        type="text"
                        value={certificateData.signedBy}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, signedBy: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <WarningCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <strong>תצוגה מקדימה:</strong>
                          <div className="mt-2 p-3 bg-white border border-blue-200 rounded text-center">
                            <div className="font-bold text-lg">תעודת הוקרה</div>
                            <div className="mt-2">מוענקת בזאת לתלמיד/ה:</div>
                            <div className="font-bold text-xl text-blue-600">{getDisplayName(student.personalInfo)}</div>
                            <div className="mt-2">{certificateData.title}</div>
                            <div className="text-sm text-gray-600">{certificateData.description}</div>
                            <div className="mt-2 text-sm">חתימה: {certificateData.signedBy}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deletion Options */}
            {activeAction === 'deletion' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">מחיקה מאובטחת</h3>
                  
                  {/* Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <ShieldIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-900">מחיקת תלמיד</div>
                        <div className="text-sm text-red-700 mt-1">
                          פעולה זו תמחק את התלמיד וכל הנתונים הקשורים אליו. המערכת תבצע בדיקות בטיחות ותיצור גיבוי לפני המחיקה.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">שיטת מחיקה:</label>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="deletionMethod"
                            value="safe"
                            checked={deletionMethod === 'safe'}
                            onChange={(e) => setDeletionMethod(e.target.value as 'safe' | 'force' | 'archive')}
                            className="mt-0.5 text-green-600 focus:ring-green-500"
                          />
                          <div>
                            <span className="font-medium text-green-800">מחיקה בטוחה (מומלץ)</span>
                            <div className="text-sm text-gray-600">בדיקות בטיחות מלאות, יצירת גיבוי, וולידציה של תלויות</div>
                          </div>
                        </label>
                        
                        <label className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="deletionMethod"
                            value="force"
                            checked={deletionMethod === 'force'}
                            onChange={(e) => setDeletionMethod(e.target.value as 'safe' | 'force' | 'archive')}
                            className="mt-0.5 text-orange-600 focus:ring-orange-500"
                          />
                          <div>
                            <span className="font-medium text-orange-800">מחיקה מאולצת</span>
                            <div className="text-sm text-gray-600">דלג על בדיקות תקינות (רק למשתמשים מתקדמים)</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Preview Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">תצוגה מקדימה של השפעה</h4>
                        <button
                          onClick={handleLoadDeletionPreview}
                          disabled={isProcessing}
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                          {isProcessing ? 'טוען...' : 'טען תצוגה מקדימה'}
                        </button>
                      </div>
                      
                      {deletionPreview && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">סה"כ רשומות:</span>
                              <span className="font-medium ml-2">{deletionPreview.summary?.totalRecords || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">רמת סיכון:</span>
                              <span className={`font-medium ml-2 ${
                                deletionPreview.summary?.riskLevel === 'high' ? 'text-red-600' :
                                deletionPreview.summary?.riskLevel === 'medium' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {deletionPreview.summary?.riskLevel === 'high' ? 'גבוהה' :
                                 deletionPreview.summary?.riskLevel === 'medium' ? 'בינונית' : 'נמוכה'}
                              </span>
                            </div>
                          </div>
                          
                          {deletionPreview.warnings?.length > 0 && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                              <div className="font-medium text-yellow-800 mb-1">אזהרות:</div>
                              {deletionPreview.warnings.map((warning: string, idx: number) => (
                                <div key={idx} className="text-yellow-700">• {warning}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ArchiveIcon Options */}
            {activeAction === 'archive' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">העברה לארכיון</h3>
                  
                  {/* Info */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <ArchiveIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-orange-900">העברת תלמיד לארכיון</div>
                        <div className="text-sm text-orange-700 mt-1">
                          התלמיד יועבר לארכיון וייסגר מהמערכת הפעילה, אך כל הנתונים יישמרו לצורך עיון עתידי.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        סיבת ההעברה לארכיון
                      </label>
                      <textarea
                        value={archiveReason}
                        onChange={(e) => setArchiveReason(e.target.value)}
                        rows={4}
                        placeholder="הזן סיבה להעברת התלמיד לארכיון (חובה)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        דרושה סיבה מפורטת להעברה לארכיון לצורכי ביקורת
                      </div>
                    </div>

                    {/* ArchiveIcon Benefits */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-900 mb-2">יתרונות ארכיון:</div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• השמירה על כל הנתונים וההיסטוריה</li>
                        <li>• אפשרות לשחזור בעתיד</li>
                        <li>• מעקב אחר סיבת הסגירה</li>
                        <li>• דיווחים סטטיסטיים</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckIcon className="w-4 h-4 text-green-600" />
            <span>תלמיד: {getDisplayName(student.personalInfo)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            
            <button
              onClick={() => {
                switch (activeAction) {
                  case 'print':
                    handlePrint()
                    break
                  case 'export':
                    handleExport()
                    break
                  case 'email':
                    handleEmail()
                    break
                  case 'certificate':
                    handleGenerateCertificate()
                    break
                  case 'deletion':
                    handleExecuteDeletion()
                    break
                  case 'archive':
                    handleExecuteDeletion()
                    break
                }
              }}
              disabled={isProcessing || (activeAction === 'archive' && !archiveReason.trim())}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeAction === 'deletion' 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : activeAction === 'archive'
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-primary text-primary-foreground hover:bg-neutral-800'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  {activeAction === 'print' && <PrinterIcon className="w-4 h-4" />}
                  {activeAction === 'export' && <DownloadSimpleIcon className="w-4 h-4" />}
                  {activeAction === 'email' && <SendIcon className="w-4 h-4" />}
                  {activeAction === 'certificate' && <MedalIcon className="w-4 h-4" />}
                  {activeAction === 'deletion' && <ShieldIcon className="w-4 h-4" />}
                  {activeAction === 'archive' && <ArchiveIcon className="w-4 h-4" />}
                  
                  {activeAction === 'print' && 'הדפס'}
                  {activeAction === 'export' && 'ייצא'}
                  {activeAction === 'email' && 'שלח'}
                  {activeAction === 'certificate' && 'צור תעודה'}
                  {activeAction === 'deletion' && 'מחק תלמיד'}
                  {activeAction === 'archive' && 'העבר לארכיון'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickActionsModal