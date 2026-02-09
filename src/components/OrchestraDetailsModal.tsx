import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Users, 
  Calendar, 
  MapPin, 
  Music, 
  Star,
  Edit,
  Trash2,
  UserPlus,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Award,
  Activity,
  AlertCircle
} from 'lucide-react'
import { Card } from './ui/Card'
import { orchestraService, studentService, teacherService, rehearsalService } from '../services/apiService'
import { 
  getOrchestraTypeInfo,
  getOrchestraStatus,
  calculateOrchestraStats,
  getOrchestraReadiness,
  getMemberInstrumentsSummary,
  type Orchestra
} from '../utils/orchestraUtils'

interface OrchestraDetailsModalProps {
  orchestraId: string
  isOpen: boolean
  onClose: () => void
  onEdit?: (orchestra: Orchestra) => void
  onDelete?: (orchestraId: string) => void
  onManageMembers?: (orchestraId: string) => void
  refreshTrigger?: number // Add trigger to force refresh when members change
}

interface DetailedOrchestra extends Orchestra {
  memberDetails?: Array<{
    _id: string
    personalInfo: {
      fullName: string
      phone?: string
      email?: string
      studentEmail?: string
    }
    academicInfo?: {
      class?: string
      instrumentProgress?: Array<{
        instrumentName: string
        isPrimary: boolean
        currentStage: number
      }>
    }
  }>
  conductorDetails?: {
    _id: string
    personalInfo: {
      fullName: string
      email?: string
      phone?: string
    }
    professionalInfo?: {
      instrument?: string
    }
  }
  rehearsals?: Array<{
    _id: string
    date: string
    dayOfWeek: number
    startTime: string
    endTime: string
    location: string
    attendance?: {
      present: string[]
      absent: string[]
    }
    notes?: string
    isActive: boolean
  }>
}

export default function OrchestraDetailsModal({
  orchestraId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onManageMembers,
  refreshTrigger
}: OrchestraDetailsModalProps) {
  const [orchestra, setOrchestra] = useState<DetailedOrchestra | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'rehearsals' | 'analytics'>('info')

  useEffect(() => {
    if (isOpen && orchestraId) {
      loadOrchestraDetails()
    }
  }, [isOpen, orchestraId, refreshTrigger]) // Add refreshTrigger to dependencies

  const loadOrchestraDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load orchestra data
      const orchestraData = await orchestraService.getOrchestra(orchestraId)

      // Load related data in parallel
      const [allStudents, allTeachers, rehearsals] = await Promise.all([
        studentService.getStudents(),
        teacherService.getTeachers(),
        rehearsalService.getOrchestraRehearsals(orchestraId).catch(() => [])
      ])

      // Get member details
      const memberDetails = allStudents.filter(student => 
        orchestraData.memberIds?.includes(student._id)
      )

      // Get conductor details
      const conductorDetails = allTeachers.find(teacher => 
        teacher._id === orchestraData.conductorId
      )

      const detailedOrchestra: DetailedOrchestra = {
        ...orchestraData,
        memberDetails,
        conductorDetails,
        rehearsals
      }

      setOrchestra(detailedOrchestra)
    } catch (error) {
      console.error('Error loading orchestra details:', error)
      setError('שגיאה בטעינת פרטי התזמורת')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleBackdropClick}>
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 ml-2"></div>
            <span className="text-gray-700">טוען פרטי תזמורת...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !orchestra) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleBackdropClick}>
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 ml-2" />
            <h3 className="text-lg font-semibold text-gray-900">שגיאה</h3>
          </div>
          <p className="text-gray-600 mb-6">{error || 'תזמורת לא נמצאה'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    )
  }

  const typeInfo = getOrchestraTypeInfo(orchestra.type)
  const status = getOrchestraStatus(orchestra)
  const readiness = getOrchestraReadiness(orchestra)
  const instrumentsSummary = getMemberInstrumentsSummary(orchestra.memberDetails || [])

  // Calculate rehearsal statistics
  const rehearsalStats = {
    total: orchestra.rehearsals?.length || 0,
    completed: orchestra.rehearsals?.filter(r => new Date(r.date) < new Date()).length || 0,
    upcoming: orchestra.rehearsals?.filter(r => new Date(r.date) >= new Date()).length || 0,
    avgAttendance: orchestra.rehearsals && orchestra.rehearsals.length > 0 
      ? Math.round(
          orchestra.rehearsals
            .filter(r => r.attendance)
            .reduce((sum, r) => sum + (r.attendance!.present.length || 0), 0) / 
          Math.max(orchestra.rehearsals.filter(r => r.attendance).length, 1)
        )
      : 0
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
              <span className="text-xl text-white">{typeInfo.icon}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{orchestra.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                  {typeInfo.text}
                </span>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                  {status.text}
                </span>
                {readiness.isReady && (
                  <Star className="w-4 h-4 text-yellow-500" title="מוכן לביצוע" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(orchestra)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                עריכה
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(orchestra._id)}
                className="flex items-center gap-2 px-3 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                מחיקה
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'info', label: 'מידע כללי', icon: <Music className="w-4 h-4" /> },
            { key: 'members', label: `חברים (${orchestra.memberDetails?.length || 0})`, icon: <Users className="w-4 h-4" /> },
            { key: 'rehearsals', label: `חזרות (${rehearsalStats.total})`, icon: <Calendar className="w-4 h-4" /> },
            { key: 'analytics', label: 'ניתוח נתונים', icon: <TrendingUp className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטים בסיסיים</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">סוג הרכב</div>
                      <div className="text-sm text-gray-600">{typeInfo.text}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">מיקום</div>
                      <div className="text-sm text-gray-600">{orchestra.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">סטטוס</div>
                      <div className="text-sm text-gray-600">{status.text}</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Conductor Information */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי מנצח</h3>
                {orchestra.conductorDetails ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {orchestra.conductorDetails.personalInfo.fullName}
                        </div>
                        {orchestra.conductorDetails.professionalInfo?.instrument && (
                          <div className="text-sm text-gray-600">
                            {orchestra.conductorDetails.professionalInfo.instrument}
                          </div>
                        )}
                      </div>
                    </div>

                    {orchestra.conductorDetails.personalInfo.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {orchestra.conductorDetails.personalInfo.phone}
                        </span>
                      </div>
                    )}

                    {orchestra.conductorDetails.personalInfo.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {orchestra.conductorDetails.personalInfo.email}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">לא הוקצה מנצח</p>
                  </div>
                )}
              </Card>

              {/* Readiness Assessment */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">הערכת מוכנות</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">ציון כללי</span>
                    <span className={`font-semibold text-lg ${
                      readiness.score >= 75 ? 'text-green-600' :
                      readiness.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {readiness.score}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        readiness.score >= 75 ? 'bg-green-500' :
                        readiness.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${readiness.score}%` }}
                    />
                  </div>

                  {readiness.strengths.length > 0 && (
                    <div>
                      <div className="font-medium text-green-700 mb-2">נקודות חוזק:</div>
                      <ul className="space-y-1">
                        {readiness.strengths.map(strength => (
                          <li key={strength} className="text-sm text-green-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {readiness.issues.length > 0 && (
                    <div>
                      <div className="font-medium text-red-700 mb-2">נקודות לשיפור:</div>
                      <ul className="space-y-1">
                        {readiness.issues.map(issue => (
                          <li key={issue} className="text-sm text-red-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>

              {/* Instruments Summary */}
              {instrumentsSummary.totalInstruments > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">כלי נגינה</h3>
                  <div className="space-y-3">
                    {Object.entries(instrumentsSummary.instrumentCounts).map(([instrument, count]) => {
                      const isPrimary = instrumentsSummary.primaryInstruments.includes(instrument);
                      return (
                        <div key={instrument} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{instrument}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count} נגנים</span>
                            {isPrimary && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                                ראשי
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  חברי התזמורת ({orchestra.memberDetails?.length || 0})
                </h3>
                {onManageMembers && (
                  <button
                    onClick={() => onManageMembers(orchestra._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    ניהול חברים
                  </button>
                )}
              </div>

              {orchestra.memberDetails && orchestra.memberDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orchestra.memberDetails.map(member => {
                    const primaryInstrument = member.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
                    
                    return (
                      <Card key={member._id}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{member.personalInfo.fullName}</div>
                            <div className="text-sm text-gray-600">
                              {member.academicInfo?.class && `כיתה ${member.academicInfo.class}`}
                            </div>
                            {primaryInstrument && (
                              <div className="text-xs text-primary-600 mt-1">
                                {primaryInstrument.instrumentName} • שלב {primaryInstrument.currentStage}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">אין חברים רשומים</h4>
                  <p className="text-gray-600 mb-6">התחל על ידי הוספת חברים לתזמורת</p>
                  {onManageMembers && (
                    <button
                      onClick={() => onManageMembers(orchestra._id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      הוסף חברים
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rehearsals' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  חזרות ({rehearsalStats.total})
                </h3>
              </div>

              {orchestra.rehearsals && orchestra.rehearsals.length > 0 ? (
                <div className="space-y-4">
                  {orchestra.rehearsals
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(rehearsal => {
                      const isUpcoming = new Date(rehearsal.date) >= new Date()
                      const attendanceRate = rehearsal.attendance 
                        ? Math.round((rehearsal.attendance.present.length / 
                            Math.max(rehearsal.attendance.present.length + rehearsal.attendance.absent.length, 1)) * 100)
                        : 0

                      return (
                        <Card key={rehearsal._id} className={!rehearsal.isActive ? 'opacity-60' : ''}>
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {new Date(rehearsal.date).toLocaleDateString('he-IL')}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  isUpcoming ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {isUpcoming ? 'עתידה' : 'הסתיימה'}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{rehearsal.startTime} - {rehearsal.endTime}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{rehearsal.location}</span>
                                </div>
                              </div>

                              {rehearsal.notes && (
                                <p className="text-sm text-gray-600">{rehearsal.notes}</p>
                              )}
                            </div>

                            {rehearsal.attendance && (
                              <div className="text-left">
                                <div className="text-sm font-medium text-gray-900">
                                  נוכחות: {attendanceRate}%
                                </div>
                                <div className="text-xs text-gray-600">
                                  {rehearsal.attendance.present.length} נוכחים • {rehearsal.attendance.absent.length} נעדרים
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">אין חזרות מתוכננות</h4>
                  <p className="text-gray-600">חזרות יופיעו כאן לאחר שייווצרו</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">סטטיסטיקת חברים</h4>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {orchestra.memberDetails?.length || 0}
                </div>
                <p className="text-sm text-gray-600">חברים פעילים</p>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">סך חזרות</h4>
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {rehearsalStats.total}
                </div>
                <p className="text-sm text-gray-600">
                  {rehearsalStats.upcoming} עתידות • {rehearsalStats.completed} הסתיימו
                </p>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">נוכחות ממוצעת</h4>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {rehearsalStats.avgAttendance}%
                </div>
                <p className="text-sm text-gray-600">בחזרות שנערכו</p>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">כלי נגינה</h4>
                  <Music className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {instrumentsSummary.totalInstruments}
                </div>
                <p className="text-sm text-gray-600">סוגי כלים שונים</p>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">מוכנות</h4>
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {readiness.score}%
                </div>
                <p className="text-sm text-gray-600">
                  {readiness.isReady ? 'מוכן לביצוע' : 'דורש שיפורים'}
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}