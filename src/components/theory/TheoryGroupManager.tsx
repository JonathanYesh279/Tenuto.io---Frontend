import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'

import apiService from '../../services/apiService'
import { getDisplayName } from '../../utils/nameUtils'
import { BellIcon, BookOpenIcon, CalendarIcon, CheckSquareIcon, ClockIcon, CopyIcon, DownloadSimpleIcon, EnvelopeIcon, EyeIcon, FunnelIcon, GearIcon, MagnifyingGlassIcon, MapPinIcon, MedalIcon, PencilIcon, PlusIcon, TrashIcon, TrendUpIcon, UploadSimpleIcon, UserMinusIcon, UserPlusIcon, UsersIcon, WarningIcon } from '@phosphor-icons/react'

interface TheoryGroup {
  id: string
  name: string
  description?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  teacherId: string
  teacherName: string
  capacity: number
  schedule: {
    dayOfWeek: string
    startTime: string
    endTime: string
  }
  location: string
  enrolledStudents: GroupStudent[]
  waitingList: GroupStudent[]
  isActive: boolean
  createdAt: string
  curriculum?: CurriculumItem[]
  requirements?: string[]
}

interface GroupStudent {
  id: string
  firstName: string
  lastName: string
  fullName?: string
  email?: string
  phone?: string
  grade?: string
  instrument?: string
  level?: string
  enrollmentDate: string
  attendance?: {
    total: number
    present: number
    absent: number
    rate: number
  }
  grades?: StudentGrade[]
  status: 'active' | 'inactive' | 'on_hold' | 'graduated'
  notes?: string
}

interface CurriculumItem {
  id: string
  title: string
  description?: string
  order: number
  isCompleted: boolean
  completedDate?: string
}

interface StudentGrade {
  id: string
  subject: string
  grade: number
  maxGrade: number
  date: string
  notes?: string
}

export default function TheoryGroupManager() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<TheoryGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<TheoryGroup | null>(null)
  const [availableStudents, setAvailableStudents] = useState<GroupStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    level: 'all',
    status: 'all',
    category: 'all'
  })
  const [activeTab, setActiveTab] = useState<'students' | 'waiting' | 'curriculum' | 'analytics'>('students')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TheoryGroup | null>(null)

  useEffect(() => {
    loadTheoryGroups()
    loadAvailableStudents()
  }, [user])

  const loadTheoryGroups = async () => {
    try {
      setLoading(true)
      const allLessons = await apiService.theory.getTheoryLessons()

      // Convert lessons to groups (group by category + level + teacher)
      const groupsMap = new Map<string, TheoryGroup>()

      allLessons.forEach(lesson => {
        const groupKey = `${lesson.teacherId}-${lesson.category}-${lesson.level || 'intermediate'}`

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: groupKey,
            name: `${lesson.category} - ${mapLevelLabel(lesson.level || 'intermediate')}`,
            description: lesson.description,
            level: mapLevelFromString(lesson.level || 'intermediate'),
            category: lesson.category || 'מגמה',
            teacherId: lesson.teacherId,
            teacherName: lesson.teacherName || 'מורה',
            capacity: lesson.maxStudents || 15,
            schedule: {
              dayOfWeek: lesson.dayOfWeek || 'sunday',
              startTime: lesson.startTime || '09:00',
              endTime: lesson.endTime || '10:30'
            },
            location: lesson.location || 'חדר תיאוריה',
            enrolledStudents: [],
            waitingList: [],
            isActive: lesson.isActive,
            createdAt: lesson.createdAt || new Date().toISOString(),
            curriculum: generateMockCurriculum(lesson.category),
            requirements: generateMockRequirements(lesson.category)
          })
        }

        // Add students to group
        const group = groupsMap.get(groupKey)!
        if (lesson.studentIds && lesson.studentIds.length > 0) {
          // In real app, fetch student details
          lesson.studentIds.forEach((studentId, index) => {
            group.enrolledStudents.push({
              id: studentId,
              firstName: `תלמיד${index + 1}`,
              lastName: 'דוגמה',
              email: `student${index + 1}@example.com`,
              grade: `${Math.floor(Math.random() * 6) + 7}`,
              instrument: ['פסנתר', 'כינור', 'גיטרה', 'חליל'][Math.floor(Math.random() * 4)],
              level: group.level,
              enrollmentDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
              attendance: {
                total: Math.floor(Math.random() * 20) + 10,
                present: 0,
                absent: 0,
                rate: 0
              },
              grades: generateMockGrades(),
              status: 'active',
              notes: index === 0 ? 'תלמיד מצטיין' : undefined
            })
          })

          // Calculate attendance
          group.enrolledStudents.forEach(student => {
            if (student.attendance) {
              student.attendance.present = Math.floor(student.attendance.total * (0.8 + Math.random() * 0.15))
              student.attendance.absent = student.attendance.total - student.attendance.present
              student.attendance.rate = Math.round((student.attendance.present / student.attendance.total) * 100)
            }
          })
        }
      })

      const groupsArray = Array.from(groupsMap.values())
      setGroups(groupsArray)

      if (groupsArray.length > 0 && !selectedGroup) {
        setSelectedGroup(groupsArray[0])
      }
    } catch (error) {
      console.error('Error loading theory groups:', error)
      setError('שגיאה בטעינת קבוצות התיאוריה')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableStudents = async () => {
    try {
      const allStudents = await apiService.students.getStudents()
      const mapped: GroupStudent[] = allStudents.map(student => ({
        id: student._id,
        firstName: student.personalInfo?.firstName || '',
        lastName: student.personalInfo?.lastName || '',
        fullName: getDisplayName(student.personalInfo),
        email: student.personalInfo?.email,
        phone: student.personalInfo?.phone,
        grade: student.academicInfo?.gradeLevel,
        instrument: student.primaryInstrument,
        enrollmentDate: new Date().toISOString(),
        status: 'active'
      }))

      setAvailableStudents(mapped)
    } catch (error) {
      console.error('Error loading available students:', error)
    }
  }

  const mapLevelFromString = (level: string): 'beginner' | 'intermediate' | 'advanced' => {
    if (level?.includes('מתחיל') || level?.includes('בסיס')) return 'beginner'
    if (level?.includes('מתקדם') || level?.includes('גבוה')) return 'advanced'
    return 'intermediate'
  }

  const mapLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'מתחילים'
      case 'intermediate': return 'בינוניים'
      case 'advanced': return 'מתקדמים'
      default: return 'בינוניים'
    }
  }

  const generateMockCurriculum = (category: string): CurriculumItem[] => {
    const curriculums = {
      'מגמה': [
        { title: 'יסודות הרמוניה', description: 'לימוד אקורדים בסיסיים' },
        { title: 'קצב ומטר', description: 'זיהוי וביצוע קצבים' },
        { title: 'סולמות מז\'ור', description: 'כל סולמות המז\'ור' },
        { title: 'סולמות מינור', description: 'סוגי סולמות מינור' }
      ],
      'הרמוניה': [
        { title: 'אקורדי שלישיות', description: 'בניית אקורדים בסיסיים' },
        { title: 'הולכת קולות', description: 'חוקי הולכת קולות' },
        { title: 'מודולציה', description: 'מעבר בין טונליות' }
      ],
      'קומפוזיציה': [
        { title: 'מלודיה', description: 'כתיבת מלודיות' },
        { title: 'מבנה מוזיקלי', description: 'צורות מוזיקליות' },
        { title: 'כלים ותזמור', description: 'הכרת כלי נגינה' }
      ]
    }

    const items = curriculums[category] || curriculums['מגמה']
    return items.map((item, index) => ({
      id: `curriculum-${index}`,
      title: item.title,
      description: item.description,
      order: index + 1,
      isCompleted: Math.random() > 0.6,
      completedDate: Math.random() > 0.5 ? new Date().toISOString() : undefined
    }))
  }

  const generateMockRequirements = (category: string): string[] => {
    const requirements = {
      'מגמה': [
        'ידע בקריאת תווים',
        'בסיס בכלי מקלדת',
        'המלצה מהמורה הפרטי'
      ],
      'הרמוניה': [
        'השלמת קורס מגמה בסיסי',
        'ידע בסולמות ובאקורדים',
        'יכולת קריאה בשני המפתחות'
      ],
      'קומפוזיציה': [
        'רקע בהרמוניה',
        'יכולת נגינה ברמה בינונית',
        'יצירתיות ועניין ביצירה'
      ]
    }

    return requirements[category] || requirements['מגמה']
  }

  const generateMockGrades = (): StudentGrade[] => {
    const subjects = ['מבחן', 'עבודה', 'השתתפות', 'פרויקט']
    return subjects.map((subject, index) => ({
      id: `grade-${index}`,
      subject,
      grade: Math.floor(Math.random() * 30) + 70,
      maxGrade: 100,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      notes: Math.random() > 0.7 ? 'עבודה מצוינת' : undefined
    }))
  }

  const handleEnrollStudent = async (studentId: string, groupId: string) => {
    try {
      // In real app, call API
      // await apiService.theory.enrollStudentInGroup(studentId, groupId)

      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          const student = availableStudents.find(s => s.id === studentId)
          if (student && group.enrolledStudents.length < group.capacity) {
            return {
              ...group,
              enrolledStudents: [...group.enrolledStudents, {
                ...student,
                enrollmentDate: new Date().toISOString(),
                attendance: { total: 0, present: 0, absent: 0, rate: 100 },
                grades: []
              }]
            }
          } else if (student) {
            // Add to waiting list if group is full
            return {
              ...group,
              waitingList: [...group.waitingList, student]
            }
          }
        }
        return group
      }))

      if (selectedGroup?.id === groupId) {
        const updatedGroup = groups.find(g => g.id === groupId)
        if (updatedGroup) setSelectedGroup(updatedGroup)
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      alert('שגיאה ברישום התלמיד')
    }
  }

  const handleUnenrollStudent = async (studentId: string, groupId: string) => {
    try {
      // In real app, call API
      // await apiService.theory.unenrollStudentFromGroup(studentId, groupId)

      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            enrolledStudents: group.enrolledStudents.filter(s => s.id !== studentId),
            waitingList: group.waitingList.filter(s => s.id !== studentId)
          }
        }
        return group
      }))

      if (selectedGroup?.id === groupId) {
        const updatedGroup = groups.find(g => g.id === groupId)
        if (updatedGroup) setSelectedGroup(updatedGroup)
      }
    } catch (error) {
      console.error('Error unenrolling student:', error)
      alert('שגיאה בביטול רישום התלמיד')
    }
  }

  const sendGroupAnnouncement = (groupId: string) => {
    // Mock functionality
    alert('הודעה נשלחה לכל תלמידי הקבוצה')
  }

  const exportGroupData = (group: TheoryGroup) => {
    const csv = [
      'שם,אימייל,כיתה,כלי,תאריך רישום,נוכחות',
      ...group.enrolledStudents.map(student =>
        `${getDisplayName(student)},${student.email || ''},${student.grade || ''},${student.instrument || ''},${new Date(student.enrollmentDate).toLocaleDateString('he-IL')},${student.attendance?.rate || 0}%`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `group_${group.name}_students.csv`
    link.click()
  }

  const filteredGroups = groups.filter(group => {
    if (filters.level !== 'all' && group.level !== filters.level) return false
    if (filters.status !== 'all' && (filters.status === 'active') !== group.isActive) return false
    if (filters.category !== 'all' && group.category !== filters.category) return false
    if (searchTerm && !group.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const filteredStudents = selectedGroup?.enrolledStudents.filter(student => {
    if (searchTerm && !getDisplayName(student).toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  }) || []

  const availableForEnrollment = availableStudents.filter(student => {
    const isAlreadyEnrolled = selectedGroup?.enrolledStudents.some(enrolled => enrolled.id === student.id)
    const isOnWaitingList = selectedGroup?.waitingList.some(waiting => waiting.id === student.id)
    return !isAlreadyEnrolled && !isOnWaitingList
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען קבוצות תיאוריה...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800 font-reisinger-yonatan text-center">
            <WarningIcon className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-bold mb-2">{error}</h3>
            <button
              onClick={loadTheoryGroups}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-reisinger-yonatan">
              ניהול קבוצות תיאוריה 👥
            </h1>
            <p className="text-gray-600 mt-2">ניהול מתקדם של רישום תלמידים וקבוצות לימוד</p>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="font-reisinger-yonatan">קבוצה חדשה</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Groups List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 font-reisinger-yonatan">קבוצות תיאוריה</h2>

                {/* Filters */}
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="חיפוש קבוצות..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      dir="rtl"
                    />
                  </div>

                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="all">כל הקטגוריות</option>
                    <option value="מגמה">מגמה</option>
                    <option value="הרמוניה">הרמוניה</option>
                    <option value="קומפוזיציה">קומפוזיציה</option>
                  </select>

                  <select
                    value={filters.level}
                    onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="all">כל הרמות</option>
                    <option value="beginner">מתחילים</option>
                    <option value="intermediate">בינוניים</option>
                    <option value="advanced">מתקדמים</option>
                  </select>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredGroups.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-reisinger-yonatan">אין קבוצות</p>
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedGroup?.id === group.id ? 'bg-indigo-50 border-indigo-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 font-reisinger-yonatan">{group.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {group.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <UsersIcon className="w-3 h-3" />
                          <span>{group.enrolledStudents.length}/{group.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{getDayLabel(group.schedule.dayOfWeek)} {group.schedule.startTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          <span>{group.location}</span>
                        </div>
                      </div>
                      {group.waitingList.length > 0 && (
                        <div className="mt-2 text-xs text-orange-600 font-reisinger-yonatan">
                          {group.waitingList.length} ברשימת המתנה
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Group Details */}
          <div className="lg:col-span-3">
            {selectedGroup ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Group Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
                        {selectedGroup.name}
                      </h2>
                      <p className="text-gray-600 mt-1 font-reisinger-yonatan">
                        {selectedGroup.teacherName} • {selectedGroup.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => sendGroupAnnouncement(selectedGroup.id)}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                        <span className="font-reisinger-yonatan">שלח הודעה</span>
                      </button>
                      <button
                        onClick={() => exportGroupData(selectedGroup)}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <DownloadSimpleIcon className="w-4 h-4" />
                        <span className="font-reisinger-yonatan">ייצא נתונים</span>
                      </button>
                      <button
                        onClick={() => setShowEnrollModal(true)}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                        <span className="font-reisinger-yonatan">הוסף תלמיד</span>
                      </button>
                    </div>
                  </div>

                  {/* Group Stats */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedGroup.enrolledStudents.length}</div>
                      <div className="text-sm text-gray-600 font-reisinger-yonatan">תלמידים רשומים</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedGroup.capacity}</div>
                      <div className="text-sm text-gray-600 font-reisinger-yonatan">קיבולת מקסימלית</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{selectedGroup.waitingList.length}</div>
                      <div className="text-sm text-gray-600 font-reisinger-yonatan">רשימת המתנה</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedGroup.enrolledStudents.length > 0 ?
                          Math.round(selectedGroup.enrolledStudents.reduce((sum, s) => sum + (s.attendance?.rate || 0), 0) / selectedGroup.enrolledStudents.length)
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-600 font-reisinger-yonatan">נוכחות ממוצעת</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" dir="rtl">
                    {[
                      { id: 'students', label: 'תלמידים', icon: UsersIcon },
                      { id: 'waiting', label: 'רשימת המתנה', icon: ClockIcon },
                      { id: 'curriculum', label: 'תכנית לימודים', icon: BookOpenIcon },
                      { id: 'analytics', label: 'ניתוח נתונים', icon: TrendUpIcon }
                    ].map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 font-reisinger-yonatan ${
                            activeTab === tab.id
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                          {tab.id === 'waiting' && selectedGroup.waitingList.length > 0 && (
                            <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                              {selectedGroup.waitingList.length}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'students' && (
                    <div className="space-y-4">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="font-reisinger-yonatan">אין תלמידים רשומים</p>
                        </div>
                      ) : (
                        filteredStudents.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <UsersIcon className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 font-reisinger-yonatan">{getDisplayName(student)}</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>כיתה {student.grade} • {student.instrument}</div>
                                  <div>רישום: {new Date(student.enrollmentDate).toLocaleDateString('he-IL')}</div>
                                  {student.attendance && (
                                    <div className="flex items-center gap-2">
                                      <span>נוכחות: {student.attendance.rate}%</span>
                                      <div className={`w-2 h-2 rounded-full ${
                                        student.attendance.rate >= 90 ? 'bg-green-500' :
                                        student.attendance.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="צפה בפרטים">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="ערוך">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUnenrollStudent(student.id, selectedGroup.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="הסר מהקבוצה"
                              >
                                <UserMinusIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'waiting' && (
                    <div className="space-y-4">
                      {selectedGroup.waitingList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="font-reisinger-yonatan">אין תלמידים ברשימת המתנה</p>
                        </div>
                      ) : (
                        selectedGroup.waitingList.map((student, index) => (
                          <div key={student.id} className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-bold text-sm">#{index + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 font-reisinger-yonatan">{getDisplayName(student)}</h4>
                                <div className="text-sm text-gray-600">
                                  כיתה {student.grade} • {student.instrument}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  // Move from waiting list to enrolled if space available
                                  if (selectedGroup.enrolledStudents.length < selectedGroup.capacity) {
                                    handleEnrollStudent(student.id, selectedGroup.id)
                                  }
                                }}
                                disabled={selectedGroup.enrolledStudents.length >= selectedGroup.capacity}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                              >
                                <UserPlusIcon className="w-4 h-4" />
                                רשום
                              </button>
                              <button
                                onClick={() => handleUnenrollStudent(student.id, selectedGroup.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="הסר מרשימת המתנה"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'curriculum' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">תכנית הלימודים</h3>
                        <span className="text-sm text-gray-600 font-reisinger-yonatan">
                          {selectedGroup.curriculum?.filter(item => item.isCompleted).length || 0} מתוך {selectedGroup.curriculum?.length || 0} הושלמו
                        </span>
                      </div>

                      {!selectedGroup.curriculum || selectedGroup.curriculum.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="font-reisinger-yonatan">אין תכנית לימודים מוגדרת</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedGroup.curriculum.map((item) => (
                            <div key={item.id} className={`p-4 border rounded-lg ${
                              item.isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    item.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                  }`}>
                                    {item.isCompleted ? (
                                      <CheckSquareIcon className="w-4 h-4 text-white" />
                                    ) : (
                                      <span className="text-white text-xs">{item.order}</span>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className={`font-medium ${
                                      item.isCompleted ? 'text-green-900' : 'text-gray-900'
                                    } font-reisinger-yonatan`}>
                                      {item.title}
                                    </h4>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 font-reisinger-yonatan">{item.description}</p>
                                    )}
                                  </div>
                                </div>
                                {item.completedDate && (
                                  <span className="text-xs text-green-600 font-reisinger-yonatan">
                                    הושלם: {new Date(item.completedDate).toLocaleDateString('he-IL')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Requirements */}
                      {selectedGroup.requirements && selectedGroup.requirements.length > 0 && (
                        <div className="mt-8">
                          <h4 className="font-medium text-gray-900 mb-3 font-reisinger-yonatan">דרישות הקבוצה</h4>
                          <ul className="space-y-2">
                            {selectedGroup.requirements.map((requirement, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                <span className="font-reisinger-yonatan">{requirement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <div className="text-center py-12">
                      <TrendUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2 font-reisinger-yonatan">ניתוח נתונים מתקדם</h3>
                      <p className="text-gray-600 font-reisinger-yonatan">תכונה זו תהיה זמינה בקרוב</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center text-gray-500">
                  <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2 font-reisinger-yonatan">בחר קבוצה</h3>
                  <p className="font-reisinger-yonatan">בחר קבוצה מהרשימה כדי לצפות בפרטים ולנהל תלמידים</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enroll Student Modal */}
      {showEnrollModal && selectedGroup && (
        <EnrollStudentModal
          group={selectedGroup}
          availableStudents={availableForEnrollment}
          onClose={() => setShowEnrollModal(false)}
          onEnroll={(studentId) => {
            handleEnrollStudent(studentId, selectedGroup.id)
            setShowEnrollModal(false)
          }}
        />
      )}
    </div>
  )
}

// Helper function
const getDayLabel = (day: string) => {
  const days = {
    'sunday': 'ראשון',
    'monday': 'שני',
    'tuesday': 'שלישי',
    'wednesday': 'רביעי',
    'thursday': 'חמישי',
    'friday': 'שישי',
    'saturday': 'שבת'
  }
  return days[day.toLowerCase() as keyof typeof days] || day
}

// Enroll Student Modal Component
interface EnrollStudentModalProps {
  group: TheoryGroup
  availableStudents: GroupStudent[]
  onClose: () => void
  onEnroll: (studentId: string) => void
}

function EnrollStudentModal({ group, availableStudents, onClose, onEnroll }: EnrollStudentModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStudents = availableStudents.filter(student =>
    getDisplayName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.instrument?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" dir="rtl">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          הוסף תלמיד ל{group.name}
        </h3>

        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="חיפוש תלמידים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {group.enrolledStudents.length >= group.capacity && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <WarningIcon className="w-4 h-4" />
              <span className="text-sm font-reisinger-yonatan">הקבוצה מלאה - תלמידים יתווספו לרשימת המתנה</span>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="font-reisinger-yonatan">אין תלמידים זמינים</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900 font-reisinger-yonatan">
                    {getDisplayName(student)}
                  </div>
                  <div className="text-sm text-gray-600 font-reisinger-yonatan">
                    {student.instrument && `${student.instrument} • `}
                    {student.grade && `כיתה ${student.grade}`}
                  </div>
                </div>
                <button
                  onClick={() => onEnroll(student.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-reisinger-yonatan"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  {group.enrolledStudents.length >= group.capacity ? 'רשימת המתנה' : 'רשום'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-reisinger-yonatan"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}