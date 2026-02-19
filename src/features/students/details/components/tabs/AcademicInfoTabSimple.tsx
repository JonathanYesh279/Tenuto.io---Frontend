/**
 * Academic Info Tab Component (Simplified)
 * 
 * Displays ONLY actual backend fields - aligned with schema
 * Updated field names and added technical exams section
 */

import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Trophy, Clock, FileText, CheckCircle, XCircle, Star, Edit, Save, X, AlertTriangle, User } from 'lucide-react'
import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'

interface AcademicInfoTabProps {
  student: any
  studentId: string
  isLoading?: boolean
  onStudentUpdate?: (updatedStudent: any) => void
}

// Test status options - aligned with backend validation
const TEST_STATUSES = [
  'לא נבחן',
  'עבר/ה',
  'לא עבר/ה',
  'עבר/ה בהצטיינות',
  'עבר/ה בהצטיינות יתרה'
]

// Passing statuses that trigger stage advancement
const PASSING_STATUSES = ['עבר/ה', 'עבר/ה בהצטיינות', 'עבר/ה בהצטיינות יתרה']

const AcademicInfoTabSimple: React.FC<AcademicInfoTabProps> = ({ student, studentId, isLoading, onStudentUpdate }) => {
  const academicInfo = student?.academicInfo || {}
  const teacherAssignments = student?.teacherAssignments || []

  // Derive a stable, deduplicated list of teacher IDs from teacherAssignments
  // Backend has NO teacherIds field — teachers are only in teacherAssignments[].teacherId
  // Dependency is student?.teacherAssignments directly (stable undefined or same array ref)
  const teacherIdsToFetch = useMemo(() => {
    const assignments = student?.teacherAssignments || []
    const ids = assignments
      .map((ta: any) => ta.teacherId)
      .filter(Boolean)
    return [...new Set(ids)] as string[]
  }, [student?.teacherAssignments])

  // State declarations - must come before memos that use them
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [teachersData, setTeachersData] = useState<any[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  // Get primary teacher name from teacher assignments
  const primaryTeacher = useMemo(() => {
    if (teacherAssignments && teacherAssignments.length > 0) {
      const activeAssignment = teacherAssignments.find((ta: any) => ta.isActive) || teacherAssignments[0]

      // Look up the teacher name from teachersData using teacherId
      if (activeAssignment?.teacherId && teachersData.length > 0) {
        const teacher = teachersData.find((t: any) => t._id === activeAssignment.teacherId)
        const teacherName = getDisplayName(teacher?.personalInfo)
        if (teacherName) return teacherName
      }
    }

    // Fallback: if we have teachersData but no assignments, show the first teacher
    if (teachersData.length > 0) {
      const firstTeacherName = getDisplayName(teachersData[0]?.personalInfo)
      if (firstTeacherName) return firstTeacherName
    }

    return null
  }, [teacherAssignments, teachersData])

  // Get primary instrument from progress
  const primaryInstrument = useMemo(() => {
    if (academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0) {
      const primary = academicInfo.instrumentProgress.find((i: any) => i.isPrimary)
      return primary || academicInfo.instrumentProgress[0]
    }
    return null
  }, [academicInfo.instrumentProgress])

  // Initialize editedData with test statuses
  const initializeEditData = () => {
    const instrumentTests: Record<string, any> = {}
    if (academicInfo.instrumentProgress) {
      academicInfo.instrumentProgress.forEach((instrument: any) => {
        instrumentTests[instrument.instrumentName] = {
          stageTestStatus: instrument.tests?.stageTest?.status || 'לא נבחן',
          technicalTestStatus: instrument.tests?.technicalTest?.status || 'לא נבחן',
        }
      })
    }
    return {
      class: academicInfo.class || '',
      stage: academicInfo.stage || academicInfo.level || '',
      startDate: academicInfo.startDate || '',
      instrumentTests
    }
  }

  const [editedData, setEditedData] = useState(initializeEditData())

  // Update editedData when student data changes
  useEffect(() => {
    setEditedData(initializeEditData())
  }, [academicInfo])

  // Load teacher names from teacherAssignments
  // Uses teacherIdsToFetch (memoized) so the effect only re-runs when IDs actually change
  useEffect(() => {
    if (teacherIdsToFetch.length === 0) {
      setTeachersData([])
      return
    }

    let cancelled = false
    const loadTeachersData = async () => {
      setLoadingTeachers(true)
      try {
        const teachersPromises = teacherIdsToFetch.map((teacherId: string) =>
          apiService.teachers.getTeacher(teacherId).catch(err => {
            console.error(`Failed to load teacher ${teacherId}:`, err)
            return null
          })
        )
        const teachers = (await Promise.all(teachersPromises)).filter(Boolean)
        if (!cancelled) {
          setTeachersData(teachers)
        }
      } catch (error) {
        console.error('Failed to load teachers:', error)
      } finally {
        if (!cancelled) {
          setLoadingTeachers(false)
        }
      }
    }

    loadTeachersData()
    return () => { cancelled = true }
  }, [teacherIdsToFetch])

  // Find teachers assigned but without active lesson (no scheduleInfo)
  const teachersWithoutLessons = useMemo(() => {
    const inactiveTeacherIds = teacherAssignments
      .filter((a: any) => a.isActive && !a.timeBlockId)
      .map((a: any) => a.teacherId)

    return teachersData.filter((teacher) =>
      inactiveTeacherIds.includes(teacher._id)
    )
  }, [teachersData, teacherAssignments])

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Update instrument progress with new test statuses and check for stage advancement
      const updatedInstrumentProgress = academicInfo.instrumentProgress?.map((instrument: any) => {
        const testUpdates = editedData.instrumentTests?.[instrument.instrumentName]
        if (testUpdates) {
          const oldStageTestStatus = instrument.tests?.stageTest?.status || 'לא נבחן'
          const newStageTestStatus = testUpdates.stageTestStatus

          // Check if stage test changed from failing to passing
          const shouldAdvanceStage =
            PASSING_STATUSES.includes(newStageTestStatus) &&
            !PASSING_STATUSES.includes(oldStageTestStatus) &&
            instrument.currentStage < 8

          return {
            ...instrument,
            // Increment stage if conditions are met
            currentStage: shouldAdvanceStage ? instrument.currentStage + 1 : instrument.currentStage,
            tests: {
              ...instrument.tests,
              stageTest: {
                ...instrument.tests?.stageTest,
                status: testUpdates.stageTestStatus
              },
              technicalTest: {
                ...instrument.tests?.technicalTest,
                status: testUpdates.technicalTestStatus
              }
            }
          }
        }
        return instrument
      })

      await apiService.students.updateStudent(studentId, {
        academicInfo: {
          ...academicInfo,
          class: editedData.class,
          instrumentProgress: updatedInstrumentProgress
        }
      })

      // Fetch fresh data from server
      const freshStudent = await apiService.students.getStudentById(studentId)

      // Update parent component state
      if (onStudentUpdate) {
        onStudentUpdate(freshStudent)
      }

      setIsEditing(false)
    } catch (error: any) {
      console.error('Error saving student academic info:', error)

      // Provide more specific error messages
      let errorMessage = 'שגיאה בשמירת הנתונים האקדמיים'

      if (error.message?.includes('Authentication failed')) {
        errorMessage = 'פג תוקף הפנייה. אנא התחבר מחדש.'
      } else if (error.message?.includes('validation')) {
        errorMessage = 'שגיאה בנתונים שהוזנו. אנא בדוק את הפרטים האקדמיים.'
      } else if (error.message?.includes('not found')) {
        errorMessage = 'התלמיד לא נמצא במערכת.'
      } else if (error.message?.includes('Network')) {
        errorMessage = 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט.'
      }

      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData(initializeEditData())
    setIsEditing(false)
  }

  const handleTestStatusChange = (instrumentName: string, testType: 'stageTest' | 'technicalTest', value: string) => {
    setEditedData(prev => ({
      ...prev,
      instrumentTests: {
        ...prev.instrumentTests,
        [instrumentName]: {
          ...prev.instrumentTests?.[instrumentName],
          [`${testType}Status`]: value
        }
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getExamStatusIcon = (status: string) => {
    switch (status) {
      case 'עבר/ה':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'לא עבר/ה':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'עבר/ה בהצטיינות':
        return <Star className="w-4 h-4 text-blue-500" />
      case 'עבר/ה בהצטיינות יתרה':
        return <Star className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getExamStatusColor = (status: string) => {
    switch (status) {
      case 'עבר/ה':
        return 'bg-green-100 text-green-800'
      case 'לא עבר/ה':
        return 'bg-red-100 text-red-800'
      case 'עבר/ה בהצטיינות':
        return 'bg-blue-100 text-blue-800'
      case 'עבר/ה בהצטיינות יתרה':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with Edit Button - matching PersonalInfoTab */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">מידע אקדמי</h2>
          <p className="text-gray-600 mt-1">התקדמות, כישורים והישגים אקדמיים</p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors shadow-md hover:shadow-lg"
            >
              <Edit className="w-4 h-4" />
              ערוך
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                בטל
              </button>
            </>
          )}
        </div>
      </div>

      {/* Single unified container for ALL academic information */}
      <div className="bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="p-2 bg-muted/50 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">פרטים אקדמיים</h3>
        </div>

        {/* Teachers Enrolled but No Lesson Scheduled - WARNING */}
        {teachersWithoutLessons.length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">מורים ללא שיעור:</span>
              {teachersWithoutLessons.map((t, i) => (
                <span key={t._id || i}>{getDisplayName(t.personalInfo) || 'מורה'}{i < teachersWithoutLessons.length - 1 ? ', ' : ''}</span>
              ))}
            </div>
          </div>
        )}

        {/* Basic Info - GRID LAYOUT */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Teacher - HIGHLIGHTED - First from right */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm text-primary mb-1 flex items-center gap-1">
              <User className="w-4 h-4" />
              מורה
            </div>
            <div className="text-base font-semibold text-primary">
              {loadingTeachers ? (
                <span className="text-gray-400 animate-pulse">טוען...</span>
              ) : primaryTeacher ? (
                primaryTeacher
              ) : teacherAssignments.length > 0 ? (
                <span className="text-orange-500">טוען שם מורה...</span>
              ) : (
                <span className="text-gray-400">לא משויך</span>
              )}
            </div>
          </div>

          {/* Class */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">כיתה</div>
            <div className="text-base font-semibold text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.class}
                  onChange={(e) => setEditedData({ ...editedData, class: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="כיתה"
                />
              ) : (
                academicInfo.class || <span className="text-gray-400">לא צוין</span>
              )}
            </div>
          </div>

          {/* Instrument */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">כלי נגינה</div>
            <div className="text-base font-semibold text-gray-900">
              {primaryInstrument?.instrumentName || <span className="text-gray-400">לא צוין</span>}
            </div>
          </div>

          {/* Stage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">שלב</div>
            <div className="text-base font-semibold text-gray-900">
              {primaryInstrument?.currentStage || primaryInstrument?.stage || academicInfo.stage || academicInfo.level || <span className="text-gray-400">לא צוין</span>}
            </div>
          </div>

          {/* Start Date */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">תאריך התחלה</div>
            <div className="text-base font-semibold text-gray-900">
              {isEditing ? (
                <input
                  type="date"
                  value={editedData.startDate ? new Date(editedData.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedData({ ...editedData, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                academicInfo.startDate ? new Date(academicInfo.startDate).toLocaleDateString('he-IL') : <span className="text-gray-400">לא צוין</span>
              )}
            </div>
          </div>
        </div>

        {/* Tests Section - Only show tests, instrument info is already in the grid above */}
        {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary" />
              <h4 className="text-base font-semibold text-gray-900">מבחנים</h4>
            </div>

            <div className="space-y-4">
              {academicInfo.instrumentProgress.map((instrument: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  {/* Instrument name header - only if multiple instruments */}
                  {academicInfo.instrumentProgress.length > 1 && (
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <span className="text-sm font-semibold text-gray-900">{instrument.instrumentName}</span>
                      {instrument.isPrimary && (
                        <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground-800 rounded-full">ראשי</span>
                      )}
                    </div>
                  )}

                  {/* Tests in grid - 2 columns */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Technical Test */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">מבחן טכני</div>
                      {isEditing ? (
                        <select
                          value={editedData.instrumentTests?.[instrument.instrumentName]?.technicalTestStatus || 'לא נבחן'}
                          onChange={(e) => handleTestStatusChange(instrument.instrumentName, 'technicalTest', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {TEST_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getExamStatusColor(instrument.tests?.technicalTest?.status || 'לא נבחן')}`}>
                          {getExamStatusIcon(instrument.tests?.technicalTest?.status || 'לא נבחן')}
                          {instrument.tests?.technicalTest?.status || 'לא נבחן'}
                        </div>
                      )}
                    </div>

                    {/* Stage Test */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">מבחן שלב</div>
                      {isEditing ? (
                        <select
                          value={editedData.instrumentTests?.[instrument.instrumentName]?.stageTestStatus || 'לא נבחן'}
                          onChange={(e) => handleTestStatusChange(instrument.instrumentName, 'stageTest', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {TEST_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getExamStatusColor(instrument.tests?.stageTest?.status || 'לא נבחן')}`}>
                          {getExamStatusIcon(instrument.tests?.stageTest?.status || 'לא נבחן')}
                          {instrument.tests?.stageTest?.status || 'לא נבחן'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Notes - INLINE */}
        {academicInfo.notes && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-gray-900">הערות</h4>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{academicInfo.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AcademicInfoTabSimple