/**
 * Student Management Tab Component
 * 
 * Manages students assigned to the teacher
 */

import { useState, useEffect, useRef } from 'react'
import { Users, Plus, Trash2, Calendar, Clock, User, Search, X, ChevronDown, BookOpen } from 'lucide-react'
import { Teacher } from '../../types'
import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'

interface StudentManagementTabProps {
  teacher: Teacher
  teacherId: string
}

interface Student {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
  }
  academicInfo?: {
    class?: string
  }
  primaryInstrument?: string
}

const StudentManagementTab: React.FC<StudentManagementTabProps> = ({ teacher, teacherId }) => {
  const [students, setStudents] = useState<Student[]>([])
  const [studentsWithLessons, setStudentsWithLessons] = useState<{ [key: string]: boolean }>({})
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isSchedulingLesson, setIsSchedulingLesson] = useState(false)
  const [schedulingStudent, setSchedulingStudent] = useState<Student | null>(null)
  const [lessonData, setLessonData] = useState({
    day: '',
    startTime: '',
    duration: 30
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if student has active lessons with this teacher (using existing student data)
  const checkStudentHasLessons = (student: any): boolean => {
    try {
      const hasActiveAssignment = student.teacherAssignments?.some((assignment: any) => 
        assignment.teacherId === teacherId && assignment.isActive === true
      )
      return hasActiveAssignment || false
    } catch (error) {
      console.error(`Error checking lessons for student ${student._id}:`, error)
      return false
    }
  }

  // Fetch students data - use teacher.teaching.studentIds as source of truth
  // This ensures we show all students assigned to the teacher, even those without lessons yet
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true)

        console.log('📚 StudentManagementTab - Fetching students for teacher:', {
          teacherId,
          teacherName: getDisplayName(teacher.personalInfo),
          studentIds: teacher.teaching?.studentIds
        })

        // Use teacher's studentIds array as the source of truth
        const studentIds = teacher.teaching?.studentIds || []

        if (studentIds.length > 0) {
          // Fetch full student data for each student ID
          const studentPromises = studentIds.map((studentId: string) =>
            apiService.students.getStudentById(studentId).catch((err: any) => {
              console.warn(`⚠️ Failed to fetch student ${studentId}:`, err.message)
              return null // Return null for failed fetches
            })
          )
          const studentData = await Promise.all(studentPromises)
          const validStudents = studentData.filter(Boolean) // Filter out null values
          console.log('✅ StudentManagementTab - Fetched students:', validStudents.length)
          setStudents(validStudents)

          // Check which students have active lessons with this teacher
          const lessonStatusMap: { [key: string]: boolean } = {}
          validStudents.forEach((student: any) => {
            // Check if student has an active teacherAssignment with this teacher
            const hasActiveLesson = student.teacherAssignments?.some((assignment: any) =>
              assignment.teacherId === teacherId && assignment.isActive === true
            )
            lessonStatusMap[student._id] = hasActiveLesson || false
          })
          setStudentsWithLessons(lessonStatusMap)
        } else {
          console.log('⚠️ StudentManagementTab - No students in teacher.teaching.studentIds')
          setStudents([])
        }

        // Fetch all students for the add student dropdown
        const allStudentsData = await apiService.students.getStudents()
        setAllStudents(allStudentsData)
      } catch (error) {
        console.error('❌ Error fetching students:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [teacherId, teacher.teaching?.studentIds])

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    setSelectedStudentId(student._id)
    setSearchTerm(getDisplayName(student.personalInfo))
    setShowDropdown(false)
    setHighlightedIndex(-1)
  }

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setSelectedStudentId('')
    setShowDropdown(true)
    setHighlightedIndex(-1)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('')
    setSelectedStudentId('')
    setShowDropdown(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowDropdown(true)
        return
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredStudents.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredStudents.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredStudents[highlightedIndex]) {
          handleStudentSelect(filteredStudents[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleAddStudent = async () => {
    if (!selectedStudentId) return

    try {
      await apiService.teachers.addStudentToTeacher(teacherId, selectedStudentId)
      
      // Refresh students list
      const newStudent = await apiService.students.getStudentById(selectedStudentId)
      setStudents(prev => [...prev, newStudent])
      
      setIsAddingStudent(false)
      setSelectedStudentId('')
      setSearchTerm('')
    } catch (error) {
      console.error('Error adding student:', error)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    const student = students.find(s => s._id === studentId)
    const studentName = getDisplayName(student?.personalInfo) || 'התלמיד'
    const teacherName = getDisplayName(teacher.personalInfo) || 'המורה'
    
    if (!confirm(`האם אתה בטוח שברצונך להסיר את ${studentName} מרשימת התלמידים של ${teacherName}?\n\nפעולה זו תנתק את הקשר בין התלמיד למורה אך לא תמחק את פרטי התלמיד מהמערכת.`)) return

    try {
      await apiService.teachers.removeStudentFromTeacher(teacherId, studentId)
      
      // Remove from local state
      setStudents(prev => prev.filter(student => student._id !== studentId))
    } catch (error) {
      console.error('Error removing student:', error)
    }
  }

  const handleScheduleLesson = (student: Student) => {
    setSchedulingStudent(student)
    setIsSchedulingLesson(true)
    setLessonData({
      day: '',
      startTime: '',
      duration: 30
    })
  }

  const handleSaveLesson = async () => {
    if (!schedulingStudent || !lessonData.day || !lessonData.startTime) {
      alert('אנא מלא את כל השדות הנדרשים')
      return
    }

    try {
      console.log('🔄 Creating lesson for student:', getDisplayName(schedulingStudent.personalInfo))
      
      // Calculate end time
      const calculateEndTime = (startTime: string, duration: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + duration
        const endHours = Math.floor(totalMinutes / 60)
        const endMins = totalMinutes % 60
        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      }

      // Get current student data
      const currentStudent = await apiService.students.getStudentById(schedulingStudent._id)
      console.log('📋 Current student data loaded:', getDisplayName(currentStudent.personalInfo))

      // Get primary instrument
      const primaryInstrument = currentStudent.academicInfo?.instrumentProgress?.find(
        (instrument: any) => instrument.isPrimary
      )?.instrumentName || 'כלי נגינה'

      // Create the teacher assignment matching the exact backend structure
      // Backend expects: { teacherId, day, time, duration, location, isActive }
      const newAssignment = {
        teacherId: teacherId,
        day: lessonData.day,
        time: lessonData.startTime, // HH:MM format
        duration: lessonData.duration, // minutes
        location: '', // Empty string for now, can be filled later
        isActive: true
      }

      // Add the new assignment to the existing teacher assignments
      const updatedAssignments = [...(currentStudent.teacherAssignments || []), newAssignment]

      console.log('📤 Adding new teacher assignment:', newAssignment)
      console.log('📝 All assignments to be saved:', updatedAssignments)

      // Update the student record with teacher assignments
      // Backend will handle teacher-student relationship sync automatically
      const updateData = {
        teacherAssignments: updatedAssignments
      }

      console.log('📤 Sending update data:', updateData)

      // Update the student record
      const result = await apiService.students.updateStudent(schedulingStudent._id, updateData)

      console.log('✅ Student updated with new lesson assignment')

      // Update the lesson status for this student
      setStudentsWithLessons(prev => ({
        ...prev,
        [schedulingStudent._id]: true
      }))

      // Close modal and reset
      setIsSchedulingLesson(false)
      setSchedulingStudent(null)
      setLessonData({ day: '', startTime: '', duration: 30 })

      // Success is already logged to console
      // TODO: Add toast notification here later

    } catch (error) {
      console.error('❌ Failed to schedule lesson:', error)
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'שגיאה בקביעת השיעור. אנא נסה שוב.'
      
      if (error.message.includes('Authentication failed')) {
        errorMessage = 'פג תוקף הפנייה. אנא התחבר מחדש.'
      } else if (error.message.includes('validation')) {
        errorMessage = 'שגיאה בנתונים שהוזנו. אנא בדוק את פרטי השיעור.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'התלמיד לא נמצא במערכת.'
      } else if (error.message.includes('Network')) {
        errorMessage = 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט.'
      } else if (error.message.includes('שגיאה בשמירת הנתונים')) {
        errorMessage = 'שגיאה בשמירת הנתונים במסד הנתונים. אנא נסה שוב.'
      }
      
      alert(errorMessage)
      
      // Log detailed error information for debugging
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        studentId: schedulingStudent._id,
        teacherId: teacherId,
        lessonData: lessonData
      })
    }
  }

  // Get available students (not already assigned to this teacher)
  // Use the students state (from lessons API) instead of teacher.teaching.studentIds
  const assignedStudentIds = students.map(s => s._id)
  const availableStudents = allStudents.filter(student =>
    !assignedStudentIds.includes(student._id)
  )

  // Filter students based on search term
  const filteredStudents = availableStudents.filter(student => {
    const displayName = getDisplayName(student.personalInfo)
    const className = student.academicInfo?.class || ''
    const searchQuery = searchTerm.toLowerCase()
    return (
      displayName.toLowerCase().includes(searchQuery) ||
      className.toLowerCase().includes(searchQuery)
    )
  })

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search and dropdown when modal closes
  useEffect(() => {
    if (!isAddingStudent) {
      setSearchTerm('')
      setSelectedStudentId('')
      setShowDropdown(false)
      setHighlightedIndex(-1)
    }
  }, [isAddingStudent])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsAddingStudent(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          הוסף תלמיד
        </button>
      </div>

      {/* Add Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 teacher-modal-backdrop">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all teacher-modal-container">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">הוסף תלמיד חדש</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-800 teacher-modal-label">
                    חפש ובחר תלמיד
                  </label>
                  <div className="text-xs text-gray-500">
                    ↑↓ לניווט • Enter לבחירה • Esc לסגירה
                  </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                  {/* Search Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="הקלד שם תלמיד או כיתה..."
                      className="w-full pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white teacher-search-input"
                      style={{ paddingLeft: searchTerm ? '2.5rem' : '2.5rem' }}
                    />
                    {searchTerm ? (
                      <button
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center hover:bg-gray-50 rounded-r-lg"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    ) : (
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto teacher-search-dropdown teacher-dropdown-enter">
                      {filteredStudents.length > 0 ? (
                        <>
                          {filteredStudents.map((student, index) => (
                            <button
                              key={student._id}
                              onClick={() => handleStudentSelect(student)}
                              className={`w-full text-right px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 teacher-search-option ${
                                index === highlightedIndex ? 'bg-primary-50 text-primary-700 highlighted' : 'text-gray-900'
                              } ${selectedStudentId === student._id ? 'bg-primary-100 text-primary-700 font-medium' : ''}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  {getDisplayName(student.personalInfo)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  כיתה {student.academicInfo?.class || 'לא צוין'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          {searchTerm ? 'לא נמצאו תלמידים' : 'אין תלמידים זמינים'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 teacher-modal-buttons">
                <button
                  onClick={handleAddStudent}
                  disabled={!selectedStudentId}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm font-medium teacher-modal-button"
                >
                  הוסף
                </button>
                <button
                  onClick={() => {
                    setIsAddingStudent(false)
                    setSelectedStudentId('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm font-medium teacher-modal-button"
                >
                  בטל
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Lesson Modal */}
      {isSchedulingLesson && schedulingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              קביעת שיעור שבועי
            </h3>
            
            {/* Student Info */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-blue-900 mb-2">פרטי התלמיד</h4>
              <div className="text-sm text-blue-800">
                <div><strong>שם:</strong> {getDisplayName(schedulingStudent.personalInfo)}</div>
                <div><strong>כיתה:</strong> {schedulingStudent.academicInfo?.class || 'לא צוין'}</div>
                <div><strong>כלי נגינה:</strong> {schedulingStudent.primaryInstrument || 'לא צוין'}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  יום השבוע
                </label>
                <select
                  value={lessonData.day}
                  onChange={(e) => setLessonData(prev => ({ ...prev, day: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">בחר יום</option>
                  <option value="ראשון">ראשון</option>
                  <option value="שני">שני</option>
                  <option value="שלישי">שלישי</option>
                  <option value="רביעי">רביעי</option>
                  <option value="חמישי">חמישי</option>
                  <option value="שישי">שישי</option>
                  <option value="שבת">שבת</option>
                </select>
              </div>

              {/* Time and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    זמן התחלה
                  </label>
                  <input
                    type="time"
                    value={lessonData.startTime}
                    onChange={(e) => setLessonData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    משך (דקות)
                  </label>
                  <select
                    value={lessonData.duration}
                    onChange={(e) => setLessonData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={30}>30 דקות</option>
                    <option value={45}>45 דקות</option>
                    <option value={60}>60 דקות</option>
                  </select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={handleSaveLesson}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  קבע שיעור
                </button>
                <button
                  onClick={() => {
                    setIsSchedulingLesson(false)
                    setSchedulingStudent(null)
                    setLessonData({ day: '', startTime: '', duration: 30 })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      {students.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין תלמידים משויכים</h3>
          <p className="text-gray-600 mb-4">
            עדיין לא שויכו תלמידים למורה זה
          </p>
          <button
            onClick={() => setIsAddingStudent(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-sm font-medium"
          >
            הוסף תלמיד ראשון
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {students.map(student => (
            <div
              key={student._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getDisplayName(student.personalInfo) || 'ללא שם'}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>כיתה {student.academicInfo?.class || 'לא צוין'}</span>
                      <span>•</span>
                      <span>{student.primaryInstrument || 'ללא כלי'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Only show Schedule Lesson button if student doesn't have active lessons with this teacher */}
                  {!studentsWithLessons[student._id] && (
                    <button
                      onClick={() => handleScheduleLesson(student)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all shadow-sm font-medium flex items-center gap-1"
                    >
                      <BookOpen className="w-4 h-4" />
                      קבע שיעור
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.location.href = `/students/${student._id}`}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all shadow-sm font-medium"
                  >
                    צפה בפרטים
                  </button>
                  <button
                    onClick={() => handleRemoveStudent(student._id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all shadow-sm font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    הסר
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Overview for Students */}
      {students.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            סקירת לוח זמנים
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacher.teaching?.timeBlocks?.map((timeBlock, index) => (
              <div key={timeBlock._id || index} className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{timeBlock.day}</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.round(timeBlock.totalDuration / 60)} שעות
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {timeBlock.startTime} - {timeBlock.endTime}
                </div>
                {timeBlock.location && (
                  <div className="text-sm text-gray-500 mt-1">
                    📍 {timeBlock.location}
                  </div>
                )}
                <div className="text-xs text-blue-600 mt-2">
                  {timeBlock.assignedLessons?.length || 0} שיעורים מתוכננים
                </div>
              </div>
            ))}
          </div>

          {(!teacher.teaching?.timeBlocks || teacher.teaching.timeBlocks.length === 0) && (
            <div className="text-center text-gray-500 py-4">
              אין בלוקי זמן מוגדרים עדיין
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentManagementTab