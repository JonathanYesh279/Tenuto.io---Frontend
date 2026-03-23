import { useState, useEffect, useRef } from 'react'
import { CheckCircleIcon, ClockIcon, MapPinIcon, UserIcon, WarningIcon, XCircleIcon } from '@phosphor-icons/react'
import {
  generateRehearsalDates,
  type Rehearsal,
  type RehearsalFormData,
  type BulkRehearsalData,
} from '../utils/rehearsalUtils'
import { rehearsalService } from '../services/apiService'

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

interface DateConflict {
  date: string
  roomConflicts: Array<{
    type: string
    activityType: string
    activityName: string
    conflictingTime: string
    room: string
    description: string
  }>
  teacherConflicts: Array<{
    type: string
    activityType: string
    activityName: string
    conflictingTime: string
    description: string
  }>
}

export default function ConflictDetector({
  newRehearsal,
  bulkData,
  existingRehearsals,
  orchestras,
  onConflictsChanged,
}: ConflictDetectorProps) {
  const [conflicts, setConflicts] = useState<ConflictResult[]>([])
  const [dateConflicts, setDateConflicts] = useState<DateConflict[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (newRehearsal || bulkData) {
      detectConflicts()
    } else {
      setConflicts([])
      setDateConflicts([])
    }

    return () => { abortRef.current?.abort() }
  }, [newRehearsal, bulkData])

  useEffect(() => {
    onConflictsChanged?.(conflicts)
  }, [conflicts, onConflictsChanged])

  const detectConflicts = async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)

    try {
      let dates: string[] = []
      let startTime = ''
      let endTime = ''
      let location = ''
      let groupId = ''

      if (newRehearsal) {
        if (!newRehearsal.date || !newRehearsal.startTime || !newRehearsal.endTime || !newRehearsal.location) {
          setConflicts([])
          setDateConflicts([])
          setLoading(false)
          return
        }
        dates = [newRehearsal.date]
        startTime = newRehearsal.startTime
        endTime = newRehearsal.endTime
        location = newRehearsal.location
        groupId = newRehearsal.groupId
      } else if (bulkData) {
        if (!bulkData.startDate || !bulkData.endDate || !bulkData.startTime || !bulkData.endTime || !bulkData.location) {
          setConflicts([])
          setDateConflicts([])
          setLoading(false)
          return
        }
        dates = generateRehearsalDates(bulkData)
        startTime = bulkData.startTime
        endTime = bulkData.endTime
        location = bulkData.location
        groupId = bulkData.orchestraId
      }

      if (dates.length === 0) {
        setConflicts([])
        setDateConflicts([])
        setLoading(false)
        return
      }

      const result = await rehearsalService.checkConflicts({
        dates,
        startTime,
        endTime,
        location,
        groupId,
      })

      // Abort check — if this request was superseded, ignore its result
      if (abortRef.current?.signal.aborted) return

      const mappedConflicts: ConflictResult[] = []
      const rawDateConflicts: DateConflict[] = result.dateConflicts || []

      for (const dc of rawDateConflicts) {
        for (const rc of dc.roomConflicts || []) {
          mappedConflicts.push({
            hasConflict: true,
            conflictType: 'location',
            severity: 'critical',
            message: rc.description || `חפיפה במיקום: ${rc.room}`,
            affectedDate: dc.date,
          })
        }
        for (const tc of dc.teacherConflicts || []) {
          mappedConflicts.push({
            hasConflict: true,
            conflictType: 'conductor',
            severity: 'critical',
            message: tc.description || 'אותו מנצח בשני מקומות',
            affectedDate: dc.date,
          })
        }
      }

      setConflicts(mappedConflicts)
      setDateConflicts(rawDateConflicts)
    } catch (error) {
      if (abortRef.current?.signal.aborted) return
      console.error('Error detecting conflicts:', error)
      setConflicts([])
      setDateConflicts([])
    } finally {
      setLoading(false)
    }
  }

  const criticalConflicts = conflicts.filter((c) => c.severity === 'critical')
  const warningConflicts = conflicts.filter((c) => c.severity === 'warning')

  if (loading) {
    return (
      <div className="bg-muted rounded-card p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
          <span className="text-sm text-muted-foreground">בודק התנגשויות...</span>
        </div>
      </div>
    )
  }

  if (conflicts.length === 0 && (newRehearsal || bulkData)) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-card p-4">
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
      <div className="bg-muted rounded-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-foreground">סיכום התנגשויות</h4>
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
      </div>

      {/* Detailed Conflicts */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {conflicts.map((conflict, index) => (
          <div
            key={index}
            className={`border rounded-card p-3 ${
              conflict.severity === 'critical'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {conflict.severity === 'critical' ? (
                <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <WarningIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {conflict.conflictType === 'location' ? (
                    <MapPinIcon className="w-4 h-4" />
                  ) : conflict.conflictType === 'conductor' ? (
                    <UserIcon className="w-4 h-4" />
                  ) : (
                    <ClockIcon className="w-4 h-4" />
                  )}
                  <span className="font-medium text-sm">{conflict.message}</span>
                </div>

                {conflict.affectedDate && (
                  <div className="text-xs opacity-75 mt-1">
                    תאריך מתנגש:{' '}
                    {new Date(
                      conflict.affectedDate + (conflict.affectedDate.includes('T') ? '' : 'T12:00:00'),
                    ).toLocaleDateString('he-IL')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Recommendations */}
      {criticalConflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-card p-4">
          <h4 className="font-medium text-red-900 mb-2">פעולות מומלצות לפתרון:</h4>
          <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
            {criticalConflicts.some((c) => c.conflictType === 'location') && (
              <li>שנה את מיקום החזרה או בחר זמן אחר</li>
            )}
            {criticalConflicts.some((c) => c.conflictType === 'conductor') && (
              <li>תאם עם המנצח או שנה את זמן החזרה</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
