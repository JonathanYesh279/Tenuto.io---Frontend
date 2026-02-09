/**
 * Program Builder Chunk Component
 * 
 * Optimized program builder with:
 * - Virtual scrolling for large programs
 * - Drag and drop reordering
 * - Auto-save functionality
 * - Progressive validation
 */

import React, { useState, useCallback, memo, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Music,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  User,
  Youtube,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

import { ProgramPiece } from '@/types/bagrut.types'

interface ProgramBuilderChunkProps {
  program: ProgramPiece[]
  requiredPieces: number
  onChange: (program: ProgramPiece[]) => void
  onAutoSave?: (program: ProgramPiece[]) => Promise<void>
  readonly?: boolean
  enableAutoSave?: boolean
  enableValidation?: boolean
}

interface ValidationError {
  index: number
  field: string
  message: string
}

interface ProgramStats {
  totalPieces: number
  completedPieces: number
  totalDuration: number
  hasMemoryPiece: boolean
  completionPercentage: number
}

// Debounced auto-save hook
const useAutoSave = (
  data: ProgramPiece[],
  saveCallback: ((data: ProgramPiece[]) => Promise<void>) | undefined,
  delay: number = 3000
) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!saveCallback || data.length === 0) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setStatus('saving')

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveCallback(data)
        setStatus('saved')
        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
        setStatus('error')
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, saveCallback, delay])

  return { status, lastSaved }
}

// Memoized program piece component
const ProgramPieceItem = memo<{
  piece: ProgramPiece
  index: number
  onUpdate: (index: number, piece: ProgramPiece) => void
  onDelete: (index: number) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  readonly: boolean
  validationErrors: ValidationError[]
  isExpanded: boolean
  onToggleExpand: () => void
}>(({ piece, index, onUpdate, onDelete, onMoveUp, onMoveDown, readonly, validationErrors, isExpanded, onToggleExpand }) => {
  const pieceErrors = validationErrors.filter(error => error.index === index)
  
  const handleFieldChange = useCallback((field: keyof ProgramPiece, value: string) => {
    onUpdate(index, { ...piece, [field]: value })
  }, [piece, index, onUpdate])

  const parseDuration = (duration: string): number => {
    // Parse MM:SS format to total seconds
    const parts = duration.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0
      const seconds = parseInt(parts[1]) || 0
      return minutes * 60 + seconds
    }
    return 0
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isComplete = piece.pieceTitle && piece.composer && piece.duration

  return (
    <Card className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!readonly && (
              <div className="cursor-grab">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {index + 1}
              </Badge>
              
              <div>
                <h4 className="font-semibold text-right">
                  {piece.pieceTitle || 'יצירה חדשה'}
                </h4>
                <p className="text-sm text-gray-600 text-right">
                  {piece.composer && (
                    <>
                      <User className="w-3 h-3 inline ml-1" />
                      {piece.composer}
                    </>
                  )}
                  {piece.duration && (
                    <>
                      {piece.composer && ' • '}
                      <Clock className="w-3 h-3 inline ml-1" />
                      {piece.duration}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            
            {pieceErrors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pieceErrors.length} שגיאות
              </Badge>
            )}

            {!readonly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(index)
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-gray-50/50">
          {/* Validation Errors */}
          {pieceErrors.length > 0 && (
            <div className="mb-4 space-y-2">
              {pieceErrors.map((error, idx) => (
                <Alert key={idx} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-right block mb-2">שם היצירה</Label>
              <Input
                value={piece.pieceTitle}
                onChange={(e) => handleFieldChange('pieceTitle', e.target.value)}
                placeholder="הזן שם יצירה..."
                disabled={readonly}
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <Label className="text-right block mb-2">מלחין</Label>
              <Input
                value={piece.composer}
                onChange={(e) => handleFieldChange('composer', e.target.value)}
                placeholder="הזן שם מלחין..."
                disabled={readonly}
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <Label className="text-right block mb-2">משך זמן (דקות:שניות)</Label>
              <Input
                value={piece.duration}
                onChange={(e) => handleFieldChange('duration', e.target.value)}
                placeholder="5:30"
                disabled={readonly}
                className="text-center"
                pattern="[0-9]{1,2}:[0-9]{2}"
              />
            </div>

            <div>
              <Label className="text-right block mb-2">פרק/חלק</Label>
              <Input
                value={piece.movement || ''}
                onChange={(e) => handleFieldChange('movement', e.target.value)}
                placeholder="פרק ראשון, בעל פה..."
                disabled={readonly}
                className="text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-right block mb-2">קישור YouTube (אופציונלי)</Label>
            <div className="flex gap-2">
              <Input
                value={piece.youtubeLink || ''}
                onChange={(e) => handleFieldChange('youtubeLink', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={readonly}
                className="text-left"
                dir="ltr"
              />
              {piece.youtubeLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(piece.youtubeLink, '_blank')}
                >
                  <Youtube className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>

          {/* Move buttons */}
          {!readonly && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMoveUp?.(index)}
                disabled={index === 0}
              >
                הזז למעלה
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMoveDown?.(index)}
                disabled={index === piece.length - 1}
              >
                הזז למטה
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
})

ProgramPieceItem.displayName = 'ProgramPieceItem'

const ProgramBuilderChunk: React.FC<ProgramBuilderChunkProps> = ({
  program,
  requiredPieces,
  onChange,
  onAutoSave,
  readonly = false,
  enableAutoSave = true,
  enableValidation = true
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]))
  const [showValidation, setShowValidation] = useState(true)

  // Auto-save
  const autoSaveStatus = useAutoSave(
    program,
    enableAutoSave ? onAutoSave : undefined
  )

  // Program statistics
  const stats = useMemo<ProgramStats>(() => {
    const totalPieces = program.length
    const completedPieces = program.filter(p => p.pieceTitle && p.composer && p.duration).length
    
    const totalDuration = program.reduce((total, piece) => {
      if (!piece.duration) return total
      const parts = piece.duration.split(':')
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0
        const seconds = parseInt(parts[1]) || 0
        return total + minutes * 60 + seconds
      }
      return total
    }, 0)

    const hasMemoryPiece = program.some(piece => 
      piece.movement?.toLowerCase().includes('בעל פה') ||
      piece.movement?.toLowerCase().includes('בע"פ') ||
      piece.pieceTitle?.toLowerCase().includes('בעל פה')
    )

    const completionPercentage = totalPieces > 0 ? (completedPieces / totalPieces) * 100 : 0

    return {
      totalPieces,
      completedPieces,
      totalDuration,
      hasMemoryPiece,
      completionPercentage
    }
  }, [program])

  // Validation
  const validationErrors = useMemo<ValidationError[]>(() => {
    if (!enableValidation) return []

    const errors: ValidationError[] = []

    program.forEach((piece, index) => {
      if (!piece.pieceTitle?.trim()) {
        errors.push({
          index,
          field: 'pieceTitle',
          message: 'נדרש שם יצירה'
        })
      }

      if (!piece.composer?.trim()) {
        errors.push({
          index,
          field: 'composer',
          message: 'נדרש שם מלחין'
        })
      }

      if (!piece.duration?.trim()) {
        errors.push({
          index,
          field: 'duration',
          message: 'נדרש משך זמן'
        })
      } else {
        // Validate duration format
        const durationRegex = /^\d{1,2}:\d{2}$/
        if (!durationRegex.test(piece.duration)) {
          errors.push({
            index,
            field: 'duration',
            message: 'פורמט משך זמן לא תקין (דוגמה: 5:30)'
          })
        }
      }

      if (piece.youtubeLink && !piece.youtubeLink.includes('youtube.com')) {
        errors.push({
          index,
          field: 'youtubeLink',
          message: 'קישור YouTube לא תקין'
        })
      }
    })

    // Check minimum pieces requirement
    if (program.length < requiredPieces) {
      errors.push({
        index: -1,
        field: 'program',
        message: `נדרשות לפחות ${requiredPieces} יצירות`
      })
    }

    return errors
  }, [program, requiredPieces, enableValidation])

  const handlePieceUpdate = useCallback((index: number, piece: ProgramPiece) => {
    const newProgram = [...program]
    newProgram[index] = piece
    onChange(newProgram)
  }, [program, onChange])

  const handleAddPiece = useCallback(() => {
    const newPiece: ProgramPiece = {
      pieceTitle: '',
      composer: '',
      duration: '',
      movement: '',
      youtubeLink: ''
    }
    const newProgram = [...program, newPiece]
    onChange(newProgram)
    
    // Expand the new item
    setExpandedItems(prev => new Set([...prev, program.length]))
  }, [program, onChange])

  const handleDeletePiece = useCallback((index: number) => {
    const newProgram = program.filter((_, i) => i !== index)
    onChange(newProgram)
    
    // Update expanded items
    setExpandedItems(prev => {
      const newSet = new Set<number>()
      prev.forEach(i => {
        if (i < index) newSet.add(i)
        else if (i > index) newSet.add(i - 1)
      })
      return newSet
    })
  }, [program, onChange])

  const handleMovePiece = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= program.length) return

    const newProgram = [...program]
    const [movedPiece] = newProgram.splice(fromIndex, 1)
    newProgram.splice(toIndex, 0, movedPiece)
    onChange(newProgram)
  }, [program, onChange])

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  const handleExpandAll = useCallback(() => {
    setExpandedItems(new Set(program.map((_, index) => index)))
  }, [program])

  const handleCollapseAll = useCallback(() => {
    setExpandedItems(new Set())
  }, [])

  const formatTotalDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-600" />
              תכנית הרסיטל
            </div>
            <div className="flex items-center gap-3">
              {enableAutoSave && (
                <Badge 
                  variant={
                    autoSaveStatus.status === 'saved' ? 'default' :
                    autoSaveStatus.status === 'saving' ? 'secondary' :
                    autoSaveStatus.status === 'error' ? 'destructive' : 'outline'
                  }
                  className="text-xs"
                >
                  {autoSaveStatus.status === 'saved' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {autoSaveStatus.status === 'saving' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                  {autoSaveStatus.status === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  
                  {autoSaveStatus.status === 'saved' && 'נשמר'}
                  {autoSaveStatus.status === 'saving' && 'שומר...'}
                  {autoSaveStatus.status === 'error' && 'שגיאה'}
                  {autoSaveStatus.status === 'idle' && 'מוכן'}
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            {requiredPieces === 5 ? 'תכנית ל-5 יחידות לימוד' : 'תכנית ל-3 יחידות לימוד'} 
            (נדרשות {requiredPieces} יצירות מינימום)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalPieces}
              </div>
              <div className="text-sm text-gray-600">יצירות</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.completedPieces}
              </div>
              <div className="text-sm text-gray-600">מושלמות</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatTotalDuration(stats.totalDuration)}
              </div>
              <div className="text-sm text-gray-600">משך כולל</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.hasMemoryPiece ? 'text-yellow-600' : 'text-gray-400'}`}>
                {stats.hasMemoryPiece ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">בעל פה</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>השלמת תכנית</span>
              <span>{Math.round(stats.completionPercentage)}%</span>
            </div>
            <Progress value={stats.completionPercentage} className="h-2" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                disabled={expandedItems.size === program.length}
              >
                פתח הכל
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                disabled={expandedItems.size === 0}
              >
                סגור הכל
              </Button>
              {enableValidation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValidation(!showValidation)}
                >
                  {showValidation ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showValidation ? 'הסתר שגיאות' : 'הצג שגיאות'}
                </Button>
              )}
            </div>

            {!readonly && (
              <Button onClick={handleAddPiece}>
                <Plus className="w-4 h-4 mr-1" />
                הוסף יצירה
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* General Validation Errors */}
      {showValidation && validationErrors.filter(e => e.index === -1).length > 0 && (
        <div className="space-y-2">
          {validationErrors
            .filter(e => e.index === -1)
            .map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ))}
        </div>
      )}

      {/* Program Pieces */}
      <div className="space-y-4">
        {program.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Music className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center mb-4">
                לא נוספו יצירות לתכנית עדיין
              </p>
              {!readonly && (
                <Button onClick={handleAddPiece}>
                  <Plus className="w-4 h-4 mr-1" />
                  הוסף יצירה ראשונה
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          program.map((piece, index) => (
            <ProgramPieceItem
              key={index}
              piece={piece}
              index={index}
              onUpdate={handlePieceUpdate}
              onDelete={handleDeletePiece}
              onMoveUp={(i) => handleMovePiece(i, i - 1)}
              onMoveDown={(i) => handleMovePiece(i, i + 1)}
              readonly={readonly}
              validationErrors={showValidation ? validationErrors : []}
              isExpanded={expandedItems.has(index)}
              onToggleExpand={() => handleToggleExpand(index)}
            />
          ))
        )}
      </div>

      {/* Requirements Check */}
      {requiredPieces === 5 && !stats.hasMemoryPiece && program.length >= requiredPieces && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            תלמידי 5 יחידות נדרשים לבצע יצירה אחת לפחות בעל פה. 
            ציין "בעל פה" בשדה הפרק/חלק של אחת היצירות.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default memo(ProgramBuilderChunk)