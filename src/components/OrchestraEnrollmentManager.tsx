import React, { useState, useMemo } from 'react'
import { CheckCircleIcon, ClockIcon, FunnelIcon, MusicNotesIcon, PlusIcon, TrashIcon, UserIcon, UsersIcon, WarningIcon, XIcon } from '@phosphor-icons/react'


interface Orchestra {
  id: string
  name: string
  conductorName: string
  rehearsalDay: string
  rehearsalTime: string
  type: 'orchestra' | 'ensemble'
  currentEnrollment: number
  maxEnrollment: number
  instrumentSections?: string[]
}

interface Enrollment {
  id: string
  orchestraId: string
  orchestraName: string
  conductorName: string
  rehearsalDay: string
  rehearsalTime: string
  instrumentSection?: string
  enrollmentDate: Date
  type: 'orchestra' | 'ensemble'
}

interface Conflict {
  orchestraId: string
  conflictsWith: string
  conflictTime: string
  severity: 'warning' | 'error'
}

interface OrchestraEnrollmentManagerProps {
  studentId: string
  currentEnrollments: Enrollment[]
  availableOrchestras: Orchestra[]
  conflicts?: Conflict[]
  onEnroll: (orchestraId: string) => Promise<void>
  onUnenroll: (enrollmentId: string) => Promise<void>
}

const OrchestraEnrollmentManager: React.FC<OrchestraEnrollmentManagerProps> = ({
  studentId,
  currentEnrollments,
  availableOrchestras,
  conflicts = [],
  onEnroll,
  onUnenroll
}) => {
  const [filterType, setFilterType] = useState<'all' | 'orchestra' | 'ensemble'>('all')
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'enroll' | 'unenroll'
    orchestra?: Orchestra
    enrollment?: Enrollment
  } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  // FunnelIcon available orchestras
  const filteredOrchestras = useMemo(() => {
    const enrolledIds = currentEnrollments.map(e => e.orchestraId)
    const available = availableOrchestras.filter(o => !enrolledIds.includes(o.id))
    
    if (filterType === 'all') return available
    return available.filter(o => o.type === filterType)
  }, [availableOrchestras, currentEnrollments, filterType])

  // Get conflict for orchestra
  const getConflict = (orchestraId: string) => {
    return conflicts.find(c => c.orchestraId === orchestraId)
  }

  // Handle enrollment
  const handleEnroll = async (orchestra: Orchestra) => {
    setLoading(orchestra.id)
    try {
      await onEnroll(orchestra.id)
      setConfirmDialog(null)
    } catch (error) {
      console.error('Enrollment failed:', error)
    } finally {
      setLoading(null)
    }
  }

  // Handle unenrollment
  const handleUnenroll = async (enrollment: Enrollment) => {
    setLoading(enrollment.id)
    try {
      await onUnenroll(enrollment.id)
      setConfirmDialog(null)
    } catch (error) {
      console.error('Unenrollment failed:', error)
    } finally {
      setLoading(null)
    }
  }

  // Get Hebrew day name
  const getHebrewDay = (day: string) => {
    const dayMap: Record<string, string> = {
      'Sunday': 'ראשון',
      'Monday': 'שני', 
      'Tuesday': 'שלישי',
      'Wednesday': 'רביעי',
      'Thursday': 'חמישי',
      'Friday': 'שישי',
      'Saturday': 'שבת'
    }
    return dayMap[day] || day
  }

  return (
    <div className="space-y-8 p-6">
      {/* Current Enrollments Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <UsersIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">התזמורות וההרכבים שלי</h2>
        </div>

        {currentEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentEnrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-white border-2 border-blue-500 rounded p-6 shadow-sm hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {enrollment.type === 'orchestra' ? (
                      <MusicNotesIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <UsersIcon className="w-5 h-5 text-blue-600" />
                    )}
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {enrollment.type === 'orchestra' ? 'תזמורת' : 'הרכב'}
                    </span>
                  </div>
                  <button
                    onClick={() => setConfirmDialog({ type: 'unenroll', enrollment })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={loading === enrollment.id}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Orchestra Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    {enrollment.orchestraName}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm">{enrollment.conductorName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-sm">
                      יום {getHebrewDay(enrollment.rehearsalDay)} {enrollment.rehearsalTime}
                    </span>
                  </div>
                  
                  {enrollment.instrumentSection && (
                    <div className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-lg">
                      {enrollment.instrumentSection}
                    </div>
                  )}
                </div>

                {/* Enrollment Status */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">רשום</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              לא רשום לתזמורות או הרכבים
            </h3>
            <p className="text-gray-500 text-sm">
              בחר מהתזמורות הזמינות למטה כדי להירשם
            </p>
          </div>
        )}
      </div>

      {/* Available Orchestras Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MusicNotesIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">תזמורות והרכבים זמינים להרשמה</h2>
          </div>
          
          {/* FunnelIcon Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilterType('orchestra')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'orchestra'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              תזמורות
            </button>
            <button
              onClick={() => setFilterType('ensemble')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'ensemble'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              הרכבים
            </button>
          </div>
        </div>

        {filteredOrchestras.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrchestras.map((orchestra) => {
              const conflict = getConflict(orchestra.id)
              const isFull = orchestra.currentEnrollment >= orchestra.maxEnrollment
              const canEnroll = !conflict && !isFull

              return (
                <div
                  key={orchestra.id}
                  className="bg-white border-2 border-gray-200 rounded p-6 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {orchestra.type === 'orchestra' ? (
                        <MusicNotesIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <UsersIcon className="w-5 h-5 text-gray-600" />
                      )}
                      <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                        {orchestra.type === 'orchestra' ? 'תזמורת' : 'הרכב'}
                      </span>
                    </div>
                    
                    {conflict && (
                      <div className="relative group">
                        <WarningIcon className="w-5 h-5 text-orange-500" />
                        <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-orange-100 text-orange-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          מתנגש עם {conflict.conflictsWith} ב{conflict.conflictTime}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Orchestra Info */}
                  <div className="space-y-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {orchestra.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserIcon className="w-4 h-4" />
                      <span className="text-sm">{orchestra.conductorName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <ClockIcon className="w-4 h-4" />
                      <span className="text-sm">
                        יום {getHebrewDay(orchestra.rehearsalDay)} {orchestra.rehearsalTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">נרשמים:</span>
                      <span className={`font-medium ${
                        isFull ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {orchestra.currentEnrollment}/{orchestra.maxEnrollment} תלמידים
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setConfirmDialog({ type: 'enroll', orchestra })}
                    disabled={!canEnroll || loading === orchestra.id}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      canEnroll
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading === orchestra.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        {isFull ? 'מלא' : conflict ? 'מתנגש' : 'הרשם'}
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
            <FunnelIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              אין תזמורות זמינות
            </h3>
            <p className="text-gray-500 text-sm">
              נסה לשנות את הסינון או חזור מאוחר יותר
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              {confirmDialog.type === 'enroll' ? (
                <div className="p-2 bg-green-100 rounded-lg">
                  <PlusIcon className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900">
                {confirmDialog.type === 'enroll' ? 'הרשמה לתזמורת' : 'הסרה מתזמורת'}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {confirmDialog.type === 'enroll' 
                ? `להוסיף את התלמיד לתזמורת "${confirmDialog.orchestra?.name}"?`
                : `להסיר את התלמיד מתזמורת "${confirmDialog.enrollment?.orchestraName}"?`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.type === 'enroll' && confirmDialog.orchestra) {
                    handleEnroll(confirmDialog.orchestra)
                  } else if (confirmDialog.type === 'unenroll' && confirmDialog.enrollment) {
                    handleUnenroll(confirmDialog.enrollment)
                  }
                }}
                className={`flex-1 py-2 px-4 text-white rounded-lg transition-colors ${
                  confirmDialog.type === 'enroll' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmDialog.type === 'enroll' ? 'הרשם' : 'הסר'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrchestraEnrollmentManager