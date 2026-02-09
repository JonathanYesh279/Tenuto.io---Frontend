import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowRight, 
  Edit, 
  Plus, 
  Trash2, 
  Search,
  User,
  Users, 
  Calendar,
  MapPin,
  Music,
  Star,
  UserPlus,
  UserMinus,
  Eye
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import Table from '../components/ui/Table'
import StatsCard from '../components/ui/StatsCard'
import OrchestraForm from '../components/OrchestraForm'
import { orchestraService, studentService, teacherService, rehearsalService } from '../services/apiService'
import {
  getOrchestraTypeInfo,
  getOrchestraStatus,
  calculateOrchestraStats,
  getConductorName,
  getOrchestraReadiness,
  getMemberInstrumentsSummary,
  type Orchestra
} from '../utils/orchestraUtils'
import { getDisplayName } from '../utils/nameUtils'

export default function OrchestraDetails() {
  const { orchestraId } = useParams<{ orchestraId: string }>()
  const navigate = useNavigate()
  
  const [orchestra, setOrchestra] = useState<Orchestra | null>(null)
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [rehearsals, setRehearsals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (orchestraId) {
      loadOrchestraDetails()
    }
  }, [orchestraId])

  const loadOrchestraDetails = async () => {
    if (!orchestraId) return

    try {
      setLoading(true)
      setError(null)
      
      // Load orchestra details, students, teachers, and rehearsals in parallel
      const [orchestraData, studentsData, teachersData, rehearsalsData] = await Promise.all([
        orchestraService.getOrchestra(orchestraId),
        studentService.getStudents(),
        teacherService.getTeachers(),
        rehearsalService.getOrchestraRehearsals(orchestraId)
      ])
      
      setOrchestra(orchestraData)
      setAllStudents(studentsData)
      setTeachers(teachersData)
      setRehearsals(rehearsalsData)
    } catch (error) {
      console.error('Error loading orchestra details:', error)
      setError('שגיאה בטעינת פרטי התזמורת')
    } finally {
      setLoading(false)
    }
  }

  const handleEditOrchestra = async (orchestraData: any) => {
    if (!orchestraId) return

    try {
      await orchestraService.updateOrchestra(orchestraId, orchestraData)
      setShowEditForm(false)
      await loadOrchestraDetails()
    } catch (error) {
      console.error('Error updating orchestra:', error)
      throw error
    }
  }

  const handleAddMember = async (studentId: string) => {
    if (!orchestraId) return

    try {
      await orchestraService.addMember(orchestraId, studentId)
      await loadOrchestraDetails()
    } catch (error) {
      console.error('Error adding member:', error)
      setError('שגיאה בהוספת חבר לתזמורת')
    }
  }

  const handleRemoveMember = async (studentId: string) => {
    if (!orchestraId || !window.confirm('האם אתה בטוח שברצונך להסיר את החבר מהתזמורת?')) return

    try {
      await orchestraService.removeMember(orchestraId, studentId)
      await loadOrchestraDetails()
    } catch (error) {
      console.error('Error removing member:', error)
      setError('שגיאה בהסרת חבר מהתזמורת')
    }
  }

  const handleDeleteOrchestra = async () => {
    if (!orchestraId || !window.confirm('האם אתה בטוח שברצונך למחוק את התזמורת?')) return

    try {
      await orchestraService.deleteOrchestra(orchestraId)
      navigate('/orchestras')
    } catch (error) {
      console.error('Error deleting orchestra:', error)
      setError('שגיאה במחיקת התזמורת')
    }
  }

  const handleViewStudentProfile = (studentId: string) => {
    window.location.href = `/students/${studentId}`
  }

  const handleViewTeacherProfile = (teacherId: string) => {
    window.location.href = `/teachers/${teacherId}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען פרטי תזמורת...</div>
        </div>
      </div>
    )
  }

  if (error || !orchestra) {
    return (
      <div className="text-center py-12">
        <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">שגיאה בטעינת התזמורת</h3>
        <p className="text-gray-600 mb-4">{error || 'תזמורת לא נמצאה'}</p>
        <button
          onClick={() => navigate('/orchestras')}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור לרשימת תזמורות
        </button>
      </div>
    )
  }

  const typeInfo = getOrchestraTypeInfo(orchestra.type)
  const status = getOrchestraStatus(orchestra)
  const stats = calculateOrchestraStats(orchestra)
  const readiness = getOrchestraReadiness(orchestra)
  const instrumentsSummary = getMemberInstrumentsSummary(orchestra.members)

  // Get available students (not in this orchestra)
  const availableStudents = allStudents.filter(student => 
    !orchestra.memberIds.includes(student._id) &&
    student.isActive &&
    (!searchQuery || 
      getDisplayName(student.personalInfo)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.academicInfo?.class?.includes(searchQuery))
  )

  // Get current members details
  const currentMembers = allStudents.filter(student => 
    orchestra.memberIds.includes(student._id)
  )

  // Conductor details
  const conductor = teachers.find(teacher => teacher._id === orchestra.conductorId)

  // Member columns for table
  const memberColumns = [
    {
      key: 'name',
      label: 'שם',
      render: (student: any) => (
        <div className="flex items-center">
          <div>
            <div className="font-medium text-gray-900">{getDisplayName(student.personalInfo)}</div>
            <div className="text-sm text-gray-500">כיתה {student.academicInfo?.class}</div>
          </div>
        </div>
      )
    },
    {
      key: 'instrument',
      label: 'כלי נגינה',
      render: (student: any) => {
        const primaryInstrument = student.academicInfo?.instrumentProgress?.find(
          (p: any) => p.isPrimary
        )
        return primaryInstrument ? (
          <div>
            <span className="font-medium">{primaryInstrument.instrumentName}</span>
            <span className="text-sm text-gray-500 block">שלב {primaryInstrument.currentStage}</span>
          </div>
        ) : 'לא צוין'
      }
    },
    {
      key: 'contact',
      label: 'פרטי קשר',
      render: (student: any) => (
        <div className="text-sm text-gray-600">
          <div>{student.personalInfo?.phone}</div>
          {student.personalInfo?.studentEmail && (
            <div className="text-xs">{student.personalInfo.studentEmail}</div>
          )}
        </div>
      )
    }
  ]

  // Available students columns
  const availableStudentColumns = [
    {
      key: 'name',
      label: 'שם',
      render: (student: any) => (
        <div>
          <div className="font-medium text-gray-900">{getDisplayName(student.personalInfo)}</div>
          <div className="text-sm text-gray-500">כיתה {student.academicInfo?.class}</div>
        </div>
      )
    },
    {
      key: 'instrument',
      label: 'כלי ראשי',
      render: (student: any) => {
        const primaryInstrument = student.academicInfo?.instrumentProgress?.find(
          (p: any) => p.isPrimary
        )
        return primaryInstrument?.instrumentName || 'לא צוין'
      }
    },
    {
      key: 'actions',
      label: 'פעולות',
      render: (student: any) => (
        <button
          onClick={() => handleAddMember(student._id)}
          className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          <UserPlus className="w-3 h-3 ml-1" />
          הוסף
        </button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orchestras')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{typeInfo.icon}</span>
              <h1 className="text-3xl font-bold text-gray-900">{orchestra.name}</h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {typeInfo.text}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {status.text}
              </span>
              {readiness.isReady && (
                <Star className="w-5 h-5 text-yellow-500" title="מוכן לביצוע" />
              )}
            </div>
            <p className="text-gray-600">ניהול חברים, חזרות ופעילויות</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 ml-1" />
            ערוך
          </button>
          <button
            onClick={handleDeleteOrchestra}
            className="flex items-center px-3 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            מחק
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="חברים"
          value={stats.memberCount.toString()}
          subtitle="מבצעים בתזמורת"
          icon={<Users />}
          color="blue"
        />
        <StatsCard
          title="חזרות"
          value={stats.rehearsalCount.toString()}
          subtitle="חזרות מתוכננות"
          icon={<Calendar />}
          color="green"
        />
        <StatsCard
          title="כלי נגינה"
          value={instrumentsSummary.totalInstruments.toString()}
          subtitle="סוגי כלים שונים"
          icon={<Music />}
          color="purple"
        />
        <StatsCard
          title="מוכנות"
          value={`${readiness.score}%`}
          subtitle="רמת מוכנות כללית"
          icon={<Star />}
          color={readiness.score >= 75 ? "green" : readiness.score >= 50 ? "orange" : "red"}
        />
      </div>

      {/* Orchestra Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orchestra Information */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי התזמורת</h3>
            
            <div className="space-y-4">
              {/* Conductor */}
              <div className="flex items-start">
                <User className="w-5 h-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <div className="font-medium text-gray-900">מנצח</div>
                  {conductor ? (
                    <div className="text-sm text-gray-600">
                      <button
                        onClick={() => handleViewTeacherProfile(conductor._id)}
                        className="text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {getDisplayName(conductor.personalInfo)}
                      </button>
                      {conductor.personalInfo?.email && (
                        <div className="text-xs text-gray-500">{conductor.personalInfo.email}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">לא הוקצה מנצח</div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <div className="font-medium text-gray-900">מיקום</div>
                  <div className="text-sm text-gray-600">{orchestra.location}</div>
                </div>
              </div>

              {/* Orchestra Type */}
              <div className="flex items-start">
                <Music className="w-5 h-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <div className="font-medium text-gray-900">סוג הרכב</div>
                  <div className="text-sm text-gray-600">{typeInfo.text}</div>
                </div>
              </div>
            </div>

            {/* Readiness Assessment */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-3">הערכת מוכנות</h4>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    readiness.score >= 75 ? 'bg-green-500' :
                    readiness.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${readiness.score}%` }}
                />
              </div>

              {readiness.strengths.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-black font-semibold mb-1" style={{color: '#000000'}}>נקודות חוזק:</div>
                  {readiness.strengths.map(strength => (
                    <div key={strength} className="text-xs text-green-600">✓ {strength}</div>
                  ))}
                </div>
              )}

              {readiness.issues.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-black font-semibold mb-1" style={{color: '#000000'}}>נקודות לשיפור:</div>
                  {readiness.issues.map(issue => (
                    <div key={issue} className="text-xs text-red-600">✗ {issue}</div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Members Management */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                חברי התזמורת ({currentMembers.length})
              </h3>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 ml-1" />
                הוסף חבר
              </button>
            </div>

            {/* Add Member Section */}
            {showAddMember && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="חיפוש תלמידים..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddMember(false)
                      setSearchQuery('')
                    }}
                    className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    ביטול
                  </button>
                </div>

                {availableStudents.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <Table
                      data={availableStudents}
                      columns={availableStudentColumns}
                      actions={false}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p>אין תלמידים זמינים להוספה</p>
                  </div>
                )}
              </div>
            )}

            {/* Current Members */}
            {currentMembers.length > 0 ? (
              <Table
                data={currentMembers}
                columns={memberColumns}
                onView={(student) => handleViewStudentProfile(student._id)}
                onDelete={(student) => handleRemoveMember(student._id)}
                actions={true}
                actionLabels={{
                  view: 'צפה בפרופיל',
                  delete: 'הסר מהתזמורת'
                }}
              />
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">אין חברים בתזמורת</h3>
                <p className="text-gray-600 mb-4">התחל על ידי הוספת התלמיד הראשון</p>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף חבר ראשון
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Rehearsals Section */}
      {rehearsals.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">חזרות אחרונות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rehearsals.slice(0, 6).map(rehearsal => (
              <div key={rehearsal._id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {new Date(rehearsal.date).toLocaleDateString('he-IL')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {rehearsal.startTime} - {rehearsal.endTime}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 inline ml-1" />
                  {rehearsal.location}
                </div>
                {rehearsal.attendance && (
                  <div className="text-sm text-gray-600">
                    נוכחות: {rehearsal.attendance.present?.length || 0} מתוך {currentMembers.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Orchestra Edit Form Modal */}
      {showEditForm && (
        <OrchestraForm
          orchestra={orchestra}
          teachers={teachers}
          onSubmit={handleEditOrchestra}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  )
}