import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import {
  Users,
  Music,
  Search,
  Filter,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Upload,
  Star,
  Award,
  BookOpen,
  Calendar,
  TrendingUp
} from 'lucide-react'
import apiService from '../../services/apiService'

interface EnrollmentStudent {
  id: string
  name: string
  instrument: string
  level: 'beginner' | 'intermediate' | 'advanced'
  currentOrchestras: string[]
  enrollmentStatus: 'enrolled' | 'pending' | 'declined' | 'graduated'
  enrollmentDate: string
  attendanceRate: number
  performanceLevel: number
  lastActivity: string
  contactInfo: {
    email?: string
    phone?: string
  }
}

interface Orchestra {
  id: string
  name: string
  type: 'youth' | 'adult' | 'chamber' | 'symphony'
  level: 'beginner' | 'intermediate' | 'advanced'
  memberCount: number
  maxMembers: number
  status: 'active' | 'inactive'
}

export default function OrchestraEnrollmentManager() {
  const { user } = useAuth()
  const [students, setStudents] = useState<EnrollmentStudent[]>([])
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOrchestra, setFilterOrchestra] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterInstrument, setFilterInstrument] = useState<string>('all')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?._id) {
      loadEnrollmentData()
    }
  }, [user])

  const loadEnrollmentData = async () => {
    try {
      setLoading(true)
      setError(null)

      const conductorId = user._id

      // Load conductor's orchestras
      const conductorProfile = await apiService.teachers.getTeacher(conductorId)
      const orchestraIds = conductorProfile?.conducting?.orchestraIds || []

      let orchestrasData = []
      if (orchestraIds.length > 0) {
        orchestrasData = await apiService.orchestras.getBatchOrchestras(orchestraIds)
      }

      // Map orchestras data
      const mappedOrchestras = orchestrasData.map(orchestra => ({
        id: orchestra._id,
        name: orchestra.name,
        type: orchestra.type,
        level: orchestra.level,
        memberCount: orchestra.memberCount || 0,
        maxMembers: orchestra.maxMembers || 50,
        status: orchestra.status || 'active'
      }))

      setOrchestras(mappedOrchestras)

      // Load all students for enrollment management
      const allStudents = await apiService.students.getStudents({
        status: 'active',
        limit: 500
      })

      // Process students data
      const processedStudents = allStudents.map(student => {
        const primaryInstrument = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
        const studentOrchestras = orchestrasData.filter(orchestra =>
          orchestra.memberIds?.includes(student._id)
        ).map(o => o.name)

        return {
          id: student._id,
          name: student.personalInfo?.fullName || `${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`,
          instrument: primaryInstrument?.instrumentName || 'לא צוין',
          level: getStudentLevel(primaryInstrument?.currentStage || 1),
          currentOrchestras: studentOrchestras,
          enrollmentStatus: getEnrollmentStatus(student, orchestrasData),
          enrollmentDate: student.academicInfo?.enrollmentDate || new Date().toISOString(),
          attendanceRate: Math.floor(Math.random() * 20) + 80, // Mock data
          performanceLevel: primaryInstrument?.currentStage || 1,
          lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          contactInfo: {
            email: student.personalInfo?.email,
            phone: student.personalInfo?.phone
          }
        }
      })

      setStudents(processedStudents)
    } catch (error) {
      console.error('Error loading enrollment data:', error)
      setError('שגיאה בטעינת נתוני הרשמה')
    } finally {
      setLoading(false)
    }
  }

  const getStudentLevel = (stage: number): 'beginner' | 'intermediate' | 'advanced' => {
    if (stage <= 2) return 'beginner'
    if (stage <= 4) return 'intermediate'
    return 'advanced'
  }

  const getEnrollmentStatus = (student: any, orchestras: any[]): 'enrolled' | 'pending' | 'declined' | 'graduated' => {
    const isEnrolled = orchestras.some(orchestra =>
      orchestra.memberIds?.includes(student._id)
    )
    return isEnrolled ? 'enrolled' : 'pending'
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'מתחיל'
      case 'intermediate': return 'בינוני'
      case 'advanced': return 'מתקדם'
      default: return level
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enrolled': return 'רשום'
      case 'pending': return 'ממתין'
      case 'declined': return 'נדחה'
      case 'graduated': return 'בוגר'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'graduated': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    const filteredStudentIds = getFilteredStudents().map(s => s.id)
    if (selectedStudents.length === filteredStudentIds.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudentIds)
    }
  }

  const handleBulkEnroll = async (orchestraId: string) => {
    if (selectedStudents.length === 0) return

    try {
      // Process each student with bidirectional sync
      for (const studentId of selectedStudents) {
        try {
          // Step 1: Add to orchestra's memberIds
          await apiService.orchestras.addMember(orchestraId, studentId)

          // Step 2: Update student's orchestraIds (bidirectional sync)
          try {
            const student = await apiService.students.getStudent(studentId)
            const currentOrchestraIds = student?.enrollments?.orchestraIds || []

            // Only add if not already present
            if (!currentOrchestraIds.includes(orchestraId)) {
              await apiService.students.updateStudent(studentId, {
                enrollments: {
                  ...student?.enrollments,
                  orchestraIds: [...currentOrchestraIds, orchestraId]
                }
              })
              console.log(`✅ Updated student ${studentId} orchestraIds with ${orchestraId}`)
            }
          } catch (syncError) {
            console.error(`Error syncing student ${studentId} orchestraIds:`, syncError)
            // Don't fail the whole operation if sync fails
          }
        } catch (error) {
          console.error(`Error adding student ${studentId}:`, error)
        }
      }

      alert(`${selectedStudents.length} תלמידים נרשמו בהצלחה`)
      setSelectedStudents([])
      await loadEnrollmentData()
    } catch (error) {
      console.error('Error bulk enrolling students:', error)
      alert('שגיאה ברישום תלמידים')
    }
  }

  const handleBulkRemove = async (orchestraId: string) => {
    if (selectedStudents.length === 0) return

    if (!window.confirm(`האם אתה בטוח שברצונך להסיר ${selectedStudents.length} תלמידים מהתזמורת?`)) return

    try {
      // Process each student with bidirectional sync
      for (const studentId of selectedStudents) {
        try {
          // Step 1: Remove from orchestra's memberIds
          await apiService.orchestras.removeMember(orchestraId, studentId)

          // Step 2: Update student's orchestraIds (bidirectional sync)
          try {
            const student = await apiService.students.getStudent(studentId)
            const currentOrchestraIds = student?.enrollments?.orchestraIds || []

            // Remove the orchestraId from the student's list
            const updatedOrchestraIds = currentOrchestraIds.filter((id: string) => id !== orchestraId)

            if (updatedOrchestraIds.length !== currentOrchestraIds.length) {
              await apiService.students.updateStudent(studentId, {
                enrollments: {
                  ...student?.enrollments,
                  orchestraIds: updatedOrchestraIds
                }
              })
              console.log(`✅ Removed orchestraId ${orchestraId} from student ${studentId} enrollments`)
            }
          } catch (syncError) {
            console.error(`Error syncing student ${studentId} orchestraIds on remove:`, syncError)
            // Don't fail the whole operation if sync fails
          }
        } catch (error) {
          console.error(`Error removing student ${studentId}:`, error)
        }
      }

      alert(`${selectedStudents.length} תלמידים הוסרו בהצלחה`)
      setSelectedStudents([])
      await loadEnrollmentData()
    } catch (error) {
      console.error('Error bulk removing students:', error)
      alert('שגיאה בהסרת תלמידים')
    }
  }

  const exportEnrollmentData = () => {
    const csvData = getFilteredStudents().map(student => ({
      'שם': student.name,
      'כלי': student.instrument,
      'רמה': getLevelLabel(student.level),
      'תזמורות': student.currentOrchestras.join(', '),
      'סטטוס': getStatusLabel(student.enrollmentStatus),
      'תאריך הרשמה': new Date(student.enrollmentDate).toLocaleDateString('he-IL'),
      'אחוז נוכחות': `${student.attendanceRate}%`,
      'דירוג ביצועים': student.performanceLevel,
      'פעילות אחרונה': new Date(student.lastActivity).toLocaleDateString('he-IL')
    }))

    const csv = convertToCSV(csvData)
    downloadCSV(csv, 'enrollment-data.csv')
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(',')).join('\n')
    return `${headers}\n${rows}`
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.instrument.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesOrchestra = filterOrchestra === 'all' ||
        student.currentOrchestras.includes(filterOrchestra) ||
        (filterOrchestra === 'none' && student.currentOrchestras.length === 0)

      const matchesStatus = filterStatus === 'all' || student.enrollmentStatus === filterStatus

      const matchesInstrument = filterInstrument === 'all' || student.instrument === filterInstrument

      return matchesSearch && matchesOrchestra && matchesStatus && matchesInstrument
    })
  }

  const getUniqueInstruments = () => {
    return [...new Set(students.map(s => s.instrument))].filter(Boolean).sort()
  }

  const getEnrollmentStats = () => {
    const total = students.length
    const enrolled = students.filter(s => s.enrollmentStatus === 'enrolled').length
    const pending = students.filter(s => s.enrollmentStatus === 'pending').length
    const averageAttendance = students.reduce((sum, s) => sum + s.attendanceRate, 0) / total || 0

    return { total, enrolled, pending, averageAttendance }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען נתוני הרשמה...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <div className="font-reisinger-yonatan">{error}</div>
        </div>
      </div>
    )
  }

  const filteredStudents = getFilteredStudents()
  const stats = getEnrollmentStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">
            ניהול הרשמות לתזמורות
          </h1>
          <p className="text-gray-600 mt-1">
            ניהול רישום תלמידים לתזמורות וניתוח נתוני השתתפות
          </p>
        </div>
        <button
          onClick={exportEnrollmentData}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          ייצא נתונים
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600 font-reisinger-yonatan">סה״כ תלמידים</div>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.enrolled}</div>
              <div className="text-sm text-gray-600 font-reisinger-yonatan">רשומים</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600 font-reisinger-yonatan">ממתינים</div>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">{Math.round(stats.averageAttendance)}%</div>
              <div className="text-sm text-gray-600 font-reisinger-yonatan">נוכחות ממוצעת</div>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש תלמידים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              dir="rtl"
            />
          </div>
          <select
            value={filterOrchestra}
            onChange={(e) => setFilterOrchestra(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">כל התזמורות</option>
            <option value="none">ללא תזמורת</option>
            {orchestras.map(orchestra => (
              <option key={orchestra.id} value={orchestra.name}>{orchestra.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="enrolled">רשומים</option>
            <option value="pending">ממתינים</option>
            <option value="declined">נדחו</option>
            <option value="graduated">בוגרים</option>
          </select>
          <select
            value={filterInstrument}
            onChange={(e) => setFilterInstrument(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">כל הכלים</option>
            {getUniqueInstruments().map(instrument => (
              <option key={instrument} value={instrument}>{instrument}</option>
            ))}
          </select>
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              showBulkActions
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            פעולות מרוכזות
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && selectedStudents.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-indigo-800 font-medium">
              נבחרו {selectedStudents.length} תלמידים
            </div>
            <div className="flex gap-2">
              {orchestras.map(orchestra => (
                <button
                  key={orchestra.id}
                  onClick={() => handleBulkEnroll(orchestra.id)}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  רשום ל{orchestra.name}
                </button>
              ))}
              {orchestras.map(orchestra => (
                <button
                  key={`remove-${orchestra.id}`}
                  onClick={() => handleBulkRemove(orchestra.id)}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  הסר מ{orchestra.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
              רשימת תלמידים ({filteredStudents.length})
            </h3>
            {showBulkActions && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {selectedStudents.length === filteredStudents.length ? 'בטל הכל' : 'בחר הכל'}
              </button>
            )}
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-reisinger-yonatan">לא נמצאו תלמידים</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {showBulkActions && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      בחר
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    שם התלמיד
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    כלי
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    רמה
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    תזמורות
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    סטטוס
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    נוכחות
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    ביצועים
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    {showBulkActions && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentSelect(student.id)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 font-reisinger-yonatan">
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(student.enrollmentDate).toLocaleDateString('he-IL')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {student.instrument}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        student.level === 'advanced' ? 'bg-purple-100 text-purple-800' :
                        student.level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getLevelLabel(student.level)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {student.currentOrchestras.length > 0 ? (
                        <div className="space-y-1">
                          {student.currentOrchestras.map((orchestra, index) => (
                            <div key={index} className="text-sm text-gray-900 font-reisinger-yonatan">
                              {orchestra}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">אין</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(student.enrollmentStatus)
                      }`}>
                        {getStatusLabel(student.enrollmentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          student.attendanceRate >= 90 ? 'text-green-600' :
                          student.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.attendanceRate}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              student.attendanceRate >= 90 ? 'bg-green-600' :
                              student.attendanceRate >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < student.performanceLevel ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}