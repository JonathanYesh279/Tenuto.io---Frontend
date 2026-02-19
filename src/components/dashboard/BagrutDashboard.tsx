import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import {
  Users,
  Calendar,
  Clock,
  Award,
  Plus,
  CheckSquare,
  BookOpen,
  UserCheck,
  TrendingUp,
  Music,
  Bell,
  ChevronRight,
  Activity,
  FileText,
  BarChart3,
  Trophy,
  AlertCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  CalendarClock,
  GraduationCap,
  Target
} from 'lucide-react'
import { useBagrutContext } from '../../contexts/BagrutContext'
import apiService from '../../services/apiService'
import type { Bagrut } from '../../types/bagrut.types'
import { getDisplayName } from '@/utils/nameUtils'

interface BagrutStats {
  activeBagrutStudents: number
  upcomingExams: number
  completedExams: number
  passRate: number
  avgGrade: number
  pendingEvaluations: number
}

interface BagrutStudent {
  studentId: string
  studentName: string
  instrument: string
  stage: number
  progress: number
  nextExamDate?: Date
  lastActivity: Date
  status: 'active' | 'completed' | 'pending' | 'failed'
  finalGrade?: number
  completedPresentations: number
  totalPresentations: number
}

interface UpcomingExam {
  id: string
  studentName: string
  examType: string
  date: Date
  time?: string
  status: 'scheduled' | 'pending' | 'completed'
  isUrgent: boolean
}

export default function BagrutDashboard() {
  const { user } = useAuth()
  const { state, actions } = useBagrutContext()
  const [stats, setStats] = useState<BagrutStats>({
    activeBagrutStudents: 0,
    upcomingExams: 0,
    completedExams: 0,
    passRate: 0,
    avgGrade: 0,
    pendingEvaluations: 0
  })
  const [bagrutStudents, setBagrutStudents] = useState<BagrutStudent[]>([])
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (user?._id) {
      loadBagrutData()
    }
  }, [user])

  const loadBagrutData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all Bagrut records based on user role
      let bagruts: Bagrut[] = []

      if (user.role === 'teacher') {
        // Load Bagrut records for teacher's students
        const teacherStudents = await apiService.teachers.getTeacherStudents(user._id)
        const studentIds = teacherStudents.map((s: any) => s._id || s.id)

        if (studentIds.length > 0) {
          bagruts = await Promise.all(
            studentIds.map(studentId =>
              apiService.bagrut.getBagrutByStudent(studentId).catch(() => null)
            )
          ).then(results => results.filter(Boolean))
        }
      } else {
        // For admin/conductor roles, load all Bagrut records
        const bagrutResponse = await apiService.bagrut.getBagruts()
        bagruts = bagrutResponse || []
      }

      // Load student details
      const studentIds = bagruts.map(b => b.studentId)
      const students = studentIds.length > 0
        ? await apiService.students.getBatchStudents(studentIds)
        : []

      // Process Bagrut students data
      const bagrutStudentsData: BagrutStudent[] = bagruts.map(bagrut => {
        const student = students.find(s => s._id === bagrut.studentId)
        const completedPresentations = bagrut.presentations?.filter(p => p.completed).length || 0
        const totalPresentations = 4 // Always 4 presentations for Bagrut
        const progress = (completedPresentations / totalPresentations) * 100

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
          studentId: bagrut.studentId,
          studentName: getDisplayName(student?.personalInfo) || 'תלמיד לא ידוע',
          instrument: student?.academicInfo?.primaryInstrument || 'לא צוין',
          stage: completedPresentations + 1,
          progress,
          nextExamDate: getNextExamDate(bagrut),
          lastActivity: new Date(bagrut.updatedAt),
          status,
          finalGrade: bagrut.finalGrade,
          completedPresentations,
          totalPresentations
        }
      })

      setBagrutStudents(bagrutStudentsData)

      // Generate upcoming exams
      const examsData: UpcomingExam[] = []
      bagrutStudentsData.forEach(student => {
        if (student.status === 'active' && student.nextExamDate) {
          const daysDiff = Math.ceil(
            (student.nextExamDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )

          examsData.push({
            id: `exam-${student.studentId}`,
            studentName: student.studentName,
            examType: `השמעה ${student.stage}`,
            date: student.nextExamDate,
            status: 'scheduled',
            isUrgent: daysDiff <= 7
          })
        }
      })

      setUpcomingExams(examsData.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10))

      // Calculate statistics
      const activeStudents = bagrutStudentsData.filter(s => s.status === 'active').length
      const completedStudents = bagrutStudentsData.filter(s => s.status === 'completed').length
      const totalFinished = bagrutStudentsData.filter(s => s.status === 'completed' || s.status === 'failed').length
      const passRate = totalFinished > 0 ? (completedStudents / totalFinished) * 100 : 0

      const gradesSum = bagrutStudentsData
        .filter(s => s.finalGrade)
        .reduce((sum, s) => sum + (s.finalGrade || 0), 0)
      const avgGrade = gradesSum > 0 ? gradesSum / bagrutStudentsData.filter(s => s.finalGrade).length : 0

      const pendingEvaluations = bagruts.filter(b =>
        !b.directorEvaluation?.points ||
        b.presentations?.some(p => p.completed && !p.grade)
      ).length

      setStats({
        activeBagrutStudents: activeStudents,
        upcomingExams: examsData.length,
        completedExams: completedStudents,
        passRate: Math.round(passRate),
        avgGrade: Math.round(avgGrade),
        pendingEvaluations
      })

    } catch (error) {
      console.error('Error loading Bagrut data:', error)
      setError('שגיאה בטעינת נתוני בגרות')
    } finally {
      setLoading(false)
    }
  }

  const getNextExamDate = (bagrut: Bagrut): Date | undefined => {
    const completedPresentations = bagrut.presentations?.filter(p => p.completed).length || 0
    if (completedPresentations >= 4) return undefined

    // Generate a mock next exam date (in real app, this would come from scheduling system)
    const today = new Date()
    const daysToAdd = Math.floor(Math.random() * 30) + 7 // 7-37 days from today
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysToAdd)
    return nextDate
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scheduleExam':
        window.location.href = '/bagrut/schedule'
        break
      case 'assignAccompanist':
        window.location.href = '/bagrut/accompanists'
        break
      case 'reviewEvaluations':
        window.location.href = '/bagrut/evaluations'
        break
      case 'exportCertificates':
        window.location.href = '/bagrut/certificates'
        break
      case 'addBagrutStudent':
        window.location.href = '/bagrut/add-student'
        break
      case 'viewReports':
        window.location.href = '/bagrut/reports'
        break
      default:
        console.log('Action:', action)
    }
  }

  const getStatusColor = (status: BagrutStudent['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'active': return 'text-blue-600 bg-blue-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'failed': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: BagrutStudent['status']) => {
    switch (status) {
      case 'completed': return 'הושלם'
      case 'active': return 'פעיל'
      case 'pending': return 'ממתין'
      case 'failed': return 'נכשל'
      default: return 'לא ידוע'
    }
  }

  const filteredStudents = bagrutStudents.filter(student => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.instrument.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען לוח בקרה בגרות...</div>
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
              onClick={loadBagrutData}
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
          <h1 className="text-3xl font-bold text-gray-900 font-reisinger-yonatan">
            לוח בקרה בגרות
          </h1>
          <p className="text-gray-600 mt-2">
            ניהול ומעקב אחר תלמידי בגרות ומערכת המבחנים
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <StatCard
            icon={<GraduationCap className="w-6 h-6" />}
            title="תלמידי בגרות פעילים"
            value={stats.activeBagrutStudents}
            bgColor="bg-indigo-50"
            iconColor="text-indigo-600"
            borderColor="border-indigo-200"
          />
          <StatCard
            icon={<CalendarClock className="w-6 h-6" />}
            title="מבחנים קרובים"
            value={stats.upcomingExams}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
            borderColor="border-blue-200"
          />
          <StatCard
            icon={<Trophy className="w-6 h-6" />}
            title="מבחנים שהושלמו"
            value={stats.completedExams}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            borderColor="border-green-200"
          />
          <StatCard
            icon={<Target className="w-6 h-6" />}
            title="אחוז הצלחה"
            value={stats.passRate}
            suffix="%"
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
            borderColor="border-purple-200"
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="ציון ממוצע"
            value={stats.avgGrade}
            bgColor="bg-yellow-50"
            iconColor="text-yellow-600"
            borderColor="border-yellow-200"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            title="הערכות ממתינות"
            value={stats.pendingEvaluations}
            bgColor="bg-orange-50"
            iconColor="text-orange-600"
            borderColor="border-orange-200"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
            פעולות מהירות
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickActionButton
              icon={<Calendar className="w-5 h-5" />}
              label="תזמון מבחן"
              onClick={() => handleQuickAction('scheduleExam')}
              color="indigo"
            />
            <QuickActionButton
              icon={<Music className="w-5 h-5" />}
              label="הקצה מלווה"
              onClick={() => handleQuickAction('assignAccompanist')}
              color="blue"
            />
            <QuickActionButton
              icon={<CheckSquare className="w-5 h-5" />}
              label="סקור הערכות"
              onClick={() => handleQuickAction('reviewEvaluations')}
              color="green"
            />
            <QuickActionButton
              icon={<Download className="w-5 h-5" />}
              label="ייצא תעודות"
              onClick={() => handleQuickAction('exportCertificates')}
              color="purple"
            />
            <QuickActionButton
              icon={<Plus className="w-5 h-5" />}
              label="הוסף תלמיד"
              onClick={() => handleQuickAction('addBagrutStudent')}
              color="emerald"
            />
            <QuickActionButton
              icon={<FileText className="w-5 h-5" />}
              label="דוחות"
              onClick={() => handleQuickAction('viewReports')}
              color="amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bagrut Students Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Students List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  תלמידי בגרות
                </h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="חיפוש תלמידים..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">כל הסטטוסים</option>
                    <option value="active">פעיל</option>
                    <option value="completed">הושלם</option>
                    <option value="pending">ממתין</option>
                    <option value="failed">נכשל</option>
                  </select>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין תלמידי בגרות</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map((student) => (
                    <div key={student.studentId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.studentName}</div>
                            <div className="text-sm text-gray-600">{student.instrument}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                                {getStatusText(student.status)}
                              </span>
                              <span className="text-xs text-gray-500">
                                השמעה {student.stage}/4
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${student.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{Math.round(student.progress)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-1 text-gray-400 hover:text-indigo-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-indigo-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            {student.finalGrade && (
                              <span className="text-sm font-bold text-gray-900 ml-2">
                                {student.finalGrade}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Analytics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  אנליטיקת התקדמות
                </h2>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {bagrutStudents.filter(s => s.stage === 1).length}
                  </div>
                  <div className="text-sm text-gray-600">השמעה 1</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {bagrutStudents.filter(s => s.stage === 2).length}
                  </div>
                  <div className="text-sm text-gray-600">השמעה 2</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {bagrutStudents.filter(s => s.stage === 3).length}
                  </div>
                  <div className="text-sm text-gray-600">השמעה 3</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {bagrutStudents.filter(s => s.stage === 4).length}
                  </div>
                  <div className="text-sm text-gray-600">מגן בגרות</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Exams */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  מבחנים קרובים
                </h2>
                <CalendarClock className="w-5 h-5 text-gray-400" />
              </div>

              {upcomingExams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין מבחנים מתוכננים</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingExams.slice(0, 5).map((exam) => (
                    <div key={exam.id} className={`p-3 rounded-lg border ${exam.isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{exam.studentName}</div>
                          <div className="text-sm text-gray-600">{exam.examType}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {exam.date.toLocaleDateString('he-IL')}
                          </div>
                          {exam.isUrgent && (
                            <div className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              דחוף
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  מדדי ביצועים
                </h2>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">אחוז הצלחה כללי</span>
                  <span className="font-bold text-green-600">{stats.passRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ציון ממוצע</span>
                  <span className="font-bold text-blue-600">{stats.avgGrade}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">הערכות ממתינות</span>
                  <span className="font-bold text-orange-600">{stats.pendingEvaluations}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: number
  suffix?: string
  bgColor: string
  iconColor: string
  borderColor: string
}

function StatCard({ icon, title, value, suffix, bgColor, iconColor, borderColor }: StatCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {value} {suffix && <span className="text-lg font-normal">{suffix}</span>}
          </p>
        </div>
        <div className={`${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color: 'indigo' | 'green' | 'blue' | 'purple' | 'emerald' | 'amber'
}

function QuickActionButton({ icon, label, onClick, color }: QuickActionButtonProps) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200',
    green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded border transition-colors ${colorClasses[color]}`}
    >
      {icon}
      <span className="mt-2 text-sm font-medium font-reisinger-yonatan">{label}</span>
    </button>
  )
}