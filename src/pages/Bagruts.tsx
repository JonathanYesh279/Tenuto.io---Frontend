import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Eye, Edit, Trash2, Filter, Loader,
  Grid, List, Download, CheckCircle, Clock, Award,
  FileText, Calendar, User, Music, AlertCircle, XCircle
} from 'lucide-react'
import { Card } from '../components/ui/card'
import Table, { StatusBadge } from '../components/ui/Table'
import StatsCard from '../components/ui/StatsCard'
import BagrutCard from '../components/BagrutCard'
import SimplifiedBagrutForm from '../components/SimplifiedBagrutForm'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import { useBagrut } from '../hooks/useBagrut'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext'
import apiService from '../services/apiService'

export default function Bagruts() {
  const navigate = useNavigate()
  const { currentSchoolYear } = useSchoolYear()
  const { user } = useAuth()
  const {
    bagruts,
    loading,
    error,
    fetchAllBagruts,
    createBagrut,
    deleteBagrut,
    clearError
  } = useBagrut()

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    teacherId: '',
    conservatory: '',
    isCompleted: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [bagrutToDelete, setBagrutToDelete] = useState<{id: string, studentName: string} | null>(null)

  // Additional data
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loadingAdditionalData, setLoadingAdditionalData] = useState(false)
  const [teacherBagruts, setTeacherBagruts] = useState<any[]>([])
  const [isTeacherRole, setIsTeacherRole] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [currentSchoolYear])

  // Log bagruts when they change (for debugging)
  useEffect(() => {
    console.log('🎭 Bagruts state updated:', bagruts.length, 'bagruts loaded')
    if (bagruts.length > 0) {
      console.log('🎭 First bagrut sample:', bagruts[0])
    }
  }, [bagruts])

  const loadData = async (forceRefresh = false) => {
    try {
      setLoadingAdditionalData(true)

      console.log('🔄 Loading bagrut data...', forceRefresh ? '(forced refresh)' : '')
      console.log('👤 Current user:', user?._id, 'Role:', user?.roles?.[0])

      // Check if user is a teacher (but not if they're also an admin)
      const userIsAdmin = user?.roles?.includes('מנהל') || user?.roles?.includes('admin')
      const userIsTeacher = (user?.roles?.includes('מורה') || user?.roles?.includes('teacher')) && !userIsAdmin
      setIsTeacherRole(userIsTeacher)

      if (userIsTeacher) {
        // Teacher role: Load their students and filter bagruts by their students
        console.log('🎓 Teacher role detected, loading student bagruts...')

        // Get teacher profile to get their students
        const teacherProfile = await apiService.teachers.getTeacher(user._id)
        const teacherStudentIds = teacherProfile.teaching?.studentIds || []

        console.log('👥 Teacher has', teacherStudentIds.length, 'students')

        if (teacherStudentIds.length === 0) {
          // No students assigned to this teacher
          setTeacherBagruts([])
          setStudents([])
          setTeachers([])
          return
        }

        // Load students
        const studentsData = await apiService.students.getBatchStudents(teacherStudentIds)
        console.log('📚 Loaded', studentsData.length, 'students')

        // Filter students who have bagrut data
        const studentsWithBagruts = studentsData.filter(student =>
          student.academicInfo?.bagrutTracking &&
          Object.keys(student.academicInfo.bagrutTracking).length > 0
        )

        console.log('🎯', studentsWithBagruts.length, 'students have bagrut data')

        // Create bagrut objects from student data
        const bagrutData = studentsWithBagruts.map(student => ({
          _id: `${student._id}-bagrut`,
          studentId: student._id,
          studentName: student.personalInfo?.fullName || 'לא צוין',
          bagrutTracking: student.academicInfo?.bagrutTracking || {},
          class: student.personalInfo?.class || student.academicInfo?.class,
          // Check if student has any active bagrut process
          hasActiveBagrut: student.academicInfo?.bagrutTracking &&
            Object.values(student.academicInfo.bagrutTracking).some((track: any) =>
              track.status !== 'completed' && track.status !== 'cancelled'
            )
        }))

        setTeacherBagruts(bagrutData)
        setStudents(studentsData)
        setTeachers([teacherProfile])
      } else {
        // Admin/other roles: Load all bagruts
        await fetchAllBagruts({
          showInactive: false,
          sortBy: 'createdAt',
          order: 'desc'
        })

        // Load students and teachers for filtering and display
        const [studentsData, teachersData] = await Promise.all([
          apiService.students.getStudents(),
          apiService.teachers.getTeachers()
        ])

        console.log('🎓 Loaded students data:', studentsData?.length, 'students')
        console.log('👨‍🏫 Loaded teachers data:', teachersData?.length, 'teachers')

        setStudents(studentsData)
        setTeachers(teachersData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoadingAdditionalData(false)
    }
  }

  // Get student and teacher names for display
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s._id === studentId)
    console.log('🔍 Looking for student:', studentId, 'Found:', student?.personalInfo?.fullName || 'NOT FOUND')
    return student?.personalInfo?.fullName || 'תלמיד לא ידוע'
  }

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t._id === teacherId)
    return teacher?.personalInfo?.fullName || 'מורה לא ידוע'
  }

  // Handle actions
  const handleViewBagrut = (bagrutId: string) => {
    navigate(`/bagruts/${bagrutId}`)
  }

  const handleEditBagrut = (bagrutId: string) => {
    navigate(`/bagruts/${bagrutId}/edit`)
  }

  const handleDeleteClick = (bagrutId: string, studentId: string) => {
    const studentName = getStudentName(studentId)
    setBagrutToDelete({ id: bagrutId, studentName })
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (bagrutToDelete) {
      const success = await deleteBagrut(bagrutToDelete.id)
      if (success) {
        await loadData() // Reload data after deletion
      }
      setBagrutToDelete(null)
    }
    setShowDeleteModal(false)
  }

  const handleCancelDelete = () => {
    setBagrutToDelete(null)
    setShowDeleteModal(false)
  }

  const handleExportPDF = async (bagrutId: string) => {
    try {
      const response = await fetch(`/api/bagrut/${bagrutId}/export/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bagrut-${bagrutId}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting PDF:', err)
      alert('שגיאה בייצוא המסמך')
    }
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      console.log('🚀 Creating bagrut with data:', formData)
      const newBagrut = await createBagrut(formData)
      
      if (newBagrut) {
        console.log('✅ Bagrut created successfully:', newBagrut._id)
        
        // Close form first
        setShowForm(false)
        
        // Force a fresh reload of all data with a small delay
        setTimeout(async () => {
          console.log('🔄 Refreshing bagrut data...')
          await Promise.all([
            loadData(true), // Force refresh
            fetchAllBagruts({ 
              showInactive: false,
              sortBy: 'createdAt',
              order: 'desc'
            })
          ])
          
          // Navigate after data refresh
          console.log('🔗 Navigating to bagrut details:', newBagrut._id)
          navigate(`/bagruts/${newBagrut._id}`)
        }, 200)
      } else {
        console.error('❌ Failed to create bagrut - no bagrut returned')
      }
    } catch (error) {
      console.error('❌ Error in form submission:', error)
    }
  }

  // Use appropriate bagrut source based on user role
  const bagrutSource = isTeacherRole ? teacherBagruts : bagruts

  // Filter bagruts
  const filteredBagruts = bagrutSource.filter(bagrut => {
    const studentName = bagrut.studentName || getStudentName(bagrut.studentId)
    const teacherName = getTeacherName(bagrut.teacherId)

    const matchesSearch = !searchTerm ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bagrut.conservatoryName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !filters.status ||
      (filters.status === 'completed' && bagrut.isCompleted) ||
      (filters.status === 'pending' && !bagrut.isCompleted)

    const matchesTeacher = !filters.teacherId || bagrut.teacherId === filters.teacherId

    const matchesConservatory = !filters.conservatory ||
      bagrut.conservatoryName === filters.conservatory

    const matchesCompletion = filters.isCompleted === '' ||
      (filters.isCompleted === 'true' && bagrut.isCompleted) ||
      (filters.isCompleted === 'false' && !bagrut.isCompleted)

    return matchesSearch && matchesStatus && matchesTeacher && matchesConservatory && matchesCompletion
  })

  // Calculate statistics
  const totalBagruts = bagrutSource.length
  const completedBagruts = bagrutSource.filter(b => b.isCompleted).length
  const pendingBagruts = totalBagruts - completedBagruts
  const excellentGrades = bagrutSource.filter(b => b.finalGrade && b.finalGrade >= 90).length

  // Table columns
  const columns = [
    {
      key: 'student',
      header: 'תלמיד',
      render: (bagrut: any) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{getStudentName(bagrut.studentId)}</span>
        </div>
      )
    },
    {
      key: 'teacher',
      header: 'מורה',
      render: (bagrut: any) => getTeacherName(bagrut.teacherId)
    },
    {
      key: 'conservatory',
      header: 'קונסרבטוריון',
      render: (bagrut: any) => bagrut.conservatoryName || 'לא צוין'
    },
    {
      key: 'progress',
      header: 'התקדמות',
      align: 'center' as const,
      render: (bagrut: any) => {
        const presentationsCompleted = bagrut.presentations?.filter((p: any) => p.isCompleted).length || 0
        const magenCompleted = bagrut.magenBagrut?.isCompleted ? 1 : 0
        const programPieces = bagrut.program?.length || 0
        
        const totalItems = 5 // 4 presentations + magen
        const completedItems = presentationsCompleted + magenCompleted
        const percentage = Math.round((completedItems / totalItems) * 100)
        
        return (
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium text-gray-700">{percentage}%</div>
            <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full transition-all ${
                  percentage >= 80 ? 'bg-green-500' :
                  percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      key: 'grade',
      header: 'ציון סופי',
      align: 'center' as const,
      render: (bagrut: any) => {
        if (!bagrut.finalGrade) {
          return <span className="text-gray-400">-</span>
        }
        
        let color = 'text-gray-700'
        if (bagrut.finalGrade >= 90) color = 'text-green-600 font-bold'
        else if (bagrut.finalGrade >= 80) color = 'text-blue-600'
        else if (bagrut.finalGrade >= 70) color = 'text-yellow-600'
        else if (bagrut.finalGrade < 60) color = 'text-red-600'
        
        return (
          <div className="flex flex-col items-center">
            <span className={`text-lg ${color}`}>{bagrut.finalGrade}</span>
            {bagrut.finalGradeLevel && (
              <span className="text-xs text-gray-500">{bagrut.finalGradeLevel}</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'סטטוס',
      align: 'center' as const,
      render: (bagrut: any) => (
        bagrut.isCompleted ? (
          <StatusBadge status="completed">הושלם</StatusBadge>
        ) : (
          <StatusBadge status="pending">בתהליך</StatusBadge>
        )
      )
    },
    {
      key: 'actions',
      header: 'פעולות',
      align: 'center' as const,
      render: (bagrut: any) => (
        <div className="flex space-x-2 space-x-reverse justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleViewBagrut(bagrut._id)
            }}
            className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded transition-colors"
            title="צפה בפרטים"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEditBagrut(bagrut._id)
            }}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="ערוך"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleExportPDF(bagrut._id)
            }}
            className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors"
            title="ייצא PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteClick(bagrut._id, bagrut.studentId)
            }}
            className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
            title="מחק"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  if (loading || loadingAdditionalData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <div className="text-lg text-gray-600">טוען נתוני בגרויות...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <div className="text-red-600 text-lg mb-4">שגיאה בטעינת הנתונים</div>
        <div className="text-gray-600 mb-6">{error}</div>
        <button 
          onClick={() => {
            clearError()
            loadData()
          }}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול בגרויות</h1>
          <p className="text-gray-600 mt-1">
            {isTeacherRole
              ? 'מעקב אחר בגרויות התלמידים שלך'
              : 'מעקב אחר תהליכי בגרות, ציונים ומסמכים'
            }
          </p>
        </div>
        {!isTeacherRole && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 ml-2" />
            בגרות חדשה
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="סה״כ בגרויות"
          value={totalBagruts.toString()}
          subtitle="בגרויות רשומות במערכת"
          icon={<FileText />}
          color="blue"
        />
        <StatsCard
          title="הושלמו"
          value={completedBagruts.toString()}
          subtitle="בגרויות שהושלמו"
          icon={<CheckCircle />}
          color="green"
        />
        <StatsCard
          title="בתהליך"
          value={pendingBagruts.toString()}
          subtitle="בגרויות פעילות"
          icon={<Clock />}
          color="orange"
        />
        <StatsCard
          title="מצטיינים"
          value={excellentGrades.toString()}
          subtitle="ציון 90 ומעלה"
          icon={<Award />}
          color="purple"
        />
      </div>

      {/* Filters and Search */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש לפי שם תלמיד, מורה או קונסרבטוריון..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">כל הסטטוסים</option>
              <option value="completed">הושלם</option>
              <option value="pending">בתהליך</option>
            </select>

            <select
              value={filters.teacherId}
              onChange={(e) => setFilters(prev => ({ ...prev, teacherId: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">כל המורים</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.personalInfo?.fullName}
                </option>
              ))}
            </select>

            <select
              value={filters.conservatory}
              onChange={(e) => setFilters(prev => ({ ...prev, conservatory: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">כל הקונסרבטוריונים</option>
              {[...new Set(bagruts.map(b => b.conservatoryName).filter(Boolean))].map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* View Mode Toggle and Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          מציג {filteredBagruts.length} מתוך {totalBagruts} בגרויות
        </div>
        
        <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'table'
                ? 'bg-white text-primary-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <List className="w-4 h-4" />
            טבלה
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-white text-primary-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            רשת
          </button>
        </div>
      </div>

      {/* Data Display */}
      {viewMode === 'table' ? (
        <Table
          columns={columns}
          data={filteredBagruts}
          onRowClick={(row) => handleViewBagrut(row._id)}
          rowClassName="hover:bg-gray-50 cursor-pointer transition-colors"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBagruts.map(bagrut => (
            <BagrutCard
              key={bagrut._id}
              bagrut={bagrut}
              studentName={getStudentName(bagrut.studentId)}
              teacherName={getTeacherName(bagrut.teacherId)}
              onClick={() => handleViewBagrut(bagrut._id!)}
              onEdit={() => handleEditBagrut(bagrut._id!)}
              onDelete={() => handleDeleteClick(bagrut._id!, bagrut.studentId)}
              onExport={() => handleExportPDF(bagrut._id!)}
            />
          ))}
        </div>
      )}

      {filteredBagruts.length === 0 && !loading && !loadingAdditionalData && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 text-lg">
            {isTeacherRole
              ? totalBagruts === 0
                ? 'אין לך תלמידים עם תהליכי בגרות פעילים כרגע'
                : 'לא נמצאו בגרויות התואמות לחיפוש'
              : 'לא נמצאו בגרויות התואמות לחיפוש'
            }
          </div>
          {isTeacherRole && totalBagruts === 0 && (
            <p className="text-gray-400 text-sm mt-2">
              כאשר תלמידיך יירשמו לבגרויות, הן יופיעו כאן
            </p>
          )}
        </div>
      )}

      {/* New Bagrut Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mr-64">
            <SimplifiedBagrutForm
              students={students}
              teachers={teachers}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת בגרות"
        message={`האם אתה בטוח שברצונך למחוק את הבגרות של ${bagrutToDelete?.studentName}? פעולה זו לא ניתנת לביטול.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </div>
  )
}