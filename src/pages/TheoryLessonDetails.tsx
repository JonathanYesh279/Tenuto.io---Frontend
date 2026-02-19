import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowRight, 
  Edit, 
  Plus, 
  Trash2, 
  Search,
  User,
  Users, 
  Calendar,
  MapPin,
  BookOpen,
  Clock,
  UserPlus,
  UserMinus,
  Eye,
  Check,
  X,
  FileText,
  CheckCircle
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import Table from '../components/ui/Table'
import StatsCard from '../components/ui/StatsCard'
import TheoryLessonForm from '../components/TheoryLessonForm'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import { theoryService, studentService, teacherService } from '../services/apiService'
import { getDisplayName } from '@/utils/nameUtils'

interface TheoryLesson {
  _id: string
  category: string
  teacherId: string
  date: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
  studentIds: string[]
  attendance: {
    present: string[]
    absent: string[]
  }
  notes: string
  syllabus: string
  homework: string
  schoolYearId: string
  createdAt: string
  updatedAt: string
}

interface Student {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone?: string
    studentEmail?: string
  }
  academicInfo: {
    class: string
    instrumentProgress?: Array<{
      instrumentName: string
      isPrimary: boolean
      currentStage: string
    }>
  }
  isActive: boolean
}

interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    email?: string
    phone?: string
  }
}

const DAYS_OF_WEEK = {
  0: 'ראשון',
  1: 'שני', 
  2: 'שלישי',
  3: 'רביעי',
  4: 'חמישי',
  5: 'שישי',
  6: 'שבת'
}

export default function TheoryLessonDetails() {
  const { theoryId } = useParams<{ theoryId: string }>()
  const navigate = useNavigate()
  
  const [theoryLesson, setTheoryLesson] = useState<TheoryLesson | null>(null)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [showAttendance, setShowAttendance] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [tempAttendance, setTempAttendance] = useState<{present: string[], absent: string[]}>({
    present: [],
    absent: []
  })

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info'
  } | null>(null)

  // Helper function to show confirmation modal
  const showConfirmationModal = (config: {
    title: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info'
  }) => {
    setConfirmationConfig(config)
    setShowConfirmation(true)
  }

  // Helper function to handle confirmation
  const handleConfirmation = () => {
    if (confirmationConfig?.onConfirm) {
      confirmationConfig.onConfirm()
    }
    setShowConfirmation(false)
    setConfirmationConfig(null)
  }

  // Helper function to cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setConfirmationConfig(null)
  }

  useEffect(() => {
    if (theoryId) {
      loadTheoryLessonDetails()
    }
  }, [theoryId])

  const loadTheoryLessonDetails = async () => {
    if (!theoryId) return

    try {
      setLoading(true)
      setError(null)
      
      // Load theory lesson details, students, and teachers in parallel
      const [theoryData, studentsData, teachersData] = await Promise.all([
        theoryService.getTheoryLesson(theoryId),
        studentService.getStudents(),
        teacherService.getTeachers()
      ])
      
      setTheoryLesson(theoryData)
      setAllStudents(studentsData)
      setTeachers(teachersData)
      
      // Initialize attendance with current data
      setTempAttendance(theoryData.attendance || { present: [], absent: [] })
    } catch (error) {
      console.error('Error loading theory lesson details:', error)
      setError('שגיאה בטעינת פרטי שיעור התאוריה')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTheoryLesson = async (theoryData: any) => {
    if (!theoryId) return

    try {
      await theoryService.updateTheoryLesson(theoryId, theoryData)
      setShowEditForm(false)
      await loadTheoryLessonDetails()
    } catch (error) {
      console.error('Error updating theory lesson:', error)
      throw error
    }
  }

  const handleAddStudent = async (studentId: string) => {
    if (!theoryId) return

    try {
      await theoryService.addStudentToTheory(theoryId, studentId)
      await loadTheoryLessonDetails()
    } catch (error) {
      console.error('Error adding student:', error)
      setError('שגיאה בהוספת תלמיד לשיעור')
    }
  }

  const handleRemoveStudent = (studentId: string) => {
    if (!theoryId) return

    showConfirmationModal({
      title: 'הסרת תלמיד מהשיעור',
      message: 'האם אתה בטוח שברצונך להסיר את התלמיד מהשיעור?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await theoryService.removeStudentFromTheory(theoryId, studentId)
          await loadTheoryLessonDetails()
        } catch (error) {
          console.error('Error removing student:', error)
          setError('שגיאה בהסרת תלמיד מהשיעור')
        }
      }
    })
  }

  const handleDeleteTheoryLesson = () => {
    if (!theoryId) return

    showConfirmationModal({
      title: 'מחיקת שיעור תאוריה',
      message: 'האם אתה בטוח שברצונך למחוק את שיעור התאוריה? פעולה זו אינה הפיכה.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await theoryService.deleteTheoryLesson(theoryId)
          navigate('/theories')
        } catch (error) {
          console.error('Error deleting theory lesson:', error)
          setError('שגיאה במחיקת שיעור התאוריה')
        }
      }
    })
  }

  const handleSaveAttendance = async () => {
    if (!theoryId) return

    try {
      await theoryService.updateTheoryAttendance(theoryId, tempAttendance)
      await loadTheoryLessonDetails()
      setShowAttendance(false)
    } catch (error) {
      console.error('Error updating attendance:', error)
      setError('שגיאה בעדכון נוכחות')
    }
  }

  const toggleAttendance = (studentId: string, isPresent: boolean) => {
    setTempAttendance(prev => {
      const newAttendance = {
        present: [...prev.present],
        absent: [...prev.absent]
      }

      if (isPresent) {
        // Mark as present
        newAttendance.present = [...newAttendance.present.filter(id => id !== studentId), studentId]
        newAttendance.absent = newAttendance.absent.filter(id => id !== studentId)
      } else {
        // Mark as absent
        newAttendance.absent = [...newAttendance.absent.filter(id => id !== studentId), studentId]
        newAttendance.present = newAttendance.present.filter(id => id !== studentId)
      }

      return newAttendance
    })
  }

  const markAllPresent = useCallback(() => {
    if (!theoryLesson) return
    const allStudentIds = allStudents
      .filter(student => theoryLesson.studentIds.includes(student._id))
      .map(student => student._id)
    setTempAttendance({
      present: allStudentIds,
      absent: []
    })
  }, [theoryLesson, allStudents])

  const markAllAbsent = useCallback(() => {
    if (!theoryLesson) return
    const allStudentIds = allStudents
      .filter(student => theoryLesson.studentIds.includes(student._id))
      .map(student => student._id)
    setTempAttendance({
      present: [],
      absent: allStudentIds
    })
  }, [theoryLesson, allStudents])

  const clearAllAttendance = useCallback(() => {
    setTempAttendance({
      present: [],
      absent: []
    })
  }, [])

  const handleViewStudentProfile = (studentId: string) => {
    navigate(`/students/${studentId}`)
  }

  const handleViewTeacherProfile = (teacherId: string) => {
    navigate(`/teachers/${teacherId}`)
  }

  // Check if lesson date has passed (for attendance management)
  // TEMPORARY: Show attendance for all lessons during development
  const hasLessonPassed = useMemo(() => {
    if (!theoryLesson) return false
    
    // For development, always return true to test attendance functionality
    return true
    
    // Original logic (uncomment for production):
    // const lessonDate = new Date(theoryLesson.date)
    // const today = new Date()
    // today.setHours(0, 0, 0, 0) // Reset time to compare dates only
    // lessonDate.setHours(0, 0, 0, 0)
    // return lessonDate < today
  }, [theoryLesson])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">טוען פרטי שיעור תאוריה...</div>
        </div>
      </div>
    )
  }

  if (error || !theoryLesson) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">שגיאה בטעינת שיעור התאוריה</h3>
        <p className="text-gray-600 mb-4">{error || 'שיעור תאוריה לא נמצא'}</p>
        <button
          onClick={() => navigate('/theories')}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור לרשימת שיעורי תאוריה
        </button>
      </div>
    )
  }

  // Get available students (not in this theory lesson)
  const availableStudents = allStudents.filter(student => 
    !theoryLesson.studentIds.includes(student._id) &&
    student.isActive &&
    (!searchQuery ||
      getDisplayName(student.personalInfo).toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.academicInfo?.class?.includes(searchQuery))
  )

  // Get current enrolled students
  const enrolledStudents = allStudents.filter(student => 
    theoryLesson.studentIds.includes(student._id)
  )

  // Teacher details
  const teacher = teachers.find(teacher => teacher._id === theoryLesson.teacherId)

  // Statistics
  const stats = {
    totalStudents: enrolledStudents.length,
    attendanceRate: theoryLesson.attendance && enrolledStudents.length > 0 ? 
      (theoryLesson.attendance.present.length / enrolledStudents.length * 100) : 0,
    presentCount: theoryLesson.attendance?.present.length || 0,
    absentCount: theoryLesson.attendance?.absent.length || 0
  }

  // Helper function to get attendance rate color
  const getAttendanceRateColor = (rate: number): 'green' | 'orange' | 'red' => {
    if (isNaN(rate)) return 'red'
    if (rate >= 75) return 'green'
    if (rate >= 50) return 'orange'
    return 'red'
  }

  // Student columns for table
  const studentColumns = [
    {
      key: 'name',
      label: 'שם',
      render: (student: Student) => (
        <div className="flex items-center">
          <div>
            <div className="font-medium text-gray-900">{getDisplayName(student.personalInfo)}</div>
            <div className="text-sm text-gray-500">כיתה {student.academicInfo?.class}</div>
          </div>
        </div>
      )
    },
    {
      key: 'instrument',
      label: 'כלי ראשי',
      render: (student: Student) => {
        const primaryInstrument = student.academicInfo?.instrumentProgress?.find(
          (p: any) => p.isPrimary
        )
        return primaryInstrument ? (
          <div>
            <span className="font-medium">{primaryInstrument.instrumentName}</span>
            <span className="text-sm text-gray-500 block">שלב {primaryInstrument.currentStage}</span>
          </div>
        ) : 'לא צוין'
      }
    },
    {
      key: 'contact',
      label: 'פרטי קשר',
      render: (student: Student) => (
        <div className="text-sm text-gray-600">
          <div>{student.personalInfo?.phone}</div>
          {student.personalInfo?.studentEmail && (
            <div className="text-xs">{student.personalInfo.studentEmail}</div>
          )}
        </div>
      )
    },
  ]

  // Available students columns
  const availableStudentColumns = [
    {
      key: 'name',
      label: 'שם',
      render: (student: Student) => (
        <div>
          <div className="font-medium text-gray-900">{getDisplayName(student.personalInfo)}</div>
          <div className="text-sm text-gray-500">כיתה {student.academicInfo?.class}</div>
        </div>
      )
    },
    {
      key: 'instrument',
      label: 'כלי ראשי',
      render: (student: Student) => {
        const primaryInstrument = student.academicInfo?.instrumentProgress?.find(
          (p: any) => p.isPrimary
        )
        return primaryInstrument?.instrumentName || 'לא צוין'
      }
    },
    {
      key: 'actions',
      label: 'פעולות',
      render: (student: Student) => (
        <button
          onClick={() => handleAddStudent(student._id)}
          className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          <UserPlus className="w-3 h-3 ml-1" />
          הוסף
        </button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/theories')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">{theoryLesson.category}</h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {DAYS_OF_WEEK[theoryLesson.dayOfWeek as keyof typeof DAYS_OF_WEEK]}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-foreground">
                {theoryLesson.startTime} - {theoryLesson.endTime}
              </span>
            </div>
            <p className="text-gray-600">ניהול תלמידים, נוכחות וחומרי לימוד</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {hasLessonPassed && (
            <button
              onClick={() => setShowAttendance(true)}
              className="flex items-center px-3 py-2 text-green-700 border border-green-300 rounded hover:bg-green-50 transition-colors"
            >
              <Check className="w-4 h-4 ml-1" />
              נוכחות
            </button>
          )}
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center px-3 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 ml-1" />
            ערוך
          </button>
          <button
            onClick={handleDeleteTheoryLesson}
            className="flex items-center px-3 py-2 text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            מחק
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="תלמידים רשומים"
          value={stats.totalStudents.toString()}
          subtitle="תלמידים בשיעור"
          icon={<Users />}
          color="blue"
        />
        <StatsCard
          title="נוכחים"
          value={stats.presentCount.toString()}
          subtitle="בשיעור האחרון"
          icon={<Check />}
          color="green"
        />
        <StatsCard
          title="נעדרים"
          value={stats.absentCount.toString()}
          subtitle="בשיעור האחרון"
          icon={<X />}
          color="red"
        />
        <StatsCard
          title="אחוז נוכחות"
          value={`${isNaN(stats.attendanceRate) ? 0 : Math.round(stats.attendanceRate)}%`}
          subtitle="ממוצע כללי"
          icon={<Calendar />}
          color={getAttendanceRateColor(stats.attendanceRate)}
        />
      </div>

      {/* Theory Lesson Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theory Lesson Information */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי השיעור</h3>
            
            <div className="space-y-4">
              {/* Teacher */}
              <div className="flex items-start">
                <User className="w-5 h-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <div className="font-medium text-gray-900">מורה</div>
                  {teacher ? (
                    <div className="text-sm text-gray-600">
                      <button
                        onClick={() => handleViewTeacherProfile(teacher._id)}
                        className="text-primary hover:text-neutral-700 hover:underline"
                      >
                        {getDisplayName(teacher.personalInfo)}
                      </button>
                      {teacher.personalInfo?.email && (
                        <div className="text-xs text-gray-500">{teacher.personalInfo.email}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">לא הוקצה מורה</div>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <div className="font-medium text-gray-900">זמן</div>
                  <div className="text-sm text-gray-600">
                    {DAYS_OF_WEEK[theoryLesson.dayOfWeek as keyof typeof DAYS_OF_WEEK]} {theoryLesson.startTime} - {theoryLesson.endTime}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(theoryLesson.date).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <div className="font-medium text-gray-900">מיקום</div>
                  <div className="text-sm text-gray-600">{theoryLesson.location}</div>
                </div>
              </div>

              {/* Category */}
              <div className="flex items-start">
                <BookOpen className="w-5 h-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <div className="font-medium text-gray-900">קטגוריה</div>
                  <div className="text-sm text-gray-600">{theoryLesson.category}</div>
                </div>
              </div>
            </div>

            {/* Notes and Syllabus */}
            {(theoryLesson.notes || theoryLesson.syllabus || theoryLesson.homework) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">מידע נוסף</h4>
                
                {theoryLesson.syllabus && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-black font-semibold mb-1" style={{color: '#000000'}}>סילבוס:</div>
                    <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{theoryLesson.syllabus}</div>
                  </div>
                )}

                {theoryLesson.homework && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-black font-semibold mb-1" style={{color: '#000000'}}>שיעורי בית:</div>
                    <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{theoryLesson.homework}</div>
                  </div>
                )}

                {theoryLesson.notes && (
                  <div>
                    <div className="text-xs font-medium text-black font-semibold mb-1" style={{color: '#000000'}}>הערות:</div>
                    <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{theoryLesson.notes}</div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Students Management */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                תלמידים רשומים ({enrolledStudents.length})
              </h3>
              <button
                onClick={() => setShowAddStudent(!showAddStudent)}
                className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4 ml-1" />
                הוסף תלמיד
              </button>
            </div>

            {/* Add Student Section */}
            {showAddStudent && (
              <div className="mb-6 p-4 bg-gray-50 rounded border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="חיפוש תלמידים..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 border border-border rounded focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddStudent(false)
                      setSearchQuery('')
                    }}
                    className="px-3 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    ביטול
                  </button>
                </div>

                {availableStudents.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <Table
                      data={availableStudents}
                      columns={availableStudentColumns}
                      actions={false}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p>אין תלמידים זמינים להוספה</p>
                  </div>
                )}
              </div>
            )}

            {/* Current Students */}
            {enrolledStudents.length > 0 ? (
              <Table
                data={enrolledStudents}
                columns={studentColumns}
                onView={(student) => handleViewStudentProfile(student._id)}
                onDelete={(student) => handleRemoveStudent(student._id)}
                actions={true}
                actionLabels={{
                  view: 'צפה בפרופיל',
                  delete: 'הסר מהשיעור'
                }}
              />
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">אין תלמידים רשומים</h3>
                <p className="text-gray-600 mb-4">התחל על ידי הוספת התלמיד הראשון</p>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף תלמיד ראשון
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Attendance Modal */}
      {showAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">רישום נוכחות</h3>
                <button
                  onClick={() => setShowAttendance(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  תאריך השיעור
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                />
              </div>

              {/* Select All Buttons */}
              <div className="mb-4 flex gap-2 flex-wrap">
                <button
                  onClick={markAllPresent}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4 inline ml-1" />
                  סמן הכל נוכח
                </button>
                <button
                  onClick={markAllAbsent}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4 inline ml-1" />
                  סמן הכל נעדר
                </button>
                <button
                  onClick={clearAllAttendance}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  נקה הכל
                </button>
              </div>

              <div className="space-y-3">
                {enrolledStudents.map(student => {
                  const isPresent = tempAttendance.present.includes(student._id)
                  const isAbsent = tempAttendance.absent.includes(student._id)
                  
                  return (
                    <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{getDisplayName(student.personalInfo)}</div>
                        <div className="text-sm text-gray-500">כיתה {student.academicInfo?.class}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAttendance(student._id, true)}
                          className={`px-3 py-1 text-sm rounded ${
                            isPresent 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                          }`}
                        >
                          נכח
                        </button>
                        <button
                          onClick={() => toggleAttendance(student._id, false)}
                          className={`px-3 py-1 text-sm rounded ${
                            isAbsent 
                              ? 'bg-red-600 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                          }`}
                        >
                          נעדר
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveAttendance}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded hover:bg-neutral-800 transition-colors"
                >
                  שמור נוכחות
                </button>
                <button
                  onClick={() => setShowAttendance(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theory Lesson Edit Form Modal */}
      {showEditForm && (
        <TheoryLessonForm
          theoryLesson={theoryLesson}
          teachers={teachers}
          onSubmit={handleEditTheoryLesson}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmationConfig && (
        <ConfirmationModal
          isOpen={showConfirmation}
          title={confirmationConfig.title}
          message={confirmationConfig.message}
          onConfirm={handleConfirmation}
          onCancel={handleCancelConfirmation}
          variant={confirmationConfig.variant}
        />
      )}
    </div>
  )
}