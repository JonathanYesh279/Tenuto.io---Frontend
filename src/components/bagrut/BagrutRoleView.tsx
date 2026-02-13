import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  Award,
  Music,
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Plus,
  Download,
  FileText,
  CalendarClock,
  Bell,
  TrendingUp,
  Activity,
  Briefcase,
  School
} from 'lucide-react'
import apiService from '../../services/apiService'
import { getDisplayName } from '../../utils/nameUtils'
import type { Bagrut } from '../../types/bagrut.types'
import BagrutDashboard from './BagrutDashboard'
import BagrutStudentManager from './BagrutStudentManager'

interface BagrutRoleViewProps {
  role?: 'teacher' | 'admin' | 'conductor' | 'theory_teacher'
  userId?: string
}

interface BagrutStats {
  totalStudents: number
  activeStudents: number
  completedStudents: number
  pendingEvaluations: number
  upcomingExams: number
  averageGrade: number
  passRate: number
}

interface BagrutStudent {
  bagrutId: string
  studentId: string
  studentName: string
  instrument: string
  teacherName: string
  stage: number
  progress: number
  status: 'active' | 'completed' | 'pending' | 'failed'
  finalGrade?: number
  nextExamDate?: Date
  lastActivity: Date
}

interface OrchestrabagrutMember {
  studentId: string
  studentName: string
  instrument: string
  section: string
  bagrutStatus: 'active' | 'completed' | 'pending' | 'none'
  stage?: number
  progress?: number
}

export default function BagrutRoleView({ role, userId }: BagrutRoleViewProps) {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<'dashboard' | 'students' | 'evaluations' | 'reports'>('dashboard')
  const [stats, setStats] = useState<BagrutStats>({
    totalStudents: 0,
    activeStudents: 0,
    completedStudents: 0,
    pendingEvaluations: 0,
    upcomingExams: 0,
    averageGrade: 0,
    passRate: 0
  })
  const [bagrutStudents, setBagrutStudents] = useState<BagrutStudent[]>([])
  const [orchestraMembers, setOrchestraMembers] = useState<OrchestrabagrutMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const actualRole = role || user?.role || 'teacher'
  const actualUserId = userId || user?._id

  useEffect(() => {
    if (actualUserId) {
      loadRoleSpecificData()
    }
  }, [actualRole, actualUserId])

  const loadRoleSpecificData = async () => {
    try {
      setLoading(true)
      setError(null)

      switch (actualRole) {
        case 'teacher':
          await loadTeacherBagrutData()
          break
        case 'conductor':
          await loadConductorBagrutData()
          break
        case 'theory_teacher':
          await loadTheoryTeacherBagrutData()
          break
        case 'admin':
        default:
          await loadAdminBagrutData()
          break
      }
    } catch (error) {
      console.error('Error loading role-specific Bagrut data:', error)
      setError('שגיאה בטעינת נתוני בגרות')
    } finally {
      setLoading(false)
    }
  }

  const loadTeacherBagrutData = async () => {
    // Load Bagrut data for teacher's students
    const teacherStudents = await apiService.teachers.getTeacherStudents(actualUserId)
    const studentIds = teacherStudents.map((s: any) => s._id || s.id)

    if (studentIds.length > 0) {
      const bagruts = await Promise.all(
        studentIds.map(id =>
          apiService.bagrut.getBagrutByStudent(id).catch(() => null)
        )
      ).then(results => results.filter(Boolean))

      processBagrutData(bagruts, teacherStudents, [])
    }
  }

  const loadConductorBagrutData = async () => {
    // Load Bagrut data for orchestra members
    const conductorProfile = await apiService.teachers.getTeacher(actualUserId)
    const orchestraIds = conductorProfile?.conducting?.orchestraIds || []

    if (orchestraIds.length > 0) {
      // Get all orchestra members
      const orchestras = await Promise.all(
        orchestraIds.map(id => apiService.orchestras.getOrchestra(id))
      )

      const allMemberIds = orchestras.flatMap(orchestra =>
        orchestra?.members?.map(m => m.studentId) || []
      )

      if (allMemberIds.length > 0) {
        const [bagruts, students] = await Promise.all([
          Promise.all(allMemberIds.map(id =>
            apiService.bagrut.getBagrutByStudent(id).catch(() => null)
          )).then(results => results.filter(Boolean)),
          apiService.students.getBatchStudents(allMemberIds)
        ])

        // Process orchestra-specific data
        const orchestraMembers: OrchestrabagrutMember[] = allMemberIds.map(studentId => {
          const student = students.find(s => s._id === studentId)
          const bagrut = bagruts.find(b => b.studentId === studentId)
          const memberInfo = orchestras.flatMap(o => o.members || []).find(m => m.studentId === studentId)

          return {
            studentId,
            studentName: getDisplayName(student?.personalInfo) || 'תלמיד לא ידוע',
            instrument: memberInfo?.instrument || student?.academicInfo?.primaryInstrument || 'לא צוין',
            section: memberInfo?.section || 'לא צוין',
            bagrutStatus: bagrut ? (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade >= 55 ? 'completed' : 'active') : 'none',
            stage: bagrut ? (bagrut.presentations?.filter(p => p.completed).length || 0) + 1 : undefined,
            progress: bagrut ? ((bagrut.presentations?.filter(p => p.completed).length || 0) / 4) * 100 : undefined
          }
        })

        setOrchestraMembers(orchestraMembers)
        processBagrutData(bagruts, students, [])
      }
    }
  }

  const loadTheoryTeacherBagrutData = async () => {
    // For theory teachers, show students who need theory Bagrut components
    // This would be students taking theory as part of their Bagrut
    const allBagruts = await apiService.bagrut.getAllBagruts()
    const relevantBagruts = allBagruts.filter(bagrut =>
      bagrut.recitalField === 'ג\'אז' || bagrut.recitalUnits === 5 // Theory-heavy programs
    )

    if (relevantBagruts.length > 0) {
      const studentIds = relevantBagruts.map(b => b.studentId)
      const [students, teachers] = await Promise.all([
        apiService.students.getBatchStudents(studentIds),
        apiService.teachers.getBatchTeachers(relevantBagruts.map(b => b.teacherId))
      ])

      processBagrutData(relevantBagruts, students, teachers)
    }
  }

  const loadAdminBagrutData = async () => {
    // Load all Bagrut data for admin overview
    const allBagruts = await apiService.bagrut.getAllBagruts()

    if (allBagruts.length > 0) {
      const studentIds = [...new Set(allBagruts.map(b => b.studentId))]
      const teacherIds = [...new Set(allBagruts.map(b => b.teacherId))]

      const [students, teachers] = await Promise.all([
        apiService.students.getBatchStudents(studentIds),
        apiService.teachers.getBatchTeachers(teacherIds)
      ])

      processBagrutData(allBagruts, students, teachers)
    }
  }

  const processBagrutData = (bagruts: Bagrut[], students: any[], teachers: any[]) => {
    const bagrutStudentsData: BagrutStudent[] = bagruts.map(bagrut => {
      const student = students.find(s => s._id === bagrut.studentId)
      const teacher = teachers.find(t => t._id === bagrut.teacherId)
      const completedPresentations = bagrut.presentations?.filter(p => p.completed).length || 0
      const progress = (completedPresentations / 4) * 100

      // Determine status
      let status: BagrutStudent['status'] = 'active'
      if (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade >= 55) {
        status = 'completed'
      } else if (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade < 55) {
        status = 'failed'
      } else if (completedPresentations === 0) {
        status = 'pending'
      }

      return {
        bagrutId: bagrut._id || '',
        studentId: bagrut.studentId,
        studentName: getDisplayName(student?.personalInfo) || 'תלמיד לא ידוע',
        instrument: student?.academicInfo?.primaryInstrument || 'לא צוין',
        teacherName: getDisplayName(teacher?.personalInfo) || 'מורה לא ידוע',
        stage: completedPresentations + 1,
        progress,
        status,
        finalGrade: bagrut.finalGrade,
        nextExamDate: generateNextExamDate(status, completedPresentations),
        lastActivity: new Date(bagrut.updatedAt)
      }
    })

    setBagrutStudents(bagrutStudentsData)

    // Calculate statistics
    const totalStudents = bagrutStudentsData.length
    const activeStudents = bagrutStudentsData.filter(s => s.status === 'active').length
    const completedStudents = bagrutStudentsData.filter(s => s.status === 'completed').length
    const failedStudents = bagrutStudentsData.filter(s => s.status === 'failed').length

    const pendingEvaluations = bagruts.filter(b =>
      !b.directorEvaluation?.points ||
      b.presentations?.some(p => p.completed && !p.grade)
    ).length

    const upcomingExams = bagrutStudentsData.filter(s =>
      s.status === 'active' && s.nextExamDate
    ).length

    const gradesSum = bagrutStudentsData
      .filter(s => s.finalGrade)
      .reduce((sum, s) => sum + (s.finalGrade || 0), 0)
    const averageGrade = gradesSum > 0 ? gradesSum / bagrutStudentsData.filter(s => s.finalGrade).length : 0

    const totalFinished = completedStudents + failedStudents
    const passRate = totalFinished > 0 ? (completedStudents / totalFinished) * 100 : 0

    setStats({
      totalStudents,
      activeStudents,
      completedStudents,
      pendingEvaluations,
      upcomingExams,
      averageGrade: Math.round(averageGrade),
      passRate: Math.round(passRate)
    })
  }

  const generateNextExamDate = (status: BagrutStudent['status'], completedPresentations: number): Date | undefined => {
    if (status === 'active' && completedPresentations < 4) {
      const today = new Date()
      const daysToAdd = Math.floor(Math.random() * 30) + 7
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + daysToAdd)
      return nextDate
    }
    return undefined
  }

  const getRoleSpecificTitle = () => {
    switch (actualRole) {
      case 'teacher':
        return 'בגרות - תלמידיי'
      case 'conductor':
        return 'בגרות - חברי תזמורת'
      case 'theory_teacher':
        return 'בגרות - תיאוריה'
      case 'admin':
      default:
        return 'בגרות - ניהול כללי'
    }
  }

  const getRoleSpecificDescription = () => {
    switch (actualRole) {
      case 'teacher':
        return 'מעקב והתקדמות תלמידי הבגרות שלך'
      case 'conductor':
        return 'מצב הבגרות של חברי התזמורות שלך'
      case 'theory_teacher':
        return 'תלמידי בגרות הזקוקים לרכיב תיאוריה'
      case 'admin':
      default:
        return 'ניהול מקיף של מערכת הבגרות'
    }
  }

  const renderRoleSpecificActions = () => {
    switch (actualRole) {
      case 'teacher':
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/teacher/bagrut/add-student'}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              הוסף תלמיד לבגרות
            </button>
            <button
              onClick={() => window.location.href = '/teacher/bagrut/schedule'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              תזמון מבחנים
            </button>
          </div>
        )
      case 'conductor':
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/conductor/bagrut/orchestra-overview'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              סקירת תזמורת
            </button>
            <button
              onClick={() => window.location.href = '/conductor/bagrut/performance-planning'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              תכנון ביצועים
            </button>
          </div>
        )
      case 'theory_teacher':
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/theory/bagrut/assignments'}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              מטלות תיאוריה
            </button>
            <button
              onClick={() => window.location.href = '/theory/bagrut/evaluations'}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
            >
              <School className="w-4 h-4" />
              הערכות תיאוריה
            </button>
          </div>
        )
      case 'admin':
      default:
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('students')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              ניהול תלמידים
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              דוחות
            </button>
            <button
              onClick={() => window.location.href = '/admin/bagrut/export'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              ייצא נתונים
            </button>
          </div>
        )
    }
  }

  const renderConductorSpecificView = () => {
    if (actualRole !== 'conductor') return null

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          חברי תזמורת לפי סטטוס בגרות
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {orchestraMembers.filter(m => m.bagrutStatus === 'active').length}
            </div>
            <div className="text-sm text-gray-600">בגרות פעילה</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {orchestraMembers.filter(m => m.bagrutStatus === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">הושלמה בגרות</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {orchestraMembers.filter(m => m.bagrutStatus === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">ממתינים לבגרות</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {orchestraMembers.filter(m => m.bagrutStatus === 'none').length}
            </div>
            <div className="text-sm text-gray-600">ללא בגרות</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">חברי תזמורת עם בגרות פעילה</h3>
          {orchestraMembers.filter(m => m.bagrutStatus === 'active').slice(0, 5).map((member) => (
            <div key={member.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Music className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{member.studentName}</div>
                  <div className="text-sm text-gray-600">{member.instrument} • {member.section}</div>
                </div>
              </div>
              <div className="text-right">
                {member.stage && (
                  <div className="text-sm font-medium text-gray-900">
                    השמעה {member.stage}/4
                  </div>
                )}
                {member.progress && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${member.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(member.progress)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderViewContent = () => {
    switch (activeView) {
      case 'students':
        return <BagrutStudentManager teacherId={actualRole === 'teacher' ? actualUserId : undefined} role={actualRole} />
      case 'dashboard':
      default:
        return (
          <>
            {renderConductorSpecificView()}
            <BagrutDashboard />
          </>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען נתוני בגרות...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800 font-reisinger-yonatan text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-bold mb-2">{error}</h3>
            <button
              onClick={loadRoleSpecificData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-reisinger-yonatan">
                {getRoleSpecificTitle()}
              </h1>
              <p className="text-gray-600 mt-2">
                {getRoleSpecificDescription()}
              </p>
            </div>
            {renderRoleSpecificActions()}
          </div>
        </div>

        {/* Role-specific Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">סה״כ תלמידים</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
              </div>
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">פעילים</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeStudents}</p>
              </div>
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">הושלמו</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.completedStudents}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">אחוז הצלחה</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.passRate}%</p>
              </div>
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                לוח בקרה
              </button>
              <button
                onClick={() => setActiveView('students')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'students'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                תלמידים
              </button>
              <button
                onClick={() => setActiveView('evaluations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'evaluations'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                הערכות
              </button>
              <button
                onClick={() => setActiveView('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'reports'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                דוחות
              </button>
            </nav>
          </div>
        </div>

        {/* View Content */}
        {renderViewContent()}
      </div>
    </div>
  )
}