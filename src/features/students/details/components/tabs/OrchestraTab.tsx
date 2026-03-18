/**
 * Orchestra Tab Component - Simplified Implementation
 *
 * Displays student's current orchestra enrollments and provides enrollment management
 * Works with actual student data and API structure
 */

import { useState, useEffect } from 'react'
import { Chip, Button, Tabs, Tab } from '@heroui/react'
import { motion } from 'framer-motion'

import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'
import { CheckCircleIcon, MusicNotesIcon, PlusIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { ActivityTimelineCard } from '@/components/schedule/ActivityTimelineCard'

interface RehearsalSchedule {
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
  dayName: string
}

interface Orchestra {
  _id: string
  name: string
  type: string
  conductorId?: string
  conductor?: any
  memberIds: string[]
  rehearsalIds?: string[]
  rehearsalSchedule?: RehearsalSchedule
  location?: string
  isActive?: boolean
  capacity?: number
  currentMembers?: number
  level?: string
  gradeRequirements?: string[]
  description?: string
  isCompatible?: boolean
  rehearsalSummary?: any
}

interface OrchestraTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const OrchestraTab: React.FC<OrchestraTabProps> = ({ student, studentId, isLoading }) => {
  const [activeView, setActiveView] = useState<'current' | 'manage'>('current')
  const [enrolledOrchestras, setEnrolledOrchestras] = useState<Orchestra[]>([])
  const [availableOrchestras, setAvailableOrchestras] = useState<Orchestra[]>([])
  const [isLoadingOrchestras, setIsLoadingOrchestras] = useState(false)
  const [enrollmentInProgress, setEnrollmentInProgress] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null)

  // Get student's current instrument (for filtering compatible orchestras)
  const studentInstrument = student?.teacherAssignments?.[0]?.instrument || 'חצוצרה'
  const studentGrade = student?.academicInfo?.class || 'ז'

  // Fetch enrolled orchestras details
  useEffect(() => {
    const fetchEnrolledOrchestras = async () => {
      try {
        setIsLoadingOrchestras(true)

        // First, get all orchestras to check memberIds
        const allOrchestras = await apiService.orchestras.getOrchestras()

        // Find orchestras where this student is listed as a member
        const orchestrasWhereStudentIsMember = allOrchestras.filter((orchestra: any) =>
          orchestra.memberIds?.includes(studentId)
        )

        // Also check student's enrollments.orchestraIds
        const enrolledOrchestraIds = student?.enrollments?.orchestraIds || []

        // Combine both sources (student's enrollments and orchestra's memberIds)
        const allEnrolledIds = new Set([
          ...enrolledOrchestraIds,
          ...orchestrasWhereStudentIsMember.map((o: any) => o._id)
        ])

        if (allEnrolledIds.size === 0) {
          setEnrolledOrchestras([])
          return
        }

        // Fetch details for all enrolled orchestras (without individual rehearsal fetching)
        const orchestraPromises = Array.from(allEnrolledIds).map(async (orchestraId: string) => {
          try {
            const orchestra = await apiService.orchestras.getOrchestra(orchestraId)

            // Fetch conductor data if conductorId exists
            let conductorData = null
            if (orchestra.conductorId || orchestra.teacherId) {
              try {
                const teacherId = orchestra.conductorId || orchestra.teacherId
                const teacher = await apiService.teachers.getTeacher(teacherId)
                conductorData = teacher
              } catch (conductorError) {
                console.warn(`Failed to fetch conductor ${orchestra.conductorId || orchestra.teacherId}:`, conductorError)
              }
            }

            // Add basic rehearsal summary instead of fetching all individual rehearsals
            const rehearsalSummary = {
              hasRehearsals: orchestra.rehearsalIds && orchestra.rehearsalIds.length > 0,
              rehearsalCount: orchestra.rehearsalIds?.length || 0,
              location: orchestra.location || 'אולם המוזיקה הראשי'
            }

            return {
              ...orchestra,
              conductor: conductorData || orchestra.conductor,
              enrollmentStatus: 'enrolled',
              rehearsalSummary
            }
          } catch (error) {
            console.warn(`Failed to fetch orchestra ${orchestraId}:`, error)
            // Try to get from the already fetched list
            const fromList = orchestrasWhereStudentIsMember.find((o: any) => o._id === orchestraId)
            if (fromList) {
              return {
                ...fromList,
                enrollmentStatus: 'enrolled',
                rehearsalSummary: { hasRehearsals: false, rehearsalCount: 0, location: 'לא מוגד' }
              }
            }
            return {
              _id: orchestraId,
              name: 'תזמורת לא זמינה',
              error: true,
              enrollmentStatus: 'enrolled',
              rehearsalSummary: { hasRehearsals: false, rehearsalCount: 0, location: 'לא מוגד' }
            }
          }
        })

        const orchestras = await Promise.all(orchestraPromises)
        setEnrolledOrchestras(orchestras)

        console.log(`Found ${orchestras.length} enrolled orchestras for student ${studentId}`)
        if (orchestras.length > 0) {
          console.log('📊 Enrolled orchestra sample:', orchestras[0])
          console.log('📊 Enrolled orchestra keys:', Object.keys(orchestras[0]))
          console.log('📊 Enrolled rehearsal schedule:', orchestras[0].rehearsalSchedule)
        }
      } catch (error) {
        console.error('Error fetching enrolled orchestras:', error)
      } finally {
        setIsLoadingOrchestras(false)
      }
    }

    fetchEnrolledOrchestras()
  }, [student?.enrollments?.orchestraIds, studentId])

  // Fetch available orchestras for enrollment
  useEffect(() => {
    const fetchAvailableOrchestras = async () => {
      if (activeView !== 'manage') return

      try {
        setIsLoadingOrchestras(true)
        const allOrchestras = await apiService.orchestras.getOrchestras()

        // Process orchestras with smart summary approach and fetch conductor data
        const processedOrchestras = await Promise.all(allOrchestras.map(async (orchestra: any) => {
          // Check if student is already enrolled (either in enrollments or in orchestra's memberIds)
          const isEnrolled = student?.enrollments?.orchestraIds?.includes(orchestra._id) ||
                            orchestra.memberIds?.includes(studentId)

          // Check instrument compatibility (if orchestra specifies required instruments)
          let instrumentCompatible = true
          if (orchestra.requiredInstruments && orchestra.requiredInstruments.length > 0) {
            instrumentCompatible = orchestra.requiredInstruments.includes(studentInstrument)
          }

          // Check grade level requirements (if specified)
          let gradeCompatible = true
          if (orchestra.gradeRequirements && orchestra.gradeRequirements.length > 0) {
            gradeCompatible = orchestra.gradeRequirements.includes(studentGrade)
          }

          // Fetch conductor data if conductorId exists
          let conductorData = null
          if (orchestra.conductorId || orchestra.teacherId) {
            try {
              const teacherId = orchestra.conductorId || orchestra.teacherId
              const teacher = await apiService.teachers.getTeacher(teacherId)
              conductorData = teacher
            } catch (conductorError) {
              console.warn(`Failed to fetch conductor ${orchestra.conductorId || orchestra.teacherId}:`, conductorError)
            }
          }

          // Add rehearsal summary without fetching individual rehearsals
          const rehearsalSummary = {
            hasRehearsals: orchestra.rehearsalIds && orchestra.rehearsalIds.length > 0,
            rehearsalCount: orchestra.rehearsalIds?.length || 0,
            location: orchestra.location || 'אולם המוזיקה הראשי'
          }

          return {
            ...orchestra,
            conductor: conductorData || orchestra.conductor,
            isEnrolled,
            instrumentCompatible,
            gradeCompatible,
            isCompatible: instrumentCompatible && gradeCompatible,
            rehearsalSummary
          }
        }))

        // Filter to show only non-enrolled orchestras in the available view
        const available = processedOrchestras.filter((orchestra: any) => !orchestra.isEnrolled)

        console.log('All orchestras:', allOrchestras.length, 'Available:', available.length)
        console.log('📊 Orchestra data sample:', allOrchestras[0])
        console.log('📊 Orchestra keys:', allOrchestras[0] ? Object.keys(allOrchestras[0]) : 'No orchestras')
        if (allOrchestras[0]) {
          console.log('📊 Rehearsal schedule field:', allOrchestras[0].rehearsalSchedule)
          console.log('📊 Schedule field:', allOrchestras[0].schedule)
          console.log('📊 Rehearsals field:', allOrchestras[0].rehearsals)
        }
        setAvailableOrchestras(available)
      } catch (error) {
        console.error('Error fetching available orchestras:', error)
        setAvailableOrchestras([])
      } finally {
        setIsLoadingOrchestras(false)
      }
    }

    fetchAvailableOrchestras()
  }, [activeView, student?.enrollments?.orchestraIds, studentInstrument, studentGrade, studentId])

  // Check for schedule conflicts
  const checkScheduleConflict = (orchestra: Orchestra) => {
    const rehearsalSchedule = orchestra?.rehearsalSchedule
    if (!rehearsalSchedule || !student?.teacherAssignments) return false

    const studentLessonDay = 2 // Tuesday (0=Sunday, 1=Monday, 2=Tuesday...)
    const studentLessonStart = '14:30'
    const studentLessonEnd = '15:15'

    // Check if the rehearsal is on the same day as student's lesson
    if (rehearsalSchedule.dayOfWeek !== studentLessonDay) return false

    const rehearsalStart = rehearsalSchedule.startTime
    const rehearsalEnd = rehearsalSchedule.endTime

    // Check for time overlap
    return (rehearsalStart < studentLessonEnd && rehearsalEnd > studentLessonStart)
  }

  // Enroll in orchestra — addMember updates BOTH orchestra.memberIds AND student.enrollments.orchestraIds
  const handleEnrollment = async (orchestraId: string) => {
    try {
      setEnrollmentInProgress(orchestraId)

      await apiService.orchestras.addMember(orchestraId, studentId)

      // Update local state optimistically
      const enrolledOrchestra = availableOrchestras.find(o => o._id === orchestraId)
      if (enrolledOrchestra) {
        setEnrolledOrchestras(prev => [...prev, { ...enrolledOrchestra, enrollmentStatus: 'enrolled' }])
        setAvailableOrchestras(prev => prev.filter(o => o._id !== orchestraId))
      }
    } catch (error) {
      console.error('Error enrolling in orchestra:', error)
    } finally {
      setEnrollmentInProgress(null)
    }
  }

  // Remove enrollment — removeMember updates BOTH orchestra.memberIds AND student.enrollments.orchestraIds
  const handleUnenrollment = async (orchestraId: string) => {
    try {
      setEnrollmentInProgress(orchestraId)

      await apiService.orchestras.removeMember(orchestraId, studentId)

      // Update local state optimistically
      const unenrolledOrchestra = enrolledOrchestras.find(o => o._id === orchestraId)
      if (unenrolledOrchestra && !unenrolledOrchestra.error) {
        setAvailableOrchestras(prev => [...prev, unenrolledOrchestra])
      }
      setEnrolledOrchestras(prev => prev.filter(o => o._id !== orchestraId))
    } catch (error) {
      console.error('Error unenrolling from orchestra:', error)
    } finally {
      setEnrollmentInProgress(null)
      setShowConfirmDialog(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-6 bg-muted rounded animate-pulse w-48"></div>
          <div className="h-32 bg-muted rounded animate-pulse"></div>
          <div className="h-24 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  const renderCurrentEnrollments = () => {
    if (isLoadingOrchestras) {
      return (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-muted rounded-card h-48 animate-pulse"></div>
          ))}
        </div>
      )
    }

    if (enrolledOrchestras.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MusicNotesIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">אין הרשמות קיימות</h3>
          <p className="text-muted-foreground mb-6">התלמיד אינו רשום כרגע לתזמורות</p>
          <Button
            color="secondary"
            variant="solid"
            onPress={() => setActiveView('manage')}
          >
            צפה בתזמורות זמינות
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MusicNotesIcon className="w-5 h-5 text-secondary" />
          תזמורות רשומות ({enrolledOrchestras.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrolledOrchestras.map((orchestra) => (
            <motion.div
              key={orchestra._id}
              className="bg-card rounded-card border border-border p-6 shadow-1"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-foreground">{orchestra.name}</h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">מנצח:</span>
                      <span className="text-sm text-foreground">
                        {(() => {
                          console.log('🎭 Debugging conductor for orchestra:', orchestra.name)
                          console.log('🎭 Orchestra object keys:', Object.keys(orchestra))
                          console.log('🎭 Orchestra.conductor:', orchestra.conductor)
                          console.log('🎭 Orchestra.conductorId:', orchestra.conductorId)
                          console.log('🎭 Orchestra.teacherId:', orchestra.teacherId)

                          // Try different ways to get conductor name
                          if (orchestra.conductor) {
                            console.log('🎭 Conductor object:', orchestra.conductor)
                            console.log('🎭 Conductor type:', typeof orchestra.conductor)
                            console.log('🎭 Conductor keys:', typeof orchestra.conductor === 'object' ? Object.keys(orchestra.conductor) : 'N/A')
                            console.log('🎭 Conductor.personalInfo:', orchestra.conductor.personalInfo)
                            console.log('🎭 Conductor.personalInfo keys:', orchestra.conductor.personalInfo ? Object.keys(orchestra.conductor.personalInfo) : 'No personalInfo')

                            if (typeof orchestra.conductor === 'string') {
                              console.log('🎭 Using string conductor name:', orchestra.conductor)
                              return orchestra.conductor
                            }

                            // Check for name using getDisplayName first
                            const displayNameResult = getDisplayName(orchestra.conductor.personalInfo)
                            if (displayNameResult) {
                              console.log('🎭 Using getDisplayName:', displayNameResult)
                              return displayNameResult
                            }
                            if (orchestra.conductor.fullName) {
                              console.log('🎭 Using fullName:', orchestra.conductor.fullName)
                              return orchestra.conductor.fullName
                            }

                            // Check for firstName + lastName
                            if (orchestra.conductor.personalInfo?.firstName && orchestra.conductor.personalInfo?.lastName) {
                              const name = `${orchestra.conductor.personalInfo.firstName} ${orchestra.conductor.personalInfo.lastName}`
                              console.log('🎭 Using personalInfo firstName + lastName:', name)
                              return name
                            }

                            // Check for name field
                            if (orchestra.conductor.personalInfo?.name) {
                              console.log('🎭 Using personalInfo.name:', orchestra.conductor.personalInfo.name)
                              return orchestra.conductor.personalInfo.name
                            }
                            if (orchestra.conductor.name) {
                              console.log('🎭 Using name:', orchestra.conductor.name)
                              return orchestra.conductor.name
                            }

                            // Check Hebrew name fields
                            if (orchestra.conductor.personalInfo?.hebrewName) {
                              console.log('🎭 Using personalInfo.hebrewName:', orchestra.conductor.personalInfo.hebrewName)
                              return orchestra.conductor.personalInfo.hebrewName
                            }

                            // Check for displayName
                            if (orchestra.conductor.displayName) {
                              console.log('🎭 Using displayName:', orchestra.conductor.displayName)
                              return orchestra.conductor.displayName
                            }
                          }
                          console.log('🎭 No conductor data found, returning default')
                          return 'לא מוגד'
                        })()}
                      </span>
                    </div>
                  </div>
                  {orchestra.error && (
                    <p className="text-danger text-sm mt-1">שגיאה בטעינת פרטי התזמורת</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Chip color="success" variant="flat" size="sm" startContent={<CheckCircleIcon className="w-3 h-3" />}>
                    רשום
                  </Chip>

                  <Button
                    isIconOnly
                    variant="light"
                    color="danger"
                    size="sm"
                    onPress={() => setShowConfirmDialog(orchestra._id)}
                    isDisabled={enrollmentInProgress === orchestra._id}
                    title="בטל הרשמה"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {orchestra.description && (
                <p className="text-muted-foreground mb-4">{orchestra.description}</p>
              )}

              {/* Rehearsal Summary */}
              {orchestra.rehearsalSchedule && (
                <ActivityTimelineCard
                  title={orchestra.name}
                  subtitle={(() => {
                    if (!orchestra.conductor) return undefined
                    if (typeof orchestra.conductor === 'string') return orchestra.conductor
                    const dn = getDisplayName(orchestra.conductor.personalInfo)
                    if (dn) return dn
                    if (orchestra.conductor.personalInfo?.firstName && orchestra.conductor.personalInfo?.lastName) {
                      return `${orchestra.conductor.personalInfo.firstName} ${orchestra.conductor.personalInfo.lastName}`
                    }
                    return orchestra.conductor.displayName || orchestra.conductor.name || undefined
                  })()}
                  type="orchestra"
                  startTime={orchestra.rehearsalSchedule.startTime || '—'}
                  endTime={orchestra.rehearsalSchedule.endTime || '—'}
                  location={orchestra.rehearsalSchedule.location || orchestra.location}
                  className="mt-2 mb-4"
                />
              )}

              {/* Capacity Info */}
              {orchestra.capacity && (
                <div className="text-sm text-muted-foreground">
                  קיבולת: {orchestra.currentMembers || 0} / {orchestra.capacity} חברים
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  const renderManagementView = () => {
    if (isLoadingOrchestras) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-muted rounded-card h-32 animate-pulse"></div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PlusIcon className="w-5 h-5 text-success" />
            תזמורות זמינות להרשמה
          </h3>
          <div className="text-sm text-muted-foreground">
            מציג תזמורות התואמות לכלי: {studentInstrument}
          </div>
        </div>

        {availableOrchestras.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MusicNotesIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-muted-foreground mb-2">אין תזמורות זמינות</h4>
            <p className="text-muted-foreground">
              כל התזמורות התואמות לכלי שלך מלאות או שכבר נרשמת אליהן
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableOrchestras.map((orchestra) => {
              const hasConflict = checkScheduleConflict(orchestra)
              const isFull = orchestra.capacity && orchestra.currentMembers >= orchestra.capacity
              const canEnroll = !hasConflict && !isFull && orchestra.isCompatible

              return (
                <motion.div
                  key={orchestra._id}
                  className={`bg-card rounded-card border border-border p-6 shadow-1 ${
                    !canEnroll ? 'opacity-75' : ''
                  }`}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground">{orchestra.name}</h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">מנצח:</span>
                          <span className="text-sm text-foreground">
                            {(() => {
                              console.log('🎪 Debugging conductor for available orchestra:', orchestra.name)
                              console.log('🎪 Available orchestra.conductor:', orchestra.conductor)
                              console.log('🎪 Available orchestra.conductorId:', orchestra.conductorId)

                              // Try different ways to get conductor name
                              if (orchestra.conductor) {
                                console.log('🎪 Available conductor object:', orchestra.conductor)
                                console.log('🎪 Available conductor type:', typeof orchestra.conductor)
                                console.log('🎪 Available conductor keys:', Object.keys(orchestra.conductor))
                                console.log('🎪 Available conductor.personalInfo:', orchestra.conductor.personalInfo)
                                console.log('🎪 Available conductor.personalInfo keys:', orchestra.conductor.personalInfo ? Object.keys(orchestra.conductor.personalInfo) : 'No personalInfo')

                                if (typeof orchestra.conductor === 'string') {
                                  console.log('🎪 Using string conductor name:', orchestra.conductor)
                                  return orchestra.conductor
                                }

                                // Check for name using getDisplayName first
                                const availableDisplayName = getDisplayName(orchestra.conductor.personalInfo)
                                if (availableDisplayName) {
                                  console.log('🎪 Using getDisplayName:', availableDisplayName)
                                  return availableDisplayName
                                }
                                if (orchestra.conductor.fullName) {
                                  console.log('🎪 Using fullName:', orchestra.conductor.fullName)
                                  return orchestra.conductor.fullName
                                }

                                // Check for firstName + lastName
                                if (orchestra.conductor.personalInfo?.firstName && orchestra.conductor.personalInfo?.lastName) {
                                  const name = `${orchestra.conductor.personalInfo.firstName} ${orchestra.conductor.personalInfo.lastName}`
                                  console.log('🎪 Using personalInfo firstName + lastName:', name)
                                  return name
                                }

                                // Check for name field
                                if (orchestra.conductor.personalInfo?.name) {
                                  console.log('🎪 Using personalInfo.name:', orchestra.conductor.personalInfo.name)
                                  return orchestra.conductor.personalInfo.name
                                }
                                if (orchestra.conductor.name) {
                                  console.log('🎪 Using name:', orchestra.conductor.name)
                                  return orchestra.conductor.name
                                }

                                // Check Hebrew name fields
                                if (orchestra.conductor.personalInfo?.hebrewName) {
                                  console.log('🎪 Using personalInfo.hebrewName:', orchestra.conductor.personalInfo.hebrewName)
                                  return orchestra.conductor.personalInfo.hebrewName
                                }

                                // Check for displayName
                                if (orchestra.conductor.displayName) {
                                  console.log('🎪 Using displayName:', orchestra.conductor.displayName)
                                  return orchestra.conductor.displayName
                                }
                              }
                              console.log('🎪 No conductor data found for available orchestra, returning default')
                              return 'לא מוגד'
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Level and Type */}
                      <div className="mt-2 flex items-center gap-2">
                        {orchestra.level && (
                          <Chip
                            color={
                              orchestra.level === 'beginner' ? 'success' :
                              orchestra.level === 'intermediate' ? 'warning' :
                              orchestra.level === 'advanced' ? 'danger' :
                              'primary'
                            }
                            variant="flat"
                            size="sm"
                          >
                            {orchestra.level === 'beginner' ? 'מתחילים' :
                             orchestra.level === 'intermediate' ? 'בינוני' :
                             orchestra.level === 'advanced' ? 'מתקדמים' : 'מעורב'}
                          </Chip>
                        )}

                        {orchestra.gradeRequirements && orchestra.gradeRequirements.includes(studentGrade) && (
                          <Chip color="primary" variant="flat" size="sm">
                            מתאים לכיתה {studentGrade}
                          </Chip>
                        )}
                      </div>
                    </div>

                    <Button
                      color={canEnroll ? 'success' : 'default'}
                      variant="solid"
                      size="sm"
                      isDisabled={!canEnroll || enrollmentInProgress === orchestra._id}
                      isLoading={enrollmentInProgress === orchestra._id}
                      onPress={() => handleEnrollment(orchestra._id)}
                      startContent={enrollmentInProgress !== orchestra._id ? <PlusIcon className="w-4 h-4" /> : undefined}
                    >
                      {enrollmentInProgress === orchestra._id ? 'נרשם...' : 'הרשם'}
                    </Button>
                  </div>

                  {orchestra.description && (
                    <p className="text-muted-foreground mb-4">{orchestra.description}</p>
                  )}

                  {/* Warning Messages */}
                  {hasConflict && (
                    <div className="mb-4 p-3 bg-danger/5 border border-danger/20 rounded-card">
                      <div className="flex items-center gap-2 text-danger">
                        <WarningCircleIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">התנגשות בלוח זמנים</span>
                      </div>
                      <p className="text-danger text-sm mt-1">
                        זמני החזרות מתנגשים עם השיעור שלך בימי שלישי 14:30-15:15
                      </p>
                    </div>
                  )}

                  {isFull && (
                    <div className="mb-4 p-3 bg-warning/5 border border-warning/20 rounded-card">
                      <div className="flex items-center gap-2 text-warning">
                        <WarningCircleIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">התזמורת מלאה</span>
                      </div>
                      <p className="text-warning text-sm mt-1">
                        כל המקומות בתזמורת תפוסים
                      </p>
                    </div>
                  )}

                  {/* Rehearsal Summary */}
                  {orchestra.rehearsalSchedule && (
                    <ActivityTimelineCard
                      title={orchestra.name}
                      subtitle={(() => {
                        if (!orchestra.conductor) return undefined
                        if (typeof orchestra.conductor === 'string') return orchestra.conductor
                        const dn = getDisplayName(orchestra.conductor.personalInfo)
                        if (dn) return dn
                        if (orchestra.conductor.personalInfo?.firstName && orchestra.conductor.personalInfo?.lastName) {
                          return `${orchestra.conductor.personalInfo.firstName} ${orchestra.conductor.personalInfo.lastName}`
                        }
                        return orchestra.conductor.displayName || orchestra.conductor.name || undefined
                      })()}
                      type="orchestra"
                      startTime={orchestra.rehearsalSchedule.startTime || '—'}
                      endTime={orchestra.rehearsalSchedule.endTime || '—'}
                      location={orchestra.rehearsalSchedule.location || orchestra.location}
                      className="mt-2 mb-4"
                    />
                  )}

                  {/* Required Instruments */}
                  {orchestra.requiredInstruments && orchestra.requiredInstruments.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-foreground mb-2">כלים נדרשים</h5>
                      <div className="flex flex-wrap gap-1">
                        {orchestra.requiredInstruments.map((instrument: string, index: number) => (
                          <Chip
                            key={index}
                            color={instrument === studentInstrument ? 'success' : 'default'}
                            variant="flat"
                            size="sm"
                          >
                            {instrument}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Capacity Info */}
                  {orchestra.capacity && (
                    <div className="text-sm text-muted-foreground">
                      קיבולת: {orchestra.currentMembers || 0} / {orchestra.capacity} חברים
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">תזמורות והרכבים</h2>
        </div>

        {/* View Toggle */}
        <Tabs
          selectedKey={activeView}
          onSelectionChange={(key) => setActiveView(key as 'current' | 'manage')}
          variant="underlined"
          classNames={{ tabList: 'border-b border-border' }}
        >
          <Tab
            key="current"
            title={
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                הרשמות קיימות
              </div>
            }
          />
          <Tab
            key="manage"
            title={
              <div className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                הרשמה חדשה
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Content */}
      {activeView === 'current' ? renderCurrentEnrollments() : renderManagementView()}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-card border border-border shadow-2 p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              בטל הרשמה לתזמורת
            </h3>
            <p className="text-muted-foreground mb-6">
              האם אתה בטוח שברצונך לבטל את ההרשמה לתזמורת זו?
              פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="flat"
                onPress={() => setShowConfirmDialog(null)}
              >
                ביטול
              </Button>
              <Button
                color="danger"
                variant="solid"
                isDisabled={enrollmentInProgress === showConfirmDialog}
                isLoading={enrollmentInProgress === showConfirmDialog}
                onPress={() => handleUnenrollment(showConfirmDialog)}
              >
                {enrollmentInProgress === showConfirmDialog ? 'מבטל...' : 'בטל הרשמה'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrchestraTab
