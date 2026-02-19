/**
 * Conflict Resolution Modal Component
 * 
 * Handles data conflicts during concurrent editing with:
 * - Side-by-side comparison
 * - Field-level conflict resolution
 * - Smart merge suggestions
 * - Visual diff display
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
import { ArrowLeftIcon, ArrowRightIcon, ArrowsClockwiseIcon, CheckIcon, ClockIcon, EyeIcon, GitMergeIcon, PencilSimpleIcon, UserIcon, WarningIcon, XIcon } from '@phosphor-icons/react'
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'


import { Bagrut, Presentation, ProgramPiece, DetailedGrading } from '@/types/bagrut.types'

interface ConflictResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  localData: Bagrut
  serverData: Bagrut
  conflictFields: string[]
  onResolve: (resolution: ConflictResolution) => void
  userInfo?: {
    currentUser: string
    lastModifiedBy: string
    lastModified: Date
  }
}

interface ConflictResolution {
  action: 'use_local' | 'use_server' | 'merge' | 'abort'
  mergedData?: Bagrut
  resolvedFields?: { [key: string]: 'local' | 'server' | 'custom' }
}

interface FieldConflict {
  field: string
  localValue: any
  serverValue: any
  path: string[]
  displayName: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  resolution?: 'local' | 'server' | 'custom'
  customValue?: any
}

// Utility to get nested object value by path
const getNestedValue = (obj: any, path: string[]): any => {
  return path.reduce((current, key) => current?.[key], obj)
}

// Utility to set nested object value by path
const setNestedValue = (obj: any, path: string[], value: any): any => {
  const result = { ...obj }
  let current = result
  
  for (let i = 0; i < path.length - 1; i++) {
    if (current[path[i]] === undefined) {
      current[path[i]] = {}
    } else {
      current[path[i]] = { ...current[path[i]] }
    }
    current = current[path[i]]
  }
  
  current[path[path.length - 1]] = value
  return result
}

// Field display names mapping
const FIELD_DISPLAY_NAMES: { [key: string]: string } = {
  'program': 'תכנית רסיטל',
  'presentations': 'השמעות',
  'presentations.0': 'השמעה ראשונה',
  'presentations.1': 'השמעה שנייה', 
  'presentations.2': 'השמעה שלישית',
  'presentations.3': 'מגן בגרות',
  'directorEvaluation': 'הערכת מנהל',
  'recitalUnits': 'יחידות לימוד',
  'recitalField': 'תחום רסיטל',
  'notes': 'הערות',
  'finalGrade': 'ציון סופי'
}

// Smart merge suggestions
const getSuggestionForField = (field: string, localValue: any, serverValue: any): {
  suggestion: 'local' | 'server' | 'merge'
  reason: string
} => {
  // Grade-related fields - prefer higher values
  if (field.includes('grade') || field.includes('points')) {
    if (typeof localValue === 'number' && typeof serverValue === 'number') {
      return {
        suggestion: localValue > serverValue ? 'local' : 'server',
        reason: 'מועדף הציון הגבוה יותר'
      }
    }
  }

  // Date fields - prefer more recent
  if (field.includes('date') || field.includes('Date')) {
    const localDate = new Date(localValue)
    const serverDate = new Date(serverValue)
    
    if (!isNaN(localDate.getTime()) && !isNaN(serverDate.getTime())) {
      return {
        suggestion: localDate > serverDate ? 'local' : 'server',
        reason: 'מועדף התאריך החדש יותר'
      }
    }
  }

  // Text fields - prefer longer/more detailed
  if (typeof localValue === 'string' && typeof serverValue === 'string') {
    return {
      suggestion: localValue.length > serverValue.length ? 'local' : 'server',
      reason: 'מועדף הטקסט המפורט יותר'
    }
  }

  // Array fields - prefer more items
  if (Array.isArray(localValue) && Array.isArray(serverValue)) {
    return {
      suggestion: localValue.length > serverValue.length ? 'local' : 'server',
      reason: 'מועדף הרשימה הארוכה יותר'
    }
  }

  // Boolean fields - prefer true (completion)
  if (typeof localValue === 'boolean' && typeof serverValue === 'boolean') {
    return {
      suggestion: localValue ? 'local' : 'server',
      reason: 'מועדף המצב המושלם'
    }
  }

  return {
    suggestion: 'local',
    reason: 'ברירת מחדל - השינויים המקומיים'
  }
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  localData,
  serverData,
  conflictFields,
  onResolve,
  userInfo
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'field-by-field' | 'preview'>('overview')
  const [fieldResolutions, setFieldResolutions] = useState<{ [key: string]: 'local' | 'server' | 'custom' }>({})
  const [customValues, setCustomValues] = useState<{ [key: string]: any }>({})

  // Parse conflicts into structured format
  const conflicts = useMemo<FieldConflict[]>(() => {
    return conflictFields.map(fieldPath => {
      const path = fieldPath.split('.')
      const localValue = getNestedValue(localData, path)
      const serverValue = getNestedValue(serverData, path)
      
      return {
        field: fieldPath,
        localValue,
        serverValue,
        path,
        displayName: FIELD_DISPLAY_NAMES[fieldPath] || fieldPath,
        type: typeof localValue === 'object' ? (Array.isArray(localValue) ? 'array' : 'object') : typeof localValue,
        resolution: fieldResolutions[fieldPath]
      }
    })
  }, [conflictFields, localData, serverData, fieldResolutions])

  // Generate smart suggestions
  const suggestions = useMemo(() => {
    const fieldSuggestions: { [key: string]: { suggestion: 'local' | 'server' | 'merge'; reason: string } } = {}
    
    conflicts.forEach(conflict => {
      fieldSuggestions[conflict.field] = getSuggestionForField(
        conflict.field,
        conflict.localValue,
        conflict.serverValue
      )
    })
    
    return fieldSuggestions
  }, [conflicts])

  // Generate merged data based on current resolutions
  const mergedData = useMemo<Bagrut>(() => {
    let result = { ...localData }
    
    conflicts.forEach(conflict => {
      const resolution = fieldResolutions[conflict.field] || suggestions[conflict.field]?.suggestion || 'local'
      let valueToUse: any
      
      switch (resolution) {
        case 'server':
          valueToUse = conflict.serverValue
          break
        case 'custom':
          valueToUse = customValues[conflict.field] ?? conflict.localValue
          break
        default:
          valueToUse = conflict.localValue
      }
      
      result = setNestedValue(result, conflict.path, valueToUse)
    })
    
    return result
  }, [localData, conflicts, fieldResolutions, suggestions, customValues])

  const handleFieldResolution = useCallback((field: string, resolution: 'local' | 'server' | 'custom') => {
    setFieldResolutions(prev => ({ ...prev, [field]: resolution }))
  }, [])

  const handleCustomValueChange = useCallback((field: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleApplyAllSuggestions = useCallback(() => {
    const newResolutions: { [key: string]: 'local' | 'server' | 'custom' } = {}
    
    conflicts.forEach(conflict => {
      const suggestion = suggestions[conflict.field]
      if (suggestion) {
        newResolutions[conflict.field] = suggestion.suggestion
      }
    })
    
    setFieldResolutions(newResolutions)
  }, [conflicts, suggestions])

  const handleResolveConflict = useCallback((action: ConflictResolution['action']) => {
    let resolution: ConflictResolution

    switch (action) {
      case 'use_local':
        resolution = { action: 'use_local' }
        break
      case 'use_server':
        resolution = { action: 'use_server' }
        break
      case 'merge':
        resolution = {
          action: 'merge',
          mergedData,
          resolvedFields: fieldResolutions
        }
        break
      case 'abort':
        resolution = { action: 'abort' }
        break
    }

    onResolve(resolution)
  }, [mergedData, fieldResolutions, onResolve])

  // Render field value for display
  const renderValue = (value: any, type: string) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">ריק</span>
    }

    switch (type) {
      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'כן' : 'לא'}
          </Badge>
        )
      case 'array':
        return (
          <span className="text-sm">
            {Array.isArray(value) ? `${value.length} פריטים` : 'רשימה'}
          </span>
        )
      case 'object':
        if (value && typeof value === 'object') {
          const keys = Object.keys(value)
          return (
            <span className="text-sm">
              אובייקט עם {keys.length} שדות
            </span>
          )
        }
        return <span className="text-sm">אובייקט</span>
      default:
        return <span className="font-mono text-sm">{String(value)}</span>
    }
  }

  const resolvedCount = Object.keys(fieldResolutions).length
  const totalConflicts = conflicts.length
  const isAllResolved = resolvedCount === totalConflicts

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMergeIcon className="w-6 h-6 text-orange-500" />
            זוהו קונפליקטים בנתונים
          </DialogTitle>
          <DialogDescription>
            הנתונים שלך הותאמו במקביל על ידי משתמש אחר. אנא בחר כיצד לטפל בקונפליקטים.
          </DialogDescription>
        </DialogHeader>

        {/* UserIcon Info */}
        {userInfo && (
          <Alert>
            <ClockIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between text-sm">
                <span>
                  עודכן לאחרונה על ידי: <strong>{userInfo.lastModifiedBy}</strong>
                </span>
                <span>
                  {userInfo.lastModified.toLocaleString('he-IL')}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              סקירה כללית ({totalConflicts} קונפליקטים)
            </TabsTrigger>
            <TabsTrigger value="field-by-field">
              פתרון שדה-אחר-שדה ({resolvedCount}/{totalConflicts})
            </TabsTrigger>
            <TabsTrigger value="preview">
              תצוגה מקדימה של התוצאה
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 max-h-[50vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">קונפליקטים שזוהו</h3>
                <p className="text-sm text-gray-600">
                  {totalConflicts} שדות בעלי ערכים שונים
                </p>
              </div>
              <Button onClick={handleApplyAllSuggestions} variant="outline">
                <ArrowsClockwiseIcon className="w-4 h-4 mr-2" />
                החל הצעות אוטומטיות
              </Button>
            </div>

            <div className="space-y-3">
              {conflicts.map((conflict, index) => {
                const suggestion = suggestions[conflict.field]
                return (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {conflict.displayName}
                        {suggestion && (
                          <Badge variant="outline" className="text-xs">
                            הצעה: {suggestion.suggestion === 'local' ? 'מקומי' : 'שרת'}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-blue-500" />
                            הגרסה שלך
                          </Label>
                          <div className="p-3 bg-blue-50 rounded">
                            {renderValue(conflict.localValue, conflict.type)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <ArrowsClockwiseIcon className="w-4 h-4 text-orange-500" />
                            גרסת השרת
                          </Label>
                          <div className="p-3 bg-orange-50 rounded">
                            {renderValue(conflict.serverValue, conflict.type)}
                          </div>
                        </div>
                      </div>
                      {suggestion && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                          💡 {suggestion.reason}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Field-by-Field Tab */}
          <TabsContent value="field-by-field" className="space-y-4 max-h-[50vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">פתרון מפורט</h3>
                <p className="text-sm text-gray-600">
                  בחר עבור כל שדה איזה ערך לשמור
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isAllResolved ? 'default' : 'secondary'}>
                  {resolvedCount}/{totalConflicts} הושלמו
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {conflicts.map((conflict, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{conflict.displayName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Local Option */}
                      <div 
                        className={`p-3 border-2 rounded cursor-pointer transition-colors ${
                          fieldResolutions[conflict.field] === 'local' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleFieldResolution(conflict.field, 'local')}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {fieldResolutions[conflict.field] === 'local' && 
                            <CheckIcon className="w-4 h-4 text-blue-500" />}
                          <Label className="text-sm font-medium text-blue-700">
                            השתמש בגרסה המקומית
                          </Label>
                        </div>
                        <div className="text-sm">
                          {renderValue(conflict.localValue, conflict.type)}
                        </div>
                      </div>

                      {/* Server Option */}
                      <div 
                        className={`p-3 border-2 rounded cursor-pointer transition-colors ${
                          fieldResolutions[conflict.field] === 'server' 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => handleFieldResolution(conflict.field, 'server')}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {fieldResolutions[conflict.field] === 'server' && 
                            <CheckIcon className="w-4 h-4 text-orange-500" />}
                          <Label className="text-sm font-medium text-orange-700">
                            השתמש בגרסת השרת
                          </Label>
                        </div>
                        <div className="text-sm">
                          {renderValue(conflict.serverValue, conflict.type)}
                        </div>
                      </div>

                      {/* Custom Option */}
                      <div 
                        className={`p-3 border-2 rounded cursor-pointer transition-colors ${
                          fieldResolutions[conflict.field] === 'custom' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                        onClick={() => handleFieldResolution(conflict.field, 'custom')}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {fieldResolutions[conflict.field] === 'custom' && 
                            <CheckIcon className="w-4 h-4 text-green-500" />}
                          <Label className="text-sm font-medium text-green-700">
                            ערך מותאם אישית
                          </Label>
                        </div>
                        {fieldResolutions[conflict.field] === 'custom' ? (
                          <Textarea
                            value={customValues[conflict.field] || ''}
                            onChange={(e) => handleCustomValueChange(conflict.field, e.target.value)}
                            placeholder="הזן ערך מותאם..."
                            className="text-sm"
                            dir="rtl"
                          />
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            לחץ לעריכה מותאמת
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">תצוגה מקדימה של התוצאה</h3>
              <p className="text-sm text-gray-600 mb-4">
                כך יראו הנתונים לאחר פתרון הקונפליקטים
              </p>
            </div>

            <Alert>
              <EyeIcon className="h-4 w-4" />
              <AlertDescription>
                תצוגה זו מבוססת על הבחירות הנוכחיות שלך. 
                {!isAllResolved && ' אנא השלם את פתרון כל הקונפליקטים.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto">
              {conflicts.map((conflict, index) => {
                const resolution = fieldResolutions[conflict.field] || suggestions[conflict.field]?.suggestion || 'local'
                let finalValue: any

                switch (resolution) {
                  case 'server':
                    finalValue = conflict.serverValue
                    break
                  case 'custom':
                    finalValue = customValues[conflict.field] ?? conflict.localValue
                    break
                  default:
                    finalValue = conflict.localValue
                }

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{conflict.displayName}:</span>
                      <div className="mt-1">
                        {renderValue(finalValue, conflict.type)}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        resolution === 'local' ? 'default' :
                        resolution === 'server' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {resolution === 'local' ? 'מקומי' : 
                       resolution === 'server' ? 'שרת' : 'מותאם'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleResolveConflict('abort')}
              >
                <XIcon className="w-4 h-4 mr-2" />
                ביטול
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleResolveConflict('use_server')}
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                השתמש בגרסת השרת
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResolveConflict('use_local')}
              >
                <ArrowRightIcon className="w-4 h-4 mr-2" />
                השתמש בגרסה המקומית
              </Button>
              <Button
                onClick={() => handleResolveConflict('merge')}
                disabled={!isAllResolved}
              >
                <GitMergeIcon className="w-4 h-4 mr-2" />
                מזג שינויים
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConflictResolutionModal