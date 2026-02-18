/**
 * Student Details Page - Simplified Version
 *
 * Handles route parameters, basic data fetching, and renders student details
 */

import { useState, useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw, User, GraduationCap, Calendar, CheckCircle, Music, BookOpen, FileText } from 'lucide-react'
import { TabType } from '../types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DetailPageHeader } from '@/components/domain'
import { AnimatePresence, motion } from 'framer-motion'
import PersonalInfoTab from './tabs/PersonalInfoTabSimple'
import AcademicInfoTab from './tabs/AcademicInfoTabSimple'
import ScheduleTab from './tabs/ScheduleTab'
import OrchestraTab from './tabs/OrchestraTab'
import TheoryTabOptimized from './tabs/TheoryTabOptimized'
import apiService from '../../../../services/apiService'
import { getDisplayName, getInitials } from '../../../../utils/nameUtils'

// Placeholder tabs not yet implemented
const AttendanceTab = ({ student }: { student: any }) => (
  <div className="p-6 text-center text-gray-500">
    <div className="text-4xl mb-4">✅</div>
    <div>נוכחות - בפיתוח</div>
  </div>
)

const DocumentsTab = ({ student }: { student: any }) => (
  <div className="p-6 text-center text-gray-500">
    <div className="text-4xl mb-4">📄</div>
    <div>מסמכים - בפיתוח</div>
  </div>
)

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
      {/* Gradient header with breadcrumb, avatar, badges, updatedAt */}
      <DetailPageHeader
        firstName={student?.personalInfo?.firstName}
        lastName={student?.personalInfo?.lastName}
        fullName={student?.personalInfo?.fullName}
        entityType="תלמיד"
        breadcrumbLabel="תלמידים"
        breadcrumbHref="/students"
        updatedAt={student?.updatedAt}
        badges={
          <>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {student?.isActive ? 'פעיל' : 'לא פעיל'}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              כיתה {student?.academicInfo?.class || '-'}
            </span>
          </>
        }
      />

      {/* Tab Navigation and Content — shadcn Tabs with AnimatePresence fade */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
          <TabsList className="sticky top-0 z-10 w-full justify-start rounded-none border-b bg-white h-auto px-6 overflow-x-auto scrollbar-hide">
            <TabsTrigger value="personal" className="gap-2 inline-flex items-center whitespace-nowrap">
              <User className="h-4 w-4" />
              פרטים אישיים
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-2 inline-flex items-center whitespace-nowrap">
              <GraduationCap className="h-4 w-4" />
              מידע אקדמי
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2 inline-flex items-center whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              לוח זמנים
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 inline-flex items-center whitespace-nowrap">
              <CheckCircle className="h-4 w-4" />
              נוכחות
            </TabsTrigger>
            <TabsTrigger value="orchestra" className="gap-2 inline-flex items-center whitespace-nowrap">
              <Music className="h-4 w-4" />
              תזמורות
            </TabsTrigger>
            <TabsTrigger value="theory" className="gap-2 inline-flex items-center whitespace-nowrap">
              <BookOpen className="h-4 w-4" />
              תאוריה
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2 inline-flex items-center whitespace-nowrap">
              <FileText className="h-4 w-4" />
              מסמכים
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'personal' && (
                <PersonalInfoTab student={student} studentId={studentId} onStudentUpdate={handleStudentUpdate} />
              )}
              {activeTab === 'academic' && (
                <AcademicInfoTab student={student} studentId={studentId} onStudentUpdate={handleStudentUpdate} />
              )}
              {activeTab === 'schedule' && (
                <ScheduleTab student={student} studentId={studentId} isLoading={false} />
              )}
              {activeTab === 'attendance' && <AttendanceTab student={student} />}
              {activeTab === 'orchestra' && (
                <OrchestraTab student={student} studentId={studentId} isLoading={false} />
              )}
              {activeTab === 'theory' && (
                <TheoryTabOptimized student={student} studentId={studentId} />
              )}
              {activeTab === 'documents' && <DocumentsTab student={student} />}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}

export default StudentDetailsPage
