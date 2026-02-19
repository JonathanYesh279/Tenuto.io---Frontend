import { useState, useEffect } from 'react'

import { FloppyDiskIcon, MusicNotesIcon, UserIcon, UsersIcon, XIcon } from '@phosphor-icons/react'
import {
  VALID_ORCHESTRA_TYPES,
  VALID_LOCATIONS,
  validateOrchestraForm,
  type Orchestra,
  type OrchestraFormData,
  type OrchestraType,
  type LocationType
} from '../utils/orchestraUtils'
import { handleServerValidationError } from '../utils/validationUtils'
import { getDisplayName } from '@/utils/nameUtils'
import { ORCHESTRA_SUBTYPES, PERFORMANCE_LEVELS } from '../constants/enums'
import { cn } from '@/lib/utils'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OrchestraFormProps {
  orchestra?: Orchestra | null
  teachers: any[]
  onSubmit: (data: OrchestraFormData) => Promise<void>
  onCancel: () => void
}

export default function OrchestraForm({ orchestra, teachers, onSubmit, onCancel }: OrchestraFormProps) {
  const [formData, setFormData] = useState<OrchestraFormData & {
    subType: string | null
    performanceLevel: string | null
    ministryData: { coordinationHours: number | null }
  }>({
    name: '',
    type: 'תזמורת',
    subType: null,
    performanceLevel: null,
    conductorId: '',
    memberIds: [],
    location: 'חדר 1',
    ministryData: { coordinationHours: null },
    isActive: true
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-populate form if editing existing orchestra
  useEffect(() => {
    if (orchestra) {
      setFormData({
        name: orchestra.name || '',
        type: orchestra.type || 'תזמורת',
        subType: (orchestra as any).subType || null,
        performanceLevel: (orchestra as any).performanceLevel || null,
        conductorId: orchestra.conductorId || '',
        memberIds: orchestra.memberIds || [],
        location: orchestra.location || 'חדר 1',
        ministryData: {
          coordinationHours: (orchestra as any).ministryData?.coordinationHours ?? null
        },
        isActive: orchestra.isActive !== undefined ? orchestra.isActive : true
      })
    }
  }, [orchestra])

  const handleInputChange = (field: keyof OrchestraFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const validation = validateOrchestraForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    try {
      // Strip memberIds from submission — members are managed through
      // dedicated addMember/removeMember endpoints, not through the form
      const { memberIds, ...submitData } = formData
      await onSubmit(submitData as any)
    } catch (error: any) {
      console.error('Error submitting orchestra form:', error)
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error, 'שגיאה בשמירת התזמורת')
      if (isValidationError) {
        setErrors({ ...fieldErrors, general: generalMessage })
      } else {
        setErrors({ general: generalMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter conductors (teachers with conductor role)
  const conductors = teachers.filter(teacher =>
    teacher.roles?.includes('מנצח') ||
    teacher.professionalInfo?.instrument === 'מנהיגות מוזיקלית' ||
    teacher.conducting?.orchestraIds?.length > 0
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Form Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {orchestra ? 'עריכת תזמורת' : 'תזמורת חדשה'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-muted rounded transition-colors"
          >
            <XIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {errors.general && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-4">
              <p className="text-destructive text-sm">{errors.general}</p>
            </div>
          )}

          {/* Ensemble Details */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-orchestras-fg rounded-full" />
              <h3 className="text-sm font-semibold text-foreground">פרטי הרכב</h3>
            </div>
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orchestra Name */}
            <div className="md:col-span-2">
              <FormField label="שם התזמורת" htmlFor="name" error={errors.name} required>
                <div className="relative">
                  <MusicNotesIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={cn("ps-9", errors.name && "border-destructive focus-visible:ring-destructive")}
                    placeholder="הזן שם לתזמורת"
                  />
                </div>
              </FormField>
            </div>

            {/* Orchestra Type */}
            <FormField label="סוג הרכב" htmlFor="type" error={errors.type} required>
              <Select value={formData.type} onValueChange={(val) => handleInputChange('type', val as OrchestraType)}>
                <SelectTrigger id="type" className={cn(errors.type && "border-destructive focus:ring-destructive")}>
                  <SelectValue placeholder="בחר סוג" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_ORCHESTRA_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Location */}
            <FormField label="מיקום חזרות" htmlFor="location" error={errors.location} required>
              <Select value={formData.location} onValueChange={(val) => handleInputChange('location', val as LocationType)}>
                <SelectTrigger id="location" className={cn(errors.location && "border-destructive focus:ring-destructive")}>
                  <SelectValue placeholder="בחר מיקום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>אולמות</SelectLabel>
                    {VALID_LOCATIONS.filter(loc => loc.includes('אולם')).map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>סטודיואים</SelectLabel>
                    {VALID_LOCATIONS.filter(loc => loc.includes('סטודיו')).map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>חדרי חזרות</SelectLabel>
                    {VALID_LOCATIONS.filter(loc => loc.includes('חדר חזרות')).map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>חדרי לימוד</SelectLabel>
                    {VALID_LOCATIONS.filter(loc => loc.startsWith('חדר') && !loc.includes('חזרות') && !loc.includes('תאוריה')).map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>חדרי תיאוריה</SelectLabel>
                    {VALID_LOCATIONS.filter(loc => loc.includes('תאוריה')).map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>אחר</SelectLabel>
                    {VALID_LOCATIONS.filter(loc => !loc.includes('אולם') && !loc.includes('סטודיו') && !loc.includes('חדר')).map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          </div>

          {/* Ministry & Classification */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-orchestras-fg rounded-full" />
              <h3 className="text-sm font-semibold text-foreground">פרטי משרד</h3>
            </div>
          {/* Sub-Type, Performance Level, Coordination Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sub-Type */}
            <FormField
              label="תת-סוג הרכב"
              htmlFor="subType"
              error={errors.subType}
              hint="נדרש לדוחות משרד החינוך"
              required
            >
              <Select
                value={formData.subType ?? undefined}
                onValueChange={(val) => handleInputChange('subType' as any, val || null)}
              >
                <SelectTrigger id="subType" className={cn(errors.subType && "border-destructive focus:ring-destructive")}>
                  <SelectValue placeholder="בחר תת-סוג" />
                </SelectTrigger>
                <SelectContent>
                  {ORCHESTRA_SUBTYPES.map(st => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Performance Level */}
            <FormField label="רמת ביצוע" htmlFor="performanceLevel">
              <Select
                value={formData.performanceLevel ?? undefined}
                onValueChange={(val) => handleInputChange('performanceLevel' as any, val || null)}
              >
                <SelectTrigger id="performanceLevel">
                  <SelectValue placeholder="בחר רמה" />
                </SelectTrigger>
                <SelectContent>
                  {PERFORMANCE_LEVELS.map(pl => (
                    <SelectItem key={pl} value={pl}>{pl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Coordination Hours */}
            <FormField label='שעות ריכוז (ש"ש)' htmlFor="coordinationHours">
              <Input
                id="coordinationHours"
                type="number"
                min="0"
                max="50"
                step="0.25"
                value={formData.ministryData.coordinationHours ?? ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ministryData: {
                    ...prev.ministryData,
                    coordinationHours: e.target.value ? parseFloat(e.target.value) : null
                  }
                }))}
                placeholder="0-50"
              />
            </FormField>
          </div>

          {/* Conductor Assignment */}
          <FormField label="מנצח" htmlFor="conductorId" error={errors.conductorId} required>
            <div className="relative">
              <UserIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <Select
                value={formData.conductorId || undefined}
                onValueChange={(val) => handleInputChange('conductorId', val)}
              >
                <SelectTrigger
                  id="conductorId"
                  className={cn("ps-9", errors.conductorId && "border-destructive focus:ring-destructive")}
                >
                  <SelectValue placeholder="בחר מנצח" />
                </SelectTrigger>
                <SelectContent>
                  {conductors.map(conductor => (
                    <SelectItem key={conductor._id} value={conductor._id}>
                      {getDisplayName(conductor.personalInfo)}
                      {conductor.professionalInfo?.instrument ? ` - ${conductor.professionalInfo.instrument}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {conductors.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">
                לא נמצאו מורים עם תפקיד מנצח. ניתן להוסיף מורים חדשים בעמוד המורים.
              </p>
            )}
          </FormField>
          </div>

          {/* Members & Status */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-orchestras-fg rounded-full" />
              <h3 className="text-sm font-semibold text-foreground">חברים וסטטוס</h3>
            </div>
          {/* Members Section - Read Only Display for Now */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <UsersIcon className="w-4 h-4 inline ms-1" />
              חברי התזמורת
            </label>

            {formData.memberIds.length > 0 ? (
              <div className="bg-muted border border-border rounded p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {formData.memberIds.length} חברים בתזמורת
                </p>
                <p className="text-xs text-muted-foreground">
                  ניהול חברים יהיה זמין בעמוד הפרטים של התזמורת
                </p>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-foreground text-sm">
                  לאחר יצירת התזמורת, תוכל להוסיף חברים בעמוד הפרטים
                </p>
              </div>
            )}
          </div>

          {/* Orchestra Status */}
          <div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
              />
              <Label htmlFor="isActive">תזמורת פעילה</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              תזמורות לא פעילות לא יוצגו ברשימות הראשיות
            </p>
          </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-borderforeground ms-2"></div>
              ) : (
                <FloppyDiskIcon className="w-4 h-4 ms-2" />
              )}
              {orchestra ? 'עדכן תזמורת' : 'צור תזמורת'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
