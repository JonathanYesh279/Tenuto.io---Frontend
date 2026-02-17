/**
 * Add Teacher Modal Component
 *
 * A comprehensive form for creating new teachers with all required fields
 * including personal info, roles, professional info, and schedule slots.
 * Only accessible by admin users.
 *
 * Migrated to React Hook Form (shouldUnregister: false default) for tab-switch
 * data persistence. All native inputs replaced with shadcn/ui primitives.
 */

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { X, Plus, Trash2, Clock, MapPin, Save, AlertCircle, User, Briefcase, Calendar, Settings, Music2, BookOpen } from 'lucide-react'
import apiService from '../../services/apiService'
import { useSchoolYear } from '../../services/schoolYearContext'
import { VALID_LOCATIONS } from '../../constants/locations'
import { handleServerValidationError, VALID_INSTRUMENTS } from '../../utils/validationUtils'
import { formatAddress } from '../../utils/nameUtils'
import {
  CLASSIFICATIONS, DEGREES, MANAGEMENT_ROLES, TEACHING_SUBJECTS,
  INSTRUMENT_DEPARTMENTS
} from '../../constants/enums'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/ui/form-field'
import {
  Select, SelectTrigger, SelectValue, SelectContent,
  SelectItem, SelectGroup, SelectLabel
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface AddTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onTeacherAdded: (teacher: any) => void
  teacherToEdit?: any // If provided, modal opens in edit mode
  mode?: 'add' | 'edit' // Mode of the modal
}

interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
  location: string
  notes: string
}

interface TeacherFormData {
  personalInfo: {
    firstName: string
    lastName: string
    phone: string
    email: string
    address: string
    idNumber: string
    birthYear: number | null
  }
  roles: string[]
  professionalInfo: {
    instrument: string  // primary instrument (backward compat)
    instruments: string[]  // multi-select
    classification: string
    degree: string
    hasTeachingCertificate: boolean
    teachingExperienceYears: number | null
    isUnionMember: boolean
    teachingSubjects: string[]
    isActive: boolean
  }
  managementInfo: {
    role: string
    managementHours: number | null
    accompHours: number | null
    ensembleCoordHours: number | null
    travelTimeHours: number | null
  }
  teaching: {
    schedule: ScheduleSlot[]
  }
  conducting: {
    orchestraIds: string[]
  }
  ensemblesIds: string[]
}

const VALID_ROLES = ['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מורה תאוריה', 'מגמה']
const VALID_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']

const DEFAULT_FORM_VALUES: TeacherFormData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
    birthYear: null
  },
  roles: [],
  professionalInfo: {
    instrument: '',
    instruments: [],
    classification: '',
    degree: '',
    hasTeachingCertificate: false,
    teachingExperienceYears: null,
    isUnionMember: false,
    teachingSubjects: [],
    isActive: true
  },
  managementInfo: {
    role: '',
    managementHours: null,
    accompHours: null,
    ensembleCoordHours: null,
    travelTimeHours: null
  },
  teaching: {
    schedule: []
  },
  conducting: {
    orchestraIds: []
  },
  ensemblesIds: []
}

// Helper function to calculate duration in minutes from start and end time
const calculateDuration = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0

  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  // Handle case where end time is before start time (invalid)
  if (endTotalMinutes <= startTotalMinutes) {
    return 0
  }

  return endTotalMinutes - startTotalMinutes
}

// Helper function to validate time range
const validateTimeRange = (startTime: string, endTime: string): string | null => {
  if (!startTime || !endTime) return null

  const duration = calculateDuration(startTime, endTime)

  if (duration <= 0) {
    return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
  }

  if (duration < 30) {
    return 'יום לימוד חייב להיות לפחות 30 דקות'
  }

  if (duration > 480) { // 8 hours
    return 'יום לימוד לא יכול להיות יותר מ-8 שעות'
  }

  return null
}

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ isOpen, onClose, onTeacherAdded, teacherToEdit, mode = 'add' }) => {
  const { currentSchoolYear } = useSchoolYear()
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'instruments' | 'subjects' | 'management' | 'schedule' | 'conducting'>('personal')
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [ensembles, setEnsembles] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // React Hook Form — shouldUnregister: false (default) ensures tab-switch data retention
  const { control, handleSubmit, formState: { errors }, reset, setValue, watch, getValues } = useForm<TeacherFormData>({
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onTouched', // validate after first touch, then live
  })

  // Watch schedule array for reactive rendering
  const scheduleSlots = watch('teaching.schedule')

  // Load teacher data when editing
  useEffect(() => {
    if (isOpen && mode === 'edit' && teacherToEdit) {
      loadTeacherData(teacherToEdit)
    } else if (isOpen && mode === 'add') {
      reset(DEFAULT_FORM_VALUES)
      setActiveTab('personal')
      setSubmitError('')
    }
  }, [isOpen, mode, teacherToEdit])

  // Load orchestras and ensembles for conducting tab
  useEffect(() => {
    if (isOpen) {
      loadOrchestrasAndEnsembles()
    }
  }, [isOpen])

  const loadOrchestrasAndEnsembles = async () => {
    try {
      const [orchestraData, ensembleData] = await Promise.all([
        apiService.orchestras.getOrchestras(),
        apiService.orchestras.getOrchestras({ type: 'ensemble' })
      ])
      setOrchestras(orchestraData || [])
      setEnsembles(ensembleData || [])
    } catch (error) {
      console.error('Failed to load orchestras/ensembles:', error)
    }
  }

  const loadTeacherData = (teacher: any) => {
    // Load time blocks (availability windows) for editing
    const timeBlocksForForm = (teacher.teaching?.timeBlocks || []).map((block: any) => ({
      day: block.day,
      startTime: block.startTime,
      endTime: block.endTime,
      location: block.location || '',
      notes: block.notes || ''
    }))

    reset({
      personalInfo: {
        firstName: teacher.personalInfo?.firstName || '',
        lastName: teacher.personalInfo?.lastName || '',
        phone: teacher.personalInfo?.phone || '',
        email: teacher.personalInfo?.email || '',
        address: formatAddress(teacher.personalInfo?.address),
        idNumber: teacher.personalInfo?.idNumber || '',
        birthYear: teacher.personalInfo?.birthYear || null
      },
      roles: teacher.roles || [],
      professionalInfo: {
        instrument: teacher.professionalInfo?.instrument || '',
        instruments: teacher.professionalInfo?.instruments || [],
        classification: teacher.professionalInfo?.classification || '',
        degree: teacher.professionalInfo?.degree || '',
        hasTeachingCertificate: teacher.professionalInfo?.hasTeachingCertificate || false,
        teachingExperienceYears: teacher.professionalInfo?.teachingExperienceYears ?? null,
        isUnionMember: teacher.professionalInfo?.isUnionMember || false,
        teachingSubjects: teacher.professionalInfo?.teachingSubjects || [],
        isActive: teacher.professionalInfo?.isActive ?? true
      },
      managementInfo: {
        role: teacher.managementInfo?.role || '',
        managementHours: teacher.managementInfo?.managementHours ?? null,
        accompHours: teacher.managementInfo?.accompHours ?? null,
        ensembleCoordHours: teacher.managementInfo?.ensembleCoordHours ?? null,
        travelTimeHours: teacher.managementInfo?.travelTimeHours ?? null
      },
      teaching: {
        schedule: timeBlocksForForm
      },
      conducting: {
        orchestraIds: teacher.conducting?.orchestraIds || []
      },
      ensemblesIds: teacher.ensemblesIds || []
    })
  }

  const addScheduleSlot = () => {
    const current = getValues('teaching.schedule') || []
    setValue('teaching.schedule', [
      ...current,
      { day: 'ראשון', startTime: '14:00', endTime: '15:30', location: '', notes: '' }
    ])
  }

  const removeScheduleSlot = (index: number) => {
    const current = getValues('teaching.schedule') || []
    setValue('teaching.schedule', current.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: TeacherFormData) => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Convert form schedule entries to timeBlocks format
      const newTimeBlocks = data.teaching.schedule.map(slot => ({
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        totalDuration: calculateDuration(slot.startTime, slot.endTime),
        location: slot.location || null,
        notes: slot.notes || null,
        isActive: true,
        assignedLessons: [],
        recurring: {
          isRecurring: true,
          excludeDates: []
        }
      }))

      // When editing, preserve existing timeBlocks with their assigned lessons
      let finalTimeBlocks = newTimeBlocks
      if (mode === 'edit' && teacherToEdit) {
        const existingBlocksWithLessons = (teacherToEdit.teaching?.timeBlocks || []).filter(
          (block: any) => block.assignedLessons && block.assignedLessons.length > 0
        )
        console.log(`📋 Preserving ${existingBlocksWithLessons.length} existing timeBlocks with lessons`)
        finalTimeBlocks = [...newTimeBlocks, ...existingBlocksWithLessons]
      }

      // Prepare teacher data according to backend schema
      const teacherData = {
        personalInfo: data.personalInfo,
        roles: data.roles,
        professionalInfo: data.professionalInfo,
        managementInfo: data.managementInfo,
        teaching: {
          timeBlocks: finalTimeBlocks
        },
        conducting: data.conducting,
        ensemblesIds: data.ensemblesIds,
        schoolYears: currentSchoolYear ? [{
          schoolYearId: currentSchoolYear._id,
          isActive: true
        }] : [],
        credentials: {
          email: data.personalInfo.email,
          password: null, // Will be set through invitation system
          isInvitationAccepted: false
        },
        isActive: true
      }

      if (mode === 'edit' && teacherToEdit) {
        console.log('🔄 Updating teacher with preserved lessons:', teacherData)
        const updatedTeacher = await apiService.teachers.updateTeacher(teacherToEdit._id, teacherData)
        console.log('✅ Teacher updated successfully:', updatedTeacher)
        onTeacherAdded(updatedTeacher)
      } else {
        console.log('🔄 Creating teacher:', teacherData)
        const newTeacher = await apiService.teachers.addTeacher(teacherData)
        console.log('✅ Teacher created successfully:', newTeacher)
        onTeacherAdded(newTeacher)
      }

      reset(DEFAULT_FORM_VALUES)
      setActiveTab('personal')
      onClose()
    } catch (error: any) {
      console.error(`❌ Failed to ${mode === 'edit' ? 'update' : 'create'} teacher:`, error)

      // Handle validation errors with field-level details using utility function
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(
        error,
        `שגיאה ב${mode === 'edit' ? 'עדכון' : 'יצירת'} המורה. נסה שוב.`
      )

      if (isValidationError) {
        // Set server errors on RHF fields
        Object.entries(fieldErrors).forEach(([key, message]) => {
          // No-op: server errors are shown via submitError banner
          // Field-level server errors can be added here if needed
        })
      }
      setSubmitError(generalMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset(DEFAULT_FORM_VALUES)
    setActiveTab('personal')
    setSubmitError('')
    onClose()
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'personal', label: 'מידע אישי', icon: User },
    { id: 'professional', label: 'נתונים מקצועיים', icon: Briefcase },
    { id: 'instruments', label: 'כלי נגינה', icon: Music2 },
    { id: 'subjects', label: 'מקצועות הוראה', icon: BookOpen },
    { id: 'management', label: 'שעות ניהול', icon: Clock },
    { id: 'schedule', label: 'לוח זמנים', icon: Calendar },
    { id: 'conducting', label: 'ניצוח', icon: Settings }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {mode === 'edit' ? 'עריכת פרטי מורה' : 'הוספת מורה חדש'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex space-x-8 px-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="personalInfo.firstName"
                    control={control}
                    rules={{ required: 'שם פרטי נדרש' }}
                    render={({ field, fieldState }) => (
                      <FormField label="שם פרטי" htmlFor="firstName" error={fieldState.error?.message} required>
                        <Input
                          id="firstName"
                          {...field}
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? 'firstName-error' : undefined}
                          className={cn(fieldState.error && 'border-destructive focus-visible:ring-destructive')}
                          placeholder="הכנס שם פרטי"
                        />
                      </FormField>
                    )}
                  />

                  <Controller
                    name="personalInfo.lastName"
                    control={control}
                    rules={{ required: 'שם משפחה נדרש' }}
                    render={({ field, fieldState }) => (
                      <FormField label="שם משפחה" htmlFor="lastName" error={fieldState.error?.message} required>
                        <Input
                          id="lastName"
                          {...field}
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? 'lastName-error' : undefined}
                          className={cn(fieldState.error && 'border-destructive focus-visible:ring-destructive')}
                          placeholder="הכנס שם משפחה"
                        />
                      </FormField>
                    )}
                  />

                  <Controller
                    name="personalInfo.phone"
                    control={control}
                    rules={{
                      required: 'טלפון נדרש',
                      pattern: { value: /^05\d{8}$/, message: 'מספר טלפון חייב להיות בפורמט: 05XXXXXXXX' }
                    }}
                    render={({ field, fieldState }) => (
                      <FormField label="טלפון" htmlFor="phone" error={fieldState.error?.message} required>
                        <Input
                          id="phone"
                          type="tel"
                          {...field}
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? 'phone-error' : undefined}
                          className={cn(fieldState.error && 'border-destructive focus-visible:ring-destructive')}
                          placeholder="05XXXXXXXX"
                        />
                      </FormField>
                    )}
                  />

                  <Controller
                    name="personalInfo.email"
                    control={control}
                    rules={{
                      required: 'אימייל נדרש',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'כתובת אימייל לא תקינה' }
                    }}
                    render={({ field, fieldState }) => (
                      <FormField label="אימייל" htmlFor="email" error={fieldState.error?.message} required>
                        <Input
                          id="email"
                          type="email"
                          {...field}
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? 'email-error' : undefined}
                          className={cn(fieldState.error && 'border-destructive focus-visible:ring-destructive')}
                          placeholder="teacher@example.com"
                        />
                      </FormField>
                    )}
                  />

                  <Controller
                    name="personalInfo.address"
                    control={control}
                    rules={{ required: 'כתובת נדרשת' }}
                    render={({ field, fieldState }) => (
                      <FormField label="כתובת" htmlFor="address" error={fieldState.error?.message} required>
                        <Input
                          id="address"
                          {...field}
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? 'address-error' : undefined}
                          className={cn(fieldState.error && 'border-destructive focus-visible:ring-destructive')}
                          placeholder="רחוב מספר, עיר"
                        />
                      </FormField>
                    )}
                  />

                  <Controller
                    name="personalInfo.idNumber"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label="תעודת זהות" htmlFor="idNumber" error={fieldState.error?.message}>
                        <Input
                          id="idNumber"
                          {...field}
                          aria-invalid={!!fieldState.error}
                          placeholder="9 ספרות"
                          maxLength={9}
                        />
                      </FormField>
                    )}
                  />

                  <Controller
                    name="personalInfo.birthYear"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label="שנת לידה" htmlFor="birthYear" error={fieldState.error?.message}>
                        <Input
                          id="birthYear"
                          type="number"
                          min={1940}
                          max={2010}
                          aria-invalid={!!fieldState.error}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="1940-2010"
                        />
                      </FormField>
                    )}
                  />
                </div>

                {/* Roles */}
                <div>
                  <Label className="block text-sm font-medium mb-3">
                    תפקידים <span className="text-destructive ms-1" aria-hidden="true">*</span>
                  </Label>
                  <Controller
                    name="roles"
                    control={control}
                    rules={{ validate: (v) => v.length > 0 || 'יש לבחור לפחות תפקיד אחד' }}
                    render={({ field, fieldState }) => (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {VALID_ROLES.map(role => (
                            <div key={role} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                              <Checkbox
                                id={`role-${role}`}
                                checked={field.value.includes(role)}
                                onCheckedChange={(checked) => {
                                  const newRoles = checked
                                    ? [...field.value, role]
                                    : field.value.filter((r: string) => r !== role)
                                  field.onChange(newRoles)
                                }}
                              />
                              <Label htmlFor={`role-${role}`} className="text-sm font-medium cursor-pointer">{role}</Label>
                            </div>
                          ))}
                        </div>
                        {fieldState.error && (
                          <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Professional Info Tab */}
            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Classification */}
                  <Controller
                    name="professionalInfo.classification"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label="סיווג" htmlFor="classification" error={fieldState.error?.message}>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger id="classification" className={cn(fieldState.error && 'border-destructive')}>
                            <SelectValue placeholder="בחר סיווג" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormField>
                    )}
                  />

                  {/* Degree */}
                  <Controller
                    name="professionalInfo.degree"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label="תואר" htmlFor="degree" error={fieldState.error?.message}>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger id="degree" className={cn(fieldState.error && 'border-destructive')}>
                            <SelectValue placeholder="בחר תואר" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEGREES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormField>
                    )}
                  />

                  {/* Teaching Experience Years */}
                  <Controller
                    name="professionalInfo.teachingExperienceYears"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label="שנות ניסיון בהוראה" htmlFor="teachingExperienceYears" error={fieldState.error?.message}>
                        <Input
                          id="teachingExperienceYears"
                          type="number"
                          min={0}
                          max={50}
                          aria-invalid={!!fieldState.error}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="0-50"
                        />
                      </FormField>
                    )}
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <Controller
                    name="professionalInfo.hasTeachingCertificate"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors">
                        <Checkbox
                          id="hasTeachingCertificate"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="hasTeachingCertificate" className="text-sm font-medium cursor-pointer">תעודת הוראה</Label>
                      </div>
                    )}
                  />
                  <Controller
                    name="professionalInfo.isUnionMember"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors">
                        <Checkbox
                          id="isUnionMember"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="isUnionMember" className="text-sm font-medium cursor-pointer">חבר ארגון מורים</Label>
                      </div>
                    )}
                  />
                  <Controller
                    name="professionalInfo.isActive"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors">
                        <Checkbox
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">מורה פעיל</Label>
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Instruments Tab */}
            {activeTab === 'instruments' && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">בחר את כלי הנגינה שהמורה מלמד. סמן את הכלי הראשי.</p>
                <Controller
                  name="professionalInfo.instruments"
                  control={control}
                  render={({ field: instrumentsField, fieldState }) => (
                    <Controller
                      name="professionalInfo.instrument"
                      control={control}
                      render={({ field: primaryField }) => (
                        <>
                          {Object.entries(INSTRUMENT_DEPARTMENTS).map(([dept, instruments]) => (
                            <div key={dept} className="border border-border rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-foreground mb-3">{dept}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {instruments.map(instrument => {
                                  const isSelected = instrumentsField.value.includes(instrument)
                                  const isPrimary = primaryField.value === instrument
                                  return (
                                    <div key={instrument} className={`flex items-center p-2 rounded-lg transition-colors ${
                                      isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted border border-transparent'
                                    }`}>
                                      <Checkbox
                                        id={`inst-${instrument}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          const newInstruments = checked
                                            ? [...instrumentsField.value, instrument]
                                            : instrumentsField.value.filter((i: string) => i !== instrument)
                                          instrumentsField.onChange(newInstruments)
                                          // Auto-set primary if first instrument selected
                                          if (checked && instrumentsField.value.length === 0) {
                                            primaryField.onChange(instrument)
                                          }
                                          // Clear primary if it was unchecked
                                          if (!checked && primaryField.value === instrument) {
                                            primaryField.onChange(newInstruments[0] || '')
                                          }
                                        }}
                                      />
                                      <Label htmlFor={`inst-${instrument}`} className="mr-2 text-sm cursor-pointer flex-1">{instrument}</Label>
                                      {isSelected && (
                                        <button
                                          type="button"
                                          onClick={() => primaryField.onChange(instrument)}
                                          className={`text-xs px-2 py-0.5 rounded-full ${
                                            isPrimary
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                          }`}
                                        >
                                          {isPrimary ? 'ראשי' : 'סמן כראשי'}
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                          {fieldState.error && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />{fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  )}
                />
              </div>
            )}

            {/* Teaching Subjects Tab */}
            {activeTab === 'subjects' && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">בחר את מקצועות ההוראה הנוספים מעבר לכלי הנגינה.</p>
                <Controller
                  name="professionalInfo.teachingSubjects"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {TEACHING_SUBJECTS.map(subject => (
                        <div key={subject} className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                          <Checkbox
                            id={`subj-${subject}`}
                            checked={field.value.includes(subject)}
                            onCheckedChange={(checked) => {
                              const newSubjects = checked
                                ? [...field.value, subject]
                                : field.value.filter((s: string) => s !== subject)
                              field.onChange(newSubjects)
                            }}
                          />
                          <Label htmlFor={`subj-${subject}`} className="text-sm font-medium cursor-pointer">{subject}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>
            )}

            {/* Management Hours Tab */}
            {activeTab === 'management' && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">הגדר שעות ניהול ותפקיד ניהולי (ש"ש = שעות שבועיות).</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Management Role */}
                  <div className="md:col-span-2">
                    <Controller
                      name="managementInfo.role"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormField label="תפקיד ניהולי" htmlFor="managementRole" error={fieldState.error?.message}>
                          <Select value={field.value || undefined} onValueChange={field.onChange}>
                            <SelectTrigger id="managementRole">
                              <SelectValue placeholder="ללא תפקיד ניהולי" />
                            </SelectTrigger>
                            <SelectContent>
                              {MANAGEMENT_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                      )}
                    />
                  </div>

                  {/* Management Hours */}
                  <Controller
                    name="managementInfo.managementHours"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label='שעות ניהול (ש"ש)' htmlFor="managementHours" error={fieldState.error?.message}>
                        <Input
                          id="managementHours"
                          type="number"
                          min={0}
                          max={40}
                          step={0.25}
                          aria-invalid={!!fieldState.error}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="0"
                        />
                      </FormField>
                    )}
                  />

                  {/* Accompaniment Hours */}
                  <Controller
                    name="managementInfo.accompHours"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label='שעות ליווי פסנתר (ש"ש)' htmlFor="accompHours" error={fieldState.error?.message}>
                        <Input
                          id="accompHours"
                          type="number"
                          min={0}
                          max={40}
                          step={0.25}
                          aria-invalid={!!fieldState.error}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="0"
                        />
                      </FormField>
                    )}
                  />

                  {/* Ensemble Coordination Hours */}
                  <Controller
                    name="managementInfo.ensembleCoordHours"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label='שעות ריכוז הרכבים (ש"ש)' htmlFor="ensembleCoordHours" error={fieldState.error?.message}>
                        <Input
                          id="ensembleCoordHours"
                          type="number"
                          min={0}
                          max={40}
                          step={0.25}
                          aria-invalid={!!fieldState.error}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="0"
                        />
                      </FormField>
                    )}
                  />

                  {/* Travel Time Hours */}
                  <Controller
                    name="managementInfo.travelTimeHours"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField label='שעות נסיעות (ש"ש)' htmlFor="travelTimeHours" error={fieldState.error?.message}>
                        <Input
                          id="travelTimeHours"
                          type="number"
                          min={0}
                          max={40}
                          step={0.25}
                          aria-invalid={!!fieldState.error}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="0"
                        />
                      </FormField>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">בלוקי זמן להוראה</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addScheduleSlot}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף בלוק זמן
                  </Button>
                </div>

                {(!scheduleSlots || scheduleSlots.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>לא הוגדרו בלוקי זמן</p>
                    <p className="text-sm">הוסף בלוק זמן כדי לקבוע מתי המורה זמין להוראה</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduleSlots.map((slot, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                          <Controller
                            name={`teaching.schedule.${index}.day`}
                            control={control}
                            render={({ field, fieldState }) => (
                              <FormField label="יום" htmlFor={`day-${index}`} error={fieldState.error?.message}>
                                <Select value={field.value || undefined} onValueChange={field.onChange}>
                                  <SelectTrigger id={`day-${index}`}>
                                    <SelectValue placeholder="בחר יום" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {VALID_DAYS.map(day => (
                                      <SelectItem key={day} value={day}>{day}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}
                          />

                          <Controller
                            name={`teaching.schedule.${index}.startTime`}
                            control={control}
                            render={({ field, fieldState }) => (
                              <FormField label="שעת התחלה" htmlFor={`startTime-${index}`} error={fieldState.error?.message}>
                                <Input
                                  id={`startTime-${index}`}
                                  type="time"
                                  {...field}
                                  aria-invalid={!!fieldState.error}
                                  className={cn(fieldState.error && 'border-destructive')}
                                />
                              </FormField>
                            )}
                          />

                          <Controller
                            name={`teaching.schedule.${index}.endTime`}
                            control={control}
                            render={({ field, fieldState }) => {
                              const startTime = scheduleSlots[index]?.startTime
                              const endTime = field.value
                              const duration = startTime && endTime ? calculateDuration(startTime, endTime) : 0
                              const timeError = startTime && endTime ? validateTimeRange(startTime, endTime) : null
                              return (
                                <FormField label="שעת סיום" htmlFor={`endTime-${index}`} error={fieldState.error?.message}>
                                  <Input
                                    id={`endTime-${index}`}
                                    type="time"
                                    {...field}
                                    aria-invalid={!!fieldState.error}
                                    className={cn((fieldState.error || timeError) && 'border-destructive')}
                                  />
                                  {startTime && endTime && (
                                    <div className="mt-1 text-xs">
                                      {timeError ? (
                                        <span className="text-destructive">{timeError}</span>
                                      ) : duration > 0 ? (
                                        <span className="text-muted-foreground">משך: {duration} דקות</span>
                                      ) : null}
                                    </div>
                                  )}
                                </FormField>
                              )
                            }}
                          />

                          <Controller
                            name={`teaching.schedule.${index}.location`}
                            control={control}
                            render={({ field, fieldState }) => (
                              <FormField label="מיקום" htmlFor={`location-${index}`} error={fieldState.error?.message}>
                                <Select value={field.value || undefined} onValueChange={field.onChange}>
                                  <SelectTrigger id={`location-${index}`} className={cn(fieldState.error && 'border-destructive')}>
                                    <SelectValue placeholder="בחר מיקום..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {VALID_LOCATIONS.map(location => (
                                      <SelectItem key={location} value={location}>{location}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}
                          />
                        </div>

                        <div className="mb-3">
                          <Controller
                            name={`teaching.schedule.${index}.notes`}
                            control={control}
                            render={({ field, fieldState }) => (
                              <FormField label="הערות" htmlFor={`notes-${index}`} error={fieldState.error?.message}>
                                <Input
                                  id={`notes-${index}`}
                                  {...field}
                                  placeholder="הערות נוספות"
                                />
                              </FormField>
                            )}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeScheduleSlot(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            הסר
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conducting Tab */}
            {activeTab === 'conducting' && (
              <div className="space-y-8">
                {/* Orchestra Section */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Settings className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <Label className="block text-lg font-semibold text-foreground">
                        תזמורות לניצוח
                      </Label>
                      <p className="text-sm text-muted-foreground">בחר את התזמורות שהמורה ינצח</p>
                    </div>
                  </div>
                  <Controller
                    name="conducting.orchestraIds"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                        {orchestras.map(orchestra => (
                          <div key={orchestra._id} className="flex items-center p-4 bg-card border-2 border-border rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                            <Checkbox
                              id={`orch-${orchestra._id}`}
                              checked={field.value.includes(orchestra._id)}
                              onCheckedChange={(checked) => {
                                const newIds = checked
                                  ? [...field.value, orchestra._id]
                                  : field.value.filter((id: string) => id !== orchestra._id)
                                field.onChange(newIds)
                              }}
                              className="w-5 h-5"
                            />
                            <div className="mr-4 flex-1">
                              <div className="text-base font-semibold text-foreground group-hover:text-purple-700 transition-colors">{orchestra.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">{orchestra.description || 'תזמורת ללא תיאור'}</div>
                              {orchestra.memberCount && (
                                <div className="text-xs text-purple-600 mt-1">👥 {orchestra.memberCount} חברים</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Ensemble Section */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <Label className="block text-lg font-semibold text-foreground">
                        אנסמבלים להדרכה
                      </Label>
                      <p className="text-sm text-muted-foreground">בחר את האנסמבלים שהמורה ידריך</p>
                    </div>
                  </div>
                  <Controller
                    name="ensemblesIds"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                        {ensembles.map(ensemble => (
                          <div key={ensemble._id} className="flex items-center p-4 bg-card border-2 border-border rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                            <Checkbox
                              id={`ens-${ensemble._id}`}
                              checked={field.value.includes(ensemble._id)}
                              onCheckedChange={(checked) => {
                                const newIds = checked
                                  ? [...field.value, ensemble._id]
                                  : field.value.filter((id: string) => id !== ensemble._id)
                                field.onChange(newIds)
                              }}
                              className="w-5 h-5"
                            />
                            <div className="mr-4 flex-1">
                              <div className="text-base font-semibold text-foreground group-hover:text-green-700 transition-colors">{ensemble.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">{ensemble.description || 'אנסמבל ללא תיאור'}</div>
                              {ensemble.memberCount && (
                                <div className="text-xs text-green-600 mt-1">🎵 {ensemble.memberCount} חברים</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border">
            {submitError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <span className="text-sm text-destructive">{submitError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin ml-2" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                {isSubmitting ? 'שומר...' : (mode === 'edit' ? 'עדכן מורה' : 'שמור מורה')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTeacherModal
