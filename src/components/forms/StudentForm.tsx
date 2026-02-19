import React, { useState, useEffect, useRef } from 'react'
import {
  User, Phone, Mail, MapPin, Music, Calendar, Clock, Save,
  X, Plus, Trash2, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  BookOpen, Users, Filter, Search
} from 'lucide-react'
import apiService from '../../services/apiService'
import ConfirmationModal from '../ui/ConfirmationModal'
import { handleServerValidationError } from '../../utils/validationUtils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FormField } from '@/components/ui/form-field'
import {
  Select, SelectTrigger, SelectValue, SelectContent,
  SelectItem, SelectGroup, SelectLabel
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Constants from schema
const VALID_CLASSES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'אחר']
const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8]
const VALID_INSTRUMENTS = [
  'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
  'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון', 'שירה',
  'כינור', 'ויולה', "צ'לו", 'קונטרבס', 'פסנתר', 'גיטרה',
  'גיטרה בס', 'תופים'
]
const VALID_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
const VALID_DURATIONS = [30, 45, 60]
const TEST_STATUSES = [
  'לא נבחן', 'עבר/ה', 'לא עבר/ה', 'עבר/ה בהצטיינות', 'עבר/ה בהצטיינות יתרה'
]

interface TeacherScheduleSlot {
  _id: string
  day: string
  startTime: string
  endTime: string
  duration: number
  isAvailable: boolean
  location?: string
  teacherName?: string
  teacherId?: string
  instrument?: string
}

interface InstrumentProgress {
  instrumentName: string
  isPrimary: boolean
  currentStage: number
  tests: {
    stageTest: {
      status: string
      lastTestDate?: string
      nextTestDate?: string
      notes?: string
    }
    technicalTest: {
      status: string
      lastTestDate?: string
      nextTestDate?: string
      notes?: string
    }
  }
}

interface TeacherAssignment {
  teacherId: string
  scheduleSlotId?: string
  timeBlockId?: string
  lessonId?: string
  day: string
  time: string // Backend expects 'time', not 'startTime'
  duration: number
  location?: string
  notes?: string
  scheduleInfo?: {
    day?: string
    startTime?: string
    endTime?: string
    duration?: number
    location?: string
    notes?: string
  }
  startDate?: Date
  endDate?: Date | null
  isActive?: boolean
  isRecurring?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface StudentFormData {
  personalInfo: {
    firstName: string
    lastName: string
    phone: string
    age: number | null
    address: string
    parentName: string
    parentPhone: string
    parentEmail: string
    studentEmail: string
  }
  academicInfo: {
    instrumentProgress: InstrumentProgress[]
    class: string
    tests: {
      bagrutId: string | null
    }
  }
  enrollments: {
    orchestraIds: string[]
    ensembleIds: string[]
    theoryLessonIds: string[]
    schoolYears: Array<{
      schoolYearId: string
      isActive: boolean
    }>
  }
  teacherAssignments: TeacherAssignment[]
  isActive: boolean
}

interface StudentFormProps {
  initialData?: Partial<StudentFormData>
  onSubmit: (data: StudentFormData) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

const StudentForm: React.FC<StudentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      age: null,
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      studentEmail: ''
    },
    academicInfo: {
      instrumentProgress: [{
        instrumentName: '',
        isPrimary: true,
        currentStage: 1,
        tests: {
          stageTest: { status: 'לא נבחן' },
          technicalTest: { status: 'לא נבחן' }
        }
      }],
      class: 'א',
      tests: { bagrutId: null }
    },
    enrollments: {
      orchestraIds: [],
      ensembleIds: [],
      theoryLessonIds: [],
      schoolYears: []
    },
    teacherAssignments: [],
    isActive: true,
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    academic: true,
    instruments: true,
    teachers: true,
    enrollments: false
  })

  // Fetch data
  const [teachers, setTeachers] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<TeacherScheduleSlot[]>([])
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [theoryLessons, setTheoryLessons] = useState<any[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [rehearsals, setRehearsals] = useState<any[]>([])

  // Slot filters state
  const [slotFilters, setSlotFilters] = useState({
    duration: null as number | null,
    selectedDays: [] as string[],
    startTime: '',
    endTime: ''
  })

  // Slots menu visibility state
  const [showSlotsMenu, setShowSlotsMenu] = useState(true)

  // Teacher search dropdown state
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('')
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const teacherDropdownRef = useRef<HTMLDivElement>(null)
  const teacherButtonRef = useRef<HTMLButtonElement>(null)

  // Conflict detection state
  const [conflictModal, setConflictModal] = useState({
    isOpen: false,
    message: '',
    conflictingSlot: null as TeacherScheduleSlot | null
  })

  // Fetch teachers on mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachersList = await apiService.teachers.getTeachers()
        setTeachers(teachersList)
      } catch (error) {
        console.error('Error fetching teachers:', error)
      }
    }

    const fetchOrchestras = async () => {
      try {
        const orchestrasList = await apiService.orchestras.getOrchestras()
        console.log('Fetched orchestras:', orchestrasList)

        // Fetch rehearsal data for each orchestra to get schedule info
        const orchestrasWithRehearsals = await Promise.all(
          (orchestrasList || []).map(async (orchestra) => {
            if (orchestra.rehearsalIds && orchestra.rehearsalIds.length > 0) {
              try {
                // Get rehearsal details for the first rehearsal ID to get schedule
                const rehearsal = await apiService.rehearsals.getRehearsalById(orchestra.rehearsalIds[0])
                return {
                  ...orchestra,
                  rehearsalSchedule: rehearsal ? {
                    day: rehearsal.day || rehearsal.dayOfWeek,
                    startTime: rehearsal.startTime,
                    endTime: rehearsal.endTime,
                    location: rehearsal.location || orchestra.location
                  } : null
                }
              } catch (err) {
                console.log('Could not fetch rehearsal for orchestra:', orchestra.name)
                return orchestra
              }
            }
            return orchestra
          })
        )

        setOrchestras(orchestrasWithRehearsals)
      } catch (error) {
        console.error('Error fetching orchestras:', error)
        setOrchestras([])
      }
    }

    const fetchTheoryLessons = async () => {
      try {
        const theoryList = await apiService.theory.getTheoryLessons()
        console.log('Fetched theory lessons:', theoryList)
        // Extract the array from the response - handle both array and object responses
        const lessonsArray = Array.isArray(theoryList) ? theoryList : (theoryList?.data || [])
        setTheoryLessons(lessonsArray)
      } catch (error) {
        console.error('Error fetching theory lessons:', error)
        setTheoryLessons([])
      }
    }

    fetchTeachers()
    fetchOrchestras()
    fetchTheoryLessons()
  }, [])

  // Close teacher dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target as Node)) {
        setIsTeacherDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher => {
    if (!teacherSearchQuery) return true
    const searchLower = teacherSearchQuery.toLowerCase()
    const teacherName = ((teacher.personalInfo?.firstName || '') + ' ' + (teacher.personalInfo?.lastName || '')).toLowerCase()
    const instrument = teacher.professionalInfo?.instrument?.toLowerCase() || ''
    return teacherName.includes(searchLower) || instrument.includes(searchLower)
  })

  // Get selected teacher name for display
  const getSelectedTeacherDisplay = () => {
    if (!selectedTeacherId) return 'בחר מורה לראות זמנים פנויים'
    const teacher = teachers.find(t => t._id === selectedTeacherId)
    if (!teacher) return 'בחר מורה לראות זמנים פנויים'
    return `${teacher.personalInfo?.firstName || ''} ${teacher.personalInfo?.lastName || ''} - ${teacher.professionalInfo?.instrument || 'ללא כלי'}`
  }

  // Helper function to calculate end time from start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  // Helper function to check if two time ranges overlap
  const timeRangesOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    // Convert times to minutes for easier comparison
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const start1Min = timeToMinutes(start1)
    const end1Min = timeToMinutes(end1)
    const start2Min = timeToMinutes(start2)
    const end2Min = timeToMinutes(end2)

    // Two ranges overlap if one starts before the other ends AND ends after the other starts
    return start1Min < end2Min && end1Min > start2Min
  }

  // Fetch available slots when teacher is selected
  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherSlots(selectedTeacherId)
      // Show slots menu when new teacher is selected
      setShowSlotsMenu(true)
    }
  }, [selectedTeacherId])

  const fetchTeacherSlots = async (teacherId: string) => {
    setLoadingSlots(true)
    try {
      const teacher = await apiService.teachers.getTeacherById(teacherId)

      console.log('Teacher data for slots:', teacher) // Debug log

      // Fetch all students who have lessons with this teacher
      const teacherStudents = await apiService.teachers.getTeacherStudents(teacherId)
      console.log('Teacher students:', teacherStudents) // Debug log

      // Build a list of ALL occupied time slots from all students
      const occupiedSlots: Array<{day: string, time: string, duration: number}> = []
      teacherStudents.forEach((student: any) => {
        if (student.teacherAssignments && Array.isArray(student.teacherAssignments)) {
          student.teacherAssignments.forEach((assignment: any) => {
            // Only include assignments for this specific teacher
            if (assignment.teacherId === teacherId) {
              occupiedSlots.push({
                day: assignment.day,
                time: assignment.time,
                duration: assignment.duration
              })
            }
          })
        }
      })

      console.log('🚫 Occupied slots from other students:', occupiedSlots) // Debug log

      // Get available time blocks
      console.log('📋 Teacher teaching data:', {
        hasTeaching: !!teacher.teaching,
        hasTimeBlocks: !!teacher.teaching?.timeBlocks,
        timeBlocksLength: teacher.teaching?.timeBlocks?.length
      })

      const timeBlocks = (teacher.teaching?.timeBlocks || []).filter((block: any) =>
        block.isAvailable !== false && block.isActive !== false
      )

      console.log('📅 Time blocks found:', timeBlocks.length)

      // Transform time blocks to available slots with different durations
      const availableSlots: TeacherScheduleSlot[] = []

      timeBlocks.forEach((block: any) => {
        const startTime = block.startTime
        const endTime = block.endTime
        const dayName = block.day

        // Parse time strings to calculate available slots
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)

        const startTimeMinutes = startHour * 60 + startMin
        const endTimeMinutes = endHour * 60 + endMin
        const totalAvailableTime = endTimeMinutes - startTimeMinutes

        // Generate slots for each duration (30, 45, 60 minutes)
        VALID_DURATIONS.forEach(duration => {
          // Generate slots starting every 15 minutes to capture all possible time slots
          const SLOT_INCREMENT = 15 // minutes between possible start times

          // Iterate through all possible start times in 15-minute increments
          for (let slotStartMinutes = startTimeMinutes; slotStartMinutes + duration <= endTimeMinutes; slotStartMinutes += SLOT_INCREMENT) {
            const slotEndMinutes = slotStartMinutes + duration

            // Convert back to time format
            const slotStartHour = Math.floor(slotStartMinutes / 60)
            const slotStartMinute = slotStartMinutes % 60
            const slotEndHour = Math.floor(slotEndMinutes / 60)
            const slotEndMinute = slotEndMinutes % 60

            const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`
            const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`

            // Check if this slot overlaps with ANY occupied slot from other students
            const overlapsWithOccupied = occupiedSlots.some(occupied => {
              if (occupied.day !== dayName) return false

              const occupiedEndTime = calculateEndTime(occupied.time, occupied.duration)
              const overlaps = timeRangesOverlap(slotStartTime, slotEndTime, occupied.time, occupiedEndTime)
              if (overlaps && duration === 60) {
                console.log(`🔴 Blocking slot ${slotStartTime}-${slotEndTime} (${duration}min) - overlaps with ${occupied.time}-${occupiedEndTime}`)
              }
              return overlaps
            })

            // Check if this slot is already assigned in current form
            const isAssignedInForm = formData.teacherAssignments.some((assignment: any) => {
              return assignment.teacherId === teacher._id &&
                     assignment.day === dayName &&
                     assignment.time === slotStartTime &&
                     assignment.duration === duration
            })

            if (!overlapsWithOccupied && !isAssignedInForm) {
              // Create unique ID based on start time to avoid duplicates
              const slotId = `${block._id}-${duration}-${slotStartTime.replace(':', '')}`
              availableSlots.push({
                _id: slotId,
                day: dayName,
                startTime: slotStartTime,
                endTime: slotEndTime,
                duration: duration,
                isAvailable: true,
                location: block.location,
                teacherName: (teacher.personalInfo?.firstName || '') + ' ' + (teacher.personalInfo?.lastName || ''),
                teacherId: teacher._id,
                instrument: teacher.professionalInfo?.instrument
              })
            }
          }
        })
      })

      console.log('Generated available slots (after filtering occupied):', availableSlots) // Debug log
      setAvailableSlots(availableSlots)
    } catch (error) {
      console.error('Error fetching teacher slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof StudentFormData],
        [field]: value
      }
    }))

    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [`${section}.${field}`]: ''
    }))
  }

  const handleInstrumentChange = (index: number, field: string, value: any) => {
    const updatedInstruments = [...formData.academicInfo.instrumentProgress]

    if (field === 'tests') {
      updatedInstruments[index] = {
        ...updatedInstruments[index],
        tests: value
      }
    } else {
      updatedInstruments[index] = {
        ...updatedInstruments[index],
        [field]: value
      }
    }

    // Ensure only one primary instrument
    if (field === 'isPrimary' && value === true) {
      updatedInstruments.forEach((inst, i) => {
        if (i !== index) inst.isPrimary = false
      })
    }

    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        instrumentProgress: updatedInstruments
      }
    }))
  }

  const addInstrument = () => {
    const hasPrimary = formData.academicInfo.instrumentProgress.some(i => i.isPrimary)

    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        instrumentProgress: [
          ...prev.academicInfo.instrumentProgress,
          {
            instrumentName: '',
            isPrimary: !hasPrimary,
            currentStage: 1,
            tests: {
              stageTest: { status: 'לא נבחן' },
              technicalTest: { status: 'לא נבחן' }
            }
          }
        ]
      }
    }))
  }

  const removeInstrument = (index: number) => {
    const updatedInstruments = formData.academicInfo.instrumentProgress.filter((_, i) => i !== index)

    // Ensure at least one primary instrument remains
    if (updatedInstruments.length > 0 && !updatedInstruments.some(i => i.isPrimary)) {
      updatedInstruments[0].isPrimary = true
    }

    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        instrumentProgress: updatedInstruments
      }
    }))
  }

  // Check for schedule conflicts
  const checkForConflicts = (slot: TeacherScheduleSlot): string | null => {
    const slotEndTime = calculateEndTime(slot.startTime, slot.duration)

    // 1. Check conflicts with other teacher lessons
    for (const assignment of formData.teacherAssignments) {
      if (assignment.day === slot.day) {
        const assignmentEndTime = calculateEndTime(assignment.time, assignment.duration)

        if (timeRangesOverlap(slot.startTime, slotEndTime, assignment.time, assignmentEndTime)) {
          const conflictTeacher = teachers.find(t => t._id === assignment.teacherId)
          const teacherName = conflictTeacher ? (conflictTeacher.personalInfo?.firstName || '') + ' ' + (conflictTeacher.personalInfo?.lastName || '') : 'מורה'
          return `התזמון מתנגש עם שיעור קיים:\n${assignment.day} ${assignment.time}-${assignmentEndTime} עם ${teacherName}`
        }
      }
    }

    // 2. Check conflicts with orchestra rehearsals
    const selectedOrchestra = orchestras.find(o => o._id === formData.enrollments.orchestraIds[0])
    if (selectedOrchestra?.rehearsalSchedule) {
      const rehearsal = selectedOrchestra.rehearsalSchedule
      if (rehearsal.day === slot.day) {
        if (timeRangesOverlap(slot.startTime, slotEndTime, rehearsal.startTime, rehearsal.endTime)) {
          return `התזמון מתנגש עם חזרת תזמורת:\n${rehearsal.day} ${rehearsal.startTime}-${rehearsal.endTime} - ${selectedOrchestra.name}`
        }
      }
    }

    // 3. Check conflicts with theory lessons
    const selectedTheoryLesson = theoryLessons.find(l => l._id === formData.enrollments.theoryLessonIds[0])
    if (selectedTheoryLesson?.schedule) {
      for (const theorySlot of selectedTheoryLesson.schedule) {
        if (theorySlot.day === slot.day) {
          if (timeRangesOverlap(slot.startTime, slotEndTime, theorySlot.startTime, theorySlot.endTime)) {
            return `התזמון מתנגש עם שיעור תיאוריה:\n${theorySlot.day} ${theorySlot.startTime}-${theorySlot.endTime} - ${selectedTheoryLesson.name}`
          }
        }
      }
    }

    return null // No conflicts
  }

  const handleSlotSelection = (slot: TeacherScheduleSlot) => {
    // Check for conflicts before adding the slot
    const conflictMessage = checkForConflicts(slot)

    if (conflictMessage) {
      // Show conflict warning modal
      setConflictModal({
        isOpen: true,
        message: conflictMessage,
        conflictingSlot: slot
      })
      return
    }

    // No conflicts - proceed with adding the slot
    addSlotToSchedule(slot)
  }

  const addSlotToSchedule = (slot: TeacherScheduleSlot) => {
    // Create assignment structure that exactly matches backend validation schema
    const assignment = {
      teacherId: slot.teacherId!,
      day: slot.day,
      time: slot.startTime, // Backend expects 'time', not 'startTime'
      duration: slot.duration,
      isActive: true,
      isRecurring: true,
      // Optional fields that backend accepts
      ...(slot.location && { location: slot.location }),
      // Remove scheduleSlotId - it's optional and might be causing issues
      // Remove non-schema fields like instrument and teacherName
    }

    setFormData(prev => ({
      ...prev,
      teacherAssignments: [...prev.teacherAssignments, assignment]
    }))

    // Remove selected slot from available slots
    setAvailableSlots(prev => prev.filter(s => s._id !== slot._id))

    // Hide slots menu after selection
    setShowSlotsMenu(false)
  }

  const handleConflictOverride = () => {
    // User chose to proceed despite conflict
    if (conflictModal.conflictingSlot) {
      addSlotToSchedule(conflictModal.conflictingSlot)
    }
    setConflictModal({ isOpen: false, message: '', conflictingSlot: null })
  }

  const handleConflictCancel = () => {
    // User chose not to proceed
    setConflictModal({ isOpen: false, message: '', conflictingSlot: null })
  }

  const removeTeacherAssignment = (index: number) => {
    const assignment = formData.teacherAssignments[index]

    setFormData(prev => {
      const newAssignments = prev.teacherAssignments.filter((_, i) => i !== index)

      // Check if teacher still has other assignments
      const teacherHasOtherAssignments = newAssignments.some(a =>
        a.teacherId === assignment.teacherId
      )

      return {
        ...prev,
        teacherAssignments: newAssignments
      }
    })

    // If the removed assignment is for the currently selected teacher, refresh the available slots
    if (selectedTeacherId === assignment.teacherId) {
      // Use setTimeout to ensure state has updated before re-fetching
      setTimeout(() => {
        fetchTeacherSlots(assignment.teacherId)
      }, 100)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Personal info validation
    if (!formData.personalInfo.firstName.trim()) {
      newErrors['personalInfo.firstName'] = 'שם פרטי הוא שדה חובה'
    }
    if (!formData.personalInfo.lastName.trim()) {
      newErrors['personalInfo.lastName'] = 'שם משפחה הוא שדה חובה'
    }

    if (formData.personalInfo.phone && !/^05\d{8}$/.test(formData.personalInfo.phone)) {
      newErrors['personalInfo.phone'] = 'מספר טלפון לא תקין (דוגמה: 0501234567)'
    }

    if (formData.personalInfo.parentPhone && !/^05\d{8}$/.test(formData.personalInfo.parentPhone)) {
      newErrors['personalInfo.parentPhone'] = 'מספר טלפון הורה לא תקין'
    }

    if (formData.personalInfo.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.parentEmail)) {
      newErrors['personalInfo.parentEmail'] = 'אימייל הורה לא תקין'
    }

    if (formData.personalInfo.studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.studentEmail)) {
      newErrors['personalInfo.studentEmail'] = 'אימייל תלמיד לא תקין'
    }

    // Academic info validation
    if (!formData.academicInfo.class) {
      newErrors['academicInfo.class'] = 'כיתה היא שדה חובה'
    }

    // Instrument validation
    if (formData.academicInfo.instrumentProgress.length === 0) {
      newErrors['academicInfo.instruments'] = 'יש להוסיף לפחות כלי נגינה אחד'
    } else {
      formData.academicInfo.instrumentProgress.forEach((inst, index) => {
        if (!inst.instrumentName) {
          newErrors[`instrument.${index}.name`] = 'שם הכלי הוא שדה חובה'
        }
      })
    }

    // Ensure at least one primary instrument
    const hasPrimary = formData.academicInfo.instrumentProgress.some(i => i.isPrimary)
    if (formData.academicInfo.instrumentProgress.length > 0 && !hasPrimary) {
      newErrors['academicInfo.primaryInstrument'] = 'יש לבחור כלי ראשי'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      console.log('📋 Form data being submitted:', JSON.stringify(formData, null, 2))
      console.log('👥 Teacher assignments:', JSON.stringify(formData.teacherAssignments, null, 2))
      await onSubmit(formData)
    } catch (error: any) {
      console.error('Error submitting form:', error)
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error, 'שגיאה בשמירת הנתונים')
      if (isValidationError) {
        setErrors({ ...fieldErrors, submit: generalMessage })
      } else {
        setErrors({ submit: generalMessage })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {isEdit ? 'עריכת תלמיד' : 'הוספת תלמיד חדש'}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {errors.submit && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="text-destructive">{errors.submit}</span>
        </div>
      )}

      {/* Personal Information Section */}
      <div className="bg-card rounded border border-border">
        <button
          type="button"
          onClick={() => toggleSection('personal')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">פרטים אישיים</h3>
          </div>
          {expandedSections.personal ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.personal && (
          <div className="p-6 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <FormField label="שם פרטי" htmlFor="firstName" error={errors['personalInfo.firstName']} required>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.personalInfo.firstName}
                  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  aria-invalid={!!errors['personalInfo.firstName']}
                  aria-describedby={errors['personalInfo.firstName'] ? 'firstName-error' : undefined}
                  className={cn(errors['personalInfo.firstName'] && "border-destructive focus-visible:ring-destructive")}
                  placeholder="הכנס שם פרטי"
                />
              </FormField>

              {/* Last Name */}
              <FormField label="שם משפחה" htmlFor="lastName" error={errors['personalInfo.lastName']} required>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.personalInfo.lastName}
                  onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  aria-invalid={!!errors['personalInfo.lastName']}
                  aria-describedby={errors['personalInfo.lastName'] ? 'lastName-error' : undefined}
                  className={cn(errors['personalInfo.lastName'] && "border-destructive focus-visible:ring-destructive")}
                  placeholder="הכנס שם משפחה"
                />
              </FormField>

              {/* Student Phone */}
              <FormField label="טלפון תלמיד" htmlFor="phone" error={errors['personalInfo.phone']}>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.personalInfo.phone}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  aria-invalid={!!errors['personalInfo.phone']}
                  aria-describedby={errors['personalInfo.phone'] ? 'phone-error' : undefined}
                  className={cn(errors['personalInfo.phone'] && "border-destructive focus-visible:ring-destructive")}
                  placeholder="0501234567"
                />
              </FormField>

              {/* Age */}
              <FormField label="גיל" htmlFor="age">
                <Input
                  id="age"
                  type="number"
                  value={formData.personalInfo.age || ''}
                  onChange={(e) => handleInputChange('personalInfo', 'age', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="גיל התלמיד"
                  min="0"
                  max="99"
                />
              </FormField>

              {/* Student Email */}
              <FormField label="אימייל תלמיד" htmlFor="studentEmail" error={errors['personalInfo.studentEmail']}>
                <Input
                  id="studentEmail"
                  type="email"
                  value={formData.personalInfo.studentEmail}
                  onChange={(e) => handleInputChange('personalInfo', 'studentEmail', e.target.value)}
                  aria-invalid={!!errors['personalInfo.studentEmail']}
                  aria-describedby={errors['personalInfo.studentEmail'] ? 'studentEmail-error' : undefined}
                  className={cn(errors['personalInfo.studentEmail'] && "border-destructive focus-visible:ring-destructive")}
                  placeholder="student@example.com"
                />
              </FormField>

              {/* Address */}
              <div className="md:col-span-2">
                <FormField label="כתובת" htmlFor="address">
                  <Input
                    id="address"
                    type="text"
                    value={formData.personalInfo.address}
                    onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
                    placeholder="הכנס כתובת מלאה"
                  />
                </FormField>
              </div>

              {/* Parent section divider */}
              <div className="md:col-span-2">
                <Separator className="mb-4" />
                <h4 className="text-md font-medium text-foreground mb-4">פרטי הורה</h4>
              </div>

              {/* Parent Name */}
              <FormField label="שם הורה" htmlFor="parentName">
                <Input
                  id="parentName"
                  type="text"
                  value={formData.personalInfo.parentName}
                  onChange={(e) => handleInputChange('personalInfo', 'parentName', e.target.value)}
                  placeholder="שם ההורה"
                />
              </FormField>

              {/* Parent Phone */}
              <FormField label="טלפון הורה" htmlFor="parentPhone" error={errors['personalInfo.parentPhone']}>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={formData.personalInfo.parentPhone}
                  onChange={(e) => handleInputChange('personalInfo', 'parentPhone', e.target.value)}
                  aria-invalid={!!errors['personalInfo.parentPhone']}
                  aria-describedby={errors['personalInfo.parentPhone'] ? 'parentPhone-error' : undefined}
                  className={cn(errors['personalInfo.parentPhone'] && "border-destructive focus-visible:ring-destructive")}
                  placeholder="0501234567"
                />
              </FormField>

              {/* Parent Email */}
              <div className="md:col-span-2">
                <FormField label="אימייל הורה" htmlFor="parentEmail" error={errors['personalInfo.parentEmail']}>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.personalInfo.parentEmail}
                    onChange={(e) => handleInputChange('personalInfo', 'parentEmail', e.target.value)}
                    aria-invalid={!!errors['personalInfo.parentEmail']}
                    aria-describedby={errors['personalInfo.parentEmail'] ? 'parentEmail-error' : undefined}
                    className={cn(errors['personalInfo.parentEmail'] && "border-destructive focus-visible:ring-destructive")}
                    placeholder="parent@example.com"
                  />
                </FormField>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Academic Information Section */}
      <div className="bg-card rounded border border-border">
        <button
          type="button"
          onClick={() => toggleSection('academic')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">פרטים אקדמיים</h3>
          </div>
          {expandedSections.academic ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.academic && (
          <div className="p-6 border-t border-border">
            <div className="space-y-4">
              {/* Class */}
              <FormField label="כיתה" htmlFor="class" error={errors['academicInfo.class']} required>
                <Select
                  value={formData.academicInfo.class || undefined}
                  onValueChange={(val) => handleInputChange('academicInfo', 'class', val)}
                >
                  <SelectTrigger
                    id="class"
                    aria-invalid={!!errors['academicInfo.class']}
                    aria-describedby={errors['academicInfo.class'] ? 'class-error' : undefined}
                    className={cn(errors['academicInfo.class'] && "border-destructive")}
                  >
                    <SelectValue placeholder="בחר כיתה" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_CLASSES.map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* Instruments Section */}
      <div className="bg-card rounded border border-border">
        <button
          type="button"
          onClick={() => toggleSection('instruments')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">כלי נגינה</h3>
          </div>
          {expandedSections.instruments ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.instruments && (
          <div className="p-6 border-t border-border">
            {errors['academicInfo.instruments'] && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded">
                <p className="text-destructive text-sm">{errors['academicInfo.instruments']}</p>
              </div>
            )}

            {errors['academicInfo.primaryInstrument'] && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-amber-700 text-sm">{errors['academicInfo.primaryInstrument']}</p>
              </div>
            )}

            <div className="space-y-4">
              {formData.academicInfo.instrumentProgress.map((instrument, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-foreground">כלי נגינה {index + 1}</h4>
                    {formData.academicInfo.instrumentProgress.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInstrument(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Instrument Name */}
                    <FormField
                      label="שם הכלי"
                      htmlFor={`instrumentName-${index}`}
                      error={errors[`instrument.${index}.name`]}
                      required
                    >
                      <Select
                        value={instrument.instrumentName || undefined}
                        onValueChange={(val) => handleInstrumentChange(index, 'instrumentName', val)}
                      >
                        <SelectTrigger
                          id={`instrumentName-${index}`}
                          aria-invalid={!!errors[`instrument.${index}.name`]}
                          aria-describedby={errors[`instrument.${index}.name`] ? `instrumentName-${index}-error` : undefined}
                          className={cn(errors[`instrument.${index}.name`] && "border-destructive")}
                        >
                          <SelectValue placeholder="בחר כלי" />
                        </SelectTrigger>
                        <SelectContent>
                          {VALID_INSTRUMENTS.map(inst => (
                            <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    {/* Current Stage */}
                    <FormField label="שלב נוכחי" htmlFor={`currentStage-${index}`}>
                      <Select
                        value={instrument.currentStage?.toString() || undefined}
                        onValueChange={(val) => handleInstrumentChange(index, 'currentStage', val ? parseInt(val) : 1)}
                      >
                        <SelectTrigger id={`currentStage-${index}`}>
                          <SelectValue placeholder="בחר שלב" />
                        </SelectTrigger>
                        <SelectContent>
                          {VALID_STAGES.map(stage => (
                            <SelectItem key={stage} value={stage.toString()}>שלב {stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    {/* Is Primary */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`isPrimary-${index}`}
                        checked={instrument.isPrimary}
                        onCheckedChange={(checked) => handleInstrumentChange(index, 'isPrimary', checked as boolean)}
                      />
                      <Label htmlFor={`isPrimary-${index}`} className="cursor-pointer">כלי ראשי</Label>
                    </div>

                    {/* Test Statuses */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                      <FormField label="מבחן שלב" htmlFor={`stageTest-${index}`}>
                        <Select
                          value={instrument.tests.stageTest.status || undefined}
                          onValueChange={(val) => handleInstrumentChange(index, 'tests', {
                            ...instrument.tests,
                            stageTest: { ...instrument.tests.stageTest, status: val }
                          })}
                        >
                          <SelectTrigger id={`stageTest-${index}`}>
                            <SelectValue placeholder="בחר סטטוס" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEST_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="מבחן טכני" htmlFor={`technicalTest-${index}`}>
                        <Select
                          value={instrument.tests.technicalTest.status || undefined}
                          onValueChange={(val) => handleInstrumentChange(index, 'tests', {
                            ...instrument.tests,
                            technicalTest: { ...instrument.tests.technicalTest, status: val }
                          })}
                        >
                          <SelectTrigger id={`technicalTest-${index}`}>
                            <SelectValue placeholder="בחר סטטוס" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEST_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addInstrument}
                className="w-full border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary"
              >
                <Plus className="w-4 h-4 ms-2" />
                הוסף כלי נגינה
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Teacher & Schedule Section */}
      <div className="bg-card rounded border border-border">
        <button
          type="button"
          onClick={() => toggleSection('teachers')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">מורים ושיעורים</h3>
            {formData.teacherAssignments.length > 0 && (
              <span className="px-2 py-1 bg-muted text-primary rounded-full text-xs">
                {formData.teacherAssignments.length} שיבוצים
              </span>
            )}
          </div>
          {expandedSections.teachers ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.teachers && (
          <div className="p-6 border-t border-border">
            {/* Current Assignments */}
            {formData.teacherAssignments.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">שיעורים מתוכננים</h4>
                <div className="space-y-2">
                  {formData.teacherAssignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                      <div className="flex items-center gap-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-foreground">
                            מורה - {teachers.find(t => t._id === assignment.teacherId)?.professionalInfo?.instrument || 'כלי'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.day} | {assignment.time}-{calculateEndTime(assignment.time, assignment.duration)} | {assignment.duration} דקות
                            {assignment.location && ` | ${assignment.location}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeacherAssignment(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Selection - Searchable Dropdown (custom UI - keep as-is for fixed-positioning escape) */}
            <div className="relative" ref={teacherDropdownRef}>
              <Label className="block mb-2">בחר מורה</Label>

              {/* Dropdown trigger button */}
              <button
                type="button"
                ref={teacherButtonRef}
                onClick={() => {
                  if (!isTeacherDropdownOpen && teacherButtonRef.current) {
                    const rect = teacherButtonRef.current.getBoundingClientRect()
                    setDropdownPosition({
                      top: rect.bottom + 4,
                      left: rect.left,
                      width: rect.width
                    })
                  }
                  setIsTeacherDropdownOpen(!isTeacherDropdownOpen)
                }}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-right flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className={selectedTeacherId ? 'text-foreground' : 'text-muted-foreground'}>
                  {getSelectedTeacherDisplay()}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isTeacherDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu - Fixed positioning to escape modal overflow */}
              {isTeacherDropdownOpen && (
                <div
                  className="fixed z-[9999] bg-popover border border-border rounded shadow-xl overflow-hidden"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                    maxHeight: `calc(100vh - ${dropdownPosition.top + 20}px)`
                  }}
                >
                  {/* Search input */}
                  <div className="p-2 border-b border-border sticky top-0 bg-popover">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={teacherSearchQuery}
                        onChange={(e) => setTeacherSearchQuery(e.target.value)}
                        placeholder="חיפוש לפי שם או כלי נגינה..."
                        className="pr-9 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Options list */}
                  <div className="overflow-y-auto" style={{ maxHeight: `calc(100vh - ${dropdownPosition.top + 80}px)` }}>
                    {/* Clear selection option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeacherId('')
                        setTeacherSearchQuery('')
                        setIsTeacherDropdownOpen(false)
                      }}
                      className="w-full px-3 py-2 text-right text-muted-foreground hover:bg-muted border-b border-border"
                    >
                      בחר מורה לראות זמנים פנויים
                    </button>

                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map(teacher => (
                        <button
                          type="button"
                          key={teacher._id}
                          onClick={() => {
                            setSelectedTeacherId(teacher._id)
                            setTeacherSearchQuery('')
                            setIsTeacherDropdownOpen(false)
                          }}
                          className={`w-full px-3 py-2 text-right hover:bg-accent flex items-center justify-between ${
                            selectedTeacherId === teacher._id ? 'bg-accent text-accent-foreground' : 'text-foreground'
                          }`}
                        >
                          <span>
                            {teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName} - {teacher.professionalInfo?.instrument || 'ללא כלי'}
                          </span>
                          {selectedTeacherId === teacher._id && (
                            <CheckCircle className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                        לא נמצאו מורים תואמים
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Available Slots */}
            {selectedTeacherId && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  זמנים פנויים - {(() => { const t = teachers.find(t => t._id === selectedTeacherId); return t ? (t.personalInfo?.firstName || '') + ' ' + (t.personalInfo?.lastName || '') : 'מורה' })()}
                </h4>

                {/* Add Additional Lesson Button - shows when menu is closed and there are available slots */}
                {!showSlotsMenu && availableSlots.length > 0 && (
                  <div className="mb-4">
                    <Button
                      type="button"
                      onClick={() => setShowSlotsMenu(true)}
                    >
                      <Plus className="w-4 h-4 ms-2" />
                      בחר שיעור נוסף
                    </Button>
                  </div>
                )}

                {/* Filters Section - only show when slots menu is open */}
                {showSlotsMenu && !loadingSlots && availableSlots.length > 0 && (
                  <div className="mb-4 p-4 bg-muted/50 rounded border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        סינון זמנים
                      </h5>
                      {(slotFilters.duration || slotFilters.selectedDays.length > 0 || slotFilters.startTime || slotFilters.endTime) && (
                        <button
                          type="button"
                          onClick={() => setSlotFilters({
                            duration: null,
                            selectedDays: [],
                            startTime: '',
                            endTime: ''
                          })}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          נקה סינון
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Duration Filter */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">משך שיעור</Label>
                        <Select
                          value={slotFilters.duration?.toString() || ''}
                          onValueChange={(val) => setSlotFilters(prev => ({
                            ...prev,
                            duration: val ? Number(val) : null
                          }))}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="כל המשכים" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">כל המשכים</SelectItem>
                            <SelectItem value="30">30 דקות</SelectItem>
                            <SelectItem value="45">45 דקות</SelectItem>
                            <SelectItem value="60">60 דקות</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Days Filter - keep custom checkbox dropdown */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">ימים</Label>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full h-8 px-2 py-1.5 text-sm border border-input rounded-md bg-background text-right flex items-center justify-between text-foreground"
                            onClick={(e) => {
                              const dropdown = e.currentTarget.nextElementSibling
                              if (dropdown) {
                                dropdown.classList.toggle('hidden')
                              }
                            }}
                          >
                            <span className="truncate">
                              {slotFilters.selectedDays.length > 0
                                ? `${slotFilters.selectedDays.length} ימים נבחרו`
                                : 'כל הימים'}
                            </span>
                            <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          </button>
                          <div className="hidden absolute top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg z-10">
                            {VALID_DAYS.map(day => (
                              <label key={day} className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer">
                                <Checkbox
                                  checked={slotFilters.selectedDays.includes(day)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSlotFilters(prev => ({
                                        ...prev,
                                        selectedDays: [...prev.selectedDays, day]
                                      }))
                                    } else {
                                      setSlotFilters(prev => ({
                                        ...prev,
                                        selectedDays: prev.selectedDays.filter(d => d !== day)
                                      }))
                                    }
                                  }}
                                  className="ms-2"
                                />
                                <span className="text-sm text-foreground">{day}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Start Time Filter */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">משעה</Label>
                        <Input
                          type="time"
                          value={slotFilters.startTime}
                          onChange={(e) => setSlotFilters(prev => ({
                            ...prev,
                            startTime: e.target.value
                          }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* End Time Filter */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">עד שעה</Label>
                        <Input
                          type="time"
                          value={slotFilters.endTime}
                          onChange={(e) => setSlotFilters(prev => ({
                            ...prev,
                            endTime: e.target.value
                          }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {loadingSlots ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">טוען זמנים פנויים...</p>
                  </div>
                ) : showSlotsMenu && availableSlots.length > 0 ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      בחר זמן ומשך שיעור מהאפשרויות הזמינות:
                    </p>
                    {/* Group slots by day for better organization */}
                    {(() => {
                      // Apply filters to slots
                      const filteredSlots = availableSlots.filter(slot => {
                        // Duration filter
                        if (slotFilters.duration && slot.duration !== slotFilters.duration) {
                          return false
                        }

                        // Days filter
                        if (slotFilters.selectedDays.length > 0 && !slotFilters.selectedDays.includes(slot.day)) {
                          return false
                        }

                        // Time range filter
                        if (slotFilters.startTime && slot.startTime < slotFilters.startTime) {
                          return false
                        }
                        if (slotFilters.endTime && slot.endTime > slotFilters.endTime) {
                          return false
                        }

                        return true
                      })

                      if (filteredSlots.length === 0) {
                        return (
                          <div className="text-center py-8 bg-muted/50 rounded">
                            <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground text-sm mb-2">אין זמנים התואמים לסינון שבחרת</p>
                            <button
                              type="button"
                              onClick={() => setSlotFilters({
                                duration: null,
                                selectedDays: [],
                                startTime: '',
                                endTime: ''
                              })}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              נקה סינון ותראה את כל הזמנים
                            </button>
                          </div>
                        )
                      }

                      const slotsByDay = filteredSlots.reduce((acc, slot) => {
                        if (!acc[slot.day]) acc[slot.day] = []
                        acc[slot.day].push(slot)
                        return acc
                      }, {} as Record<string, typeof availableSlots>)

                      return Object.entries(slotsByDay).map(([day, daySlots]) => (
                        <div key={day} className="mb-4">
                          <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {day}
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {daySlots
                              .sort((a, b) => a.startTime.localeCompare(b.startTime))
                              .map(slot => (
                              <button
                                key={slot._id}
                                type="button"
                                onClick={() => handleSlotSelection(slot)}
                                className={`p-3 border rounded hover:border-primary hover:bg-primary/5 transition-colors text-right ${
                                  slot.duration === 30 ? 'border-green-300 bg-green-50' :
                                  slot.duration === 45 ? 'border-blue-300 bg-blue-50' :
                                  'border-purple-300 bg-purple-50'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span className="text-sm font-medium text-foreground">
                                        {slot.startTime}-{slot.endTime}
                                      </span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      slot.duration === 30 ? 'bg-green-100 text-green-800' :
                                      slot.duration === 45 ? 'bg-blue-100 text-blue-800' :
                                      'bg-purple-100 text-purple-800'
                                    }`}>
                                      {slot.duration} דק׳
                                    </span>
                                  </div>
                                  {slot.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      {slot.location}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {slot.instrument}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                ) : selectedTeacherId && !loadingSlots && showSlotsMenu && availableSlots.length === 0 ? (
                  <div className="text-center py-6 bg-muted/50 rounded">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm mb-2">אין זמנים פנויים למורה זה</p>
                    <p className="text-xs text-muted-foreground/70">
                      ייתכן שכל הזמנים הפנויים כבר תפוסים או שהמורה לא הגדיר זמני הוראה
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enrollments Section (Optional) */}
      <div className="bg-card rounded border border-border">
        <button
          type="button"
          onClick={() => toggleSection('enrollments')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">הרשמות</h3>
          </div>
          {expandedSections.enrollments ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.enrollments && (
          <div className="p-6 border-t border-border">
            <div className="space-y-6">
              {/* Orchestra Selection */}
              <FormField label="תזמורת" htmlFor="orchestra">
                <Select
                  value={formData.enrollments.orchestraIds[0] || undefined}
                  onValueChange={(val) => {
                    setFormData(prev => ({
                      ...prev,
                      enrollments: {
                        ...prev.enrollments,
                        orchestraIds: val ? [val] : []
                      }
                    }))
                  }}
                >
                  <SelectTrigger id="orchestra">
                    <SelectValue placeholder="בחר תזמורת" />
                  </SelectTrigger>
                  <SelectContent>
                    {orchestras.map(orchestra => {
                      // Check for schedule information in various places
                      const scheduleInfo = orchestra.rehearsalSchedule ||
                                         (orchestra.schedule && orchestra.schedule[0]) ||
                                         (orchestra.rehearsals && orchestra.rehearsals[0]) ||
                                         null;

                      // Build the display string with available information
                      let displayText = orchestra.name;

                      if (scheduleInfo) {
                        const day = scheduleInfo.day || scheduleInfo.dayOfWeek || '';
                        const startTime = scheduleInfo.startTime || '';
                        const endTime = scheduleInfo.endTime || '';
                        const location = scheduleInfo.location || orchestra.location || '';

                        if (day && startTime && endTime) {
                          displayText += ` | ${day} ${startTime}-${endTime}`;
                        }
                        if (location) {
                          displayText += ` | ${location}`;
                        }
                      } else if (orchestra.location) {
                        displayText += ` | ${orchestra.location}`;
                      }

                      return (
                        <SelectItem key={orchestra._id} value={orchestra._id}>
                          {displayText}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Orchestra Preview */}
              {formData.enrollments.orchestraIds[0] && (
                <div className="mt-2 p-3 bg-purple-50 rounded border border-purple-200">
                  {(() => {
                    const selectedOrchestra = orchestras.find(o => o._id === formData.enrollments.orchestraIds[0])
                    if (!selectedOrchestra) return null
                    return (
                      <div className="space-y-1">
                        <h4 className="font-medium text-purple-900">{selectedOrchestra.name}</h4>
                        <div className="text-sm text-purple-700 space-y-1">
                          {selectedOrchestra.rehearsalSchedule && (
                            <div className="p-2 bg-purple-100 rounded">
                              <strong>זמני חזרות:</strong> {selectedOrchestra.rehearsalSchedule.day}
                              {' '}{selectedOrchestra.rehearsalSchedule.startTime}-{selectedOrchestra.rehearsalSchedule.endTime}
                              {selectedOrchestra.rehearsalSchedule.location &&
                                <span> | {selectedOrchestra.rehearsalSchedule.location}</span>
                              }
                            </div>
                          )}
                          <div><strong>סוג:</strong> {selectedOrchestra.type || 'תזמורת'}</div>
                          {!selectedOrchestra.rehearsalSchedule && selectedOrchestra.location && (
                            <div><strong>מיקום:</strong> {selectedOrchestra.location}</div>
                          )}
                          {selectedOrchestra.memberIds && (
                            <div><strong>מספר חברים:</strong> {selectedOrchestra.memberIds.length}</div>
                          )}
                          <div><strong>סטטוס:</strong> {selectedOrchestra.isActive ? 'פעיל' : 'לא פעיל'}</div>
                          {selectedOrchestra.rehearsalIds && selectedOrchestra.rehearsalIds.length > 0 && (
                            <div><strong>מספר חזרות שמורות:</strong> {selectedOrchestra.rehearsalIds.length}</div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Theory Lessons */}
              <FormField label="שיעור תיאוריה" htmlFor="theoryLesson">
                <Select
                  value={formData.enrollments.theoryLessonIds[0] || undefined}
                  onValueChange={(val) => {
                    setFormData(prev => ({
                      ...prev,
                      enrollments: {
                        ...prev.enrollments,
                        theoryLessonIds: val ? [val] : []
                      }
                    }))
                  }}
                >
                  <SelectTrigger id="theoryLesson">
                    <SelectValue placeholder="בחר שיעור תיאוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    {theoryLessons.map(lesson => {
                      const scheduleInfo = lesson.schedule && lesson.schedule.length > 0 ? lesson.schedule[0] : null;
                      const dayTimeLocation = scheduleInfo
                        ? `${scheduleInfo.day} ${scheduleInfo.startTime}-${scheduleInfo.endTime}${scheduleInfo.location ? ` | ${scheduleInfo.location}` : ''}`
                        : '';

                      return (
                        <SelectItem key={lesson._id} value={lesson._id}>
                          {lesson.name || lesson.title || lesson.category} {dayTimeLocation ? `| ${dayTimeLocation}` : ''}
                          {lesson.teacher?.personalInfo?.firstName && ` | מורה: ${lesson.teacher.personalInfo.firstName} ${lesson.teacher.personalInfo.lastName || ''}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Theory Lesson Preview */}
              {formData.enrollments.theoryLessonIds[0] && (
                <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                  {(() => {
                    const selectedLesson = theoryLessons.find(l => l._id === formData.enrollments.theoryLessonIds[0])
                    if (!selectedLesson) return null
                    return (
                      <div className="space-y-1">
                        <h4 className="font-medium text-blue-900">{selectedLesson.name}</h4>
                        <div className="text-sm text-blue-700 space-y-1">
                          <div><strong>רמה:</strong> {selectedLesson.level}</div>
                          {selectedLesson.teacher?.personalInfo?.firstName && (
                            <div><strong>מורה:</strong> {selectedLesson.teacher.personalInfo.firstName} {selectedLesson.teacher.personalInfo.lastName || ''}</div>
                          )}
                          {selectedLesson.description && (
                            <div><strong>תיאור:</strong> {selectedLesson.description}</div>
                          )}
                          {selectedLesson.maxStudents && (
                            <div><strong>מקסימום תלמידים:</strong> {selectedLesson.maxStudents}</div>
                          )}
                          {selectedLesson.currentStudents !== undefined && (
                            <div><strong>תלמידים נוכחיים:</strong> {selectedLesson.currentStudents}/{selectedLesson.maxStudents || '∞'}</div>
                          )}
                          {selectedLesson.schedule && selectedLesson.schedule.length > 0 && (
                            <div>
                              <strong>זמני שיעור:</strong>
                              <div className="mt-1 space-y-1">
                                {selectedLesson.schedule.map((slot: any, idx: number) => (
                                  <div key={idx} className="text-xs bg-blue-100 px-2 py-1 rounded">
                                    {slot.day} {slot.startTime}-{slot.endTime}
                                    {slot.location && ` | ${slot.location}`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedLesson.prerequisites && (
                            <div className="text-xs text-blue-600 mt-2">
                              <strong>דרישות קדם:</strong> {selectedLesson.prerequisites}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          ביטול
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin ms-2"></div>
              שומר...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 ms-2" />
              {isEdit ? 'עדכן תלמיד' : 'הוסף תלמיד'}
            </>
          )}
        </Button>
      </div>

      {/* Conflict Warning Modal */}
      <ConfirmationModal
        isOpen={conflictModal.isOpen}
        title="התנגשות בלוח זמנים"
        message={conflictModal.message}
        confirmText="המשך בכל זאת"
        cancelText="ביטול"
        onConfirm={handleConflictOverride}
        onCancel={handleConflictCancel}
        variant="warning"
      />
    </form>
  )
}

export default StudentForm
