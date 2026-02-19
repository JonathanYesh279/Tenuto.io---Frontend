import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, Clock, MapPin, Users, Edit, Trash2, CheckCircle, XCircle, Check, X, Search, Save, RotateCcw } from 'lucide-react'
import { rehearsalService, orchestraService, studentService } from '../services/apiService'
import { 
  formatRehearsalDateTime, 
  getRehearsalStatus,
  calculateAttendanceStats,
  getRehearsalColor,
  type Rehearsal 
} from '../utils/rehearsalUtils'
import { Card } from '../components/ui/Card'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import RehearsalForm from '../components/RehearsalForm'
import { getDisplayName } from '@/utils/nameUtils'

export default function RehearsalDetails() {
  const { rehearsalId } = useParams<{ rehearsalId: string }>()
  const navigate = useNavigate()
  
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null)
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false)
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null)
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false)
  const [bulkUpdateError, setBulkUpdateError] = useState<string | null>(null)
  
  // Attendance state
  const [attendanceState, setAttendanceState] = useState<{
    present: Set<string>
    absent: Set<string>
  }>({
    present: new Set(),
    absent: new Set()
  })
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('')
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [hasAttendanceChanges, setHasAttendanceChanges] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [attendanceSuccess, setAttendanceSuccess] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (rehearsalId) {
      loadRehearsalDetails()
    }
  }, [rehearsalId])

  const loadRehearsalDetails = async () => {
    if (!rehearsalId) return

    try {
      setLoading(true)
      setError(null)

      const [rehearsalsData, orchestrasData, studentsData] = await Promise.all([
        rehearsalService.getRehearsals(),
        orchestraService.getOrchestras(),
        studentService.getStudents()
      ])

      // Find the specific rehearsal and enrich it with orchestra data
      const foundRehearsal = rehearsalsData.find((r: Rehearsal) => r._id === rehearsalId)
      if (!foundRehearsal) {
        setError('החזרה לא נמצאה')
        return
      }

      const orchestra = orchestrasData.find((orch: any) => orch._id === foundRehearsal.groupId)
      const enrichedRehearsal = {
        ...foundRehearsal,
        orchestra: orchestra ? {
          _id: orchestra._id,
          name: orchestra.name,
          type: orchestra.type,
          memberIds: orchestra.memberIds || [],
          conductor: orchestra.conductor,
          // Populate members with full student data
          members: orchestra.memberIds ? orchestra.memberIds.map((memberId: string) =>
            studentsData.find((student: any) => student._id === memberId)
          ).filter(Boolean) : []
        } : undefined
      }

      setRehearsal(enrichedRehearsal)
      setOrchestras(orchestrasData)
      
      // Initialize attendance state
      setAttendanceState({
        present: new Set(foundRehearsal.attendance?.present || []),
        absent: new Set(foundRehearsal.attendance?.absent || [])
      })
    } catch (error: any) {
      console.error('Error loading rehearsal details:', error)
      setError('שגיאה בטעינת פרטי החזרה')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRehearsal = async (data: any) => {
    if (!rehearsal) return

    // Store the update data and show bulk update confirmation
    setPendingUpdateData(data)
    setShowEditForm(false)
    setBulkUpdateError(null)
    setShowBulkUpdateModal(true)
  }

  const handleSingleUpdate = async () => {
    if (!rehearsal || !pendingUpdateData) return

    setBulkUpdateLoading(true)
    setBulkUpdateError(null)

    try {
      await rehearsalService.updateRehearsal(rehearsal._id, pendingUpdateData)
      setShowBulkUpdateModal(false)
      setPendingUpdateData(null)
      await loadRehearsalDetails()
    } catch (error: any) {
      setBulkUpdateError(error.message || 'שגיאה בעדכון החזרה')
    } finally {
      setBulkUpdateLoading(false)
    }
  }

  const handleBulkUpdate = async () => {
    if (!rehearsal || !pendingUpdateData) return

    setBulkUpdateLoading(true)
    setBulkUpdateError(null)

    try {
      // Filter out forbidden fields for bulk update
      const forbiddenFields = ['_id', 'createdAt', 'updatedAt', 'groupId', 'date', 'schoolYearId', 'type']
      const filteredData = Object.keys(pendingUpdateData)
        .filter(key => !forbiddenFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = pendingUpdateData[key]
          return obj
        }, {})

      await rehearsalService.updateBulkRehearsals(rehearsal.groupId, filteredData)
      setShowBulkUpdateModal(false)
      setPendingUpdateData(null)
      await loadRehearsalDetails()
    } catch (error: any) {
      setBulkUpdateError(error.message || 'שגיאה בעדכון החזרות')
    } finally {
      setBulkUpdateLoading(false)
    }
  }

  const cancelBulkUpdate = () => {
    setShowBulkUpdateModal(false)
    setPendingUpdateData(null)
    setBulkUpdateError(null)
  }

  const handleDeleteRehearsal = () => {
    setShowDeleteModal(true)
  }

  const confirmDeleteRehearsal = async () => {
    if (!rehearsal) return

    try {
      await rehearsalService.deleteRehearsal(rehearsal._id)
      navigate('/rehearsals')
    } catch (error: any) {
      setError('שגיאה במחיקת החזרה')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const cancelDeleteRehearsal = () => {
    setShowDeleteModal(false)
  }

  // Attendance functions
  useEffect(() => {
    if (!rehearsal) return
    
    // Check if there are changes
    const originalPresent = new Set(rehearsal.attendance?.present || [])
    const originalAbsent = new Set(rehearsal.attendance?.absent || [])
    
    const hasChanges = 
      originalPresent.size !== attendanceState.present.size ||
      originalAbsent.size !== attendanceState.absent.size ||
      [...attendanceState.present].some(id => !originalPresent.has(id)) ||
      [...attendanceState.absent].some(id => !originalAbsent.has(id))
    
    setHasAttendanceChanges(hasChanges)
  }, [attendanceState, rehearsal])

  const handleAttendanceChange = (memberId: string, status: 'present' | 'absent' | 'unmarked') => {
    setAttendanceState(prev => {
      const newState = {
        present: new Set(prev.present),
        absent: new Set(prev.absent)
      }

      // Remove from both sets first
      newState.present.delete(memberId)
      newState.absent.delete(memberId)

      // Add to appropriate set if not unmarked
      if (status === 'present') {
        newState.present.add(memberId)
      } else if (status === 'absent') {
        newState.absent.add(memberId)
      }

      return newState
    })
    setAttendanceError(null)
  }

  const handleQuickMarkAll = (status: 'present' | 'absent') => {
    if (!rehearsal?.orchestra?.members) return
    
    setAttendanceState(prev => {
      const newState = {
        present: new Set<string>(),
        absent: new Set<string>()
      }

      if (status === 'present') {
        rehearsal.orchestra!.members!.forEach(member => newState.present.add(member._id))
      } else {
        rehearsal.orchestra!.members!.forEach(member => newState.absent.add(member._id))
      }

      return newState
    })
    setAttendanceError(null)
  }

  const handleAttendanceReset = () => {
    if (!rehearsal) return
    
    setAttendanceState({
      present: new Set(rehearsal.attendance?.present || []),
      absent: new Set(rehearsal.attendance?.absent || [])
    })
    setAttendanceError(null)
  }

  // Enhanced Select All functionality
  const markAllPresent = useCallback(() => {
    if (!rehearsal?.orchestra?.members) return
    
    const allMemberIds = rehearsal.orchestra.members.map(member => member._id)
    setAttendanceState({
      present: new Set(allMemberIds),
      absent: new Set()
    })
    setAttendanceError(null)
  }, [rehearsal])

  const markAllAbsent = useCallback(() => {
    if (!rehearsal?.orchestra?.members) return
    
    const allMemberIds = rehearsal.orchestra.members.map(member => member._id)
    setAttendanceState({
      present: new Set(),
      absent: new Set(allMemberIds)
    })
    setAttendanceError(null)
  }, [rehearsal])

  const clearAllAttendance = useCallback(() => {
    setAttendanceState({
      present: new Set(),
      absent: new Set()
    })
    setAttendanceError(null)
  }, [])

  const handleSaveAttendance = async () => {
    if (!rehearsal) return
    
    setAttendanceLoading(true)
    setAttendanceError(null)

    try {
      const attendanceData = {
        present: [...attendanceState.present],
        absent: [...attendanceState.absent]
      }

      await rehearsalService.updateAttendance(rehearsal._id, attendanceData)
      setAttendanceSuccess(true)
      setTimeout(() => {
        setAttendanceSuccess(false)
        setShowAttendanceModal(false)
      }, 1500)
      await loadRehearsalDetails()
    } catch (error: any) {
      setAttendanceError(error.message || 'שגיאה בשמירת הנוכחות')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const getAttendanceStatus = (memberId: string): 'present' | 'absent' | 'unmarked' => {
    if (attendanceState.present.has(memberId)) return 'present'
    if (attendanceState.absent.has(memberId)) return 'absent'
    return 'unmarked'
  }

  // Check if rehearsal date has passed (for attendance management)
  const hasRehearsalPassed = useMemo(() => {
    if (!rehearsal) return false
    
    const rehearsalDate = new Date(rehearsal.date)
    const today = new Date()
    
    // Set both dates to midnight to compare dates only (not times)
    today.setHours(0, 0, 0, 0)
    rehearsalDate.setHours(0, 0, 0, 0)
    
    // Allow attendance marking for past rehearsals OR current day rehearsals
    return rehearsalDate <= today
  }, [rehearsal])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">טוען פרטי החזרה...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => navigate('/rehearsals')}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            חזור לחזרות
          </button>
        </div>
      </div>
    )
  }

  if (!rehearsal) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">החזרה לא נמצאה</h2>
          <button
            onClick={() => navigate('/rehearsals')}
            className="text-primary hover:text-neutral-700 underline"
          >
            חזור לחזרות
          </button>
        </div>
      </div>
    )
  }

  const status = getRehearsalStatus(rehearsal)
  const attendanceStats = calculateAttendanceStats(rehearsal)
  const color = getRehearsalColor(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/rehearsals')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="חזור לחזרות"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">פרטי החזרה</h1>
            <p className="text-gray-600 mt-1">{rehearsal.orchestra?.name || 'ללא שם'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasRehearsalPassed && (
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="flex items-center px-4 py-2 text-green-700 border border-green-300 rounded hover:bg-green-50 transition-colors"
            >
              <Check className="w-4 h-4 ml-1" />
              סימון נוכחות
            </button>
          )}
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 ml-1" />
            ערוך
          </button>
          <button
            onClick={handleDeleteRehearsal}
            className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            מחק
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Rehearsal Info Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {rehearsal.orchestra?.name || 'ללא שם'}
                </h2>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    rehearsal.type === 'תזמורת' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {rehearsal.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date & Time */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">תאריך</div>
                  <div className="text-gray-600">{dateTime.date}</div>
                  <div className="text-sm text-gray-500">{dateTime.dayName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">שעה</div>
                  <div className="text-gray-600">{dateTime.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">מיקום</div>
                  <div className="text-gray-600">{rehearsal.location || 'לא צוין מיקום'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">חברי התזמורת</div>
                  <div className="text-gray-600">
                    {rehearsal.orchestra?.members?.length || 0} חברים
                  </div>
                </div>
              </div>
            </div>

            {rehearsal.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="font-medium text-gray-900 mb-2">הערות</div>
                <div className="text-gray-600 whitespace-pre-wrap">{rehearsal.notes}</div>
              </div>
            )}

            {!hasRehearsalPassed && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mr-3">
                    <div className="text-sm text-blue-800">
                      <strong>חזרה עתידית:</strong> לא ניתן לסמן נוכחות לחזרות שטרם התרחשו. נוכחות תהיה זמינה החל מיום החזרה.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">ניהול נוכחות</h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={markAllPresent}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                >
                  <Check className="w-3 h-3 inline-block ml-1" />
                  סמן הכל נוכח
                </button>
                <button
                  onClick={markAllAbsent}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-3 h-3 inline-block ml-1" />
                  סמן הכל נעדר
                </button>
                <button
                  onClick={clearAllAttendance}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                >
                  נקה הכל
                </button>
                {hasAttendanceChanges && (
                  <button
                    onClick={handleAttendanceReset}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 mr-1 inline" />
                    שחזר מקור
                  </button>
                )}
              </div>
            </div>

            {/* Success Message */}
            {attendanceSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                  <span className="text-green-800 text-sm">הנוכחות נשמרה בהצלחה!</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {attendanceError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-600 ml-2" />
                  <span className="text-red-800 text-sm">{attendanceError}</span>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{attendanceState.present.size}</div>
                <div className="text-sm text-gray-600">נוכחים</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{attendanceState.absent.size}</div>
                <div className="text-sm text-gray-600">נעדרים</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {(rehearsal.orchestra?.members?.length || 0) - attendanceState.present.size - attendanceState.absent.size}
                </div>
                <div className="text-sm text-gray-600">לא סומנו</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{rehearsal.orchestra?.members?.length || 0}</div>
                <div className="text-sm text-gray-600">סה״כ</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש חבר..."
                value={attendanceSearchQuery}
                onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-border rounded focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Members List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {!rehearsal.orchestra?.members || rehearsal.orchestra.members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>אין חברים רשומים לתזמורת/הרכב זה</p>
                  <p className="text-sm mt-1">יש להוסיף חברים דרך עמוד התזמורת</p>
                </div>
              ) : rehearsal.orchestra.members
                .filter(member =>
                  getDisplayName(member.personalInfo).toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
                  member.academicInfo?.class?.includes(attendanceSearchQuery)
                )
                .map(member => {
                  const status = getAttendanceStatus(member._id)
                  return (
                    <div key={member._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{getDisplayName(member.personalInfo)}</div>
                        {member.academicInfo?.class && (
                          <div className="text-sm text-gray-500">{member.academicInfo.class}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAttendanceChange(member._id, status === 'present' ? 'unmarked' : 'present')}
                          className={`p-2 rounded transition-colors ${
                            status === 'present' 
                              ? 'bg-green-100 text-green-600 border-2 border-green-300' 
                              : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-green-50'
                          }`}
                          title="נוכח"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleAttendanceChange(member._id, status === 'absent' ? 'unmarked' : 'absent')}
                          className={`p-2 rounded transition-colors ${
                            status === 'absent' 
                              ? 'bg-red-100 text-red-600 border-2 border-red-300' 
                              : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-red-50'
                          }`}
                          title="נעדר"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Save Button */}
            {hasAttendanceChanges && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveAttendance}
                  disabled={attendanceLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary text-primary-foreground rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {attendanceLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      שמור נוכחות
                    </>
                  )}
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Confirmation Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">עדכון חזרות</h3>
                <button
                  onClick={cancelBulkUpdate}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h4 className="text-lg font-medium text-gray-900">איך ברצונך לעדכן?</h4>
                    <p className="text-gray-600">בחר את היקף העדכון לחזרות התזמורת</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <strong>תזמורת:</strong> {rehearsal?.orchestra?.name}<br />
                      <strong>שינויים:</strong> 
                      {pendingUpdateData?.location && ` מיקום: ${pendingUpdateData.location}`}
                      {pendingUpdateData?.startTime && ` | זמן התחלה: ${pendingUpdateData.startTime}`}
                      {pendingUpdateData?.endTime && ` | זמן סיום: ${pendingUpdateData.endTime}`}
                      {pendingUpdateData?.notes !== undefined && ` | הערות עודכנו`}
                      {pendingUpdateData?.isActive !== undefined && ` | סטטוס עודכן`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {bulkUpdateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-600 ml-2" />
                    <span className="text-red-800 text-sm">{bulkUpdateError}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSingleUpdate}
                  disabled={bulkUpdateLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {bulkUpdateLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      מעדכן...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5 ml-2" />
                      עדכון חזרה זו בלבד
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkUpdateLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary text-primary-foreground rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {bulkUpdateLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      מעדכן כל החזרות...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5 ml-2" />
                      עדכון כל החזרות של התזמורת
                    </>
                  )}
                </button>
                
                <button
                  onClick={cancelBulkUpdate}
                  disabled={bulkUpdateLoading}
                  className="w-full flex items-center justify-center px-4 py-3 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <RehearsalForm
          orchestras={orchestras}
          existingRehearsals={[]}
          onSubmit={handleEditRehearsal}
          onCancel={() => setShowEditForm(false)}
          initialData={{
            groupId: rehearsal.groupId,
            type: rehearsal.type,
            date: rehearsal.date.split('T')[0],
            startTime: rehearsal.startTime,
            endTime: rehearsal.endTime,
            location: rehearsal.location,
            notes: rehearsal.notes,
            isActive: rehearsal.isActive
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת חזרה"
        message="האם אתה בטוח שברצונך למחוק את החזרה? פעולה זו אינה ניתנת לביטול ותמחק את כל הנתונים הקשורים לחזרה כולל נוכחות שנרשמה."
        confirmText="מחק לצמיתות"
        cancelText="ביטול"
        onConfirm={confirmDeleteRehearsal}
        onCancel={cancelDeleteRehearsal}
        variant="danger"
      />

    </div>
  )
}