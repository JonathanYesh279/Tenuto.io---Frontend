/**
 * Optimized Magen Bagrut Form Component
 * 
 * Performance-optimized version with:
 * - Debounced input calculations
 * - Memoized components
 * - Progressive saving
 * - Real-time validation
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Users, 
  Link, 
  Award, 
  CheckCircle,
  Save,
  AlertTriangle,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react'
import { DetailedGrading, MagenBagrut } from '@/types/bagrut.types'

interface OptimizedMagenBagrutFormProps {
  magenBagrut?: MagenBagrut
  studentId: string
  onUpdate?: (magenBagrut: MagenBagrut & { detailedGrading?: DetailedGrading }) => void
  readonly?: boolean
  enableAutoSave?: boolean
  enableValidation?: boolean
}

interface ValidationError {
  field: string
  message: string
  type: 'error' | 'warning'
}

interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  pendingChanges: boolean
}

// Debounced input hook
const useDebounced = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Memoized grade calculation hook
const useGradeCalculation = (detailedGrading: DetailedGrading) => {
  return useMemo(() => {
    const total = (detailedGrading.playingSkills.points || 0) + 
                  (detailedGrading.musicalUnderstanding.points || 0) + 
                  (detailedGrading.textKnowledge.points || 0) + 
                  (detailedGrading.playingByHeart.points || 0)
    
    const getGradeLevel = (score: number): string => {
      if (score >= 95) return 'מצוין (95-100)'
      if (score >= 85) return 'טוב מאוד (85-94)'
      if (score >= 75) return 'טוב (75-84)'
      if (score >= 65) return 'כמעט טוב (65-74)'
      if (score >= 55) return 'מספק (55-64)'
      if (score >= 45) return 'כמעט מספק (45-54)'
      if (score >= 35) return 'לא מספק (35-44)'
      return 'גרוע (0-34)'
    }

    return {
      total,
      gradeLevel: getGradeLevel(total),
      percentage: (total / 100) * 100,
      isValid: total <= 100,
      isPassing: total >= 55
    }
  }, [detailedGrading])
}

// Real-time validation hook
const useValidation = (formData: any): ValidationError[] => {
  return useMemo(() => {
    const errors: ValidationError[] = []

    if (!formData.date) {
      errors.push({
        field: 'date',
        message: 'יש להזין תאריך מגן הבגרות',
        type: 'error'
      })
    }

    if (!formData.reviewedBy?.trim()) {
      errors.push({
        field: 'reviewedBy',
        message: 'יש להזין את שמות הבוחנים',
        type: 'error'
      })
    }

    const grading = formData.detailedGrading
    if (grading) {
      // Check individual scores don't exceed maximum
      if ((grading.playingSkills.points || 0) > 40) {
        errors.push({
          field: 'playingSkills',
          message: 'ניקוד מיומנות נגינה חורג מהמקסימום (40)',
          type: 'error'
        })
      }

      if ((grading.musicalUnderstanding.points || 0) > 30) {
        errors.push({
          field: 'musicalUnderstanding',
          message: 'ניקוד הבנה מוסיקלית חורג מהמקסימום (30)',
          type: 'error'
        })
      }

      if ((grading.textKnowledge.points || 0) > 20) {
        errors.push({
          field: 'textKnowledge',
          message: 'ניקוד ידיעת טקסט חורג מהמקסימום (20)',
          type: 'error'
        })
      }

      if ((grading.playingByHeart.points || 0) > 10) {
        errors.push({
          field: 'playingByHeart',
          message: 'ניקוד נגינה בעל פה חורג מהמקסימום (10)',
          type: 'error'
        })
      }

      // Check total doesn't exceed 100
      const total = (grading.playingSkills.points || 0) + 
                   (grading.musicalUnderstanding.points || 0) + 
                   (grading.textKnowledge.points || 0) + 
                   (grading.playingByHeart.points || 0)

      if (total > 100) {
        errors.push({
          field: 'total',
          message: 'סך הנקודות חורג מ-100',
          type: 'error'
        })
      }

      if (total < 55 && total > 0) {
        errors.push({
          field: 'total',
          message: 'ציון נמוך מהמינימום הנדרש (55)',
          type: 'warning'
        })
      }

      // Check for missing scores
      const missingScores = []
      if (grading.playingSkills.points === undefined) missingScores.push('מיומנות נגינה')
      if (grading.musicalUnderstanding.points === undefined) missingScores.push('הבנה מוסיקלית')
      if (grading.textKnowledge.points === undefined) missingScores.push('ידיעת טקסט')
      if (grading.playingByHeart.points === undefined) missingScores.push('נגינה בעל פה')

      if (missingScores.length > 0) {
        errors.push({
          field: 'missing',
          message: `חסרים ציונים עבור: ${missingScores.join(', ')}`,
          type: 'warning'
        })
      }
    }

    return errors
  }, [formData])
}

// Auto-save hook
const useAutoSave = (
  data: any, 
  saveCallback: (data: any) => Promise<void>,
  enabled: boolean = true,
  delay: number = 2000
) => {
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    status: 'idle',
    pendingChanges: false
  })

  const debouncedData = useDebounced(data, delay)
  const lastSavedDataRef = useRef(data)

  useEffect(() => {
    if (!enabled) return

    const hasChanges = JSON.stringify(debouncedData) !== JSON.stringify(lastSavedDataRef.current)
    
    if (hasChanges && autoSaveState.status !== 'saving') {
      setAutoSaveState(prev => ({ ...prev, pendingChanges: true }))
      
      const performSave = async () => {
        setAutoSaveState(prev => ({ ...prev, status: 'saving' }))
        
        try {
          await saveCallback(debouncedData)
          lastSavedDataRef.current = debouncedData
          setAutoSaveState({
            status: 'saved',
            lastSaved: new Date(),
            pendingChanges: false
          })
        } catch (error) {
          console.error('Auto-save failed:', error)
          setAutoSaveState(prev => ({ ...prev, status: 'error', pendingChanges: true }))
        }
      }

      performSave()
    }
  }, [debouncedData, enabled, delay, saveCallback, autoSaveState.status])

  return autoSaveState
}

// Memoized input component for performance
const DebouncedScoreInput = React.memo<{
  value: number | undefined
  onChange: (value: number | undefined) => void
  max: number
  label: string
  disabled?: boolean
  error?: boolean
}>(({ value, onChange, max, label, disabled, error }) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '')
  
  const debouncedChange = useCallback(
    useDebounced((newValue: string) => {
      const numValue = newValue === '' ? undefined : parseInt(newValue)
      onChange(numValue)
    }, 300),
    [onChange]
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedChange(newValue)
  }, [debouncedChange])

  useEffect(() => {
    setLocalValue(value?.toString() || '')
  }, [value])

  return (
    <Input
      type="number"
      min="0"
      max={max}
      value={localValue}
      onChange={handleChange}
      disabled={disabled}
      className={`w-20 mx-auto text-center font-bold text-lg border-2 
        ${error ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}
        transition-colors duration-200`}
      placeholder="0"
      aria-label={label}
    />
  )
})

DebouncedScoreInput.displayName = 'DebouncedScoreInput'

const OptimizedMagenBagrutForm: React.FC<OptimizedMagenBagrutFormProps> = ({
  magenBagrut = {},
  studentId,
  onUpdate,
  readonly = false,
  enableAutoSave = true,
  enableValidation = true
}) => {
  const [formData, setFormData] = useState<MagenBagrut & { detailedGrading?: DetailedGrading }>(() => ({
    date: magenBagrut.date,
    review: magenBagrut.review || '',
    reviewedBy: magenBagrut.reviewedBy || '',
    recordingLinks: magenBagrut.recordingLinks || [''],
    completed: magenBagrut.completed || false,
    status: magenBagrut.status || 'pending',
    grade: magenBagrut.grade,
    gradeLevel: magenBagrut.gradeLevel,
    detailedGrading: {
      playingSkills: {
        points: (magenBagrut as any)?.detailedGrading?.playingSkills?.points || undefined,
        maxPoints: 40,
        comments: (magenBagrut as any)?.detailedGrading?.playingSkills?.comments || '',
      },
      musicalUnderstanding: {
        points: (magenBagrut as any)?.detailedGrading?.musicalUnderstanding?.points || undefined,
        maxPoints: 30,
        comments: (magenBagrut as any)?.detailedGrading?.musicalUnderstanding?.comments || '',
      },
      textKnowledge: {
        points: (magenBagrut as any)?.detailedGrading?.textKnowledge?.points || undefined,
        maxPoints: 20,
        comments: (magenBagrut as any)?.detailedGrading?.textKnowledge?.comments || '',
      },
      playingByHeart: {
        points: (magenBagrut as any)?.detailedGrading?.playingByHeart?.points || undefined,
        maxPoints: 10,
        comments: (magenBagrut as any)?.detailedGrading?.playingByHeart?.comments || '',
      },
    },
  }))

  // Performance hooks
  const gradeCalculation = useGradeCalculation(formData.detailedGrading!)
  const validationErrors = enableValidation ? useValidation(formData) : []

  // Auto-save functionality
  const handleAutoSave = useCallback(async (data: any) => {
    // Simulate API save
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('Auto-saved Magen Bagrut data:', data)
  }, [])

  const autoSaveState = useAutoSave(formData, handleAutoSave, enableAutoSave)

  // Update form data with calculated grade
  useEffect(() => {
    const updatedData = {
      ...formData,
      grade: gradeCalculation.total,
      gradeLevel: gradeCalculation.gradeLevel,
    }
    
    if (JSON.stringify(updatedData) !== JSON.stringify(formData)) {
      setFormData(updatedData)
      onUpdate?.(updatedData)
    }
  }, [gradeCalculation.total, gradeCalculation.gradeLevel, onUpdate])

  // Memoized field update handlers
  const updateField = useCallback((field: keyof MagenBagrut, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateGradingField = useCallback((
    category: keyof DetailedGrading,
    field: 'points' | 'comments',
    value: number | string | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      detailedGrading: {
        ...prev.detailedGrading!,
        [category]: {
          ...prev.detailedGrading![category],
          [field]: value,
        },
      },
    }))
  }, [])

  const updateRecordingLink = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const links = [...(prev.recordingLinks || [''])]
      links[index] = value
      
      if (index === links.length - 1 && value) {
        links.push('')
      }
      
      return {
        ...prev,
        recordingLinks: links.filter((link, i) => link || i === links.length - 1)
      }
    })
  }, [])

  // Manual save handler
  const handleManualSave = useCallback(async () => {
    try {
      await handleAutoSave(formData)
    } catch (error) {
      console.error('Manual save failed:', error)
    }
  }, [formData, handleAutoSave])

  // Date formatting helpers
  const formatDate = useCallback((date: Date | undefined) => {
    return date ? new Date(date).toISOString().split('T')[0] : ''
  }, [])

  const parseDate = useCallback((dateString: string) => {
    return dateString ? new Date(dateString) : undefined
  }, [])

  const isFormValid = useMemo(() => {
    const hasRequiredData = formData.date && formData.reviewedBy?.trim()
    const hasNoErrors = validationErrors.filter(e => e.type === 'error').length === 0
    return hasRequiredData && hasNoErrors
  }, [formData, validationErrors])

  return (
    <div className="space-y-6">
      {/* Auto-save status */}
      {enableAutoSave && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                autoSaveState.status === 'saved' ? 'default' :
                autoSaveState.status === 'saving' ? 'secondary' :
                autoSaveState.status === 'error' ? 'destructive' : 'outline'
              }
              className="text-xs"
            >
              {autoSaveState.status === 'saved' && <CheckCircle className="w-3 h-3 mr-1" />}
              {autoSaveState.status === 'saving' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
              {autoSaveState.status === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
              
              {autoSaveState.status === 'saved' && 'שמור אוטומטית'}
              {autoSaveState.status === 'saving' && 'שומר...'}
              {autoSaveState.status === 'error' && 'שגיאת שמירה'}
              {autoSaveState.status === 'idle' && 'מוכן'}
            </Badge>
            
            {autoSaveState.lastSaved && (
              <span className="text-xs text-gray-500">
                נשמר לאחרונה: {autoSaveState.lastSaved.toLocaleTimeString('he-IL')}
              </span>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualSave}
            disabled={!autoSaveState.pendingChanges}
          >
            <Save className="w-4 h-4 mr-1" />
            שמור עכשיו
          </Button>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors.map((error, index) => (
            <Alert key={index} variant={error.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Grade Progress Indicator */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">התקדמות ציון</h4>
          <div className="flex items-center gap-2">
            <Badge variant={gradeCalculation.isPassing ? 'default' : 'destructive'}>
              <Zap className="w-3 h-3 mr-1" />
              {gradeCalculation.total}/100
            </Badge>
          </div>
        </div>
        
        <Progress 
          value={gradeCalculation.percentage} 
          className="h-3 mb-2"
        />
        
        <div className="flex justify-between text-sm">
          <span className={gradeCalculation.isPassing ? 'text-green-600' : 'text-red-600'}>
            {gradeCalculation.gradeLevel}
          </span>
          <span className="text-gray-600">
            {gradeCalculation.isPassing ? 'עובר' : 'לא עובר'}
          </span>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Award className="w-6 h-6 ml-3 text-yellow-600" />
            מגן בגרות - השמעה סופית
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            formData.completed
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {formData.completed ? 'הושלמה' : 'בתהליך'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="magen-date" className="text-right block mb-2 font-semibold">
              <Calendar className="w-4 h-4 inline ml-2" />
              תאריך מגן הבגרות
            </Label>
            <Input
              id="magen-date"
              type="date"
              value={formatDate(formData.date)}
              onChange={(e) => updateField('date', parseDate(e.target.value))}
              disabled={readonly}
              className="text-right"
            />
          </div>

          <div>
            <Label htmlFor="magen-reviewedBy" className="text-right block mb-2 font-semibold">
              <Users className="w-4 h-4 inline ml-2" />
              ועדת הבוחנים
            </Label>
            <Input
              id="magen-reviewedBy"
              value={formData.reviewedBy || ''}
              onChange={(e) => updateField('reviewedBy', e.target.value)}
              placeholder="שמות הבוחנים בוועדה"
              disabled={readonly}
              className="text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Optimized Grading Table */}
        <div className="mb-8">
          <h4 className="text-lg font-bold text-gray-900 mb-4">טבלת ציונים - מגן בגרות במוסיקה</h4>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-400">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border-2 border-gray-400 px-4 py-3 text-right font-bold text-gray-900">
                    קריטריון הערכה
                  </th>
                  <th className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-gray-900">
                    ניקוד מקסימלי
                  </th>
                  <th className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-gray-900">
                    ניקוד שהתקבל
                  </th>
                  <th className="border-2 border-gray-400 px-4 py-3 text-right font-bold text-gray-900">
                    הערות
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Playing Skills Row */}
                <tr>
                  <td className="border-2 border-gray-400 px-4 py-3 font-semibold text-right">
                    מיומנות נגינה
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-lg">
                    40
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2 text-center">
                    <DebouncedScoreInput
                      value={formData.detailedGrading?.playingSkills.points}
                      onChange={(value) => updateGradingField('playingSkills', 'points', value)}
                      max={40}
                      label="מיומנות נגינה"
                      disabled={readonly}
                      error={validationErrors.some(e => e.field === 'playingSkills')}
                    />
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2">
                    <Input
                      value={formData.detailedGrading?.playingSkills.comments || ''}
                      onChange={(e) => updateGradingField('playingSkills', 'comments', e.target.value)}
                      disabled={readonly}
                      placeholder="הערות על מיומנות הנגינה"
                      className="border-0 text-right text-sm"
                      dir="rtl"
                    />
                  </td>
                </tr>

                {/* Musical Understanding Row */}
                <tr className="bg-gray-50">
                  <td className="border-2 border-gray-400 px-4 py-3 font-semibold text-right">
                    הבנה מוסיקלית
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-lg">
                    30
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2 text-center">
                    <DebouncedScoreInput
                      value={formData.detailedGrading?.musicalUnderstanding.points}
                      onChange={(value) => updateGradingField('musicalUnderstanding', 'points', value)}
                      max={30}
                      label="הבנה מוסיקלית"
                      disabled={readonly}
                      error={validationErrors.some(e => e.field === 'musicalUnderstanding')}
                    />
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2">
                    <Input
                      value={formData.detailedGrading?.musicalUnderstanding.comments || ''}
                      onChange={(e) => updateGradingField('musicalUnderstanding', 'comments', e.target.value)}
                      disabled={readonly}
                      placeholder="הערות על הבנה מוסיקלית"
                      className="border-0 text-right text-sm"
                      dir="rtl"
                    />
                  </td>
                </tr>

                {/* Text Knowledge Row */}
                <tr>
                  <td className="border-2 border-gray-400 px-4 py-3 font-semibold text-right">
                    ידיעת הטקסט
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-lg">
                    20
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2 text-center">
                    <DebouncedScoreInput
                      value={formData.detailedGrading?.textKnowledge.points}
                      onChange={(value) => updateGradingField('textKnowledge', 'points', value)}
                      max={20}
                      label="ידיעת טקסט"
                      disabled={readonly}
                      error={validationErrors.some(e => e.field === 'textKnowledge')}
                    />
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2">
                    <Input
                      value={formData.detailedGrading?.textKnowledge.comments || ''}
                      onChange={(e) => updateGradingField('textKnowledge', 'comments', e.target.value)}
                      disabled={readonly}
                      placeholder="הערות על ידיעת הטקסט"
                      className="border-0 text-right text-sm"
                      dir="rtl"
                    />
                  </td>
                </tr>

                {/* Playing by Heart Row */}
                <tr className="bg-gray-50">
                  <td className="border-2 border-gray-400 px-4 py-3 font-semibold text-right">
                    נגינה בע"פ
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-lg">
                    10
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2 text-center">
                    <DebouncedScoreInput
                      value={formData.detailedGrading?.playingByHeart.points}
                      onChange={(value) => updateGradingField('playingByHeart', 'points', value)}
                      max={10}
                      label="נגינה בעל פה"
                      disabled={readonly}
                      error={validationErrors.some(e => e.field === 'playingByHeart')}
                    />
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2">
                    <Input
                      value={formData.detailedGrading?.playingByHeart.comments || ''}
                      onChange={(e) => updateGradingField('playingByHeart', 'comments', e.target.value)}
                      disabled={readonly}
                      placeholder="הערות על נגינה בעל פה"
                      className="border-0 text-right text-sm"
                      dir="rtl"
                    />
                  </td>
                </tr>

                {/* Total Row */}
                <tr className="bg-blue-200">
                  <td className="border-2 border-gray-400 px-4 py-3 font-bold text-right text-lg">
                    סה"כ ציון
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-xl">
                    100
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-3 text-center">
                    <div className={`text-2xl font-bold ${
                      gradeCalculation.isPassing ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {gradeCalculation.total}
                    </div>
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-3 text-right">
                    <div className={`font-semibold ${
                      gradeCalculation.isPassing ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {gradeCalculation.gradeLevel}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recording Links */}
        <div className="mb-6">
          <Label className="text-right block mb-2 font-semibold">
            <Link className="w-4 h-4 inline ml-2" />
            קישורי הקלטות למגן
          </Label>
          <div className="space-y-2">
            {(formData.recordingLinks || ['']).map((link, index) => (
              <Input
                key={index}
                value={link}
                onChange={(e) => updateRecordingLink(index, e.target.value)}
                placeholder={`קישור הקלטה ${index + 1}`}
                disabled={readonly}
                className="text-left"
                dir="ltr"
              />
            ))}
          </div>
        </div>

        {/* Review Section */}
        <div className="mb-6">
          <Label htmlFor="magen-review" className="text-right block mb-2 font-semibold">
            הערות כלליות של הוועדה
          </Label>
          <Textarea
            id="magen-review"
            value={formData.review || ''}
            onChange={(e) => updateField('review', e.target.value)}
            placeholder="הערות כלליות על הביצוע והרמה הכללית..."
            disabled={readonly}
            className="text-right min-h-[120px]"
            dir="rtl"
          />
        </div>

        {/* Action Buttons */}
        {!readonly && (
          <div className="flex justify-between items-center">
            <Button
              onClick={() => updateField('completed', !formData.completed)}
              disabled={!isFormValid}
              variant={formData.completed ? "destructive" : "default"}
              className="flex items-center"
            >
              {formData.completed ? (
                <>
                  <Clock className="w-4 h-4 ml-2" />
                  בטל השלמת מגן
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 ml-2" />
                  השלם מגן בגרות
                </>
              )}
            </Button>

            <div className="text-left">
              <div className={`text-2xl font-bold ${
                gradeCalculation.isPassing ? 'text-green-700' : 'text-red-700'
              }`}>
                ציון סופי: {gradeCalculation.total}/100
              </div>
              <div className="text-sm text-gray-600">
                {gradeCalculation.gradeLevel}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default React.memo(OptimizedMagenBagrutForm)