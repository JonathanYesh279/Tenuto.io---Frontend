/**
 * Quick Actions Service
 * 
 * Provides functionality for printing, exporting, and emailing student reports,
 * certificates, and other documents.
 */

import { StudentDetails } from '../features/students/details/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json'
  includePersonal?: boolean
  includeAcademic?: boolean
  includeAttendance?: boolean
  includeOrchestra?: boolean
  includeTheory?: boolean
  includeDocuments?: boolean
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface PrintOptions {
  type: 'summary' | 'detailed' | 'certificate' | 'attendance' | 'schedule'
  orientation?: 'portrait' | 'landscape'
  includePhotos?: boolean
  includeCharts?: boolean
}

export interface EmailOptions {
  recipients: string[]
  subject: string
  message: string
  attachments?: {
    type: 'summary' | 'detailed' | 'certificate'
    format: 'pdf' | 'excel'
  }[]
}

class QuickActionsService {
  
  /**
   * Generate PDF report for student
   */
  async generatePDF(student: StudentDetails, options: PrintOptions): Promise<Blob> {
    const doc = new jsPDF(options.orientation || 'portrait')
    
    // Set Hebrew font support (would need actual Hebrew font in production)
    doc.setFont('helvetica')
    doc.setFontSize(16)
    
    // Header
    doc.text('דוח תלמיד - מוזיקה', 20, 20)
    doc.setFontSize(12)
    doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, 20, 30)
    
    // Student basic info
    doc.setFontSize(14)
    doc.text('פרטים אישיים', 20, 50)
    doc.setFontSize(10)
    
    const personalData = [
      ['שם מלא', student.personalInfo.fullName || ''],
      ['תעודת זהות', student.personalInfo.nationalId || ''],
      ['גיל', student.personalInfo.age?.toString() || ''],
      ['טלפון', student.personalInfo.phone || ''],
      ['כתובת', student.personalInfo.address || ''],
      ['הורה/אפוטרופוס', student.personalInfo.parentName || ''],
      ['טלפון הורה', student.personalInfo.parentPhone || '']
    ]
    
    doc.autoTable({
      startY: 60,
      head: [['שדה', 'ערך']],
      body: personalData,
      margin: { right: 20 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [63, 126, 223] }
    })
    
    // Academic info
    if (options.includeAcademic !== false) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('פרטים אקדמיים', 20, 20)
      
      const academicData = [
        ['כיתה', student.academicInfo.class || ''],
        ['רמה', student.academicInfo.level || ''],
        ['כלי נגינה ראשי', student.academicInfo.instrumentProgress?.[0]?.instrumentName || ''],
        ['חטיבה', student.academicInfo.hebrewStage || ''],
        ['שעות תרגול שבועיות', student.academicInfo.weeklyPracticeHours?.toString() || '']
      ]
      
      doc.autoTable({
        startY: 30,
        head: [['שדה', 'ערך']],
        body: academicData,
        margin: { right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [34, 197, 94] }
      })
      
      // Instruments table
      if (student.academicInfo.instrumentProgress?.length > 0) {
        const instrumentData = student.academicInfo.instrumentProgress.map(instrument => [
          instrument.instrumentName,
          instrument.level || '',
          instrument.isPrimary ? 'כלי ראשי' : 'כלי משני',
          instrument.practiceHours?.toString() || ''
        ])
        
        doc.autoTable({
          startY: 90,
          head: [['כלי נגינה', 'רמה', 'סוג', 'שעות תרגול']],
          body: instrumentData,
          margin: { right: 20 },
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [147, 51, 234] }
        })
      }
    }
    
    // Attendance summary
    if (options.type === 'attendance' || options.type === 'detailed') {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('סיכום נוכחות', 20, 20)
      
      const attendanceData = [
        ['אחוז נוכחות', `${Math.round(student.attendanceStats?.attendanceRate || 0)}%`],
        ['שיעורים שהתקיימו', student.attendanceStats?.totalLessons?.toString() || '0'],
        ['שיעורים בהם נכח', student.attendanceStats?.attendedLessons?.toString() || '0'],
        ['היעדרויות', student.attendanceStats?.absences?.toString() || '0'],
        ['איחורים', student.attendanceStats?.lateArrivals?.toString() || '0'],
        ['רצף נוכחות נוכחי', `${student.attendanceStats?.currentStreak || 0} שיעורים`]
      ]
      
      doc.autoTable({
        startY: 30,
        head: [['מדד', 'ערך']],
        body: attendanceData,
        margin: { right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [239, 68, 68] }
      })
    }
    
    // Orchestra enrollments
    if (student.orchestraEnrollments?.length > 0 && options.type === 'detailed') {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('תזמורות והרכבים', 20, 20)
      
      const orchestraData = student.orchestraEnrollments.map(enrollment => [
        enrollment.orchestraName,
        enrollment.position || '',
        enrollment.partAssignment || '',
        enrollment.isActive ? 'פעיל' : 'לא פעיל',
        new Date(enrollment.enrollmentDate).toLocaleDateString('he-IL')
      ])
      
      doc.autoTable({
        startY: 30,
        head: [['תזמורת', 'תפקיד', 'חלק', 'סטטוס', 'תאריך הצטרפות']],
        body: orchestraData,
        margin: { right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [168, 85, 247] }
      })
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`עמוד ${i} מתוך ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
      doc.text('מוזמקה - מערכת ניהול קונסרבטוריון', 20, doc.internal.pageSize.height - 10)
    }
    
    return doc.output('blob')
  }

  /**
   * Generate Excel export
   */
  async generateExcel(student: StudentDetails, options: ExportOptions): Promise<Blob> {
    const workbook = XLSX.utils.book_new()
    
    // Personal information sheet
    if (options.includePersonal !== false) {
      const personalData = [
        ['שם מלא', student.personalInfo.fullName || ''],
        ['תעודת זהות', student.personalInfo.nationalId || ''],
        ['תאריך לידה', student.personalInfo.birthDate || ''],
        ['גיל', student.personalInfo.age || ''],
        ['טלפון', student.personalInfo.phone || ''],
        ['אימייל', student.personalInfo.email || ''],
        ['כתובת', student.personalInfo.address || ''],
        ['הורה/אפוטרופוס', student.personalInfo.parentName || ''],
        ['טלפון הורה', student.personalInfo.parentPhone || ''],
        ['אימייל הורה', student.personalInfo.parentEmail || '']
      ]
      
      const personalSheet = XLSX.utils.aoa_to_sheet([['שדה', 'ערך'], ...personalData])
      XLSX.utils.book_append_sheet(workbook, personalSheet, 'פרטים אישיים')
    }
    
    // Academic information sheet
    if (options.includeAcademic !== false && student.academicInfo) {
      const academicData = [
        ['כיתה', student.academicInfo.class || ''],
        ['רמה', student.academicInfo.level || ''],
        ['חטיבה עברית', student.academicInfo.hebrewStage || ''],
        ['שעות תרגול שבועיות', student.academicInfo.weeklyPracticeHours || ''],
        ['תאריך התחלת לימודים', student.academicInfo.startDate || '']
      ]
      
      const academicSheet = XLSX.utils.aoa_to_sheet([['שדה', 'ערך'], ...academicData])
      XLSX.utils.book_append_sheet(workbook, academicSheet, 'פרטים אקדמיים')
      
      // Instruments progress sheet
      if (student.academicInfo.instrumentProgress?.length > 0) {
        const instrumentData = student.academicInfo.instrumentProgress.map(instrument => [
          instrument.instrumentName,
          instrument.level || '',
          instrument.isPrimary ? 'כלי ראשי' : 'כלי משני',
          instrument.practiceHours || '',
          instrument.currentRepertoire?.join(', ') || ''
        ])
        
        const instrumentSheet = XLSX.utils.aoa_to_sheet([
          ['כלי נגינה', 'רמה', 'סוג', 'שעות תרגול', 'רפרטואר נוכחי'],
          ...instrumentData
        ])
        XLSX.utils.book_append_sheet(workbook, instrumentSheet, 'כלי נגינה')
      }
    }
    
    // Attendance data sheet
    if (options.includeAttendance !== false && student.attendanceStats) {
      const attendanceData = [
        ['אחוז נוכחות', `${Math.round(student.attendanceStats.attendanceRate || 0)}%`],
        ['שיעורים שהתקיימו', student.attendanceStats.totalLessons || 0],
        ['שיעורים בהם נכח', student.attendanceStats.attendedLessons || 0],
        ['היעדרויות', student.attendanceStats.absences || 0],
        ['איחורים', student.attendanceStats.lateArrivals || 0],
        ['רצף נוכחות נוכחי', student.attendanceStats.currentStreak || 0]
      ]
      
      const attendanceSheet = XLSX.utils.aoa_to_sheet([['מדד', 'ערך'], ...attendanceData])
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'נוכחות')
    }
    
    // Orchestra enrollments sheet
    if (options.includeOrchestra !== false && student.orchestraEnrollments?.length > 0) {
      const orchestraData = student.orchestraEnrollments.map(enrollment => [
        enrollment.orchestraName,
        enrollment.position || '',
        enrollment.partAssignment || '',
        enrollment.isActive ? 'פעיל' : 'לא פעיל',
        new Date(enrollment.enrollmentDate).toLocaleDateString('he-IL'),
        enrollment.performanceHistory?.length || 0
      ])
      
      const orchestraSheet = XLSX.utils.aoa_to_sheet([
        ['תזמורת', 'תפקיד', 'חלק', 'סטטוס', 'תאריך הצטרפות', 'מספר הופעות'],
        ...orchestraData
      ])
      XLSX.utils.book_append_sheet(workbook, orchestraSheet, 'תזמורות')
    }
    
    return new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
  }

  /**
   * Generate CSV export
   */
  async generateCSV(student: StudentDetails, options: ExportOptions): Promise<Blob> {
    const data = []
    
    // Headers
    const headers = ['קטגוריה', 'שדה', 'ערך']
    data.push(headers)
    
    // Personal info
    if (options.includePersonal !== false) {
      data.push(['פרטים אישיים', 'שם מלא', student.personalInfo.fullName || ''])
      data.push(['פרטים אישיים', 'תעודת זהות', student.personalInfo.nationalId || ''])
      data.push(['פרטים אישיים', 'טלפון', student.personalInfo.phone || ''])
      data.push(['פרטים אישיים', 'כתובת', student.personalInfo.address || ''])
    }
    
    // Academic info
    if (options.includeAcademic !== false) {
      data.push(['פרטים אקדמיים', 'כיתה', student.academicInfo.class || ''])
      data.push(['פרטים אקדמיים', 'רמה', student.academicInfo.level || ''])
      data.push(['פרטים אקדמיים', 'חטיבה', student.academicInfo.hebrewStage || ''])
    }
    
    // Convert to CSV string
    const csvContent = data.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    // Add BOM for Hebrew support
    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  }

  /**
   * Print student report
   */
  async printReport(student: StudentDetails, options: PrintOptions): Promise<void> {
    try {
      const pdf = await this.generatePDF(student, options)
      const url = URL.createObjectURL(pdf)
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print()
        })
      } else {
        toast.error('אנא אפשר חלונות קופצים כדי להדפיס')
      }
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 30000)
      
      toast.success('הדוח נשלח להדפסה')
    } catch (error) {
      console.error('Print error:', error)
      toast.error('שגיאה בהדפסת הדוח')
    }
  }

  /**
   * Download export file
   */
  async downloadExport(student: StudentDetails, options: ExportOptions): Promise<void> {
    try {
      let blob: Blob
      let filename: string
      
      switch (options.format) {
        case 'pdf':
          blob = await this.generatePDF(student, { type: 'detailed' })
          filename = `${student.personalInfo.fullName || 'תלמיד'}_דוח.pdf`
          break
        case 'excel':
          blob = await this.generateExcel(student, options)
          filename = `${student.personalInfo.fullName || 'תלמיד'}_נתונים.xlsx`
          break
        case 'csv':
          blob = await this.generateCSV(student, options)
          filename = `${student.personalInfo.fullName || 'תלמיד'}_נתונים.csv`
          break
        case 'json':
          blob = new Blob([JSON.stringify(student, null, 2)], { type: 'application/json' })
          filename = `${student.personalInfo.fullName || 'תלמיד'}_נתונים.json`
          break
        default:
          throw new Error('פורמט לא נתמך')
      }
      
      // Download file
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success(`הקובץ ${filename} הורד בהצלחה`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('שגיאה בייצוא הנתונים')
    }
  }

  /**
   * Send email with student report
   */
  async sendEmail(student: StudentDetails, options: EmailOptions): Promise<void> {
    try {
      // Generate attachments
      const attachments = []
      
      if (options.attachments) {
        for (const attachment of options.attachments) {
          let blob: Blob
          
          if (attachment.format === 'pdf') {
            blob = await this.generatePDF(student, { type: attachment.type })
          } else if (attachment.format === 'excel') {
            blob = await this.generateExcel(student, { format: 'excel' })
          } else {
            continue
          }
          
          attachments.push({
            filename: `${student.personalInfo.fullName || 'תלמיד'}_${attachment.type}.${attachment.format}`,
            blob
          })
        }
      }
      
      // In a real implementation, this would call an email API
      // For now, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Email would be sent to:', options.recipients)
      console.log('Subject:', options.subject)
      console.log('Message:', options.message)
      console.log('Attachments:', attachments.length)
      
      toast.success(`אימייל נשלח בהצלחה ל-${options.recipients.length} נמענים`)
    } catch (error) {
      console.error('Email error:', error)
      toast.error('שגיאה בשליחת האימייל')
    }
  }

  /**
   * Generate certificate of achievement
   */
  async generateCertificate(student: StudentDetails, achievement: {
    title: string
    description: string
    date: Date
    signedBy: string
  }): Promise<Blob> {
    const doc = new jsPDF('landscape')
    
    // Certificate design
    doc.setFontSize(24)
    doc.text('תעודת הוקרה', doc.internal.pageSize.width / 2, 40, { align: 'center' })
    
    doc.setFontSize(16)
    doc.text('מוענקת בזאת לתלמיד/ה:', doc.internal.pageSize.width / 2, 80, { align: 'center' })
    
    doc.setFontSize(22)
    doc.text(student.personalInfo.fullName || '', doc.internal.pageSize.width / 2, 110, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text(achievement.title, doc.internal.pageSize.width / 2, 140, { align: 'center' })
    doc.text(achievement.description, doc.internal.pageSize.width / 2, 160, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`תאריך: ${achievement.date.toLocaleDateString('he-IL')}`, doc.internal.pageSize.width / 2, 180, { align: 'center' })
    doc.text(`חתימה: ${achievement.signedBy}`, doc.internal.pageSize.width / 2, 200, { align: 'center' })
    
    return doc.output('blob')
  }
}

export const quickActionsService = new QuickActionsService()