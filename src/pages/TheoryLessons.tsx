import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, MagnifyingGlassIcon, CalendarIcon, ClockIcon, UsersIcon, BookOpenIcon, TrashIcon, WarningIcon, GearIcon, CaretDownIcon, CaretUpIcon, ClockCounterClockwiseIcon } from '@phosphor-icons/react'
import { Button as HeroButton, Checkbox, Tabs, Tab } from '@heroui/react'
import { GlassStatCard } from '../components/ui/GlassStatCard'
import { GlassSelect } from '../components/ui/GlassSelect'
import { SearchInput } from '../components/ui/SearchInput'
import { DragCarousel } from '../components/ui/DragCarousel'
import TheoryLessonForm from '../components/TheoryLessonForm'
import TheoryLessonCard from '../components/TheoryLessonCard'
import BulkTheoryUpdateTab from '../components/BulkTheoryUpdateTab'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import Modal from '../components/ui/Modal'
import { theoryService } from '../services/apiService'
import {
  type TheoryLesson
} from '../utils/theoryLessonUtils'

// Custom CSS for scrollbar styling
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`

export default function TheoryLessons() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<TheoryLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<TheoryLesson | null>(null)
  const [editingLessons, setEditingLessons] = useState<TheoryLesson[]>([])
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'bulk-edit'>('create')
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'lessons' | 'bulk'>('lessons')
  
  // Bulk selection state
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    teacherId: '',
    date: ''
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<any>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Bulk delete state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleteType, setBulkDeleteType] = useState<'date' | 'category' | 'teacher'>('date')
  const [bulkDeleteData, setBulkDeleteData] = useState({
    startDate: '',
    endDate: '',
    category: '',
    teacherId: ''
  })

  // Past lessons visibility state
  const [showPastLessons, setShowPastLessons] = useState(false)
  const [pastLessons, setPastLessons] = useState<TheoryLesson[]>([])
  const [loadingPastLessons, setLoadingPastLessons] = useState(false)
  const [pastLessonsLoaded, setPastLessonsLoaded] = useState(false)

  // Load theory lessons on component mount
  useEffect(() => {
    loadTheoryLessons(false)
  }, [])

  // Reset to first page and reload when filters change
  useEffect(() => {
    setCurrentPage(1)
    setLessons([])
    loadTheoryLessons(false)
  }, [filters, searchQuery])

  const loadTheoryLessons = async (isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Get today's date for filtering upcoming lessons
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      // Build filters with pagination - default to upcoming lessons only
      const params = {
        ...filters,
        fromDate: filters.date ? undefined : todayStr, // Only filter from today if no specific date filter
        page: isLoadMore ? currentPage + 1 : currentPage,
        limit: itemsPerPage,
        search: searchQuery
      }

      console.log('📅 Loading upcoming theory lessons with pagination:', params)

      const response = await theoryService.getTheoryLessons(params)

      // Handle both new format (with pagination) and old format (array)
      if (response.data && response.pagination) {
        if (isLoadMore) {
          // Append new lessons to existing ones
          setLessons(prev => [...prev, ...response.data])
          setCurrentPage(response.pagination.currentPage)
        } else {
          // Replace lessons with new data
          setLessons(response.data)
        }
        setTotalPages(response.pagination.totalPages)
        setTotalCount(response.pagination.totalCount)
        setHasNextPage(response.pagination.hasNextPage || false)
      } else if (Array.isArray(response)) {
        // Legacy format
        if (isLoadMore) {
          setLessons(prev => [...prev, ...response])
        } else {
          setLessons(response)
        }
        setTotalPages(1)
        setTotalCount(response.length)
        setHasNextPage(false)
      } else {
        setLessons([])
        setTotalPages(1)
        setTotalCount(0)
        setHasNextPage(false)
      }
    } catch (error) {
      console.error('Error loading theory lessons:', error)
      setError('שגיאה בטעינת שיעורי התיאוריה')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Handle load more
  const handleLoadMore = () => {
    if (hasNextPage && !loadingMore) {
      loadTheoryLessons(true)
    }
  }

  // Handle refresh (for use by child components)
  const handleRefresh = () => {
    setCurrentPage(1)
    setLessons([])
    setPastLessons([])
    setPastLessonsLoaded(false)
    loadTheoryLessons(false)
  }

  // Load past lessons when user expands that section
  const loadPastLessons = async () => {
    if (pastLessonsLoaded || loadingPastLessons) return

    try {
      setLoadingPastLessons(true)

      // Get yesterday's date for filtering past lessons
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // Request past lessons (before today), sorted by date descending (most recent first)
      const params = {
        ...filters,
        toDate: yesterdayStr,
        page: 1,
        limit: 100, // Load more past lessons at once
        search: searchQuery
      }

      console.log('📅 Loading past theory lessons:', params)

      const response = await theoryService.getTheoryLessons(params)

      if (response.data) {
        setPastLessons(response.data)
      } else if (Array.isArray(response)) {
        setPastLessons(response)
      }

      setPastLessonsLoaded(true)
    } catch (error) {
      console.error('Error loading past theory lessons:', error)
    } finally {
      setLoadingPastLessons(false)
    }
  }

  // Toggle past lessons visibility and load if needed
  const handleTogglePastLessons = () => {
    if (!showPastLessons && !pastLessonsLoaded) {
      loadPastLessons()
    }
    setShowPastLessons(!showPastLessons)
  }

  // Helper function to format day header
  const formatDayHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lessonDate = new Date(date)
    lessonDate.setHours(0, 0, 0, 0)
    
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
    
    const dayName = dayNames[date.getDay()]
    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    
    let prefix = ''
    if (lessonDate.getTime() === today.getTime()) {
      prefix = 'היום - '
    } else if (lessonDate.getTime() === today.getTime() + 86400000) {
      prefix = 'מחר - '
    }
    
    return {
      prefix,
      main: `יום ${dayName}, ${day} ב${month} ${year}`,
      isToday: lessonDate.getTime() === today.getTime(),
      isPast: lessonDate < today
    }
  }

  // Group lessons by individual dates
  const groupedLessonsByDay = useMemo(() => {
    // Group upcoming lessons (from main lessons state)
    const lessonsByDate = new Map<string, TheoryLesson[]>()

    lessons.forEach(lesson => {
      const dateKey = lesson.date // Assuming date is in YYYY-MM-DD format
      if (!lessonsByDate.has(dateKey)) {
        lessonsByDate.set(dateKey, [])
      }
      lessonsByDate.get(dateKey)!.push(lesson)
    })

    // Sort lessons within each day by time
    const sortByTime = (a: TheoryLesson, b: TheoryLesson) => {
      const timeA = a.startTime || '00:00'
      const timeB = b.startTime || '00:00'
      return timeA.localeCompare(timeB)
    }

    lessonsByDate.forEach((dayLessons) => {
      dayLessons.sort(sortByTime)
    })

    // Convert to array and sort by date
    const sortedDates = Array.from(lessonsByDate.entries()).sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime()
    })

    // Get today's date for categorization
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Categorize upcoming dates (today and future only from main lessons)
    const todayLessons: Array<[string, TheoryLesson[]]> = []
    const futureLessons: Array<[string, TheoryLesson[]]> = []

    sortedDates.forEach(([date, dateLessons]) => {
      const lessonDate = new Date(date)
      lessonDate.setHours(0, 0, 0, 0)

      if (lessonDate.getTime() === today.getTime()) {
        todayLessons.push([date, dateLessons])
      } else if (lessonDate > today) {
        futureLessons.push([date, dateLessons])
      }
      // Past lessons are handled separately from pastLessons state
    })

    // Group past lessons from separate state
    const pastLessonsByDate = new Map<string, TheoryLesson[]>()
    pastLessons.forEach(lesson => {
      const dateKey = lesson.date
      if (!pastLessonsByDate.has(dateKey)) {
        pastLessonsByDate.set(dateKey, [])
      }
      pastLessonsByDate.get(dateKey)!.push(lesson)
    })

    pastLessonsByDate.forEach((dayLessons) => {
      dayLessons.sort(sortByTime)
    })

    // Sort past lessons by date descending (most recent first)
    const sortedPastDates = Array.from(pastLessonsByDate.entries()).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime()
    })

    return {
      today: todayLessons,
      future: futureLessons,
      past: sortedPastDates,
      all: [...todayLessons, ...futureLessons, ...sortedPastDates],
      flatList: [...sortedDates.flatMap(([, dateLessons]) => dateLessons), ...pastLessons],
      upcomingCount: lessons.length,
      pastCount: pastLessons.length
    }
  }, [lessons, pastLessons])

  // Use the flat list for table view
  const filteredAndSortedLessons = groupedLessonsByDay.flatList

  // Calculate statistics
  const stats = {
    totalLessons: totalCount || lessons.length, // Use backend total count if available
    upcomingLessons: lessons.length, // Upcoming lessons (loaded from today onwards)
    totalStudents: lessons.reduce((sum, l) => sum + (l.studentIds?.length || 0), 0),
    averageAttendance: lessons.length > 0
      ? Math.round(lessons.reduce((sum, l) => {
          const attendees = l.attendanceList?.filter(a => a.status === 'הגיע/ה').length || 0
          return sum + (attendees / (l.maxStudents || 1))
        }, 0) * 100 / lessons.length)
      : 0
  }

  const handleCreateLesson = () => {
    setEditingLesson(null)
    setEditingLessons([])
    setFormMode('create')
    setShowForm(true)
  }

  const handleViewLesson = (lesson: TheoryLesson) => {
    navigate(`/theory-lessons/${lesson._id}`)
  }

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setEditingLessons([])
    setFormMode('edit')
    setShowForm(true)
  }

  const handleFormSubmit = async (lessonData) => {
    try {
      if (lessonData.mode === 'edit') {
        const { mode, lessonId, ...updateData } = lessonData
        await theoryService.updateTheoryLesson(lessonId, updateData)
      } else if (lessonData.mode === 'bulk-edit') {
        const { mode, lessonIds, updateData } = lessonData
        await theoryService.bulkUpdateTheoryLessons(lessonIds, updateData)
      } else if (lessonData.mode === 'bulk-create' || lessonData.isBulk) {
        // Handle bulk creation
        const { isBulk, mode, ...bulkData } = lessonData
        await theoryService.bulkCreateTheoryLessons(bulkData)
      } else {
        const { mode, ...createData } = lessonData
        await theoryService.createTheoryLesson(createData)
      }
      setShowForm(false)
      setEditingLesson(null)
      setEditingLessons([])
      setFormMode('create')
      setSelectedLessons(new Set())
      // Reset to first page and reload
      setCurrentPage(1)
      setLessons([])
      await loadTheoryLessons(false)
    } catch (error) {
      console.error('Error saving theory lesson:', error)
      throw error
    }
  }

  const handleDeleteLesson = (lesson: any) => {
    setLessonToDelete(lesson)
    setShowDeleteModal(true)
  }

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return

    try {
      await theoryService.deleteTheoryLesson(lessonToDelete._id)
      // Reset to first page and reload
      setCurrentPage(1)
      setLessons([])
      await loadTheoryLessons(false)
      setShowDeleteModal(false)
      setLessonToDelete(null)
    } catch (error) {
      console.error('Error deleting theory lesson:', error)
      setError('שגיאה במחיקת שיעור התיאוריה')
    }
  }

  // Bulk delete handlers
  const handleBulkDelete = async () => {
    try {
      let result
      switch (bulkDeleteType) {
        case 'date':
          if (!bulkDeleteData.startDate || !bulkDeleteData.endDate) {
            setError('נדרש לבחור תאריכי התחלה וסיום')
            return
          }
          result = await theoryService.deleteTheoryLessonsByDateRange(
            bulkDeleteData.startDate,
            bulkDeleteData.endDate
          )
          break
        case 'category':
          if (!bulkDeleteData.category) {
            setError('נדרש לבחור קטגוריה')
            return
          }
          result = await theoryService.deleteTheoryLessonsByCategory(bulkDeleteData.category)
          break
        case 'teacher':
          if (!bulkDeleteData.teacherId) {
            setError('נדרש לבחור מורה')
            return
          }
          result = await theoryService.deleteTheoryLessonsByTeacher(bulkDeleteData.teacherId)
          break
        default:
          setError('סוג מחיקה לא תקין')
          return
      }

      // Reset to first page and reload
      setCurrentPage(1)
      setLessons([])
      await loadTheoryLessons(false)
      setShowBulkDeleteModal(false)
      setBulkDeleteData({ startDate: '', endDate: '', category: '', teacherId: '' })
      setError(null)
      console.log(`✅ נמחקו ${result.deletedCount} שיעורי תיאוריה בהצלחה`)
    } catch (error: any) {
      setError(error.message || 'שגיאה במחיקת שיעורי התיאוריה')
      setShowBulkDeleteModal(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false)
    setBulkDeleteData({ startDate: '', endDate: '', category: '', teacherId: '' })
  }

  // Bulk selection handlers
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
      setSelectedLessons(new Set(filteredAndSortedLessons.map(lesson => lesson._id)))
    }
    setSelectAll(!selectAll)
  }

  const handleBulkEdit = () => {
    const lessonsToEdit = lessons.filter(lesson => selectedLessons.has(lesson._id))
    if (lessonsToEdit.length === 0) {
      setError('אנא בחר שיעורים לעריכה')
      return
    }
    
    setEditingLessons(lessonsToEdit)
    setEditingLesson(null)
    setFormMode('bulk-edit')
    setShowForm(true)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-slate-600">טוען שיעורי תיאוריה...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">שיעורי תיאוריה</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">ניהול שיעורי תיאוריה ומעקב נוכחות</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'lessons' && (
            <>
              {selectedLessons.size > 0 && (
                <>
                  <HeroButton
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={handleBulkEdit}
                    startContent={<UsersIcon size={14} weight="fill" />}
                  >
                    עריכה קבוצתית ({selectedLessons.size})
                  </HeroButton>
                  <HeroButton
                    color="default"
                    variant="flat"
                    size="sm"
                    onPress={() => setSelectedLessons(new Set())}
                  >
                    ביטול בחירה
                  </HeroButton>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs
        aria-label="שיעורי תיאוריה"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as 'lessons' | 'bulk')}
        variant="solid"
        color="default"
        classNames={{
          tab: "font-bold text-sm",
        }}
      >
        <Tab
          key="lessons"
          title={
            <div className="flex items-center gap-2">
              <BookOpenIcon size={16} weight="regular" />
              <span>רשימת שיעורים</span>
            </div>
          }
        />
        <Tab
          key="bulk"
          title={
            <div className="flex items-center gap-2">
              <GearIcon size={16} weight="regular" />
              <span>עדכון שיעורים קבוצתי</span>
            </div>
          }
        />
      </Tabs>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
      {activeTab === 'lessons' ? (
        <motion.div
          key="lessons-tab"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex flex-col gap-4"
        >
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { value: stats.totalLessons, label: 'סה״כ שיעורים' },
          { value: stats.upcomingLessons, label: 'שיעורים קרובים' },
          { value: stats.totalStudents, label: 'סה״כ תלמידים' },
          { value: `${stats.averageAttendance}%`, label: 'נוכחות ממוצעת' },
        ].map((s) => (
          <GlassStatCard key={s.label} value={s.value} label={s.label} size="sm" />
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-3 flex-wrap px-1">
        <div className="w-64 flex-none">
          <SearchInput
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            placeholder="חיפוש שיעורים..."
          />
        </div>

        <GlassSelect
          value={filters.category || '__all__'}
          onValueChange={(v) => setFilters(prev => ({ ...prev, category: v === '__all__' ? '' : v }))}
          placeholder="כל הקטגוריות"
          options={[
            { value: '__all__', label: 'כל הקטגוריות' },
            { value: 'תלמידים חדשים ב-ד', label: 'תלמידים חדשים ב-ד' },
            { value: 'תלמידים חדשים צעירים', label: 'תלמידים חדשים צעירים' },
            { value: 'תלמידים חדשים בוגרים (ה - ט)', label: 'תלמידים חדשים בוגרים (ה - ט)' },
            { value: 'מתחילים', label: 'מתחילים' },
            { value: 'מתחילים ב', label: 'מתחילים ב' },
            { value: 'מתחילים ד', label: 'מתחילים ד' },
            { value: 'מתקדמים א', label: 'מתקדמים א' },
            { value: 'מתקדמים ב', label: 'מתקדמים ב' },
            { value: 'מתקדמים ג', label: 'מתקדמים ג' },
            { value: 'הכנה לרסיטל קלאסי יא', label: 'הכנה לרסיטל קלאסי יא' },
            { value: 'הכנה לרסיטל רוק\\פופ\\ג\'אז יא', label: 'הכנה לרסיטל רוק\\פופ\\ג\'אז יא' },
            { value: 'הכנה לרסיטל רוק\\פופ\\ג\'אז יב', label: 'הכנה לרסיטל רוק\\פופ\\ג\'אז יב' },
            { value: 'מגמה', label: 'מגמה' },
            { value: 'תאוריה כלי', label: 'תאוריה כלי' },
          ]}
        />

        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
          className="h-9 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {filteredAndSortedLessons.length > 0 && (
          <Checkbox
            size="sm"
            color="primary"
            isSelected={selectAll}
            onValueChange={handleSelectAll}
          >
            <span className="text-xs">בחר הכל ({selectedLessons.size} נבחרו)</span>
          </Checkbox>
        )}

        <span className="text-xs font-medium text-slate-400 mr-auto">
          {searchQuery || filters.category || filters.date
            ? `${lessons.length} מתוך ${totalCount}`
            : `${lessons.length} שיעורים`}
        </span>

        <HeroButton
          color="danger"
          variant="flat"
          size="sm"
          onPress={() => setShowBulkDeleteModal(true)}
          startContent={<TrashIcon size={14} weight="fill" />}
        >
          מחיקת שיעורים
        </HeroButton>
        <HeroButton
          color="primary"
          variant="solid"
          size="sm"
          onPress={handleCreateLesson}
          startContent={<PlusIcon size={14} weight="bold" />}
          className="font-bold"
        >
          שיעור חדש
        </HeroButton>
      </div>

      {/* Theory Lessons Table */}
      <div className="p-6">
        {filteredAndSortedLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon size={48} weight="regular" className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין שיעורי תיאוריה</h3>
            <p className="text-gray-600 mb-4">התחל על ידי יצירת שיעור התיאוריה הראשון</p>
            <HeroButton
              color="primary"
              variant="solid"
              onPress={handleCreateLesson}
              startContent={<PlusIcon size={16} weight="bold" />}
            >
              צור שיעור ראשון
            </HeroButton>
          </div>
        ) : (
          <div className="space-y-6">
            {/* No Upcoming Lessons Message */}
            {groupedLessonsByDay.today.length === 0 && groupedLessonsByDay.future.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-6 text-center">
                <CalendarIcon size={40} weight="regular" className="text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-900 mb-1">אין שיעורים קרובים</h3>
                <p className="text-blue-700 text-sm mb-3">
                  אין שיעורים מתוכננים להיום או לעתיד. ניתן לצפות בשיעורים שהסתיימו למטה או ליצור שיעורים חדשים.
                </p>
                <HeroButton
                  color="primary"
                  variant="solid"
                  size="sm"
                  onPress={handleCreateLesson}
                  startContent={<PlusIcon size={16} weight="bold" />}
                >
                  צור שיעור חדש
                </HeroButton>
              </div>
            )}

            {/* Today's Lessons Section */}
            {groupedLessonsByDay.today.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1 bg-primary rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">להיום</h2>
                </div>
                {groupedLessonsByDay.today.map(([date, dayLessons]) => {
                  const dayInfo = formatDayHeader(date)
                  return (
                    <div key={date} className="bg-muted rounded p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">
                          {dayInfo.main}
                        </h3>
                        <span className="text-sm text-muted-foreground font-medium">
                          {dayLessons.length} שיעורים
                          {dayLessons.length > 1 && (
                            <span className="mr-2 text-xs text-muted-foreground">← גלל</span>
                          )}
                        </span>
                      </div>
                      <DragCarousel>
                        {dayLessons.map(lesson => (
                          <div key={lesson._id} className="w-80 flex-shrink-0">
                            <TheoryLessonCard
                              lesson={lesson}
                              onView={handleViewLesson}
                              onEdit={handleEditLesson}
                              onDelete={handleDeleteLesson}
                              selected={selectedLessons.has(lesson._id)}
                            />
                          </div>
                        ))}
                      </DragCarousel>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Future Lessons Section */}
            {groupedLessonsByDay.future.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">שיעורים עתידיים</h2>
                </div>
                {groupedLessonsByDay.future.map(([date, dayLessons]) => {
                  const dayInfo = formatDayHeader(date)
                  return (
                    <div key={date} className="bg-blue-50 rounded p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-blue-900">
                          <span className="text-blue-700">{dayInfo.prefix}</span>
                          {dayInfo.main}
                        </h3>
                        <span className="text-sm text-blue-700 font-medium">
                          {dayLessons.length} שיעורים
                          {dayLessons.length > 1 && (
                            <span className="mr-2 text-xs text-blue-600">← גלל</span>
                          )}
                        </span>
                      </div>
                      <DragCarousel>
                        {dayLessons.map(lesson => (
                          <div key={lesson._id} className="w-80 flex-shrink-0">
                            <TheoryLessonCard
                              lesson={lesson}
                              onView={handleViewLesson}
                              onEdit={handleEditLesson}
                              onDelete={handleDeleteLesson}
                              selected={selectedLessons.has(lesson._id)}
                            />
                          </div>
                        ))}
                      </DragCarousel>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Past Lessons Section - Collapsible, loaded on demand */}
            <div className="space-y-4">
              {/* Past Lessons Toggle Button */}
              <button
                onClick={handleTogglePastLessons}
                className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 rounded transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full">
                    <ClockCounterClockwiseIcon size={20} weight="regular" className="text-gray-600" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-gray-700">שיעורים שהסתיימו</h2>
                    <p className="text-sm text-gray-500">
                      {pastLessonsLoaded
                        ? `${groupedLessonsByDay.pastCount} שיעורים ב-${groupedLessonsByDay.past.length} ימים`
                        : 'לחץ לטעינה'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  {loadingPastLessons ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  ) : (
                    <>
                      <span className="text-sm font-medium">
                        {showPastLessons ? 'הסתר' : 'הצג'}
                      </span>
                      {showPastLessons ? (
                        <CaretUpIcon size={20} weight="regular" />
                      ) : (
                        <CaretDownIcon size={20} weight="regular" />
                      )}
                    </>
                  )}
                </div>
              </button>

              {/* Past Lessons Content - Only shown when expanded and loaded */}
              {showPastLessons && pastLessonsLoaded && groupedLessonsByDay.past.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {groupedLessonsByDay.past.map(([date, dayLessons]) => {
                    const dayInfo = formatDayHeader(date)
                    return (
                      <div key={date} className="bg-gray-50 rounded p-4 space-y-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-700">
                            {dayInfo.main}
                          </h3>
                          <span className="text-sm text-gray-600 font-medium">
                            {dayLessons.length} שיעורים
                            {dayLessons.length > 1 && (
                              <span className="mr-2 text-xs text-gray-500">← גלל</span>
                            )}
                          </span>
                        </div>
                        <DragCarousel>
                          {dayLessons.map(lesson => (
                            <div key={lesson._id} className="w-80 flex-shrink-0">
                              <TheoryLessonCard
                                lesson={lesson}
                                onView={handleViewLesson}
                                onEdit={handleEditLesson}
                                onDelete={handleDeleteLesson}
                                selected={selectedLessons.has(lesson._id)}
                              />
                            </div>
                          ))}
                        </DragCarousel>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* No past lessons message */}
              {showPastLessons && pastLessonsLoaded && groupedLessonsByDay.past.length === 0 && (
                <div className="bg-gray-50 rounded p-6 text-center border border-gray-200">
                  <p className="text-gray-500">אין שיעורים שהסתיימו</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center">
          <HeroButton
            color="primary"
            variant="flat"
            onPress={handleLoadMore}
            isDisabled={loadingMore}
            isLoading={loadingMore}
            startContent={!loadingMore ? <CalendarIcon size={20} weight="regular" /> : undefined}
          >
            {loadingMore ? 'טוען...' : (
              <>
                טען עוד שיעורים
                {totalCount > lessons.length && (
                  <span className="text-sm opacity-90 mr-1">
                    ({lessons.length} מתוך {totalCount})
                  </span>
                )}
              </>
            )}
          </HeroButton>
        </div>
      )}

      </motion.div>
      ) : (
        /* Bulk Update Tab */
        <motion.div
          key="bulk-tab"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <BulkTheoryUpdateTab
            lessons={lessons}
            onRefresh={handleRefresh}
            searchQuery={searchQuery}
            filters={filters}
          />
        </motion.div>
      )}
      </AnimatePresence>

      {/* Theory Lesson Form Modal */}
      {showForm && (
        <TheoryLessonForm
          theoryLesson={editingLesson}
          theoryLessons={editingLessons}
          mode={formMode}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingLesson(null)
            setEditingLessons([])
            setFormMode('create')
            setSelectedLessons(new Set())
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת שיעור תיאוריה"
        message={
          lessonToDelete
            ? `האם אתה בטוח שברצונך למחוק את שיעור התיאוריה "${lessonToDelete.title}"?\n\nפרטי השיעור:\n• תאריך: ${new Date(lessonToDelete.date).toLocaleDateString('he-IL')}\n• משך: ${lessonToDelete.duration} דקות\n• תלמידים רשומים: ${lessonToDelete.registeredStudents?.length || 0}\n\nפעולה זו לא ניתנת לביטול.`
            : 'האם אתה בטוח שברצונך למחוק את שיעור התיאוריה?'
        }
        confirmText="מחק שיעור"
        cancelText="ביטול"
        onConfirm={confirmDeleteLesson}
        onCancel={() => {
          setShowDeleteModal(false)
          setLessonToDelete(null)
        }}
        variant="danger"
      />

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={cancelBulkDelete}
        title="מחיקה קבוצתית של שיעורי תיאוריה"
        maxWidth="lg"
      >
        <div className="p-6">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center">
              <WarningIcon size={20} weight="fill" className="text-yellow-600 ml-2" />
              <p className="text-yellow-800">
                ⚠️ פעולה זו תמחק שיעורי תיאוריה על בסיס הקריטריונים שנבחרו. 
                פעולה זו אינה ניתנת לביטול!
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Bulk Delete Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג מחיקה
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="date"
                    checked={bulkDeleteType === 'date'}
                    onChange={(e) => setBulkDeleteType(e.target.value as 'date')}
                    className="ml-2"
                  />
                  טווח תאריכים
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="category"
                    checked={bulkDeleteType === 'category'}
                    onChange={(e) => setBulkDeleteType(e.target.value as 'category')}
                    className="ml-2"
                  />
                  לפי קטגוריה
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="teacher"
                    checked={bulkDeleteType === 'teacher'}
                    onChange={(e) => setBulkDeleteType(e.target.value as 'teacher')}
                    className="ml-2"
                  />
                  לפי מורה
                </label>
              </div>
            </div>

            {/* Date Range */}
            {bulkDeleteType === 'date' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך התחלה
                  </label>
                  <input
                    type="date"
                    value={bulkDeleteData.startDate}
                    onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך סיום
                  </label>
                  <input
                    type="date"
                    value={bulkDeleteData.endDate}
                    onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>
            )}

            {/* Category Selection */}
            {bulkDeleteType === 'category' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קטגוריה
                </label>
                <select
                  value={bulkDeleteData.category}
                  onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">בחר קטגוריה</option>
                  <option value="תלמידים חדשים ב-ד">תלמידים חדשים ב-ד</option>
                  <option value="מתחילים">מתחילים</option>
                  <option value="מתחילים ב">מתחילים ב</option>
                  <option value="מתחילים ד">מתחילים ד</option>
                  <option value="מתקדמים ב">מתקדמים ב</option>
                  <option value="מתקדמים א">מתקדמים א</option>
                  <option value="מתקדמים ג">מתקדמים ג</option>
                  <option value="תלמידים חדשים בוגרים (ה - ט)">תלמידים חדשים בוגרים (ה - ט)</option>
                  <option value="תלמידים חדשים צעירים">תלמידים חדשים צעירים</option>
                  <option value="הכנה לרסיטל קלאסי יא">הכנה לרסיטל קלאסי יא</option>
                  <option value="הכנה לרסיטל רוק\פופ\ג'אז יא">הכנה לרסיטל רוק\פופ\ג'אז יא</option>
                  <option value="הכנה לרסיטל רוק\פופ\ג'אז יב">הכנה לרסיטל רוק\פופ\ג'אז יב</option>
                  <option value="מגמה">מגמה</option>
                  <option value="תאוריה כלי">תאוריה כלי</option>
                </select>
              </div>
            )}

            {/* Teacher Selection */}
            {bulkDeleteType === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מורה
                </label>
                <input
                  type="text"
                  placeholder="הזן מזהה מורה או שם"
                  value={bulkDeleteData.teacherId}
                  onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ניתן להזין מזהה מורה או לחפש לפי שם
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <HeroButton
              color="default"
              variant="flat"
              onPress={cancelBulkDelete}
            >
              ביטול
            </HeroButton>
            <HeroButton
              color="danger"
              variant="solid"
              onPress={handleBulkDelete}
              isDisabled={
                (bulkDeleteType === 'date' && (!bulkDeleteData.startDate || !bulkDeleteData.endDate)) ||
                (bulkDeleteType === 'category' && !bulkDeleteData.category) ||
                (bulkDeleteType === 'teacher' && !bulkDeleteData.teacherId)
              }
              startContent={<TrashIcon size={16} weight="fill" />}
            >
              מחק שיעורי תיאוריה
            </HeroButton>
          </div>
        </div>
      </Modal>
      </div>
    </>
  )
}