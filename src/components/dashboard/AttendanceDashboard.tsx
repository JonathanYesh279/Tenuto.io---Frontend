import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import {
  Users,
  Calendar,
  Clock,
  CheckSquare,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  ChevronRight,
  Eye,
  Edit,
  FileText,
  CalendarDays
} from 'lucide-react'
import apiService from '../../services/apiService'
import { getDisplayName } from '@/utils/nameUtils'

interface AttendanceStats {
  totalStudents: number
  presentToday: number
  absentToday: number
  lateToday: number
  weeklyAttendanceRate: number
  monthlyAttendanceRate: number
  alertsCount: number
}

interface StudentAttendanceRecord {
  studentId: string
  studentName: string
  lessonType: 'individual' | 'theory' | 'orchestra'
  teacherName?: string
  groupName?: string
  date: string
  time: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  markedBy: string
  markedAt: string
}

interface AttendanceTrend {
  date: string
  presentCount: number
  absentCount: number
  lateCount: number
  totalStudents: number
}

interface AttendanceAlert {
  id: string
  studentId: string
  studentName: string
  type: 'poor_attendance' | 'consecutive_absences' | 'late_pattern'
  message: string
  severity: 'low' | 'medium' | 'high'
  createdAt: string
}

export default function AttendanceDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    weeklyAttendanceRate: 0,
    monthlyAttendanceRate: 0,
    alertsCount: 0
  })
  const [todayAttendance, setTodayAttendance] = useState<StudentAttendanceRecord[]>([])
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([])
  const [attendanceAlerts, setAttendanceAlerts] = useState<AttendanceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'theory' | 'orchestra'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMarkAttendance, setShowMarkAttendance] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'marking' | 'reports' | 'alerts'>('overview')

  useEffect(() => {
    if (user?._id) {
      loadAttendanceData()
    }
  }, [user, selectedDate, filterType])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      setError(null)

      const userRole = user?.role
      let attendanceData: StudentAttendanceRecord[] = []

      // Load different data based on user role
      if (userRole === 'teacher') {
        // For teachers - show their students' attendance
        const teacherStudents = await apiService.teachers.getTeacherStudents(user._id)
        const studentIds = teacherStudents.map((s: any) => s._id || s.id)

        if (studentIds.length > 0) {
          // Mock attendance data for teacher's students
          attendanceData = await generateMockAttendanceData(studentIds, 'teacher')
        }
      } else if (userRole === 'conductor') {
        // For conductors - show orchestra members' attendance
        const orchestras = await apiService.orchestras.getOrchestras({ conductorId: user._id })
        const allStudentIds = orchestras.flatMap(orchestra =>
          orchestra.members?.map(member => member.studentId) || []
        )

        if (allStudentIds.length > 0) {
          attendanceData = await generateMockAttendanceData(allStudentIds, 'conductor')
        }
      } else if (userRole === 'admin') {
        // For admins - show all attendance
        const allStudents = await apiService.students.getStudents()
        const allStudentIds = allStudents.map(student => student._id)
        attendanceData = await generateMockAttendanceData(allStudentIds, 'admin')
      }

      // Filter by lesson type
      if (filterType !== 'all') {
        attendanceData = attendanceData.filter(record => record.lessonType === filterType)
      }

      // Filter by search term
      if (searchTerm) {
        attendanceData = attendanceData.filter(record =>
          record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.groupName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setTodayAttendance(attendanceData)

      // Calculate statistics
      const totalStudents = new Set(attendanceData.map(record => record.studentId)).size
      const presentToday = attendanceData.filter(record => record.status === 'present').length
      const absentToday = attendanceData.filter(record => record.status === 'absent').length
      const lateToday = attendanceData.filter(record => record.status === 'late').length

      setStats({
        totalStudents,
        presentToday,
        absentToday,
        lateToday,
        weeklyAttendanceRate: Math.round(((presentToday + lateToday) / Math.max(totalStudents, 1)) * 100),
        monthlyAttendanceRate: Math.round(Math.random() * 20 + 75), // Mock data
        alertsCount: Math.floor(Math.random() * 5) + 1
      })

      // Generate attendance trends (mock data)
      const trends: AttendanceTrend[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const totalForDay = Math.floor(Math.random() * 20) + totalStudents - 10
        const presentForDay = Math.floor(totalForDay * (0.8 + Math.random() * 0.15))
        trends.push({
          date: date.toISOString().split('T')[0],
          presentCount: presentForDay,
          absentCount: Math.floor((totalForDay - presentForDay) * 0.7),
          lateCount: Math.floor((totalForDay - presentForDay) * 0.3),
          totalStudents: totalForDay
        })
      }
      setAttendanceTrends(trends)

      // Generate attendance alerts (mock data)
      const alerts: AttendanceAlert[] = [
        {
          id: '1',
          studentId: 'student1',
          studentName: 'דניאל כהן',
          type: 'consecutive_absences',
          message: 'נעדר 3 שיעורים ברצף',
          severity: 'high',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          studentId: 'student2',
          studentName: 'רחל לוי',
          type: 'poor_attendance',
          message: 'נוכחות נמוכה - 65% החודש',
          severity: 'medium',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      setAttendanceAlerts(alerts)

    } catch (error) {
      console.error('Error loading attendance data:', error)
      setError('שגיאה בטעינת נתוני נוכחות')
    } finally {
      setLoading(false)
    }
  }

  const generateMockAttendanceData = async (studentIds: string[], userRole: string): Promise<StudentAttendanceRecord[]> => {
    const students = await apiService.students.getBatchStudents(studentIds)
    const records: StudentAttendanceRecord[] = []

    students.forEach(student => {
      // Generate 1-3 attendance records per student for today
      const recordCount = Math.floor(Math.random() * 3) + 1

      for (let i = 0; i < recordCount; i++) {
        const lessonTypes: ('individual' | 'theory' | 'orchestra')[] =
          userRole === 'conductor' ? ['orchestra'] : ['individual', 'theory']

        const lessonType = lessonTypes[Math.floor(Math.random() * lessonTypes.length)]
        const statuses: StudentAttendanceRecord['status'][] = ['present', 'absent', 'late', 'excused']
        const status = statuses[Math.floor(Math.random() * statuses.length)]

        // Weight towards present status (80% present, 10% absent, 5% late, 5% excused)
        const weightedStatus = Math.random() < 0.8 ? 'present' :
                             Math.random() < 0.6 ? 'absent' :
                             Math.random() < 0.5 ? 'late' : 'excused'

        records.push({
          studentId: student._id,
          studentName: getDisplayName(student.personalInfo) || 'תלמיד',
          lessonType,
          teacherName: lessonType === 'orchestra' ? 'מנצח התזמורת' : 'מורה פרטי',
          groupName: lessonType === 'theory' ? 'תיאוריה מתקדמת' : lessonType === 'orchestra' ? 'תזמורת הקונסרבטוריון' : undefined,
          date: selectedDate,
          time: `${8 + i * 2}:00`,
          status: weightedStatus,
          notes: status === 'excused' ? 'היעדרות מוצדקת' : undefined,
          markedBy: user?.firstName || 'מערכת',
          markedAt: new Date().toISOString()
        })
      }
    })

    return records
  }

  const handleMarkAttendance = async (recordId: string, status: StudentAttendanceRecord['status'], notes?: string) => {
    try {
      // In real app, call API to update attendance
      // await apiService.attendance.markAttendance(recordId, { status, notes })

      setTodayAttendance(prev => prev.map(record =>
        record.studentId === recordId
          ? { ...record, status, notes, markedAt: new Date().toISOString() }
          : record
      ))
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('שגיאה בסימון נוכחות')
    }
  }

  const exportAttendanceReport = () => {
    // Mock export functionality
    const csv = [
      'תאריך,שם תלמיד,סוג שיעור,מורה,סטטוס,הערות',
      ...todayAttendance.map(record =>
        `${record.date},${record.studentName},${record.lessonType},${record.teacherName || ''},${record.status},${record.notes || ''}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendance_report_${selectedDate}.csv`
    link.click()
  }

  const getStatusIcon = (status: StudentAttendanceRecord['status']) => {
    switch (status) {
      case 'present': return <CheckSquare className="w-4 h-4 text-green-600" />
      case 'absent': return <UserX className="w-4 h-4 text-red-600" />
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'excused': return <UserCheck className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusLabel = (status: StudentAttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'נוכח'
      case 'absent': return 'נעדר'
      case 'late': return 'איחור'
      case 'excused': return 'הצדקה'
    }
  }

  const getStatusColor = (status: StudentAttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'excused': return 'bg-blue-100 text-blue-800'
    }
  }

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'individual': return 'שיעור פרטי'
      case 'theory': return 'תיאוריה'
      case 'orchestra': return 'תזמורת'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען נתוני נוכחות...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800 font-reisinger-yonatan text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-bold mb-2">{error}</h3>
            <button
              onClick={loadAttendanceData}
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
            לוח בקרה - נוכחות 📊
          </h1>
          <p className="text-gray-600 mt-2">
            ניהול ומעקב נוכחות כללי • {new Date().toLocaleDateString('he-IL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" dir="rtl">
              {[
                { id: 'overview', label: 'סקירה כללית', icon: BarChart3 },
                { id: 'marking', label: 'סימון נוכחות', icon: CheckSquare },
                { id: 'reports', label: 'דוחות', icon: FileText },
                { id: 'alerts', label: 'התראות', icon: Bell }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 font-reisinger-yonatan ${
                      activeView === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'alerts' && stats.alertsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {stats.alertsCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeView === 'overview' && (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
                  <AttendanceStatCard
                    icon={<Users className="w-6 h-6" />}
                    title="סה״כ תלמידים"
                    value={stats.totalStudents}
                    bgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    borderColor="border-blue-200"
                  />
                  <AttendanceStatCard
                    icon={<CheckSquare className="w-6 h-6" />}
                    title="נוכחים היום"
                    value={stats.presentToday}
                    bgColor="bg-green-50"
                    iconColor="text-green-600"
                    borderColor="border-green-200"
                  />
                  <AttendanceStatCard
                    icon={<UserX className="w-6 h-6" />}
                    title="נעדרים היום"
                    value={stats.absentToday}
                    bgColor="bg-red-50"
                    iconColor="text-red-600"
                    borderColor="border-red-200"
                  />
                  <AttendanceStatCard
                    icon={<Clock className="w-6 h-6" />}
                    title="איחורים היום"
                    value={stats.lateToday}
                    bgColor="bg-yellow-50"
                    iconColor="text-yellow-600"
                    borderColor="border-yellow-200"
                  />
                  <AttendanceStatCard
                    icon={<TrendingUp className="w-6 h-6" />}
                    title="נוכחות שבועית"
                    value={stats.weeklyAttendanceRate}
                    suffix="%"
                    bgColor="bg-purple-50"
                    iconColor="text-purple-600"
                    borderColor="border-purple-200"
                  />
                  <AttendanceStatCard
                    icon={<BarChart3 className="w-6 h-6" />}
                    title="נוכחות חודשית"
                    value={stats.monthlyAttendanceRate}
                    suffix="%"
                    bgColor="bg-indigo-50"
                    iconColor="text-indigo-600"
                    borderColor="border-indigo-200"
                  />
                  <AttendanceStatCard
                    icon={<AlertTriangle className="w-6 h-6" />}
                    title="התראות פעילות"
                    value={stats.alertsCount}
                    bgColor="bg-orange-50"
                    iconColor="text-orange-600"
                    borderColor="border-orange-200"
                  />
                </div>

                {/* Attendance Trends Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
                    מגמות נוכחות - 7 ימים אחרונים
                  </h2>
                  <div className="space-y-3">
                    {attendanceTrends.map((trend, index) => (
                      <div key={trend.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-900 font-reisinger-yonatan">
                            {new Date(trend.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-reisinger-yonatan">נוכח: {trend.presentCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="font-reisinger-yonatan">נעדר: {trend.absentCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="font-reisinger-yonatan">איחור: {trend.lateCount}</span>
                          </div>
                          <div className="font-medium text-gray-700 font-reisinger-yonatan">
                            {Math.round((trend.presentCount / trend.totalStudents) * 100)}% נוכחות
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeView === 'marking' && (
              <>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">תאריך</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">סוג שיעור</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">כל השיעורים</option>
                      <option value="individual">שיעורים פרטיים</option>
                      <option value="theory">תיאוריה</option>
                      <option value="orchestra">תזמורת</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">חיפוש</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="שם תלמיד או מורה..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={exportAttendanceReport}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full justify-center"
                    >
                      <Download className="w-4 h-4" />
                      <span className="font-reisinger-yonatan">ייצא דוח</span>
                    </button>
                  </div>
                </div>

                {/* Today's Attendance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                      נוכחות יומית - {new Date(selectedDate).toLocaleDateString('he-IL')}
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-reisinger-yonatan">
                            תלמיד
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-reisinger-yonatan">
                            סוג שיעור
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-reisinger-yonatan">
                            מורה/קבוצה
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-reisinger-yonatan">
                            שעה
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-reisinger-yonatan">
                            סטטוס
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-reisinger-yonatan">
                            הערות
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-reisinger-yonatan">
                            פעולות
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {todayAttendance.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500 font-reisinger-yonatan">אין רשומות נוכחות לתאריך זה</p>
                            </td>
                          </tr>
                        ) : (
                          todayAttendance.map((record, index) => (
                            <tr key={`${record.studentId}-${index}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900 font-reisinger-yonatan">
                                  {record.studentName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-reisinger-yonatan">
                                  {getLessonTypeLabel(record.lessonType)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-reisinger-yonatan">
                                  {record.groupName || record.teacherName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.time}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                  {getStatusIcon(record.status)}
                                  <span className="mr-1 font-reisinger-yonatan">{getStatusLabel(record.status)}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-reisinger-yonatan">
                                {record.notes || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleMarkAttendance(record.studentId, 'present')}
                                    className="text-green-600 hover:text-green-900"
                                    title="סמן כנוכח"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMarkAttendance(record.studentId, 'absent')}
                                    className="text-red-600 hover:text-red-900"
                                    title="סמן כנעדר"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMarkAttendance(record.studentId, 'late')}
                                    className="text-yellow-600 hover:text-yellow-900"
                                    title="סמן כמאחר"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </button>
                                  <button className="text-gray-400 hover:text-gray-600" title="ערוך">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeView === 'reports' && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2 font-reisinger-yonatan">דוחות נוכחות מתקדמים</h3>
                <p className="text-gray-600 font-reisinger-yonatan">תכונה זו תהיה זמינה בקרוב</p>
              </div>
            )}

            {activeView === 'alerts' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">התראות נוכחות</h2>
                {attendanceAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2 font-reisinger-yonatan">אין התראות חדשות</h3>
                    <p className="text-gray-600 font-reisinger-yonatan">כל התלמידים עם נוכחות תקינה</p>
                  </div>
                ) : (
                  attendanceAlerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'high' ? 'bg-red-50 border-red-400' :
                      alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-blue-50 border-blue-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.severity === 'high' ? 'text-red-600' :
                            alert.severity === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <div>
                            <h4 className="font-medium text-gray-900 font-reisinger-yonatan">{alert.studentName}</h4>
                            <p className="text-sm text-gray-600 font-reisinger-yonatan">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(alert.createdAt).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-indigo-600 hover:text-indigo-800 p-1" title="צפה בפרטים">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 p-1" title="סמן כטופל">
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Attendance Stat Card Component
interface AttendanceStatCardProps {
  icon: React.ReactNode
  title: string
  value: number
  suffix?: string
  bgColor: string
  iconColor: string
  borderColor: string
}

function AttendanceStatCard({ icon, title, value, suffix, bgColor, iconColor, borderColor }: AttendanceStatCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {value} {suffix && <span className="text-sm font-normal">{suffix}</span>}
          </p>
        </div>
        <div className={`${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}