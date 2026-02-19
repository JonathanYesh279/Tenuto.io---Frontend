import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Users, Plus, Eye, UserCheck } from 'lucide-react'
import { OrchestraTabProps, OrchestraRehearsal } from '../../types'
import apiService from '../../../../../services/apiService'

const ScheduleTab: React.FC<OrchestraTabProps> = ({
  orchestraId,
  orchestra,
  isLoading,
}) => {
  const [rehearsals, setRehearsals] = useState<OrchestraRehearsal[]>([])
  const [isLoadingRehearsals, setIsLoadingRehearsals] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orchestra) {
      loadRehearsals()
    }
  }, [orchestra])

  const loadRehearsals = async () => {
    if (!orchestraId) return

    try {
      setIsLoadingRehearsals(true)
      setError(null)
      
      // Load rehearsals for this orchestra
      const rehearsalsData = await apiService.rehearsals.getOrchestraRehearsals?.(orchestraId) || []
      
      // Sort by date, most recent first
      const sortedRehearsals = rehearsalsData.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      setRehearsals(sortedRehearsals)
    } catch (error) {
      console.error('Error loading rehearsals:', error)
      setError('שגיאה בטעינת חזרות')
    } finally {
      setIsLoadingRehearsals(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    } catch {
      return dateString
    }
  }

  const getAttendanceStats = (rehearsal: OrchestraRehearsal) => {
    if (!rehearsal.attendance) {
      return { present: 0, absent: 0, total: orchestra?.memberIds?.length || 0 }
    }
    
    const present = rehearsal.attendance.present?.length || 0
    const absent = rehearsal.attendance.absent?.length || 0
    const total = orchestra?.memberIds?.length || 0
    
    return { present, absent, total }
  }

  const getAttendancePercentage = (rehearsal: OrchestraRehearsal) => {
    const stats = getAttendanceStats(rehearsal)
    if (stats.total === 0) return 0
    return Math.round((stats.present / stats.total) * 100)
  }

  const isUpcomingRehearsal = (dateString: string) => {
    const rehearsalDate = new Date(dateString)
    const now = new Date()
    return rehearsalDate > now
  }

  if (isLoading || isLoadingRehearsals) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!orchestra) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">לא נמצאו נתוני תזמורת</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          לוח זמנים וחזרות ({rehearsals.length})
        </h3>
        <button
          onClick={() => window.open('/rehearsals', '_blank')}
          className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4 ml-1" />
          הוסף חזרה
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Rehearsals List */}
      {rehearsals.length > 0 ? (
        <div className="space-y-4">
          {rehearsals.map((rehearsal) => {
            const stats = getAttendanceStats(rehearsal)
            const attendancePercentage = getAttendancePercentage(rehearsal)
            const isUpcoming = isUpcomingRehearsal(rehearsal.date)
            
            return (
              <div 
                key={rehearsal._id} 
                className={`p-4 border rounded ${
                  isUpcoming 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Date and Time */}
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 ml-2" />
                        <span className="font-medium text-gray-900">
                          {formatDate(rehearsal.date)}
                        </span>
                      </div>
                      {isUpcoming && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          עתידית
                        </span>
                      )}
                    </div>

                    {/* Time and Location */}
                    <div className="flex items-center gap-6 mb-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{rehearsal.startTime} - {rehearsal.endTime}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 ml-2" />
                        <span>{rehearsal.location}</span>
                      </div>
                    </div>

                    {/* Attendance */}
                    {rehearsal.attendance && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 ml-2" />
                          <span className="text-sm text-gray-600">
                            נוכחות: {stats.present} מתוך {stats.total}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 ml-2">
                            <div 
                              className={`h-2 rounded-full ${
                                attendancePercentage >= 80 ? 'bg-green-500' :
                                attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${attendancePercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {attendancePercentage}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {rehearsal.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>הערות:</strong> {rehearsal.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!isUpcoming && rehearsal.attendance && (
                      <button
                        onClick={() => window.open(`/rehearsals/${rehearsal._id}`, '_blank')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="צפה בנוכחות"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/rehearsals/${rehearsal._id}`, '_blank')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="צפה בפרטים"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין חזרות מתוכננות</h3>
          <p className="text-gray-600 mb-4">התחל על ידי הוספת החזרה הראשונה</p>
          <button
            onClick={() => window.open('/rehearsals', '_blank')}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4 ml-1" />
            הוסף חזרה ראשונה
          </button>
        </div>
      )}

      {/* Summary Statistics */}
      {rehearsals.length > 0 && (
        <div className="mt-8 p-4 bg-muted/30 rounded">
          <h4 className="font-medium text-gray-900 mb-3">סיכום סטטיסטי</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">סה"כ חזרות:</span>
              <span className="font-medium text-gray-900 mr-2">{rehearsals.length}</span>
            </div>
            <div>
              <span className="text-gray-600">חזרות עתידיות:</span>
              <span className="font-medium text-gray-900 mr-2">
                {rehearsals.filter(r => isUpcomingRehearsal(r.date)).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">חזרות שהתקיימו:</span>
              <span className="font-medium text-gray-900 mr-2">
                {rehearsals.filter(r => !isUpcomingRehearsal(r.date)).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleTab