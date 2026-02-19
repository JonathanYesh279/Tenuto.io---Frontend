import { useState, useEffect } from 'react'
import { 
  X, 
  Search, 
  Users, 
  User, 
  Music,
  Phone,
  Mail,
  GraduationCap,
  Filter,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Card } from './ui/Card'
import { orchestraService, studentService } from '../services/apiService'
import { type Orchestra } from '../utils/orchestraUtils'
import { getDisplayName } from '@/utils/nameUtils'

interface OrchestraMemberManagementProps {
  orchestraId: string
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

interface StudentWithDetails {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
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
  isActive: boolean
}

export default function OrchestraMemberManagement({
  orchestraId,
  isOpen,
  onClose,
  onUpdate
}: OrchestraMemberManagementProps) {
  const [orchestra, setOrchestra] = useState<Orchestra | null>(null)
  const [allStudents, setAllStudents] = useState<StudentWithDetails[]>([])
  const [currentMembers, setCurrentMembers] = useState<StudentWithDetails[]>([])
  const [availableStudents, setAvailableStudents] = useState<StudentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && orchestraId) {
      loadData()
    }
  }, [isOpen, orchestraId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load orchestra and students data
      const [orchestraData, studentsData] = await Promise.all([
        orchestraService.getOrchestra(orchestraId),
        studentService.getStudents()
      ])

      setOrchestra(orchestraData)
      setAllStudents(studentsData)

      // Separate current members from available students
      const memberIds = new Set(orchestraData.memberIds || [])
      const members = studentsData.filter(student => memberIds.has(student._id))
      const available = studentsData.filter(student => 
        !memberIds.has(student._id) && student.isActive
      )

      setCurrentMembers(members)
      setAvailableStudents(available)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (studentId: string) => {
    try {
      setActionLoading(studentId)
      await orchestraService.addMember(orchestraId, studentId)
      await loadData()
      onUpdate?.()
    } catch (error) {
      console.error('Error adding member:', error)
      setError('שגיאה בהוספת חבר לתזמורת')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (studentId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך להסיר את החבר מהתזמורת?')) {
      return
    }

    try {
      setActionLoading(studentId)
      await orchestraService.removeMember(orchestraId, studentId)
      await loadData()
      onUpdate?.()
    } catch (error) {
      console.error('Error removing member:', error)
      setError('שגיאה בהסרת חבר מהתזמורת')
    } finally {
      setActionLoading(null)
    }
  }

  // Filter students based on search and filters
  const filterStudents = (students: StudentWithDetails[]) => {
    return students.filter(student => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!getDisplayName(student.personalInfo).toLowerCase().includes(query)) {
          return false
        }
      }

      // Class filter
      if (classFilter && student.academicInfo?.class !== classFilter) {
        return false
      }

      // Instrument filter
      if (instrumentFilter) {
        const hasInstrument = student.academicInfo?.instrumentProgress?.some(
          progress => progress.instrumentName === instrumentFilter
        )
        if (!hasInstrument) {
          return false
        }
      }

      return true
    })
  }

  const filteredCurrentMembers = filterStudents(currentMembers)
  const filteredAvailableStudents = filterStudents(availableStudents)

  // Get unique classes and instruments for filters
  const uniqueClasses = [...new Set(allStudents
    .map(s => s.academicInfo?.class)
    .filter(Boolean)
  )].sort()

  const uniqueInstruments = [...new Set(allStudents
    .flatMap(s => s.academicInfo?.instrumentProgress?.map(p => p.instrumentName) || [])
    .filter(Boolean)
  )].sort()

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleBackdropClick}>
        <div className="bg-white rounded p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary ml-2"></div>
            <span className="text-gray-700">טוען נתוני חברים...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !orchestra) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleBackdropClick}>
        <div className="bg-white rounded p-8 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 ml-2" />
            <h3 className="text-lg font-semibold text-gray-900">שגיאה</h3>
          </div>
          <p className="text-gray-600 mb-6">{error || 'לא ניתן לטעון נתוני התזמורת'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    )
  }

  const StudentCard = ({ student, isMember }: { student: StudentWithDetails, isMember: boolean }) => {
    const primaryInstrument = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
    const isLoading = actionLoading === student._id

    return (
      <Card key={student._id} className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 mb-1">
                {getDisplayName(student.personalInfo)}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                {student.academicInfo?.class && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>כיתה {student.academicInfo.class}</span>
                  </div>
                )}
                
                {primaryInstrument && (
                  <div className="flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    <span>{primaryInstrument.instrumentName}</span>
                    <span className="text-xs text-gray-500">
                      (שלב {primaryInstrument.currentStage})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                {student.personalInfo.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{student.personalInfo.phone}</span>
                  </div>
                )}
                
                {student.personalInfo.studentEmail && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{student.personalInfo.studentEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMember ? (
              <button
                onClick={() => handleRemoveMember(student._id)}
                disabled={isLoading}
                className={`flex items-center gap-1 px-3 py-2 text-xs rounded transition-colors ${
                  isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                ) : (
                  <UserMinus className="w-3 h-3" />
                )}
                הסר
              </button>
            ) : (
              <button
                onClick={() => handleAddMember(student._id)}
                disabled={isLoading}
                className={`flex items-center gap-1 px-3 py-2 text-xs rounded transition-colors ${
                  isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                ) : (
                  <UserPlus className="w-3 h-3" />
                )}
                הוסף
              </button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded w-full max-w-6xl max-h-[90vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">ניהול חברי התזמורת</h2>
            <p className="text-gray-600 mt-1">{orchestra.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חיפוש תלמידים..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Class Filter */}
            <div className="w-32">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">כל הכיתות</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>כיתה {cls}</option>
                ))}
              </select>
            </div>

            {/* Instrument Filter */}
            <div className="w-40">
              <select
                value={instrumentFilter}
                onChange={(e) => setInstrumentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">כל הכלים</option>
                {uniqueInstruments.map(instrument => (
                  <option key={instrument} value={instrument}>{instrument}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchQuery('')
                setClassFilter('')
                setInstrumentFilter('')
              }}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Current Members */}
          <div className="flex-1 border-b md:border-b-0 md:border-l border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">חברים נוכחיים</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {filteredCurrentMembers.length}
                </span>
              </div>
              {currentMembers.length !== filteredCurrentMembers.length && (
                <p className="text-sm text-gray-600">
                  מציג {filteredCurrentMembers.length} מתוך {currentMembers.length} חברים
                </p>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {filteredCurrentMembers.length > 0 ? (
                <div className="space-y-3">
                  {filteredCurrentMembers.map(student => (
                    <StudentCard key={student._id} student={student} isMember={true} />
                  ))}
                </div>
              ) : currentMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">אין חברים בתזמורת</h4>
                  <p className="text-gray-600">התחל על ידי הוספת תלמידים מהרשימה הזמינה</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">אין תוצאות</h4>
                  <p className="text-gray-600">נסה לשנות את קריטריוני החיפוש</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Students */}
          <div className="flex-1">
            <div className="p-6 border-b border-gray-200 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">תלמידים זמינים</h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {filteredAvailableStudents.length}
                </span>
              </div>
              {availableStudents.length !== filteredAvailableStudents.length && (
                <p className="text-sm text-gray-600">
                  מציג {filteredAvailableStudents.length} מתוך {availableStudents.length} תלמידים
                </p>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {filteredAvailableStudents.length > 0 ? (
                <div className="space-y-3">
                  {filteredAvailableStudents.map(student => (
                    <StudentCard key={student._id} student={student} isMember={false} />
                  ))}
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">כל התלמידים כבר חברים</h4>
                  <p className="text-gray-600">כל התלמידים הפעילים כבר חברים בתזמורת</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">אין תוצאות</h4>
                  <p className="text-gray-600">נסה לשנות את קריטריוני החיפוש</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              סך הכל: {currentMembers.length} חברים • {availableStudents.length} תלמידים זמינים
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}