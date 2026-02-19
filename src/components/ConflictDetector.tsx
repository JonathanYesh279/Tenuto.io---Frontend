import { useState, useEffect } from 'react'

import {
import { CheckCircleIcon, ClockIcon, MapPinIcon, UserIcon, UsersIcon, WarningIcon, XCircleIcon } from '@phosphor-icons/react'
  checkRehearsalConflict,
  formatRehearsalDateTime,
  type Rehearsal,
  type RehearsalFormData,
  type BulkRehearsalData
} from '../utils/rehearsalUtils'

interface ConflictDetectorProps {
  newRehearsal: RehearsalFormData | null
  bulkData: BulkRehearsalData | null
  existingRehearsals: Rehearsal[]
  orchestras: Array<{
    _id: string
    name: string
    type: string
    conductor?: {
      _id: string
      personalInfo: { fullName: string }
    }
    members?: Array<{ _id: string }>
  }>
  onConflictsChanged?: (conflicts: ConflictResult[]) => void
}

interface ConflictResult {
  hasConflict: boolean
  conflictType: 'time' | 'location' | 'conductor' | 'members' | 'none'
  severity: 'critical' | 'warning' | 'none'
  message: string
  conflictingRehearsal?: Rehearsal
  affectedDate?: string
}

export default function ConflictDetector({
  newRehearsal,
  bulkData,
  existingRehearsals,
  orchestras,
  onConflictsChanged
}: ConflictDetectorProps) {
  const [conflicts, setConflicts] = useState<ConflictResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (newRehearsal || bulkData) {
      detectConflicts()
    } else {
      setConflicts([])
    }
  }, [newRehearsal, bulkData, existingRehearsals])

  useEffect(() => {
    onConflictsChanged?.(conflicts)
  }, [conflicts, onConflictsChanged])

  const detectConflicts = async () => {
    setLoading(true)
    
    try {
      let conflictsFound: ConflictResult[] = []

      if (newRehearsal) {
        // Single rehearsal conflict detection
        conflictsFound = await detectSingleRehearsalConflicts(newRehearsal)
      } else if (bulkData) {
        // Bulk rehearsal conflict detection
        conflictsFound = await detectBulkRehearsalConflicts(bulkData)
      }

      setConflicts(conflictsFound)
    } catch (error) {
      console.error('Error detecting conflicts:', error)
    } finally {
      setLoading(false)
    }
  }

  const detectSingleRehearsalConflicts = async (rehearsal: RehearsalFormData): Promise<ConflictResult[]> => {
    const conflicts: ConflictResult[] = []
    
    // Create a mock rehearsal object for conflict checking
    const mockRehearsal: Rehearsal = {
      _id: 'temp',
      groupId: rehearsal.groupId,
      type: rehearsal.type,
      date: rehearsal.date,
      dayOfWeek: new Date(rehearsal.date).getDay(),
      startTime: rehearsal.startTime,
      endTime: rehearsal.endTime,
      location: rehearsal.location,
      attendance: { present: [], absent: [] },
      notes: rehearsal.notes || '',
      schoolYearId: 'current',
      isActive: rehearsal.isActive,
      orchestra: orchestras.find(o => o._id === rehearsal.groupId)
    }

    // Check against all existing rehearsals
    for (const existingRehearsal of existingRehearsals) {
      // Skip same day rehearsals for same orchestra (allowed)
      if (existingRehearsal.groupId === rehearsal.groupId && 
          existingRehearsal.date === rehearsal.date) {
        continue
      }

      const conflict = checkRehearsalConflict(mockRehearsal, existingRehearsal)
      if (conflict.hasConflict) {
        conflicts.push({
          ...conflict,
          conflictingRehearsal: existingRehearsal,
          affectedDate: rehearsal.date
        })
      }
    }

    return conflicts
  }

  const detectBulkRehearsalConflicts = async (bulk: BulkRehearsalData): Promise<ConflictResult[]> => {
    const conflicts: ConflictResult[] = []
    
    // Generate all dates that would be created
    const dates = generateBulkDates(bulk)
    const selectedOrchestra = orchestras.find(o => o._id === bulk.orchestraId)
    
    for (const date of dates) {
      // Create mock rehearsal for this date
      const mockRehearsal: Rehearsal = {
        _id: 'temp',
        groupId: bulk.orchestraId,
        type: selectedOrchestra?.type as any || 'תזמורת',
        date: date,
        dayOfWeek: new Date(date).getDay(),
        startTime: bulk.startTime,
        endTime: bulk.endTime,
        location: bulk.location,
        attendance: { present: [], absent: [] },
        notes: bulk.notes || '',
        schoolYearId: bulk.schoolYearId,
        isActive: true,
        orchestra: selectedOrchestra
      }

      // Check against existing rehearsals
      for (const existingRehearsal of existingRehearsals) {
        // Skip same orchestra rehearsals on same date (allowed)
        if (existingRehearsal.groupId === bulk.orchestraId && 
            existingRehearsal.date === date) {
          continue
        }

        const conflict = checkRehearsalConflict(mockRehearsal, existingRehearsal)
        if (conflict.hasConflict) {
          conflicts.push({
            ...conflict,
            conflictingRehearsal: existingRehearsal,
            affectedDate: date
          })
        }
      }
    }

    return conflicts
  }

  const generateBulkDates = (bulk: BulkRehearsalData): string[] => {
    const dates: string[] = []
    const startDate = new Date(bulk.startDate)
    const endDate = new Date(bulk.endDate)
    const targetDayOfWeek = bulk.dayOfWeek
    const excludeDates = new Set(bulk.excludeDates || [])
    
    // Find first occurrence of target day
    const current = new Date(startDate)
    while (current.getDay() !== targetDayOfWeek && current <= endDate) {
      current.setDate(current.getDate() + 1)
    }
    
    // Generate all occurrences
    while (current <= endDate) {
      const dateString = current.toISOString().split('T')[0]
      if (!excludeDates.has(dateString)) {
        dates.push(dateString)
      }
      current.setDate(current.getDate() + 7) // Next week
    }
    
    return dates
  }

  const getConflictIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="w-5 h-5 text-red-600" />
      case 'warning':
        return <WarningIcon className="w-5 h-5 text-yellow-600" />
      default:
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
    }
  }

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'location':
        return <MapPinIcon className="w-4 h-4" />
      case 'conductor':
        return <UserIcon className="w-4 h-4" />
      case 'members':
        return <UsersIcon className="w-4 h-4" />
      case 'time':
        return <ClockIcon className="w-4 h-4" />
      default:
        return <CheckCircleIcon className="w-4 h-4" />
    }
  }

  const getConflictColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-green-50 border-green-200 text-green-800'
    }
  }

  const criticalConflicts = conflicts.filter(c => c.severity === 'critical')
  const warningConflicts = conflicts.filter(c => c.severity === 'warning')

  if (loading) {
    return (
      <div className="bg-gray-50 rounded p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
          <span className="text-sm text-gray-600">בודק התנגשויות...</span>
        </div>
      </div>
    )
  }

  if (conflicts.length === 0 && (newRehearsal || bulkData)) {
    return (
      <div className="bg-green-50 border border-green-200 rounded p-4">
        <div className="flex items-center">
          <CheckCircleIcon className="w-5 h-5 text-green-600 ml-2" />
          <span className="text-sm text-green-800">
            לא נמצאו התנגשויות - ניתן ליצור את החזרה
          </span>
        </div>
      </div>
    )
  }

  if (conflicts.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">סיכום התנגשויות</h4>
          <div className="flex items-center gap-4 text-sm">
            {criticalConflicts.length > 0 && (
              <div className="flex items-center text-red-600">
                <XCircleIcon className="w-4 h-4 ml-1" />
                <span>{criticalConflicts.length} קריטיות</span>
              </div>
            )}
            {warningConflicts.length > 0 && (
              <div className="flex items-center text-yellow-600">
                <WarningIcon className="w-4 h-4 ml-1" />
                <span>{warningConflicts.length} אזהרות</span>
              </div>
            )}
          </div>
        </div>

        {criticalConflicts.length > 0 && (
          <p className="text-sm text-red-800">
            נמצאו התנגשויות קריטיות שמונעות יצירת החזרה. יש לפתור אותן לפני המשך.
          </p>
        )}
        {warningConflicts.length > 0 && criticalConflicts.length === 0 && (
          <p className="text-sm text-yellow-800">
            נמצאו אזהרות שכדאי לבדוק. ניתן להמשיך ביצירת החזרה אך מומלץ לוודא.
          </p>
        )}
      </div>

      {/* Detailed Conflicts */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {conflicts.map((conflict, index) => (
          <div
            key={index}
            className={`border rounded p-3 ${getConflictColor(conflict.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                {getConflictIcon(conflict.severity)}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {getConflictTypeIcon(conflict.conflictType)}
                    <span className="font-medium text-sm">
                      {conflict.message}
                    </span>
                  </div>
                  
                  {conflict.conflictingRehearsal && (
                    <div className="text-xs opacity-75">
                      <div className="flex items-center gap-4">
                        <span>
                          {conflict.conflictingRehearsal.orchestra?.name}
                        </span>
                        <span>
                          {formatRehearsalDateTime(conflict.conflictingRehearsal).fullDateTime}
                        </span>
                        <span>
                          {conflict.conflictingRehearsal.location}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {conflict.affectedDate && (
                    <div className="text-xs opacity-75 mt-1">
                      תאריך מתנגש: {new Date(conflict.affectedDate).toLocaleDateString('he-IL')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Recommendations */}
      {criticalConflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h4 className="font-medium text-red-900 mb-2">פעולות מומלצות לפתרון:</h4>
          <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
            {criticalConflicts.some(c => c.conflictType === 'location') && (
              <li>שנה את מיקום החזרה או בחר זמן אחר</li>
            )}
            {criticalConflicts.some(c => c.conflictType === 'conductor') && (
              <li>תאם עם המנצח או שנה את זמן החזרה</li>
            )}
            {criticalConflicts.some(c => c.conflictType === 'time') && (
              <li>בחר זמן אחר או תאריך אחר</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}