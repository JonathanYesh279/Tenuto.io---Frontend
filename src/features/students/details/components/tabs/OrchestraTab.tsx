/**
 * Orchestra Tab Component - Simplified Implementation
 *
 * Displays student's current orchestra enrollments and provides enrollment management
 * Works with actual student data and API structure
 */

import { useState, useEffect } from 'react'
import { Chip, Button, Tabs, Tab } from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'

import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'
import {
  ArrowsClockwise as ArrowsClockwiseIcon,
  CalendarBlank as CalendarBlankIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  MusicNotes as MusicNotesIcon,
  Plus as PlusIcon,
  Trash as TrashIcon,
  User as UserIcon,
  Users as UsersIcon,
  WarningCircle as WarningCircleIcon,
} from '@phosphor-icons/react'

const DAY_NAMES: Record<number, string> = {
  0: 'ראשון',
  1: 'שני',
  2: 'שלישי',
  3: 'רביעי',
  4: 'חמישי',
  5: 'שישי',
}

function getConductorName(orchestra: any): string {
  if (!orchestra.conductor) return 'לא מוגד'
  if (typeof orchestra.conductor === 'string') return orchestra.conductor
  const dn = getDisplayName(orchestra.conductor.personalInfo)
  if (dn) return dn
  return orchestra.conductor.displayName || orchestra.conductor.name || 'לא מוגד'
}

function getOrchestraScheduleInfo(orchestra: any) {
  const slot = orchestra.scheduleSlots?.[0]
  const sched = orchestra.rehearsalSchedule
  const dayNum = slot?.dayOfWeek ?? sched?.dayOfWeek
  const dayName = dayNum != null ? DAY_NAMES[dayNum] : (sched?.dayName || '')
  const startTime = slot?.startTime || sched?.startTime || ''
  const endTime = slot?.endTime || sched?.endTime || ''
  const location = orchestra.location || slot?.location || sched?.location || ''
  return { dayName, startTime, endTime, location }
}

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

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {enrolledOrchestras.map((orchestra) => {
            const sched = getOrchestraScheduleInfo(orchestra)
            const conductorName = getConductorName(orchestra)
            return (
              <div key={orchestra._id} className="relative h-full pt-3">
                {/* Floating type chip */}
                <span className="absolute top-0 right-4 z-10 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border bg-amber-100 text-amber-700 border-amber-200">
                  {orchestra.type || 'תזמורת'}
                </span>

                <motion.div
                  className="bg-card rounded-card border border-border h-full flex flex-col shadow-sm hover:shadow-md hover:border-primary transition-all"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  {/* Header: day chip + action buttons */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sched.dayName && (
                        <Chip size="sm" variant="flat" color="secondary" startContent={<CalendarBlankIcon className="w-3 h-3" />}>
                          יום {sched.dayName}
                        </Chip>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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

                  {/* Body: conductor + location */}
                  <div className="px-4 pb-2 space-y-1.5 flex-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <UserIcon className="w-4 h-4 shrink-0" />
                      <span>מנצח: {conductorName}</span>
                    </div>
                    {sched.location && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPinIcon className="w-4 h-4 shrink-0" />
                        <span>{sched.location}</span>
                      </div>
                    )}
                    {orchestra.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{orchestra.description}</p>
                    )}
                  </div>

                  {/* Capacity */}
                  {orchestra.capacity && (
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <UsersIcon className="w-3.5 h-3.5" />
                        <span>{orchestra.memberIds?.length || 0} / {orchestra.capacity} חברים</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, ((orchestra.memberIds?.length || 0) / orchestra.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer: time */}
                  <div className="px-4 py-2.5 border-t border-border mt-auto">
                    <div className="flex items-center text-sm text-muted-foreground">
                      {(sched.startTime || sched.endTime) && (
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="w-4 h-4 shrink-0" />
                          <span>
                            {sched.startTime && sched.endTime
                              ? `${sched.startTime} - ${sched.endTime}`
                              : sched.startTime}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          })}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {availableOrchestras.map((orchestra) => {
              const hasConflict = checkScheduleConflict(orchestra)
              const isFull = orchestra.capacity && orchestra.currentMembers >= orchestra.capacity
              const canEnroll = !hasConflict && !isFull && orchestra.isCompatible
              const sched = getOrchestraScheduleInfo(orchestra)
              const conductorName = getConductorName(orchestra)

              return (
                <div key={orchestra._id} className="relative h-full pt-3">
                  {/* Floating type chip */}
                  <span className="absolute top-0 right-4 z-10 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border bg-amber-100 text-amber-700 border-amber-200">
                    {orchestra.type || 'תזמורת'}
                  </span>

                  <motion.div
                    className={`bg-card rounded-card border border-border h-full flex flex-col shadow-sm hover:shadow-md hover:border-primary transition-all ${!canEnroll ? 'opacity-75' : ''}`}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  >
                    {/* Header: day chip + enroll button */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {sched.dayName && (
                          <Chip size="sm" variant="flat" color="secondary" startContent={<CalendarBlankIcon className="w-3 h-3" />}>
                            יום {sched.dayName}
                          </Chip>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          onPress={() => handleEnrollment(orchestra._id)}
                          isDisabled={!canEnroll || enrollmentInProgress === orchestra._id}
                          isLoading={enrollmentInProgress === orchestra._id}
                          color="primary"
                          variant="solid"
                          size="sm"
                          startContent={enrollmentInProgress !== orchestra._id ? <PlusIcon className="w-4 h-4" /> : undefined}
                        >
                          {enrollmentInProgress === orchestra._id ? 'נרשם...' : 'הרשם'}
                        </Button>
                      </div>
                    </div>

                    {/* Body: conductor + location */}
                    <div className="px-4 pb-2 space-y-1.5 flex-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <UserIcon className="w-4 h-4 shrink-0" />
                        <span>מנצח: {conductorName}</span>
                      </div>
                      {sched.location && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPinIcon className="w-4 h-4 shrink-0" />
                          <span>{sched.location}</span>
                        </div>
                      )}
                      {orchestra.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{orchestra.description}</p>
                      )}
                    </div>

                    {/* Warnings */}
                    {(hasConflict || isFull) && (
                      <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                        {hasConflict && (
                          <Chip size="sm" variant="flat" color="danger" startContent={<WarningCircleIcon className="w-3 h-3" />}>
                            התנגשות בלו"ז
                          </Chip>
                        )}
                        {isFull && (
                          <Chip size="sm" variant="flat" color="warning" startContent={<WarningCircleIcon className="w-3 h-3" />}>
                            התזמורת מלאה
                          </Chip>
                        )}
                      </div>
                    )}

                    {/* Capacity */}
                    {orchestra.capacity && (
                      <div className="px-4 pb-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <UsersIcon className="w-3.5 h-3.5" />
                          <span>{orchestra.memberIds?.length || 0} / {orchestra.capacity} חברים</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, ((orchestra.memberIds?.length || 0) / orchestra.capacity) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer: time */}
                    <div className="px-4 py-2.5 border-t border-border mt-auto">
                      <div className="flex items-center text-sm text-muted-foreground">
                        {(sched.startTime || sched.endTime) && (
                          <span className="flex items-center gap-1.5">
                            <ClockIcon className="w-4 h-4 shrink-0" />
                            <span>
                              {sched.startTime && sched.endTime
                                ? `${sched.startTime} - ${sched.endTime}`
                                : sched.startTime}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
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
          size="sm"
          variant="solid"
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
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'current' ? renderCurrentEnrollments() : renderManagementView()}
        </motion.div>
      </AnimatePresence>

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
