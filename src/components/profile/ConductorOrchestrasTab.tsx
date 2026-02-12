import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { Plus, Search, Edit, Trash2, Music, Users, UserPlus, UserMinus, Calendar, Clock, MapPin, Settings, Star, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import apiService from '../../services/apiService'
import { getDisplayName } from '@/utils/nameUtils'
import RehearsalScheduleModal from '../rehearsal/RehearsalScheduleModal'
import ConfirmationModal from '../ui/ConfirmationModal'

interface Orchestra {
  id: string
  name: string
  description?: string
  type: 'youth' | 'adult' | 'chamber' | 'symphony'
  level: 'beginner' | 'intermediate' | 'advanced'
  memberCount?: number
  status: 'active' | 'inactive'
  rehearsalDay?: string
  rehearsalTime?: string
  venue?: string
}

interface Member {
  id: string
  firstName: string
  lastName: string
  instrument: string
  section: string
  status: 'active' | 'inactive'
  enrollmentDate?: string
  performanceLevel?: 'beginner' | 'intermediate' | 'advanced'
  attendanceRate?: number
}

interface Student {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
  }
  academicInfo: {
    primaryInstrument?: string
    instrumentProgress?: Array<{
      instrumentName: string
      isPrimary: boolean
      currentStage: number
    }>
  }
  status: 'active' | 'inactive'
}

interface Rehearsal {
  id: string
  date: string
  time: string
  location: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled'
  attendanceCount: number
  totalMembers: number
}

export default function ConductorOrchestrasTab() {
  const { user } = useAuth()
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingOrchestra, setEditingOrchestra] = useState<Orchestra | null>(null)
  const [selectedOrchestra, setSelectedOrchestra] = useState<string | null>(null)
  const [orchestraMembers, setOrchestraMembers] = useState<Member[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'members' | 'enrollment' | 'rehearsals'>('members')
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [showRehearsalModal, setShowRehearsalModal] = useState(false)
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [orchestraRehearsals, setOrchestraRehearsals] = useState<Rehearsal[]>([])
  const [enrollmentFilter, setEnrollmentFilter] = useState('')
  const [memberFilter, setMemberFilter] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Notification and confirmation modals
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    loadConductorOrchestras()
  }, [user])

  // Load available students when enrollment tab is active
  useEffect(() => {
    if (selectedOrchestra && activeTab === 'enrollment') {
      loadAvailableStudents()
    }
  }, [selectedOrchestra, activeTab])

  const loadConductorOrchestras = async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const conductorId = user._id
      
      // First get teacher profile to access orchestraIds
      const teacherProfile = await apiService.teachers.getTeacher(conductorId)
      
      if (!teacherProfile) {
        throw new Error('לא נמצא פרופיל מנצח')
      }
      
      const orchestraIds = teacherProfile?.conducting?.orchestraIds || []
      
      if (orchestraIds.length === 0) {
        console.log('No orchestras assigned to conductor')
        setOrchestras([])
        return
      }

      // Fetch specific orchestras using batch approach
      const orchestrasData = await apiService.orchestras.getBatchOrchestras(orchestraIds)
      
      if (!Array.isArray(orchestrasData)) {
        throw new Error('תגובה לא תקינה מהשרת')
      }
      
      // Map backend data to frontend format
      const mappedOrchestras = orchestrasData.map(orchestra => ({
        id: orchestra._id,
        name: orchestra.name,
        description: orchestra.description,
        type: orchestra.type,
        level: orchestra.level,
        memberCount: orchestra.memberCount || 0,
        status: orchestra.status || 'active',
        rehearsalDay: orchestra.rehearsalSchedule?.day,
        rehearsalTime: orchestra.rehearsalSchedule?.time,
        venue: orchestra.venue
      }))
      
      setOrchestras(mappedOrchestras)
    } catch (error) {
      console.error('Error loading conductor orchestras:', error)
      setError('שגיאה בטעינת רשימת התזמורות')
    } finally {
      setLoading(false)
    }
  }

  const loadOrchestraMembers = async (orchestraId: string) => {
    try {
      const orchestra = await apiService.orchestras.getOrchestra(orchestraId)
      const members = orchestra.memberDetails || []

      // Map backend data to frontend format
      const mappedMembers = members.map(member => {
        // Use getDisplayName for backward-compatible name resolution
        const displayName = getDisplayName(member.personalInfo)
        const nameParts = displayName.trim().split(/\s+/)
        const firstName = member.personalInfo?.firstName || nameParts[0] || ''
        const lastName = member.personalInfo?.lastName || nameParts.slice(1).join(' ') || ''

        // Get primary instrument and current stage
        const primaryInstrument = member.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
        const instrument = primaryInstrument?.instrumentName || member.primaryInstrument || 'לא צוין'
        const currentStage = primaryInstrument?.currentStage || 0

        return {
          id: member._id,
          fullName: displayName,
          firstName: firstName,
          lastName: lastName,
          instrument: instrument,
          currentStage: currentStage,
          section: member.section || 'כללי',
          status: member.status || 'active',
          enrollmentDate: member.enrollmentDate || new Date().toISOString(),
          performanceLevel: member.performanceLevel || 'intermediate',
          attendanceRate: member.attendanceRate || null // Only use real data
        }
      })

      setOrchestraMembers(mappedMembers)
    } catch (error) {
      console.error('Error loading orchestra members:', error)
    }
  }

  const loadAvailableStudents = async () => {
    if (!selectedOrchestra) return

    try {
      setLoadingStudents(true)
      console.log('🔍 Loading available students for orchestra:', selectedOrchestra)

      // Get all active students
      const response = await apiService.students.getStudents({
        status: 'active',
        limit: 500
      })

      console.log('📋 Raw API response:', response)

      // Handle different response structures
      let allStudents = []
      if (Array.isArray(response)) {
        allStudents = response
      } else if (response && Array.isArray(response.data)) {
        allStudents = response.data
      } else if (response && response.students && Array.isArray(response.students)) {
        allStudents = response.students
      } else {
        console.error('❌ Unexpected response structure:', response)
        allStudents = []
      }

      console.log('📋 Total active students fetched:', allStudents.length)

      // Get current orchestra to check its members
      const orchestra = await apiService.orchestras.getOrchestra(selectedOrchestra)
      const currentMemberIds = orchestra.memberIds || []

      console.log('👥 Current orchestra members:', currentMemberIds.length)

      // Filter out students already in the selected orchestra
      const available = allStudents.filter(student =>
        !currentMemberIds.includes(student._id) && student.isActive !== false
      )

      console.log('✅ Available students for enrollment:', available.length)
      setAvailableStudents(available)
    } catch (error) {
      console.error('❌ Error loading available students:', error)
      setAvailableStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const loadOrchestraRehearsals = async (orchestraId: string) => {
    try {
      const rehearsals = await apiService.rehearsals.getRehearsals({
        groupId: orchestraId,
        limit: 20
      })

      const mappedRehearsals = rehearsals.map(rehearsal => {
        // Try different date field names and formats
        const dateValue = rehearsal.date || rehearsal.scheduledDate || rehearsal.rehearsalDate
        let formattedDate = 'תאריך לא זמין'

        if (dateValue) {
          try {
            const parsedDate = new Date(dateValue)
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = parsedDate.toLocaleDateString('he-IL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
            }
          } catch (e) {
            console.warn('Failed to parse rehearsal date:', dateValue)
          }
        }

        return {
          id: rehearsal._id,
          date: formattedDate,
          time: rehearsal.startTime || '19:00',
          location: rehearsal.location || 'אולם מוזיקה',
          duration: rehearsal.duration || 120,
          status: rehearsal.status || 'scheduled',
          attendanceCount: rehearsal.attendanceList?.length || 0,
          totalMembers: orchestraMembers.length
        }
      })

      setOrchestraRehearsals(mappedRehearsals)
    } catch (error) {
      console.error('Error loading orchestra rehearsals:', error)
      setOrchestraRehearsals([])
    }
  }

  const handleAddMember = async (studentId: string) => {
    if (!selectedOrchestra) return

    try {
      // Step 1: Add to orchestra's memberIds
      await apiService.orchestras.addMember(selectedOrchestra, studentId)

      // Step 2: Update student's orchestraIds (bidirectional sync)
      try {
        const student = await apiService.students.getStudent(studentId)
        const currentOrchestraIds = student?.enrollments?.orchestraIds || []

        // Only add if not already present
        if (!currentOrchestraIds.includes(selectedOrchestra)) {
          await apiService.students.updateStudent(studentId, {
            enrollments: {
              ...student?.enrollments,
              orchestraIds: [...currentOrchestraIds, selectedOrchestra]
            }
          })
          console.log(`✅ Updated student ${studentId} orchestraIds with ${selectedOrchestra}`)
        }
      } catch (syncError) {
        console.error('Error syncing student orchestraIds:', syncError)
        // Don't fail the whole operation if sync fails
      }

      // Refresh data
      await loadOrchestraMembers(selectedOrchestra)
      await loadAvailableStudents()

      setNotification({ type: 'success', message: 'התלמיד נוסף בהצלחה לתזמורת' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error adding member:', error)
      setNotification({ type: 'error', message: 'שגיאה בהוספת התלמיד לתזמורת' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedOrchestra) return

    setConfirmModal({
      isOpen: true,
      title: 'הסרת תלמיד מהתזמורת',
      message: 'האם אתה בטוח שברצונך להסיר את התלמיד מהתזמורת?',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false })

        try {
          // Step 1: Remove from orchestra's memberIds
          await apiService.orchestras.removeMember(selectedOrchestra, memberId)

          // Step 2: Update student's orchestraIds (bidirectional sync)
          try {
            const student = await apiService.students.getStudent(memberId)
            const currentOrchestraIds = student?.enrollments?.orchestraIds || []

            // Remove the orchestraId from the student's list
            const updatedOrchestraIds = currentOrchestraIds.filter((id: string) => id !== selectedOrchestra)

            if (updatedOrchestraIds.length !== currentOrchestraIds.length) {
              await apiService.students.updateStudent(memberId, {
                enrollments: {
                  ...student?.enrollments,
                  orchestraIds: updatedOrchestraIds
                }
              })
              console.log(`✅ Removed orchestraId ${selectedOrchestra} from student ${memberId} enrollments`)
            }
          } catch (syncError) {
            console.error('Error syncing student orchestraIds on remove:', syncError)
            // Don't fail the whole operation if sync fails
          }

          // Refresh data
          await loadOrchestraMembers(selectedOrchestra)
          await loadAvailableStudents()

          setNotification({ type: 'success', message: 'התלמיד הוסר בהצלחה מהתזמורת' })
          setTimeout(() => setNotification(null), 3000)
        } catch (error) {
          console.error('Error removing member:', error)
          setNotification({ type: 'error', message: 'שגיאה בהסרת התלמיד מהתזמורת' })
          setTimeout(() => setNotification(null), 3000)
        }
      }
    })
  }

  const handleScheduleRehearsal = async (rehearsalData: any) => {
    if (!selectedOrchestra) return

    try {
      const parsedDate = new Date(rehearsalData.date)
      const rehearsalPayload = {
        groupId: selectedOrchestra,
        type: 'תזמורת' as const,
        date: parsedDate.toISOString(),
        dayOfWeek: parsedDate.getDay(),
        startTime: rehearsalData.startTime,
        endTime: rehearsalData.endTime,
        location: rehearsalData.location,
        notes: rehearsalData.notes || '',
      }

      if (rehearsalData.recurring) {
        // Create multiple rehearsals based on recurrence pattern
        const rehearsals = generateRecurringRehearsals(rehearsalPayload, rehearsalData)
        await Promise.all(rehearsals.map(r => apiService.rehearsals.createRehearsal(r)))
        setNotification({ type: 'success', message: `${rehearsals.length} חזרות נוצרו בהצלחה` })
      } else {
        await apiService.rehearsals.createRehearsal(rehearsalPayload)
        setNotification({ type: 'success', message: 'חזרה נוצרה בהצלחה' })
      }

      // Refresh rehearsals
      await loadOrchestraRehearsals(selectedOrchestra)
      setShowRehearsalModal(false)
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error scheduling rehearsal:', error)
      setNotification({ type: 'error', message: 'שגיאה ביצירת החזרה' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const calculateDurationMinutes = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  }

  const generateRecurringRehearsals = (baseRehearsal: any, recurrenceData: any) => {
    const rehearsals = []
    const startDate = new Date(recurrenceData.date)
    const endDate = new Date(recurrenceData.endRecurrence)

    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      rehearsals.push({
        ...baseRehearsal,
        date: new Date(currentDate).toISOString(),
        dayOfWeek: new Date(currentDate).getDay()
      })

      // Calculate next date based on pattern
      switch (recurrenceData.recurrencePattern) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14)
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
      }
    }

    return rehearsals
  }

  const filteredOrchestras = orchestras.filter(orchestra =>
    searchTerm === '' || 
    orchestra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orchestra.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orchestra.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteOrchestra = async (orchestraId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'מחיקת תזמורת',
      message: 'האם אתה בטוח שברצונך למחוק תזמורת זו? פעולה זו אינה ניתנת לביטול.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false })

        try {
          await apiService.orchestras.deleteOrchestra(orchestraId)
          setOrchestras(prev => prev.filter(o => o.id !== orchestraId))
          if (selectedOrchestra === orchestraId) {
            setSelectedOrchestra(null)
            setOrchestraMembers([])
          }
          setNotification({ type: 'success', message: 'התזמורת נמחקה בהצלחה' })
          setTimeout(() => setNotification(null), 3000)
        } catch (error) {
          console.error('Error deleting orchestra:', error)
          setNotification({ type: 'error', message: 'שגיאה במחיקת התזמורת' })
          setTimeout(() => setNotification(null), 3000)
        }
      }
    })
  }

  const handleOrchestraSubmit = async (orchestraData: Partial<Orchestra>) => {
    try {
      if (editingOrchestra) {
        // Update existing orchestra
        const backendData = {
          name: orchestraData.name,
          description: orchestraData.description,
          type: orchestraData.type,
          level: orchestraData.level,
          status: orchestraData.status,
          rehearsalSchedule: {
            day: orchestraData.rehearsalDay,
            time: orchestraData.rehearsalTime
          },
          venue: orchestraData.venue
        }
        
        const updatedOrchestra = await apiService.orchestras.updateOrchestra(editingOrchestra.id, backendData)
        
        // Map response back to frontend format
        const mappedOrchestra = {
          id: updatedOrchestra._id,
          name: updatedOrchestra.name,
          description: updatedOrchestra.description,
          type: updatedOrchestra.type,
          level: updatedOrchestra.level,
          memberCount: updatedOrchestra.memberCount || 0,
          status: updatedOrchestra.status || 'active',
          rehearsalDay: updatedOrchestra.rehearsalSchedule?.day,
          rehearsalTime: updatedOrchestra.rehearsalSchedule?.time,
          venue: updatedOrchestra.venue
        }
        
        setOrchestras(prev => prev.map(o => 
          o.id === editingOrchestra.id ? mappedOrchestra : o
        ))
      } else {
        // Create new orchestra
        const conductorId = user?._id
        const backendData = {
          name: orchestraData.name,
          description: orchestraData.description,
          type: orchestraData.type,
          level: orchestraData.level,
          status: orchestraData.status,
          rehearsalSchedule: {
            day: orchestraData.rehearsalDay,
            time: orchestraData.rehearsalTime
          },
          venue: orchestraData.venue,
          conductorId
        }
        
        const newOrchestra = await apiService.orchestras.createOrchestra(backendData)
        
        // Map response back to frontend format
        const mappedOrchestra = {
          id: newOrchestra._id,
          name: newOrchestra.name,
          description: newOrchestra.description,
          type: newOrchestra.type,
          level: newOrchestra.level,
          memberCount: newOrchestra.memberCount || 0,
          status: newOrchestra.status || 'active',
          rehearsalDay: newOrchestra.rehearsalSchedule?.day,
          rehearsalTime: newOrchestra.rehearsalSchedule?.time,
          venue: newOrchestra.venue
        }
        
        setOrchestras(prev => [...prev, mappedOrchestra])
      }
      setShowAddModal(false)
      setEditingOrchestra(null)
      setNotification({ type: 'success', message: editingOrchestra ? 'התזמורת עודכנה בהצלחה' : 'התזמורת נוצרה בהצלחה' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error saving orchestra:', error)
      setNotification({ type: 'error', message: 'שגיאה בשמירת פרטי התזמורת' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const getOrchestraTypeLabel = (type: string) => {
    switch (type) {
      case 'youth': return 'תזמורת נוער'
      case 'adult': return 'תזמורת מבוגרים'
      case 'chamber': return 'תזמורת קאמרית'
      case 'symphony': return 'תזמורת סימפונית'
      default: return type
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'מתחילים'
      case 'intermediate': return 'בינוניים'
      case 'advanced': return 'מתקדמים'
      default: return level
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען רשימת תזמורות...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-reisinger-yonatan">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            תזמורות שאני מנצח
          </h3>
          <p className="text-gray-600 mt-1">
            {orchestras.length} תזמורות
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-reisinger-yonatan">הוסף תזמורת</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="חיפוש תזמורות..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir="rtl"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orchestras List */}
        <div className="space-y-4">
          {filteredOrchestras.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2 font-reisinger-yonatan">
                {searchTerm ? 'לא נמצאו תזמורות' : 'אין תזמורות רשומות'}
              </h3>
              <p className="text-gray-600 font-reisinger-yonatan">
                {searchTerm ? 'נסה מילות חיפוש אחרות' : 'התחל בהוספת התזמורת הראשונה שלך'}
              </p>
            </div>
          ) : (
            filteredOrchestras.map((orchestra) => (
              <div 
                key={orchestra.id} 
                className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer transform hover:-translate-y-1 group ${
                  selectedOrchestra === orchestra.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                }`}
                onClick={() => {
                  setSelectedOrchestra(orchestra.id)
                  loadOrchestraMembers(orchestra.id)
                  loadOrchestraRehearsals(orchestra.id)
                  setActiveTab('members')
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                      {orchestra.name}
                    </h4>
                    <p className="text-sm text-gray-600 font-reisinger-yonatan">
                      {getOrchestraTypeLabel(orchestra.type)} • {getLevelLabel(orchestra.level)}
                    </p>
                    {orchestra.description && (
                      <p className="text-sm text-gray-500 mt-1 font-reisinger-yonatan">
                        {orchestra.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingOrchestra(orchestra)
                        setShowAddModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      title="עריכת תזמורת"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteOrchestra(orchestra.id)
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="מחיקת תזמורת"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{orchestra.memberCount || 0} חברים</span>
                    </div>
                    {orchestra.rehearsalDay && (
                      <span>חזרות: {orchestra.rehearsalDay}</span>
                    )}
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    orchestra.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {orchestra.status === 'active' ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Orchestra Management */}
        {selectedOrchestra && (
          <div className="bg-white border border-gray-200 rounded-lg">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-1 p-1">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'members'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  חברי התזמורת
                </button>
                <button
                  onClick={() => {
                    setActiveTab('enrollment')
                    loadAvailableStudents()
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'enrollment'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  רישום חברים
                </button>
                <button
                  onClick={() => setActiveTab('rehearsals')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'rehearsals'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  חזרות
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'members' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                      חברי התזמורת ({orchestraMembers.length})
                    </h4>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="חיפוש חברים..."
                          value={memberFilter}
                          onChange={(e) => setMemberFilter(e.target.value)}
                          className="pl-4 pr-10 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>

                  {orchestraMembers.filter(member =>
                    memberFilter === '' ||
                    `${member.firstName} ${member.lastName}`.toLowerCase().includes(memberFilter.toLowerCase()) ||
                    member.instrument.toLowerCase().includes(memberFilter.toLowerCase())
                  ).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-reisinger-yonatan">
                        {memberFilter ? 'לא נמצאו חברים' : 'אין חברים רשומים בתזמורת'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {orchestraMembers
                        .filter(member =>
                          memberFilter === '' ||
                          `${member.firstName} ${member.lastName}`.toLowerCase().includes(memberFilter.toLowerCase()) ||
                          member.instrument.toLowerCase().includes(memberFilter.toLowerCase())
                        )
                        .map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <div className="font-medium text-sm font-reisinger-yonatan">
                                {getDisplayName(member) || `${member.firstName} ${member.lastName}`.trim()}
                              </div>
                              <div className="text-xs text-gray-500 font-reisinger-yonatan">
                                {member.instrument}{member.currentStage ? ` - שלב ${member.currentStage}` : ''}
                              </div>
                              {member.attendanceRate !== null && member.attendanceRate !== undefined && (
                                <div className="text-xs text-gray-400 mt-1">
                                  נוכחות: {member.attendanceRate}%
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="הסר מהתזמורת"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'enrollment' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                      רישום חברים {!loadingStudents && `(${availableStudents.length} זמינים)`}
                    </h4>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="חיפוש תלמידים..."
                        value={enrollmentFilter}
                        onChange={(e) => setEnrollmentFilter(e.target.value)}
                        className="pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        dir="rtl"
                        disabled={loadingStudents}
                      />
                    </div>
                  </div>

                  {/* Loading state */}
                  {loadingStudents ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p className="text-gray-500 font-reisinger-yonatan">טוען רשימת תלמידים...</p>
                    </div>
                  ) : availableStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-reisinger-yonatan">
                        כל התלמידים כבר רשומים לתזמורת
                      </p>
                    </div>
                  ) : (
                    <div>
                      {availableStudents.filter(student =>
                        enrollmentFilter === '' ||
                        getDisplayName(student.personalInfo).toLowerCase().includes(enrollmentFilter.toLowerCase()) ||
                        student.academicInfo?.primaryInstrument?.toLowerCase().includes(enrollmentFilter.toLowerCase())
                      ).length === 0 ? (
                        <div className="text-center py-8">
                          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 font-reisinger-yonatan">
                            לא נמצאו תלמידים תואמים
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {availableStudents
                            .filter(student =>
                              enrollmentFilter === '' ||
                              getDisplayName(student.personalInfo).toLowerCase().includes(enrollmentFilter.toLowerCase()) ||
                              student.academicInfo?.primaryInstrument?.toLowerCase().includes(enrollmentFilter.toLowerCase())
                            )
                            .map((student) => {
                              const primaryInstrument = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
                              const instrumentName = primaryInstrument?.instrumentName || student.academicInfo?.primaryInstrument || 'לא צוין כלי'
                              const currentStage = primaryInstrument?.currentStage

                              return (
                            <div key={student._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                              <div>
                                <div className="font-medium text-sm font-reisinger-yonatan">
                                  {getDisplayName(student.personalInfo)}
                                </div>
                                <div className="text-xs text-gray-500 font-reisinger-yonatan">
                                  {instrumentName}{currentStage ? ` - שלב ${currentStage}` : ''}
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddMember(student._id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                              >
                                <UserPlus className="w-4 h-4" />
                                הוסף
                              </button>
                            </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rehearsals' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                      חזרות התזמורת
                    </h4>
                    <button
                      onClick={() => setShowRehearsalModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      קבע חזרה
                    </button>
                  </div>

                  {orchestraRehearsals.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-reisinger-yonatan">אין חזרות מתוכננות</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {orchestraRehearsals.map((rehearsal) => (
                        <div key={rehearsal.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium text-sm font-reisinger-yonatan">
                              {rehearsal.date} • {rehearsal.time}
                            </div>
                            <div className="text-xs text-gray-500 font-reisinger-yonatan flex items-center gap-2 mt-1">
                              <MapPin className="w-3 h-3" />
                              {rehearsal.location}
                              <Clock className="w-3 h-3 mr-1" />
                              {rehearsal.duration} דקות
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {rehearsal.attendanceCount}/{rehearsal.totalMembers}
                            </div>
                            <div className="text-xs text-gray-500">נוכחות</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Orchestra Modal */}
      {showAddModal && (
        <OrchestraModal
          orchestra={editingOrchestra}
          onClose={() => {
            setShowAddModal(false)
            setEditingOrchestra(null)
          }}
          onSubmit={handleOrchestraSubmit}
        />
      )}

      {/* Rehearsal Schedule Modal */}
      {showRehearsalModal && selectedOrchestra && (
        <RehearsalScheduleModal
          isOpen={showRehearsalModal}
          onClose={() => setShowRehearsalModal(false)}
          orchestraId={selectedOrchestra}
          orchestraName={orchestras.find(o => o.id === selectedOrchestra)?.name || ''}
          onSave={handleScheduleRehearsal}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        variant="danger"
        confirmText="אישור"
        cancelText="ביטול"
      />

      {/* Notification Modal */}
      {notification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in" dir="rtl">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className={`font-medium font-reisinger-yonatan ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {notification.message}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Orchestra Modal Component
interface OrchestraModalProps {
  orchestra: Orchestra | null
  onClose: () => void
  onSubmit: (data: Partial<Orchestra>) => void
}

function OrchestraModal({ orchestra, onClose, onSubmit }: OrchestraModalProps) {
  const [formData, setFormData] = useState({
    name: orchestra?.name || '',
    description: orchestra?.description || '',
    type: orchestra?.type || 'youth' as 'youth' | 'adult' | 'chamber' | 'symphony',
    level: orchestra?.level || 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    status: orchestra?.status || 'active' as 'active' | 'inactive',
    rehearsalDay: orchestra?.rehearsalDay || '',
    rehearsalTime: orchestra?.rehearsalTime || '',
    venue: orchestra?.venue || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          {orchestra ? 'עריכת תזמורת' : 'הוספת תזמורת חדשה'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              שם התזמורת *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              תיאור
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                סוג תזמורת *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="youth">תזמורת נוער</option>
                <option value="adult">תזמורת מבוגרים</option>
                <option value="chamber">תזמורת קאמרית</option>
                <option value="symphony">תזמורת סימפונית</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                רמה *
              </label>
              <select
                required
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">מתחילים</option>
                <option value="intermediate">בינוניים</option>
                <option value="advanced">מתקדמים</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                יום חזרות
              </label>
              <input
                type="text"
                value={formData.rehearsalDay}
                onChange={(e) => setFormData(prev => ({ ...prev, rehearsalDay: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="כלומר: יום ראשון"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת חזרות
              </label>
              <input
                type="time"
                value={formData.rehearsalTime}
                onChange={(e) => setFormData(prev => ({ ...prev, rehearsalTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              מקום חזרות
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              סטטוס
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">פעיל</option>
              <option value="inactive">לא פעיל</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-reisinger-yonatan"
            >
              {orchestra ? 'עדכן' : 'הוסף'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}