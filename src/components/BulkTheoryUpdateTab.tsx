import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import Modal from './ui/Modal'
import ConfirmationModal from './ui/ConfirmationModal'
import { theoryService, teacherService } from '../services/apiService'
import { filterLessons, type TheoryLesson } from '../utils/theoryLessonUtils'
import { VALID_LOCATIONS } from '../constants/locations'
import { getDisplayName } from '@/utils/nameUtils'
import { ArrowCounterClockwiseIcon, BookOpenIcon, CheckIcon, CircleNotchIcon, ClockIcon, DownloadSimpleIcon, EyeIcon, FloppyDiskIcon, FunnelIcon, InfoIcon, MapPinIcon, TrashIcon, TrendUpIcon, UsersIcon, WarningIcon } from '@phosphor-icons/react'
import {
  Table as HeroTable,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Button as HeroButton,
  Chip,
} from '@heroui/react'

interface BulkTheoryUpdateTabProps {
  lessons: TheoryLesson[]
  onRefresh: () => void
  searchQuery: string
  filters: {
    category: string
    teacherId: string
    date: string
  }
}

interface BulkUpdateFormData {
  category?: string
  teacherId?: string
  location?: string
  startTime?: string
  endTime?: string
  description?: string
  title?: string
  isActive?: boolean
  maxStudents?: number
}

interface BulkOperationResult {
  success: boolean
  affectedCount: number
  errors: string[]
  summary: string
}

export default function BulkTheoryUpdateTab({ 
  lessons, 
  onRefresh, 
  searchQuery, 
  filters 
}: BulkTheoryUpdateTabProps) {
  // Selection state
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // FunnelIcon state for bulk tab
  const [localFilters, setLocalFilters] = useState({
    category: '',
    teacherId: '',
    dateRange: { start: '', end: '' },
    status: 'all' // all, active, inactive
  })
  
  // Bulk update state
  const [showBulkUpdateForm, setShowBulkUpdateForm] = useState(false)
  const [bulkUpdateData, setBulkUpdateData] = useState<BulkUpdateFormData>({})
  const [showPreview, setShowPreview] = useState(false)
  
  // Bulk operations state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [lastOperation, setLastOperation] = useState<BulkOperationResult | null>(null)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [teachers, setTeachers] = useState<any[]>([])
  
  // Progress tracking
  const [operationProgress, setOperationProgress] = useState({
    isRunning: false,
    current: 0,
    total: 0,
    operation: '',
    details: ''
  })

  // Theory lesson categories and locations
  const categories = [
    'תלמידים חדשים ב-ד',
    'מתחילים',
    'מתחילים ב',
    'מתחילים ד',
    'מתקדמים ב',
    'מתקדמים א',
    'מתקדמים ג',
    'תלמידים חדשים בוגרים (ה - ט)',
    'תלמידים חדשים צעירים',
    'הכנה לרסיטל קלאסי יא',
    "הכנה לרסיטל רוק\\פופ\\ג'אז יא",
    "הכנה לרסיטל רוק\\פופ\\ג'אז יב",
    'מגמה',
    'תאוריה כלי',
  ]


  // Load teachers on mount
  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      const teachersData = await teacherService.getTeachers()
      // Check both normalized and legacy role names for backward compatibility
      const theoryTeachers = teachersData.filter((teacher: any) =>
        teacher.roles && teacher.roles.some((r: string) => r === 'תאוריה' || r === 'מורה תאוריה')
      )
      setTeachers(theoryTeachers)
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  // FunnelIcon lessons based on local filters and search
  const filteredLessons = useMemo(() => {
    let filtered = filterLessons(lessons, {
      searchQuery,
      category: localFilters.category || filters.category,
      teacherId: localFilters.teacherId || filters.teacherId,
      date: filters.date
    })

    // Apply additional local filters
    if (localFilters.dateRange.start && localFilters.dateRange.end) {
      const startDate = new Date(localFilters.dateRange.start)
      const endDate = new Date(localFilters.dateRange.end)
      filtered = filtered.filter(lesson => {
        const lessonDate = new Date(lesson.date)
        return lessonDate >= startDate && lessonDate <= endDate
      })
    }

    if (localFilters.status !== 'all') {
      filtered = filtered.filter(lesson => 
        localFilters.status === 'active' ? lesson.isActive : !lesson.isActive
      )
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [lessons, searchQuery, filters, localFilters])

  // Handle selection
  const handleSelectLesson = (lessonId: string) => {
    const newSelected = new Set(selectedLessons)
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId)
    } else {
      newSelected.add(lessonId)
    }
    setSelectedLessons(newSelected)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLessons(new Set())
    } else {
      setSelectedLessons(new Set(filteredLessons.map(lesson => lesson._id)))
    }
    setSelectAll(!selectAll)
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedLessons(new Set())
    setSelectAll(false)
  }

  // Get selected lessons data
  const selectedLessonsData = useMemo(() => {
    return lessons.filter(lesson => selectedLessons.has(lesson._id))
  }, [lessons, selectedLessons])

  // Bulk update form handlers
  const handleBulkUpdate = () => {
    if (selectedLessons.size === 0) {
      setError('אנא בחר שיעורים לעדכון')
      return
    }
    setShowBulkUpdateForm(true)
  }

  const handleBulkUpdateSubmit = async () => {
    if (!showPreview) {
      setShowPreview(true)
      return
    }

    setLoading(true)
    setError('')
    try {
      // FunnelIcon out empty values
      const updateData = Object.entries(bulkUpdateData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          acc[key] = value
        }
        return acc
      }, {} as any)

      if (Object.keys(updateData).length === 0) {
        setError('אנא בחר לפחות שדה אחד לעדכון')
        return
      }

      await theoryService.bulkUpdateTheoryLessons(
        Array.from(selectedLessons), 
        updateData
      )

      setLastOperation({
        success: true,
        affectedCount: selectedLessons.size,
        errors: [],
        summary: `עודכנו ${selectedLessons.size} שיעורים בהצלחה`
      })

      setSuccess(`עודכנו ${selectedLessons.size} שיעורי תיאוריה בהצלחה`)
      setShowBulkUpdateForm(false)
      setShowPreview(false)
      setBulkUpdateData({})
      clearSelection()
      await onRefresh()
    } catch (error: any) {
      setError(error.message || 'שגיאה בעדכון השיעורים')
    } finally {
      setLoading(false)
    }
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedLessons.size === 0) {
      setError('אנא בחר שיעורים למחיקה')
      return
    }
    setShowBulkDeleteModal(true)
  }

  const confirmBulkDelete = async () => {
    setLoading(true)
    setError('')
    setOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedLessons.size,
      operation: 'מוחק שיעורים',
      details: 'מתחיל מחיקה...'
    })

    try {
      const lessonIds = Array.from(selectedLessons)
      let completed = 0
      const errors: string[] = []

      // Delete lessons one by one with progress updates
      for (const lessonId of lessonIds) {
        try {
          await theoryService.deleteTheoryLesson(lessonId)
          completed++
          setOperationProgress(prev => ({
            ...prev,
            current: completed,
            details: `נמחק שיעור ${completed} מתוך ${lessonIds.length}`
          }))
        } catch (error: any) {
          errors.push(`שגיאה במחיקת שיעור: ${error.message}`)
        }
      }

      setLastOperation({
        success: errors.length === 0,
        affectedCount: completed,
        errors,
        summary: `נמחקו ${completed} שיעורים${errors.length > 0 ? ` (${errors.length} שגיאות)` : ''}`
      })

      if (errors.length === 0) {
        setSuccess(`נמחקו ${completed} שיעורי תיאוריה בהצלחה`)
      } else {
        setError(`הושלמה המחיקה עם ${errors.length} שגיאות`)
      }
      
      setShowBulkDeleteModal(false)
      clearSelection()
      await onRefresh()
    } catch (error: any) {
      setError(error.message || 'שגיאה במחיקת השיעורים')
    } finally {
      setLoading(false)
      setOperationProgress(prev => ({ ...prev, isRunning: false }))
    }
  }

  // Bulk status toggle
  const handleBulkStatusToggle = async (newStatus: boolean) => {
    if (selectedLessons.size === 0) {
      setError('אנא בחר שיעורים לעדכון סטטוס')
      return
    }

    setLoading(true)
    setError('')
    try {
      await theoryService.bulkUpdateTheoryLessons(
        Array.from(selectedLessons),
        { isActive: newStatus }
      )

      const statusText = newStatus ? 'הופעלו' : 'הושבתו'
      setSuccess(`${statusText} ${selectedLessons.size} שיעורי תיאוריה בהצלחה`)
      clearSelection()
      await onRefresh()
    } catch (error: any) {
      setError(error.message || 'שגיאה בעדכון סטטוס השיעורים')
    } finally {
      setLoading(false)
    }
  }

  // Enhanced Export to CSV
  const handleExportCSV = () => {
    if (selectedLessons.size === 0) {
      setError('אנא בחר שיעורים לייצוא')
      return
    }

    // Show operation progress
    setOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedLessons.size,
      operation: 'מייצא נתונים',
      details: 'מכין קובץ CSV...'
    })

    try {
      const csvData = selectedLessonsData.map((lesson, index) => {
        // Update progress
        setOperationProgress(prev => ({
          ...prev,
          current: index + 1,
          details: `מעבד שיעור ${index + 1} מתוך ${selectedLessonsData.length}`
        }))

        const teacher = teachers.find(t => t._id === lesson.teacherId)
        
        return {
          'מזהה': lesson._id,
          'תאריך': new Date(lesson.date).toLocaleDateString('he-IL'),
          'יום בשבוע': ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][new Date(lesson.date).getDay()],
          'קטגוריה': lesson.category,
          'מורה': getDisplayName(teacher?.personalInfo) || lesson.teacherId,
          'שעת התחלה': lesson.startTime,
          'שעת סיום': lesson.endTime,
          'משך (דקות)': calculateDuration(lesson.startTime, lesson.endTime),
          'מיקום': lesson.location,
          'תלמידים רשומים': lesson.studentIds?.length || 0,
          'מספר נוכחים': lesson.attendanceList?.filter(a => a.status === 'הגיע/ה').length || 0,
          'אחוז נוכחות': lesson.studentIds?.length > 0 
            ? Math.round(((lesson.attendanceList?.filter(a => a.status === 'הגיע/ה').length || 0) / lesson.studentIds.length) * 100)
            : 0,
          'סטטוס': lesson.isActive ? 'פעיל' : 'לא פעיל',
          'תיאור': (lesson.description || '').replace(/,/g, ';').replace(/\n/g, ' '),
          'כותרת': lesson.title || '',
          'שנת לימודים': lesson.schoolYearId
        }
      })

      // Add UTF-8 BOM for Hebrew support
      const BOM = '\uFEFF'
      const csv = BOM + [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().split('T')[0]
      link.setAttribute('href', url)
      link.setAttribute('download', `theory-lessons-bulk-export-${timestamp}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setSuccess(`יוצאו ${selectedLessons.size} שיעורים לקובץ CSV בהצלחה`)
    } catch (error: any) {
      setError('שגיאה בייצוא הקובץ: ' + error.message)
    } finally {
      setOperationProgress(prev => ({ ...prev, isRunning: false }))
    }
  }

  // Helper function to calculate lesson duration
  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0
    
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    return endMinutes - startMinutes
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">עדכון שיעורים קבוצתי</h2>
          <p className="text-muted-foreground mt-1">נהל מספר שיעורי תיאוריה בו זמנית</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedLessons.size > 0 && (
            <span className="text-sm text-muted-foreground bg-default-100 px-3 py-1 rounded-full">
              {selectedLessons.size} נבחרו
            </span>
          )}
          
          {/* Help/Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md">
            <div className="flex items-start">
              <InfoIcon className="w-4 h-4 text-blue-600 ml-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">הוראות שימוש:</p>
                <ul className="text-xs space-y-1">
                  <li>• השתמש במסננים לאיתור השיעורים הרלוונטיים</li>
                  <li>• בחר שיעורים על ידי לחיצה על תיבות הסימון</li>
                  <li>• השתמש בפעולות הקבוצתיות לעריכה, מחיקה או ייצוא</li>
                  <li>• כל עדכון יציג תצוגה מקדימה לפני הביצוע</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-green-800">{success}</p>
          {lastOperation && (
            <button
              onClick={() => {/* TODO: Implement undo functionality */}}
              className="text-green-700 hover:text-green-900 text-sm font-medium"
            >
              <ArrowCounterClockwiseIcon className="w-4 h-4 inline ml-1" />
              ביטול פעולה
            </button>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {operationProgress.isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CircleNotchIcon className="w-5 h-5 text-blue-600 animate-spin ml-2" />
              <span className="text-blue-800 font-medium">{operationProgress.operation}</span>
            </div>
            <span className="text-blue-600 text-sm">
              {operationProgress.current} / {operationProgress.total}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${operationProgress.total > 0 ? (operationProgress.current / operationProgress.total) * 100 : 0}%` 
              }}
            />
          </div>
          
          <p className="text-blue-700 text-sm">{operationProgress.details}</p>
        </div>
      )}

      {/* Filters — compact single row */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <FunnelIcon className="w-4 h-4 ml-1.5" />
          מסננים
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">קטגוריה</label>
            <select
              value={localFilters.category}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            >
              <option value="">כל הקטגוריות</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">מורה</label>
            <select
              value={localFilters.teacherId}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, teacherId: e.target.value }))}
              className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            >
              <option value="">כל המורים</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {getDisplayName(teacher.personalInfo)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">סטטוס</label>
            <select
              value={localFilters.status}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            >
              <option value="all">כל השיעורים</option>
              <option value="active">פעילים</option>
              <option value="inactive">לא פעילים</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">מתאריך</label>
            <input
              type="date"
              value={localFilters.dateRange.start}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">עד תאריך</label>
            <input
              type="date"
              value={localFilters.dateRange.end}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            />
          </div>

          <HeroButton
            variant="bordered"
            size="sm"
            className="h-9"
            onPress={() => setLocalFilters({ category: '', teacherId: '', dateRange: { start: '', end: '' }, status: 'all' })}
          >
            נקה מסננים
          </HeroButton>
        </div>
      </div>

      {/* Selection Bar — checkbox + stats + actions in one row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Checkbox
            isSelected={selectAll}
            onValueChange={(checked) => {
              setSelectAll(checked)
              handleSelectAll({ target: { checked } } as any)
            }}
            size="sm"
          >
            <span className="text-sm text-muted-foreground">בחר הכל ({filteredLessons.length} שיעורים)</span>
          </Checkbox>

          {selectedLessons.size > 0 && (
            <HeroButton
              variant="light"
              size="sm"
              onPress={clearSelection}
            >
              בטל בחירה
            </HeroButton>
          )}
        </div>

        {/* Inline stats chips — staggered bounce animation */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {selectedLessons.size > 0 && [
              <motion.div
                key="chip-selected"
                initial={{ opacity: 0, scale: 0.5, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0 }}
              >
                <Chip size="sm" variant="solid" color="primary">
                  {selectedLessons.size} נבחרו
                </Chip>
              </motion.div>,
              <motion.div
                key="chip-students"
                initial={{ opacity: 0, scale: 0.5, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.07 }}
              >
                <Chip size="sm" variant="flat" color="warning" startContent={<UsersIcon className="w-3.5 h-3.5" />}>
                  {selectedLessonsData.reduce((sum, lesson) => sum + (lesson.studentIds?.length || 0), 0)} תלמידים
                </Chip>
              </motion.div>,
              <motion.div
                key="chip-categories"
                initial={{ opacity: 0, scale: 0.5, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.14 }}
              >
                <Chip size="sm" variant="flat" color="secondary" startContent={<FunnelIcon className="w-3.5 h-3.5" />}>
                  {new Set(selectedLessonsData.map(lesson => lesson.category)).size} קטגוריות
                </Chip>
              </motion.div>,
              <motion.div
                key="chip-teachers"
                initial={{ opacity: 0, scale: 0.5, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.21 }}
              >
                <Chip size="sm" variant="flat" color="success" startContent={<InfoIcon className="w-3.5 h-3.5" />}>
                  {new Set(selectedLessonsData.map(lesson => lesson.teacherId)).size} מורים
                </Chip>
              </motion.div>,
            ]}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons — fixed height container so table doesn't shift */}
      <div className="h-10 flex items-center gap-2">
        <AnimatePresence>
          {selectedLessons.size > 0 && [
            <motion.div
              key="btn-export"
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0 }}
            >
              <HeroButton
                variant="bordered"
                color="success"
                size="sm"
                startContent={<DownloadSimpleIcon className="w-4 h-4" />}
                onPress={handleExportCSV}
              >
                ייצוא
              </HeroButton>
            </motion.div>,
            <motion.div
              key="btn-disable"
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.05 }}
            >
              <HeroButton
                variant="bordered"
                color="warning"
                size="sm"
                onPress={() => handleBulkStatusToggle(false)}
              >
                השבת
              </HeroButton>
            </motion.div>,
            <motion.div
              key="btn-enable"
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
            >
              <HeroButton
                variant="bordered"
                color="primary"
                size="sm"
                onPress={() => handleBulkStatusToggle(true)}
              >
                הפעל
              </HeroButton>
            </motion.div>,
            <motion.div
              key="btn-update"
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.15 }}
            >
              <HeroButton
                color="primary"
                variant="solid"
                size="sm"
                startContent={<FloppyDiskIcon className="w-4 h-4" />}
                onPress={handleBulkUpdate}
              >
                עדכון ({selectedLessons.size})
              </HeroButton>
            </motion.div>,
            <motion.div
              key="btn-delete"
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.2 }}
            >
              <HeroButton
                color="danger"
                variant="solid"
                size="sm"
                startContent={<TrashIcon className="w-4 h-4" />}
                onPress={handleBulkDelete}
              >
                מחיקה ({selectedLessons.size})
              </HeroButton>
            </motion.div>,
          ]}
        </AnimatePresence>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          שיעורי תיאוריה ({filteredLessons.length})
        </h3>

        {filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">לא נמצאו שיעורים</h3>
            <p className="text-muted-foreground">נסה לשנות את המסננים או הוסף שיעורים חדשים</p>
          </div>
        ) : (
          <HeroTable
            aria-label="טבלת שיעורי תיאוריה"
            selectionMode="multiple"
            selectedKeys={selectedLessons}
            onSelectionChange={(keys) => {
              if (keys === 'all') {
                setSelectedLessons(new Set(filteredLessons.map(l => l._id)))
              } else {
                setSelectedLessons(new Set(keys as Set<string>))
              }
            }}
            classNames={{
              wrapper: 'bg-transparent shadow-none',
              th: 'bg-default-100 text-default-600',
              thead: '[&>tr]:border-b-0',
              tr: 'transition-colors duration-150 hover:bg-primary/5 data-[selected=true]:bg-primary/10',
              td: 'py-3',
            }}
          >
            <TableHeader>
              <TableColumn key="date">תאריך</TableColumn>
              <TableColumn key="category">קטגוריה</TableColumn>
              <TableColumn key="time">שעות</TableColumn>
              <TableColumn key="location">מיקום</TableColumn>
              <TableColumn key="students" align="center">תלמידים</TableColumn>
              <TableColumn key="status" align="center">סטטוס</TableColumn>
              <TableColumn key="actions" align="end">פעולות</TableColumn>
            </TableHeader>
            <TableBody items={filteredLessons} emptyContent="אין שיעורים להצגה">
              {(lesson) => (
                <TableRow key={lesson._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {new Date(lesson.date).toLocaleDateString('he-IL')}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][new Date(lesson.date).getDay()]}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm truncate max-w-32 inline-block">
                      {lesson.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <ClockIcon className="w-4 h-4 ml-1" />
                      {lesson.startTime} - {lesson.endTime}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPinIcon className="w-4 h-4 ml-1" />
                      <span className="truncate max-w-20">{lesson.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center text-muted-foreground text-sm">
                      <UsersIcon className="w-4 h-4 ml-1" />
                      {lesson.studentIds?.length || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={lesson.isActive ? 'success' : 'danger'}
                    >
                      {lesson.isActive ? 'פעיל' : 'לא פעיל'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <HeroButton
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => {/* Navigate to lesson details */}}
                      title="צפייה בפרטים"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </HeroButton>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </HeroTable>
        )}
      </div>

      {/* Bulk Update Modal */}
      {showBulkUpdateForm && (
        <Modal
          isOpen={showBulkUpdateForm}
          onClose={() => {
            setShowBulkUpdateForm(false)
            setShowPreview(false)
            setBulkUpdateData({})
          }}
          title={showPreview ? 'תצוגה מקדימה - עדכון קבוצתי' : 'עדכון קבוצתי'}
          maxWidth="2xl"
        >
          <div className="p-6">
            {!showPreview ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <UsersIcon className="w-5 h-5 text-blue-600 ml-2" />
                    <p className="text-blue-800">
                      עדכון קבוצתי של {selectedLessons.size} שיעורי תיאוריה
                    </p>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    שדות ריקים יישארו ללא שינוי
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      קטגוריה
                    </label>
                    <select
                      value={bulkUpdateData.category || ''}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    >
                      <option value="">ללא שינוי</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Teacher */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      מורה
                    </label>
                    <select
                      value={bulkUpdateData.teacherId || ''}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, teacherId: e.target.value }))}
                      className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    >
                      <option value="">ללא שינוי</option>
                      {teachers.map(teacher => (
                        <option key={teacher._id} value={teacher._id}>
                          {getDisplayName(teacher.personalInfo)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      מיקום
                    </label>
                    <select
                      value={bulkUpdateData.location || ''}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    >
                      <option value="">ללא שינוי</option>
                      {VALID_LOCATIONS.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      סטטוס
                    </label>
                    <select
                      value={bulkUpdateData.isActive === undefined ? '' : bulkUpdateData.isActive.toString()}
                      onChange={(e) => setBulkUpdateData(prev => ({ 
                        ...prev, 
                        isActive: e.target.value === '' ? undefined : e.target.value === 'true' 
                      }))}
                      className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    >
                      <option value="">ללא שינוי</option>
                      <option value="true">פעיל</option>
                      <option value="false">לא פעיל</option>
                    </select>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      שעת התחלה
                    </label>
                    <input
                      type="time"
                      value={bulkUpdateData.startTime || ''}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      שעת סיום
                    </label>
                    <input
                      type="time"
                      value={bulkUpdateData.endTime || ''}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Title and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      כותרת השיעור
                    </label>
                    <input
                      type="text"
                      value={bulkUpdateData.title || ''}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                      placeholder="ללא שינוי"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      מקסימום תלמידים
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={bulkUpdateData.maxStudents || ''}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, maxStudents: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                      placeholder="ללא שינוי"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    תיאור השיעור
                  </label>
                  <textarea
                    value={bulkUpdateData.description || ''}
                    onChange={(e) => setBulkUpdateData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    placeholder="ללא שינוי"
                  />
                </div>
              </div>
            ) : (
              // Preview Mode
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <WarningIcon className="w-5 h-5 text-yellow-600 ml-2" />
                    <p className="text-yellow-800 font-medium">
                      תצוגה מקדימה - השינויים יחולו על {selectedLessons.size} שיעורים
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">שינויים שיבוצעו:</h3>
                  
                  {Object.entries(bulkUpdateData).filter(([, value]) => 
                    value !== undefined && value !== '' && value !== null
                  ).length === 0 ? (
                    <p className="text-muted-foreground">לא נבחרו שדות לעדכון</p>
                  ) : (
                    <div className="bg-default-50 rounded-lg p-4 space-y-2">
                      {Object.entries(bulkUpdateData).map(([key, value], index) => {
                        if (value === undefined || value === '' || value === null) return null
                        
                        const fieldNames: Record<string, string> = {
                          category: 'קטגוריה',
                          teacherId: 'מורה', 
                          location: 'מיקום',
                          startTime: 'שעת התחלה',
                          endTime: 'שעת סיום',
                          title: 'כותרת השיעור',
                          description: 'תיאור השיעור',
                          maxStudents: 'מקסימום תלמידים',
                          isActive: 'סטטוס'
                        }
                        
                        let displayValue = value
                        if (key === 'teacherId') {
                          const teacher = teachers.find(t => t._id === value)
                          displayValue = getDisplayName(teacher?.personalInfo) || value
                        } else if (key === 'isActive') {
                          displayValue = value ? 'פעיל' : 'לא פעיל'
                        }

                        return (
                          <div key={`${key}-${index}`} className="flex justify-between">
                            <span className="font-medium">{fieldNames[key] || key}:</span>
                            <span>{displayValue}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <HeroButton
                variant="bordered"
                onPress={() => {
                  setShowBulkUpdateForm(false)
                  setShowPreview(false)
                  setBulkUpdateData({})
                }}
              >
                ביטול
              </HeroButton>
              {!showPreview && (
                <HeroButton
                  color="primary"
                  variant="solid"
                  startContent={<EyeIcon className="w-4 h-4" />}
                  onPress={handleBulkUpdateSubmit}
                >
                  תצוגה מקדימה
                </HeroButton>
              )}
              {showPreview && (
                <HeroButton
                  color="success"
                  variant="solid"
                  isLoading={loading}
                  startContent={!loading ? <CheckIcon className="w-4 h-4" /> : undefined}
                  onPress={handleBulkUpdateSubmit}
                >
                  אישור עדכון
                </HeroButton>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        title="מחיקה קבוצתית"
        message={`האם אתה בטוח שברצונך למחוק ${selectedLessons.size} שיעורי תיאוריה?\n\nפעולה זו לא ניתנת לביטול.`}
        confirmText={`מחק ${selectedLessons.size} שיעורים`}
        cancelText="ביטול"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        variant="danger"
      />
    </div>
  )
}