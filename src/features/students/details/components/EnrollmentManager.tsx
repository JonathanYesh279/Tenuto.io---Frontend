/**
 * Enrollment Manager Component
 * 
 * Handles orchestra and ensemble enrollment management including:
 * - Viewing available orchestras/ensembles
 * - Checking eligibility
 * - Managing enrollments (add/remove)
 * - Displaying conflicts and requirements
 */

import React, { useState } from 'react'

import { CalendarIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon, MapPinIcon, MinusIcon, MusicNotesIcon, PlusIcon, StarIcon, UsersIcon, WarningIcon, XCircleIcon } from '@phosphor-icons/react'
import {
  useEnrollmentManager,
  useStudentOrchestraEnrollments,
  useStudentEnsembleEnrollments 
} from '../hooks/useOrchestraEnrollment'
import { Orchestra, Ensemble, ScheduleConflict } from '@/services/orchestraEnrollmentApi'

interface EnrollmentManagerProps {
  studentId: string
  student: any
  onEnrollmentChange?: () => void
}

const EnrollmentManager: React.FC<EnrollmentManagerProps> = ({ 
  studentId, 
  student,
  onEnrollmentChange 
}) => {
  const [activeTab, setActiveTab] = useState<'orchestras' | 'ensembles'>('orchestras')
  const [showEligibilityDetails, setShowEligibilityDetails] = useState<string | null>(null)

  const enrollmentManager = useEnrollmentManager(studentId)
  
  // Current enrollments
  const currentOrchestras = useStudentOrchestraEnrollments(
    studentId, 
    student?.orchestraIds || []
  )
  const currentEnsembles = useStudentEnsembleEnrollments(
    studentId, 
    student?.ensembleIds || []
  )

  const handleEnroll = async (type: 'orchestra' | 'ensemble', id: string) => {
    try {
      if (type === 'orchestra') {
        await enrollmentManager.enrollInOrchestra(id)
      } else {
        await enrollmentManager.enrollInEnsemble(id)
      }
      onEnrollmentChange?.()
    } catch (error) {
      console.error('Enrollment failed:', error)
    }
  }

  const handleUnenroll = async (type: 'orchestra' | 'ensemble', id: string) => {
    try {
      if (type === 'orchestra') {
        await enrollmentManager.unenrollFromOrchestra(id)
      } else {
        await enrollmentManager.unenrollFromEnsemble(id)
      }
      onEnrollmentChange?.()
    } catch (error) {
      console.error('Unenrollment failed:', error)
    }
  }

  const isEnrolled = (type: 'orchestra' | 'ensemble', id: string): boolean => {
    if (type === 'orchestra') {
      return student?.orchestraIds?.includes(id) || false
    }
    return student?.ensembleIds?.includes(id) || false
  }

  const renderConflicts = (conflicts: ScheduleConflict[]) => {
    if (!conflicts || conflicts.length === 0) return null

    return (
      <div className="mt-3 space-y-2">
        <h5 className="text-sm font-medium text-red-700 flex items-center gap-1">
          <WarningIcon className="w-4 h-4" />
          התנגשויות בלוח הזמנים
        </h5>
        {conflicts.map((conflict, index) => (
          <div 
            key={index} 
            className={`p-2 rounded text-xs ${
              conflict.severity === 'overlap' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}
          >
            <div className="font-medium">{conflict.conflictWith}</div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span>{conflict.day}</span>
              <ClockIcon className="w-3 h-3" />
              <span>{conflict.startTime} - {conflict.endTime}</span>
              <span className="text-xs opacity-75">
                {conflict.severity === 'overlap' ? '(חופפים)' : '(סמוכים)'}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderOrchestraCard = (orchestra: Orchestra) => {
    const enrolled = isEnrolled('orchestra', orchestra._id)
    const canEnroll = !enrolled && enrollmentManager.orchestraEligibility?.canEnroll

    return (
      <div 
        key={orchestra._id} 
        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MusicNotesIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-gray-900">{orchestra.name}</h4>
              {orchestra.conductor && (
                <p className="text-sm text-gray-600">מנצח: {orchestra.conductor}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  orchestra.level === 'beginner' ? 'bg-green-100 text-green-800' :
                  orchestra.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  orchestra.level === 'advanced' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {orchestra.level === 'beginner' ? 'מתחילים' :
                   orchestra.level === 'intermediate' ? 'בינוני' :
                   orchestra.level === 'advanced' ? 'מתקדמים' : 'מעורב'}
                </span>
                {orchestra.maxMembers && (
                  <span>
                    {orchestra.currentMembers || 0}/{orchestra.maxMembers} חברים
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enrolled && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircleIcon className="w-4 h-4" />
                רשום
              </span>
            )}
          </div>
        </div>

        {orchestra.description && (
          <p className="text-sm text-gray-600 mb-4">{orchestra.description}</p>
        )}

        {/* Rehearsal Times */}
        {orchestra.rehearsalTimes && orchestra.rehearsalTimes.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">זמני חזרות</h5>
            <div className="space-y-1">
              {orchestra.rehearsalTimes.map((rehearsal, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{rehearsal.day}</span>
                  <ClockIcon className="w-3 h-3" />
                  <span>{rehearsal.startTime} - {rehearsal.endTime}</span>
                  {rehearsal.location && (
                    <>
                      <MapPinIcon className="w-3 h-3" />
                      <span>{rehearsal.location}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Instruments */}
        {orchestra.instruments && orchestra.instruments.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">כלים נדרשים</h5>
            <div className="flex flex-wrap gap-1">
              {orchestra.instruments.map((instrument, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {instrument}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cost */}
        {orchestra.yearlyFee && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <CurrencyDollarIcon className="w-4 h-4" />
            <span>תשלום שנתי: ₪{orchestra.yearlyFee}</span>
          </div>
        )}

        {/* Eligibility Check */}
        {!enrolled && showEligibilityDetails === orchestra._id && enrollmentManager.orchestraEligibility && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {enrollmentManager.orchestraEligibility.canEnroll ? (
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium text-sm">
                {enrollmentManager.orchestraEligibility.canEnroll ? 'ניתן להירשם' : 'לא ניתן להירשם'}
              </span>
            </div>
            
            {!enrollmentManager.orchestraEligibility.canEnroll && (
              <div className="space-y-1 text-sm text-red-600">
                {enrollmentManager.orchestraEligibility.reasons.map((reason, index) => (
                  <div key={index}>• {reason}</div>
                ))}
              </div>
            )}

            {renderConflicts(enrollmentManager.orchestraEligibility.conflicts)}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          {enrolled ? (
            <button
              onClick={() => handleUnenroll('orchestra', orchestra._id)}
              disabled={enrollmentManager.isUnenrollingOrchestra}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <MinusIcon className="w-4 h-4" />
              {enrollmentManager.isUnenrollingOrchestra ? 'מבטל...' : 'בטל רישום'}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  enrollmentManager.setSelectedOrchestra(orchestra._id)
                  setShowEligibilityDetails(
                    showEligibilityDetails === orchestra._id ? null : orchestra._id
                  )
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                <WarningIcon className="w-4 h-4" />
                בדוק זכאות
              </button>
              
              {canEnroll && (
                <button
                  onClick={() => handleEnroll('orchestra', orchestra._id)}
                  disabled={enrollmentManager.isEnrollingOrchestra}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  {enrollmentManager.isEnrollingOrchestra ? 'נרשם...' : 'הירשם'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  const renderEnsembleCard = (ensemble: Ensemble) => {
    const enrolled = isEnrolled('ensemble', ensemble._id)
    const canEnroll = !enrolled && enrollmentManager.ensembleEligibility?.canEnroll

    return (
      <div 
        key={ensemble._id} 
        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-gray-900">{ensemble.name}</h4>
              {ensemble.director && (
                <p className="text-sm text-gray-600">מנהל אמנותי: {ensemble.director}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {ensemble.type === 'chamber' ? 'מוזיקה קאמרית' :
                   ensemble.type === 'jazz' ? 'ג׳אז' :
                   ensemble.type === 'choir' ? 'מקהלה' :
                   ensemble.type === 'band' ? 'להקה' : 'אחר'}
                </span>
                {ensemble.maxMembers && (
                  <span>
                    {ensemble.currentMembers || 0}/{ensemble.maxMembers} חברים
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enrolled && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircleIcon className="w-4 h-4" />
                רשום
              </span>
            )}
          </div>
        </div>

        {ensemble.description && (
          <p className="text-sm text-gray-600 mb-4">{ensemble.description}</p>
        )}

        {/* Similar structure to orchestra card but with ensemble-specific styling */}
        {/* Rehearsal Times */}
        {ensemble.rehearsalTimes && ensemble.rehearsalTimes.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">זמני חזרות</h5>
            <div className="space-y-1">
              {ensemble.rehearsalTimes.map((rehearsal, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{rehearsal.day}</span>
                  <ClockIcon className="w-3 h-3" />
                  <span>{rehearsal.startTime} - {rehearsal.endTime}</span>
                  {rehearsal.location && (
                    <>
                      <MapPinIcon className="w-3 h-3" />
                      <span>{rehearsal.location}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Instruments */}
        {ensemble.instruments && ensemble.instruments.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">כלים נדרשים</h5>
            <div className="flex flex-wrap gap-1">
              {ensemble.instruments.map((instrument, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {instrument}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cost */}
        {ensemble.yearlyFee && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <CurrencyDollarIcon className="w-4 h-4" />
            <span>תשלום שנתי: ₪{ensemble.yearlyFee}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          {enrolled ? (
            <button
              onClick={() => handleUnenroll('ensemble', ensemble._id)}
              disabled={enrollmentManager.isUnenrollingEnsemble}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <MinusIcon className="w-4 h-4" />
              {enrollmentManager.isUnenrollingEnsemble ? 'מבטל...' : 'בטל רישום'}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  enrollmentManager.setSelectedEnsemble(ensemble._id)
                  setShowEligibilityDetails(
                    showEligibilityDetails === ensemble._id ? null : ensemble._id
                  )
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                <WarningIcon className="w-4 h-4" />
                בדוק זכאות
              </button>
              
              {canEnroll && (
                <button
                  onClick={() => handleEnroll('ensemble', ensemble._id)}
                  disabled={enrollmentManager.isEnrollingEnsemble}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  {enrollmentManager.isEnrollingEnsemble ? 'נרשם...' : 'הירשם'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  if (enrollmentManager.isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('orchestras')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'orchestras'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MusicNotesIcon className="w-4 h-4" />
            תזמורות ({enrollmentManager.availableOrchestras.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('ensembles')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'ensembles'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <UsersIcon className="w-4 h-4" />
            הרכבים ({enrollmentManager.availableEnsembles.length})
          </div>
        </button>
      </div>

      {/* Current Enrollments Summary */}
      {((student?.orchestraIds && student.orchestraIds.length > 0) || 
        (student?.ensembleIds && student.ensembleIds.length > 0)) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
            <StarIcon className="w-4 h-4" />
            הרשמות קיימות
          </h3>
          <div className="space-y-1 text-sm text-green-800">
            {student?.orchestraIds?.length > 0 && (
              <div>• רשום ל-{student.orchestraIds.length} תזמורות</div>
            )}
            {student?.ensembleIds?.length > 0 && (
              <div>• רשום ל-{student.ensembleIds.length} הרכבים</div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'orchestras' ? (
          enrollmentManager.availableOrchestras.length > 0 ? (
            enrollmentManager.availableOrchestras.map(renderOrchestraCard)
          ) : (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <MusicNotesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">אין תזמורות זמינות</h3>
              <p className="text-sm text-gray-500">כרגע אין תזמורות פתוחות להרשמה</p>
            </div>
          )
        ) : (
          enrollmentManager.availableEnsembles.length > 0 ? (
            enrollmentManager.availableEnsembles.map(renderEnsembleCard)
          ) : (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">אין הרכבים זמינים</h3>
              <p className="text-sm text-gray-500">כרגע אין הרכבים פתוחים להרשמה</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default EnrollmentManager