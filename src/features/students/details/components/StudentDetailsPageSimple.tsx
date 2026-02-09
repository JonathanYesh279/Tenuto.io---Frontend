/**
 * Student Details Page - Simplified Version
 * 
 * Handles route parameters, basic data fetching, and renders student details
 */

import { useState, useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { TabType, TabConfig } from '../types'
import StudentTabNavigation from './StudentTabNavigation'
import StudentTabContent from './StudentTabContent'
import apiService from '../../../../services/apiService'

const StudentDetailsPage: React.FC = () => {
  console.log('🔍 StudentDetailsPage component loading...')
  const { studentId } = useParams<{ studentId: string }>()
  console.log('📝 Student ID from params:', studentId)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [student, setStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Handler to update student data without page reload
  const handleStudentUpdate = (updatedStudent: any) => {
    console.log('🔄 Updating student data in parent component:', updatedStudent)
    setStudent(updatedStudent)
  }

  // Define available tabs
  const tabs: TabConfig[] = [
    { id: 'personal', label: 'פרטים אישיים', component: () => null },
    { id: 'academic', label: 'מידע אקדמי', component: () => null },
    { id: 'schedule', label: 'לוח זמנים', component: () => null },
    { id: 'attendance', label: 'נוכחות', component: () => null },
    { id: 'orchestra', label: 'תזמורות', component: () => null },
    { id: 'theory', label: 'תאוריה', component: () => null },
    { id: 'documents', label: 'מסמכים', component: () => null }
  ]

  // Validate studentId parameter
  if (!studentId || studentId.trim() === '') {
    return <Navigate to="/students" replace />
  }

  // Fetch student data
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log('🌐 Fetching student data for ID:', studentId)
        const response = await apiService.students.getStudentById(studentId)
        console.log('✅ Student data received:', response)
        console.log('📚 Enrollments in response:', response?.enrollments)
        console.log('👨‍🏫 Teacher assignments in response:', response?.teacherAssignments)
        setStudent(response)
      } catch (err) {
        console.error('❌ Error fetching student:', err)
        setError(err.message || 'Failed to load student data')
      } finally {
        setIsLoading(false)
      }
    }

    if (studentId) {
      fetchStudent()
    }
  }, [studentId])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <div className="text-lg text-gray-600">טוען פרטי תלמיד...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">שגיאה בטעינת הנתונים</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <RefreshCw className="w-4 h-4" />
          נסה שוב
        </button>
      </div>
    )
  }

  // No student found
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">תלמיד לא נמצא</h1>
        <p className="text-gray-600 mb-6">לא נמצאו פרטים עבור התלמיד המבוקש</p>
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <ArrowRight className="w-4 h-4" />
          חזור לרשימת התלמידים
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <button
          onClick={() => navigate('/students')}
          className="hover:text-primary-600 transition-colors"
        >
          תלמידים
        </button>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-gray-900 font-medium">פרטי תלמיד</span>
      </nav>

      {/* Student Header - Simplified */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {student.personalInfo?.fullName?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {student.personalInfo?.fullName || 'שם לא זמין'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {student.isActive ? 'פעיל' : 'לא פעיל'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <StudentTabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        tabs={tabs}
      />

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <StudentTabContent
          activeTab={activeTab}
          studentId={studentId}
          student={student}
          isLoading={false}
          onStudentUpdate={handleStudentUpdate}
        />
      </div>
    </div>
  )
}

export default StudentDetailsPage