import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  FileText,
  Calendar,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  GraduationCap,
  Music,
  Target,
  BarChart3,
  Save,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useBagrutContext } from '../../contexts/BagrutContext'
import apiService from '../../services/apiService'
import type { Bagrut, BagrutFormData, ProgramPiece, Presentation } from '../../types/bagrut.types'

interface BagrutStudentManagerProps {
  teacherId?: string
  role?: 'teacher' | 'admin' | 'conductor'
}

interface BagrutStudentData {
  bagrutId: string
  studentId: string
  studentName: string
  instrument: string
  teacherName: string
  stage: number
  progress: number
  status: 'active' | 'completed' | 'pending' | 'failed'
  finalGrade?: number
  lastActivity: Date
  nextExamDate?: Date
  completedPresentations: number
  totalPresentations: number
  recitalUnits?: 3 | 5
  recitalField?: 'קלאסי' | 'ג\'אז' | 'שירה'
  programCompleted: boolean
  documentsCount: number
}

interface FilterOptions {
  status: string
  stage: string
  instrument: string
  teacher: string
  recitalUnits: string
}

export default function BagrutStudentManager({ teacherId, role = 'admin' }: BagrutStudentManagerProps) {
  const { user } = useAuth()
  const { state, actions } = useBagrutContext()
  const [bagrutStudents, setBagrutStudents] = useState<BagrutStudentData[]>([])
  const [filteredStudents, setFilteredStudents] = useState<BagrutStudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    stage: 'all',
    instrument: 'all',
    teacher: 'all',
    recitalUnits: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<BagrutStudentData | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'stage' | 'lastActivity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadBagrutStudents()
  }, [teacherId, role])

  useEffect(() => {
    applyFilters()
  }, [bagrutStudents, searchTerm, filters, sortBy, sortOrder])

  const loadBagrutStudents = async () => {
    try {
      setLoading(true)
      setError(null)

      let bagruts: Bagrut[] = []

      if (role === 'teacher' && (teacherId || user?._id)) {
        // Load Bagrut records for specific teacher's students
        const actualTeacherId = teacherId || user._id
        const teacherProfile = await apiService.teachers.getTeacher(actualTeacherId)
        const studentIds = teacherProfile?.teaching?.studentIds || []

        if (studentIds.length > 0) {
          bagruts = await Promise.all(
            studentIds.map(studentId =>
              apiService.bagrut.getBagrutByStudent(studentId).catch(() => null)
            )
          ).then(results => results.filter(Boolean))
        }
      } else {
        // For admin/conductor roles, load all Bagrut records
        const bagrutResponse = await apiService.bagrut.getAllBagruts()
        bagruts = bagrutResponse || []
      }

      // Load student and teacher details
      const studentIds = [...new Set(bagruts.map(b => b.studentId))]
      const teacherIds = [...new Set(bagruts.map(b => b.teacherId))]

      const [students, teachers] = await Promise.all([
        studentIds.length > 0 ? apiService.students.getBatchStudents(studentIds) : [],
        teacherIds.length > 0 ? apiService.teachers.getBatchTeachers(teacherIds) : []
      ])

      // Process Bagrut students data
      const bagrutStudentsData: BagrutStudentData[] = bagruts.map(bagrut => {
        const student = students.find(s => s._id === bagrut.studentId)
        const teacher = teachers.find(t => t._id === bagrut.teacherId)
        const completedPresentations = bagrut.presentations?.filter(p => p.completed).length || 0
        const totalPresentations = 4
        const progress = (completedPresentations / totalPresentations) * 100

        // Determine status
        let status: BagrutStudentData['status'] = 'active'
        if (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade >= 55) {
          status = 'completed'
        } else if (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade < 55) {
          status = 'failed'
        } else if (completedPresentations === 0) {
          status = 'pending'
        }

        // Generate next exam date (mock - in real app would come from scheduling)
        let nextExamDate: Date | undefined
        if (status === 'active' && completedPresentations < 4) {
          const today = new Date()
          const daysToAdd = Math.floor(Math.random() * 30) + 7
          nextExamDate = new Date(today)
          nextExamDate.setDate(today.getDate() + daysToAdd)
        }

        return {
          bagrutId: bagrut._id || '',
          studentId: bagrut.studentId,
          studentName: student?.personalInfo?.fullName || 'תלמיד לא ידוע',
          instrument: student?.academicInfo?.primaryInstrument || 'לא צוין',
          teacherName: teacher?.personalInfo?.fullName || 'מורה לא ידוע',
          stage: completedPresentations + 1,
          progress,
          status,
          finalGrade: bagrut.finalGrade,
          lastActivity: new Date(bagrut.updatedAt),
          nextExamDate,
          completedPresentations,
          totalPresentations,
          recitalUnits: bagrut.recitalUnits,
          recitalField: bagrut.recitalField,
          programCompleted: (bagrut.program?.length || 0) >= 5,
          documentsCount: bagrut.documents?.length || 0
        }
      })

      setBagrutStudents(bagrutStudentsData)

    } catch (error) {
      console.error('Error loading Bagrut students:', error)
      setError('שגיאה בטעינת נתוני תלמידי בגרות')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...bagrutStudents]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(student => student.status === filters.status)
    }

    // Apply stage filter
    if (filters.stage !== 'all') {
      filtered = filtered.filter(student => student.stage.toString() === filters.stage)
    }

    // Apply instrument filter
    if (filters.instrument !== 'all') {
      filtered = filtered.filter(student => student.instrument === filters.instrument)
    }

    // Apply teacher filter
    if (filters.teacher !== 'all') {
      filtered = filtered.filter(student => student.teacherName === filters.teacher)
    }

    // Apply recital units filter
    if (filters.recitalUnits !== 'all') {
      filtered = filtered.filter(student => student.recitalUnits?.toString() === filters.recitalUnits)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.studentName
          bValue = b.studentName
          break
        case 'progress':
          aValue = a.progress
          bValue = b.progress
          break
        case 'stage':
          aValue = a.stage
          bValue = b.stage
          break
        case 'lastActivity':
          aValue = a.lastActivity.getTime()
          bValue = b.lastActivity.getTime()
          break
        default:
          aValue = a.studentName
          bValue = b.studentName
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

    setFilteredStudents(filtered)
  }

  const handleBulkAction = async (action: string) => {
    if (selectedStudents.length === 0) return

    try {
      switch (action) {
        case 'export':
          await exportSelectedStudents()
          break
        case 'delete':
          if (window.confirm(`האם אתה בטוח שברצונך למחוק ${selectedStudents.length} תלמידי בגרות?`)) {
            await deleteSelectedStudents()
          }
          break
        case 'updateStatus':
          // Open bulk status update modal
          break
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      setError('שגיאה בביצוע פעולה')
    }
  }

  const exportSelectedStudents = async () => {
    // Implementation for exporting selected students
    console.log('Exporting students:', selectedStudents)
  }

  const deleteSelectedStudents = async () => {
    try {
      await Promise.all(selectedStudents.map(bagrutId =>
        apiService.bagrut.deleteBagrut(bagrutId)
      ))
      setSelectedStudents([])
      await loadBagrutStudents()
    } catch (error) {
      console.error('Error deleting students:', error)
      throw error
    }
  }

  const getStatusColor = (status: BagrutStudentData['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'active': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'failed': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: BagrutStudentData['status']) => {
    switch (status) {
      case 'completed': return 'הושלם'
      case 'active': return 'פעיל'
      case 'pending': return 'ממתין'
      case 'failed': return 'נכשל'
      default: return 'לא ידוע'
    }
  }

  const getStatusIcon = (status: BagrutStudentData['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'active': return <Clock className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getUniqueValues = (key: keyof BagrutStudentData) => {
    return [...new Set(bagrutStudents.map(student => student[key]))].filter(Boolean)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען נתוני תלמידי בגרות...</div>
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
              onClick={loadBagrutStudents}
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
                ניהול תלמידי בגרות
              </h1>
              <p className="text-gray-600 mt-2">
                ניהול מקיף של תלמידי בגרות, מעקב התקדמות ומערכת המבחנים
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף תלמיד בגרות
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                disabled={selectedStudents.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                ייצא
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">סה״כ תלמידי בגרות</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{bagrutStudents.length}</p>
              </div>
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">פעילים</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {bagrutStudents.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">הושלמו</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {bagrutStudents.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">אחוז הצלחה</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {bagrutStudents.length > 0
                    ? Math.round((bagrutStudents.filter(s => s.status === 'completed').length /
                        bagrutStudents.filter(s => s.status === 'completed' || s.status === 'failed').length) * 100) || 0
                    : 0}%
                </p>
              </div>
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="חיפוש תלמידים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                מסננים
                {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="name">מיון לפי שם</option>
                <option value="progress">מיון לפי התקדמות</option>
                <option value="stage">מיון לפי שלב</option>
                <option value="lastActivity">מיון לפי פעילות אחרונה</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="active">פעיל</option>
                <option value="completed">הושלם</option>
                <option value="pending">ממתין</option>
                <option value="failed">נכשל</option>
              </select>
              <select
                value={filters.stage}
                onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">כל השלבים</option>
                <option value="1">השמעה 1</option>
                <option value="2">השמעה 2</option>
                <option value="3">השמעה 3</option>
                <option value="4">מגן בגרות</option>
              </select>
              <select
                value={filters.instrument}
                onChange={(e) => setFilters({ ...filters, instrument: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">כל הכלים</option>
                {getUniqueValues('instrument').map(instrument => (
                  <option key={instrument} value={instrument}>{instrument}</option>
                ))}
              </select>
              <select
                value={filters.teacher}
                onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">כל המורים</option>
                {getUniqueValues('teacherName').map(teacher => (
                  <option key={teacher} value={teacher}>{teacher}</option>
                ))}
              </select>
              <select
                value={filters.recitalUnits}
                onChange={(e) => setFilters({ ...filters, recitalUnits: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">כל יחידות הרסיטל</option>
                <option value="3">3 יחידות</option>
                <option value="5">5 יחידות</option>
              </select>
            </div>
          )}

          {selectedStudents.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
              <div className="text-sm text-gray-600">
                נבחרו {selectedStudents.length} תלמידים
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  ייצא
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  מחק
                </button>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  בטל בחירה
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(filteredStudents.map(s => s.bagrutId))
                        } else {
                          setSelectedStudents([])
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תלמיד
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מורה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    שלב
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    התקדמות
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    יחידות רסיטל
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ציון סופי
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-reisinger-yonatan">
                        {bagrutStudents.length === 0 ? 'אין תלמידי בגרות' : 'לא נמצאו תלמידים התואמים לקריטריונים'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.bagrutId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.bagrutId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.bagrutId])
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.bagrutId))
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center ml-3">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                            <div className="text-sm text-gray-500">{student.instrument}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.teacherName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          השמעה {student.stage}/4
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 ml-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {Math.round(student.progress)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.status)}`}>
                          {getStatusIcon(student.status)}
                          {getStatusText(student.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.recitalUnits ? `${student.recitalUnits} יחידות` : 'לא צוין'}
                        {student.recitalField && (
                          <div className="text-xs text-gray-500">{student.recitalField}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.finalGrade ? (
                          <span className={`text-sm font-bold ${
                            student.finalGrade >= 85 ? 'text-green-600' :
                            student.finalGrade >= 75 ? 'text-blue-600' :
                            student.finalGrade >= 55 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {student.finalGrade}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">טרם הוערך</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.location.href = `/bagrut/${student.bagrutId}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {role === 'admin' && (
                            <button
                              onClick={() => {
                                if (window.confirm('האם אתה בטוח שברצונך למחוק תלמיד בגרות זה?')) {
                                  deleteSelectedStudents()
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}