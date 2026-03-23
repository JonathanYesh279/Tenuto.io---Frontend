import { useState, useEffect } from 'react'

import ConflictDetector from './ConflictDetector'
import { MinusIcon, PlusIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { VALID_LOCATIONS } from '../constants/locations'
import {
  validateRehearsalForm,
  validateBulkRehearsalForm,
  generateRehearsalDates,
  getDayName,
  DAYS_OF_WEEK_ARRAY,
  VALID_REHEARSAL_TYPES,
  type RehearsalFormData,
  type BulkRehearsalData,
  type Rehearsal
} from '../utils/rehearsalUtils'
import { handleServerValidationError } from '../utils/validationUtils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface RehearsalFormProps {
  orchestras: Array<{
    _id: string
    name: string
    type: string
    location: string
    conductor?: {
      _id: string
      personalInfo: { fullName: string }
    }
    members?: Array<{ _id: string }>
  }>
  existingRehearsals?: Rehearsal[]
  onSubmit: (data: RehearsalFormData | BulkRehearsalData, isBulk: boolean) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<RehearsalFormData>
}

export default function RehearsalForm({
  orchestras,
  existingRehearsals = [],
  onSubmit,
  open,
  onOpenChange,
  initialData
}: RehearsalFormProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Single rehearsal form state
  const [singleForm, setSingleForm] = useState<Partial<RehearsalFormData>>({
    groupId: '',
    type: 'תזמורת',
    date: '',
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    notes: '',
    isActive: true,
    ...initialData
  })

  // Bulk rehearsal form state
  const [bulkForm, setBulkForm] = useState<Partial<BulkRehearsalData>>({
    orchestraId: '',
    startDate: '',
    endDate: '',
    dayOfWeek: 0, // Sunday
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    notes: '',
    excludeDates: [],
    schoolYearId: 'current'
  })

  const [excludeDateInput, setExcludeDateInput] = useState('')
  const [previewDates, setPreviewDates] = useState<string[]>([])
  const [hasConflicts, setHasConflicts] = useState(false)
  const [hasCriticalConflicts, setHasCriticalConflicts] = useState(false)

  // Auto-fill location when orchestra is selected
  useEffect(() => {
    if (mode === 'single' && singleForm.groupId) {
      const selectedOrchestra = orchestras.find(o => o._id === singleForm.groupId)
      if (selectedOrchestra && !singleForm.location) {
        setSingleForm(prev => ({
          ...prev,
          location: selectedOrchestra.location,
          type: selectedOrchestra.type as any
        }))
      }
    }
  }, [singleForm.groupId, orchestras, mode])

  useEffect(() => {
    if (mode === 'bulk' && bulkForm.orchestraId) {
      const selectedOrchestra = orchestras.find(o => o._id === bulkForm.orchestraId)
      if (selectedOrchestra && !bulkForm.location) {
        setBulkForm(prev => ({
          ...prev,
          location: selectedOrchestra.location
        }))
      }
    }
  }, [bulkForm.orchestraId, orchestras, mode])

  // Generate preview dates for bulk creation
  useEffect(() => {
    if (mode === 'bulk' && bulkForm.startDate && bulkForm.endDate && bulkForm.dayOfWeek !== undefined) {
      try {
        const dates = generateRehearsalDates(bulkForm as BulkRehearsalData)
        setPreviewDates(dates)
      } catch (error) {
        setPreviewDates([])
      }
    } else {
      setPreviewDates([])
    }
  }, [mode, bulkForm.startDate, bulkForm.endDate, bulkForm.dayOfWeek, bulkForm.excludeDates])

  const handleSingleFormChange = (field: keyof RehearsalFormData, value: any) => {
    setSingleForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBulkFormChange = (field: keyof BulkRehearsalData, value: any) => {
    setBulkForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddExcludeDate = () => {
    if (!excludeDateInput) return

    setBulkForm(prev => ({
      ...prev,
      excludeDates: [...(prev.excludeDates || []), excludeDateInput]
    }))
    setExcludeDateInput('')
  }

  const handleRemoveExcludeDate = (dateToRemove: string) => {
    setBulkForm(prev => ({
      ...prev,
      excludeDates: (prev.excludeDates || []).filter(date => date !== dateToRemove)
    }))
  }

  const handleConflictsChanged = (conflicts: any[]) => {
    setHasConflicts(conflicts.length > 0)
    setHasCriticalConflicts(conflicts.some(c => c.severity === 'critical'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Check for critical conflicts before submitting
      if (hasCriticalConflicts) {
        setErrors({ submit: 'יש לפתור התנגשויות קריטיות לפני יצירת החזרה' })
        return
      }

      if (mode === 'single') {
        const validation = validateRehearsalForm(singleForm)
        if (!validation.isValid) {
          setErrors(validation.errors)
          return
        }

        // Calculate dayOfWeek from date
        const date = new Date(singleForm.date!)
        const dayOfWeek = date.getDay()

        const rehearsalData: RehearsalFormData = {
          ...singleForm as RehearsalFormData,
          dayOfWeek
        }

        await onSubmit(rehearsalData, false)
      } else {
        const validation = validateBulkRehearsalForm(bulkForm)
        if (!validation.isValid) {
          setErrors(validation.errors)
          return
        }

        await onSubmit(bulkForm as BulkRehearsalData, true)
      }
    } catch (error: any) {
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error, 'שגיאה בשמירת החזרה')
      if (isValidationError) {
        setErrors({ ...fieldErrors, submit: generalMessage })
      } else {
        setErrors({ submit: generalMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  // Location grouping helper (matches OrchestraForm pattern)
  const locationGroups = [
    { label: 'אולמות', filter: (loc: string) => loc.includes('אולם') },
    { label: 'סטודיואים', filter: (loc: string) => loc.includes('סטודיו') },
    { label: 'חדרי חזרות', filter: (loc: string) => loc.includes('חדר חזרות') },
    { label: 'חדרי לימוד', filter: (loc: string) => loc.startsWith('חדר') && !loc.includes('חזרות') && !loc.includes('תאוריה') },
    { label: 'חדרי תיאוריה', filter: (loc: string) => loc.includes('תאוריה') },
    { label: 'אחר', filter: (loc: string) => !loc.includes('אולם') && !loc.includes('סטודיו') && !loc.includes('חדר') },
  ]

  const renderLocationSelect = (
    value: string | undefined,
    onChange: (val: string) => void,
    id: string,
    error?: string
  ) => (
    <FormField label="מיקום" htmlFor={id} error={error} required>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className={cn(error && "border-destructive focus:ring-destructive")}>
          <SelectValue placeholder="בחר מיקום" />
        </SelectTrigger>
        <SelectContent>
          {locationGroups.map(group => {
            const items = VALID_LOCATIONS.filter(group.filter)
            if (items.length === 0) return null
            return (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {items.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectGroup>
            )
          })}
        </SelectContent>
      </Select>
    </FormField>
  )

  // Shared single-mode form fields (used in both Tabs and edit mode)
  const renderSingleFormFields = () => (
    <>
      {/* Orchestra Selection */}
      <FormField label="תזמורת" htmlFor="groupId" error={errors.groupId} required>
        <Select
          value={singleForm.groupId || undefined}
          onValueChange={(val) => handleSingleFormChange('groupId', val)}
          disabled={!!initialData}
        >
          <SelectTrigger id="groupId" className={cn(errors.groupId && "border-destructive focus:ring-destructive")}>
            <SelectValue placeholder="בחר תזמורת" />
          </SelectTrigger>
          <SelectContent>
            {orchestras.map(orchestra => (
              <SelectItem key={orchestra._id} value={orchestra._id}>
                {orchestra.name} ({orchestra.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* Date */}
      <FormField label="תאריך" htmlFor="date" error={errors.date} required>
        <Input
          id="date"
          type="date"
          value={singleForm.date || ''}
          onChange={(e) => handleSingleFormChange('date', e.target.value)}
          className={cn(errors.date && "border-destructive focus-visible:ring-destructive")}
        />
      </FormField>

      {/* Time */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="שעת התחלה" htmlFor="startTime" error={errors.startTime} required>
          <Input
            id="startTime"
            type="time"
            value={singleForm.startTime || ''}
            onChange={(e) => handleSingleFormChange('startTime', e.target.value)}
            className={cn(errors.startTime && "border-destructive focus-visible:ring-destructive")}
          />
        </FormField>

        <FormField label="שעת סיום" htmlFor="endTime" error={errors.endTime} required>
          <Input
            id="endTime"
            type="time"
            value={singleForm.endTime || ''}
            onChange={(e) => handleSingleFormChange('endTime', e.target.value)}
            className={cn(errors.endTime && "border-destructive focus-visible:ring-destructive")}
          />
        </FormField>
      </div>

      {/* Location */}
      {renderLocationSelect(
        singleForm.location,
        (val) => handleSingleFormChange('location', val),
        'singleLocation',
        errors.location
      )}

      {/* Notes */}
      <FormField label="הערות" htmlFor="singleNotes">
        <Textarea
          id="singleNotes"
          value={singleForm.notes || ''}
          onChange={(e) => handleSingleFormChange('notes', e.target.value)}
          rows={3}
          placeholder="הערות נוספות עבור החזרה..."
        />
      </FormField>
    </>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'ערוך חזרה' : 'חזרה חדשה'}</DialogTitle>
          {!initialData && (
            <DialogDescription>צור חזרה יחידה או סדרת חזרות חוזרות</DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!initialData ? (
            <Tabs value={mode} onValueChange={(val) => setMode(val as 'single' | 'bulk')}>
              <TabsList className="w-full">
                <TabsTrigger value="single" className="flex-1">חזרה יחידה</TabsTrigger>
                <TabsTrigger value="bulk" className="flex-1">חזרות חוזרות</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="space-y-4 mt-4">
                {renderSingleFormFields()}
              </TabsContent>
              <TabsContent value="bulk" className="space-y-4 mt-4">
                {/* Orchestra Selection */}
                <FormField label="תזמורת" htmlFor="orchestraId" error={errors.orchestraId} required>
                  <Select
                    value={bulkForm.orchestraId || undefined}
                    onValueChange={(val) => handleBulkFormChange('orchestraId', val)}
                  >
                    <SelectTrigger id="orchestraId" className={cn(errors.orchestraId && "border-destructive focus:ring-destructive")}>
                      <SelectValue placeholder="בחר תזמורת" />
                    </SelectTrigger>
                    <SelectContent>
                      {orchestras.map(orchestra => (
                        <SelectItem key={orchestra._id} value={orchestra._id}>
                          {orchestra.name} ({orchestra.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="תאריך התחלה" htmlFor="startDate" error={errors.startDate} required>
                    <Input
                      id="startDate"
                      type="date"
                      value={bulkForm.startDate || ''}
                      onChange={(e) => handleBulkFormChange('startDate', e.target.value)}
                      className={cn(errors.startDate && "border-destructive focus-visible:ring-destructive")}
                    />
                  </FormField>

                  <FormField label="תאריך סיום" htmlFor="endDate" error={errors.endDate} required>
                    <Input
                      id="endDate"
                      type="date"
                      value={bulkForm.endDate || ''}
                      onChange={(e) => handleBulkFormChange('endDate', e.target.value)}
                      className={cn(errors.endDate && "border-destructive focus-visible:ring-destructive")}
                    />
                  </FormField>
                </div>

                {/* Day of Week */}
                <FormField label="יום בשבוע" htmlFor="dayOfWeek" error={errors.dayOfWeek} required>
                  <Select
                    value={String(bulkForm.dayOfWeek ?? 0)}
                    onValueChange={(val) => handleBulkFormChange('dayOfWeek', parseInt(val))}
                  >
                    <SelectTrigger id="dayOfWeek" className={cn(errors.dayOfWeek && "border-destructive focus:ring-destructive")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK_ARRAY.map(day => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="שעת התחלה" htmlFor="bulkStartTime" error={errors.startTime} required>
                    <Input
                      id="bulkStartTime"
                      type="time"
                      value={bulkForm.startTime || ''}
                      onChange={(e) => handleBulkFormChange('startTime', e.target.value)}
                      className={cn(errors.startTime && "border-destructive focus-visible:ring-destructive")}
                    />
                  </FormField>

                  <FormField label="שעת סיום" htmlFor="bulkEndTime" error={errors.endTime} required>
                    <Input
                      id="bulkEndTime"
                      type="time"
                      value={bulkForm.endTime || ''}
                      onChange={(e) => handleBulkFormChange('endTime', e.target.value)}
                      className={cn(errors.endTime && "border-destructive focus-visible:ring-destructive")}
                    />
                  </FormField>
                </div>

                {/* Location */}
                {renderLocationSelect(
                  bulkForm.location,
                  (val) => handleBulkFormChange('location', val),
                  'bulkLocation',
                  errors.location
                )}

                {/* Exclude Dates */}
                <FormField label="תאריכים לדילוג" htmlFor="excludeDate">
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="excludeDate"
                      type="date"
                      value={excludeDateInput}
                      onChange={(e) => setExcludeDateInput(e.target.value)}
                      className="flex-1"
                      placeholder="בחר תאריך לדילוג"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={handleAddExcludeDate}
                      disabled={!excludeDateInput}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  {bulkForm.excludeDates && bulkForm.excludeDates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bulkForm.excludeDates.map(date => (
                        <Badge key={date} variant="secondary" className="gap-1">
                          {new Date(date).toLocaleDateString('he-IL')}
                          <button
                            type="button"
                            onClick={() => handleRemoveExcludeDate(date)}
                            className="hover:text-destructive ms-1"
                          >
                            <MinusIcon className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </FormField>

                {/* Notes */}
                <FormField label="הערות" htmlFor="bulkNotes">
                  <Textarea
                    id="bulkNotes"
                    value={bulkForm.notes || ''}
                    onChange={(e) => handleBulkFormChange('notes', e.target.value)}
                    rows={3}
                    placeholder="הערות נוספות עבור כל החזרות..."
                  />
                </FormField>

                {/* Preview Dates */}
                {previewDates.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <WarningCircleIcon className="w-4 h-4 text-primary ml-1" />
                      <span className="text-sm font-medium text-foreground">
                        תיווצרו {previewDates.length} חזרות
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                      {previewDates.slice(0, 10).map(date => (
                        <div key={date}>
                          {new Date(date + 'T12:00:00').toLocaleDateString('he-IL')} - {getDayName(new Date(date + 'T12:00:00').getDay())}
                        </div>
                      ))}
                      {previewDates.length > 10 && (
                        <div className="text-primary">...ועוד {previewDates.length - 10}</div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              {renderSingleFormFields()}
            </div>
          )}

          {/* Conflict Detection */}
          <ConflictDetector
            newRehearsal={mode === 'single' ? singleForm as RehearsalFormData : null}
            bulkData={mode === 'bulk' ? bulkForm as BulkRehearsalData : null}
            existingRehearsals={existingRehearsals}
            orchestras={orchestras}
            onConflictsChanged={handleConflictsChanged}
          />

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
              <p className="text-destructive text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading || hasCriticalConflicts}>
              {loading ? 'שומר...' : (initialData ? 'עדכן חזרה' :
                mode === 'single' ? 'צור חזרה' : `צור ${previewDates.length} חזרות`)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
