/**
 * Presentation Chunk Component
 * 
 * Optimized individual presentation component with:
 * - Lazy rendering
 * - Memoization
 * - Progressive loading
 * - Auto-save functionality
 */

import React, { useState, useCallback, memo, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowsClockwiseIcon, CalendarIcon, CheckCircleIcon, ClockIcon, FloppyDiskIcon, LinkIcon, LockIcon, LockOpenIcon, MusicNotesIcon, StarIcon, WarningIcon } from '@phosphor-icons/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'


import { Presentation, DetailedGrading } from '@/types/bagrut.types'
import OptimizedMagenBagrutForm from '../OptimizedMagenBagrutForm'

interface PresentationChunkProps {
  presentation: Presentation
  index: number
  studentId: string
  isAccessible: boolean
  isMagenBagrut: boolean
  onUpdate: (data: Partial<Presentation>) => void
  onAutoSave?: (data: Partial<Presentation>) => Promise<void>
  readonly?: boolean
  enableAutoSave?: boolean
}

interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
}

// Debounced auto-save hook
const useAutoSave = (
  data: Partial<Presentation>,
  saveCallback: ((data: Partial<Presentation>) => Promise<void>) | undefined,
  delay: number = 2000
) => {
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({ status: 'idle' })
  const [pendingData, setPendingData] = useState(data)

  useEffect(() => {
    const hasChanges = JSON.stringify(data) !== JSON.stringify(pendingData)
    if (!hasChanges || !saveCallback) return

    const timeoutId = setTimeout(async () => {
      setAutoSaveStatus({ status: 'saving' })
      
      try {
        await saveCallback(data)
        setAutoSaveStatus({
          status: 'saved',
          lastSaved: new Date()
        })
        setPendingData(data)
      } catch (error) {
        console.error('Auto-save failed:', error)
        setAutoSaveStatus({ status: 'error' })
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [data, saveCallback, delay, pendingData])

  return autoSaveStatus
}

// Memoized recording links component
const RecordingLinksSection = memo<{
  links: string[]
  onChange: (links: string[]) => void
  readonly: boolean
}>(({ links, onChange, readonly }) => {
  const handleLinkChange = useCallback((index: number, value: string) => {
    const newLinks = [...links]
    newLinks[index] = value
    
    // Add empty field if last field is filled
    if (index === links.length - 1 && value) {
      newLinks.push('')
    }
    
    // Remove empty fields except the last one
    const filtered = newLinks.filter((link, i) => link || i === newLinks.length - 1)
    onChange(filtered)
  }, [links, onChange])

  return (
    <div className="space-y-2">
      <Label className="text-right block mb-2 font-medium">
        <LinkIcon className="w-4 h-4 inline ml-2" />
        קישורי הקלטות
      </Label>
      {links.map((link, index) => (
        <Input
          key={index}
          value={link}
          onChange={(e) => handleLinkChange(index, e.target.value)}
          placeholder={`קישור הקלטה ${index + 1}`}
          disabled={readonly}
          className="text-left"
          dir="ltr"
        />
      ))}
    </div>
  )
})

RecordingLinksSection.displayName = 'RecordingLinksSection'

// Memoized basic presentation form
const BasicPresentationForm = memo<{
  presentation: Presentation
  onUpdate: (data: Partial<Presentation>) => void
  readonly: boolean
}>(({ presentation, onUpdate, readonly }) => {
  const handleDateChange = useCallback((dateString: string) => {
    const date = dateString ? new Date(dateString) : undefined
    onUpdate({
      date,
      completed: !!dateString
    })
  }, [onUpdate])

  const handleStatusChange = useCallback((status: string) => {
    onUpdate({ status })
  }, [onUpdate])

  const handleNotesChange = useCallback((notes: string) => {
    onUpdate({ notes })
  }, [onUpdate])

  const handleRecordingLinksChange = useCallback((recordingLinks: string[]) => {
    onUpdate({ recordingLinks })
  }, [onUpdate])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-right block mb-2">תאריך השמעה</Label>
          <Input
            type="date"
            value={presentation.date ? new Date(presentation.date).toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={readonly}
            className="text-right"
          />
        </div>
        
        <div>
          <Label className="text-right block mb-2">סטטוס</Label>
          <Select 
            value={presentation.status || 'pending'} 
            onValueChange={handleStatusChange}
            disabled={readonly}
          >
            <SelectTrigger className="text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">ממתין</SelectItem>
              <SelectItem value="completed">הושלם</SelectItem>
              <SelectItem value="needs_improvement">זקוק שיפור</SelectItem>
              <SelectItem value="cancelled">בוטל</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label className="text-right block mb-2">הערות ומשוב</Label>
        <Textarea
          value={presentation.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="הערות על ההשמעה, משוב למורה ותלמיד..."
          disabled={readonly}
          className="text-right min-h-[100px]"
          dir="rtl"
        />
      </div>

      <RecordingLinksSection
        links={presentation.recordingLinks || ['']}
        onChange={handleRecordingLinksChange}
        readonly={readonly}
      />
    </div>
  )
})

BasicPresentationForm.displayName = 'BasicPresentationForm'

const PresentationChunk: React.FC<PresentationChunkProps> = ({
  presentation,
  index,
  studentId,
  isAccessible,
  isMagenBagrut,
  onUpdate,
  onAutoSave,
  readonly = false,
  enableAutoSave = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Auto-save status
  const autoSaveStatus = useAutoSave(
    presentation,
    enableAutoSave ? onAutoSave : undefined
  )

  // Validation
  useEffect(() => {
    const errors: string[] = []
    
    if (presentation.completed) {
      if (!presentation.date) {
        errors.push('נדרש תאריך השמעה')
      }
      
      if (isMagenBagrut) {
        const detailedGrading = (presentation as any).detailedGrading as DetailedGrading
        if (!detailedGrading || !detailedGrading.playingSkills.points) {
          errors.push('נדרשים ציונים מפורטים למגן בגרות')
        }
      }
    }
    
    setValidationErrors(errors)
  }, [presentation, isMagenBagrut])

  // Calculate completion percentage
  const completionPercentage = React.useMemo(() => {
    let completed = 0
    let total = 0

    // Basic fields
    total += 4 // date, status, notes, recordings
    if (presentation.date) completed += 1
    if (presentation.status && presentation.status !== 'pending') completed += 1
    if (presentation.notes) completed += 1
    if (presentation.recordingLinks?.some(link => link.trim())) completed += 1

    // Magen Bagrut specific
    if (isMagenBagrut) {
      total += 4 // detailed grading categories
      const detailedGrading = (presentation as any).detailedGrading as DetailedGrading
      if (detailedGrading) {
        if (detailedGrading.playingSkills.points !== undefined) completed += 1
        if (detailedGrading.musicalUnderstanding.points !== undefined) completed += 1
        if (detailedGrading.textKnowledge.points !== undefined) completed += 1
        if (detailedGrading.playingByHeart.points !== undefined) completed += 1
      }
    }

    return Math.round((completed / total) * 100)
  }, [presentation, isMagenBagrut])

  const handleToggleExpand = useCallback(() => {
    if (isAccessible) {
      setIsExpanded(prev => !prev)
    }
  }, [isAccessible])

  const handleManualSave = useCallback(async () => {
    if (onAutoSave) {
      try {
        await onAutoSave(presentation)
      } catch (error) {
        console.error('Manual save failed:', error)
      }
    }
  }, [onAutoSave, presentation])

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 ${
      !isAccessible ? 'opacity-50' : ''
    } ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
      {/* Locked Overlay */}
      {!isAccessible && (
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center z-10 rounded">
          <div className="bg-white p-4 rounded shadow-lg flex items-center">
            <LockIcon className="w-5 h-5 ml-2 text-gray-500" />
            <span className="text-gray-600">השלם את השמעה {index} תחילה</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMagenBagrut ? (
              <StarIcon className="w-6 h-6 text-yellow-500" />
            ) : (
              <MusicNotesIcon className="w-6 h-6 text-blue-500" />
            )}
            <div>
              <h4 className="text-lg font-bold">
                {isMagenBagrut ? 'מגן בגרות' : `השמעה ${index + 1}`}
              </h4>
              {presentation.date && (
                <p className="text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 inline ml-1" />
                  {new Date(presentation.date).toLocaleDateString('he-IL')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Completion Progress */}
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">השלמה</div>
              <div className="flex items-center gap-2">
                <Progress value={completionPercentage} className="w-16 h-2" />
                <span className="text-xs font-mono">{completionPercentage}%</span>
              </div>
            </div>

            {/* Status Badge */}
            {presentation.completed ? (
              <Badge variant="default">
                <CheckCircleIcon className="w-4 h-4 ml-1" />
                הושלמה
              </Badge>
            ) : (
              <Badge variant="secondary">
                <ClockIcon className="w-4 h-4 ml-1" />
                ממתינה
              </Badge>
            )}
            
            {/* Access Status */}
            {isAccessible ? (
              <LockOpenIcon className="w-4 h-4 text-green-500" />
            ) : (
              <LockIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Auto-save Status */}
        {enableAutoSave && isAccessible && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  autoSaveStatus.status === 'saved' ? 'default' :
                  autoSaveStatus.status === 'saving' ? 'secondary' :
                  autoSaveStatus.status === 'error' ? 'destructive' : 'outline'
                }
                className="text-xs"
              >
                {autoSaveStatus.status === 'saved' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                {autoSaveStatus.status === 'saving' && <ArrowsClockwiseIcon className="w-3 h-3 mr-1 animate-spin" />}
                {autoSaveStatus.status === 'error' && <WarningIcon className="w-3 h-3 mr-1" />}
                
                {autoSaveStatus.status === 'saved' && 'נשמר'}
                {autoSaveStatus.status === 'saving' && 'שומר...'}
                {autoSaveStatus.status === 'error' && 'שגיאה'}
                {autoSaveStatus.status === 'idle' && 'מוכן'}
              </Badge>
              
              {autoSaveStatus.lastSaved && (
                <span className="text-xs text-gray-500">
                  {autoSaveStatus.lastSaved.toLocaleTimeString('he-IL')}
                </span>
              )}
            </div>

            {!readonly && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleManualSave()
                }}
              >
                <FloppyDiskIcon className="w-3 h-3 mr-1" />
                שמור
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && isAccessible && (
        <div className="px-4 pb-4 border-t">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 space-y-2">
              {validationErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <WarningIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Form Content */}
          {isMagenBagrut ? (
            <div className="mt-4">
              <OptimizedMagenBagrutForm
                magenBagrut={presentation as any}
                studentId={studentId}
                onUpdate={onUpdate}
                readonly={readonly}
                enableAutoSave={false} // Handled by parent
                enableValidation={true}
              />
            </div>
          ) : (
            <div className="mt-4">
              <BasicPresentationForm
                presentation={presentation}
                onUpdate={onUpdate}
                readonly={readonly}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default memo(PresentationChunk)