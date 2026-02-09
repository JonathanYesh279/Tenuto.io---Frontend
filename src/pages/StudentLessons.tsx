import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Music, Plus, X, Check, AlertCircle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Table'
import apiService from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { getDisplayName } from '../utils/nameUtils'

interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone?: string
  }
}

interface TeacherAssignment {
  teacherId: string
  instrumentName: string
  lessonDuration: number
  frequency: string
  preferredTimes: string[]
  isActive: boolean
}

interface StudentLesson {
  _id: string
  teacherId: string
  teacherName: string
  studentId: string
  date: string
  startTime: string
  endTime: string
  instrument: string
  location: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'noshow'
  notes: string
  homework?: string
  rating?: number
}

interface AvailableSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  location: string
  bookedBy?: string
}

export default function StudentLessons() {
  const { currentSchoolYear } = useSchoolYear()
  const [activeTab, setActiveTab] = useState<'myLessons' | 'bookLesson'>('myLessons')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Student data
  const [currentStudent, setCurrentStudent] = useState<any>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [lessons, setLessons] = useState<StudentLesson[]>([])
  
  // Booking state
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [selectedInstrument, setSelectedInstrument] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [bookingNotes, setBookingNotes] = useState<string>('')
  const [bookingLoading, setBookingLoading] = useState(false)

  // Mock current student ID - in real app this would come from auth context
  const currentStudentId = "current_student_id"

  useEffect(() => {
    if (currentSchoolYear) {
      loadStudentData()
      loadLessons()
    }
  }, [currentSchoolYear])

  useEffect(() => {
    if (selectedTeacher && selectedDate) {
      loadTeacherAvailability()
    }
  }, [selectedTeacher, selectedDate])

  const loadStudentData = async () => {
    try {
      setLoading(true)
      // In real implementation, get current student from auth context
      // const student = await apiService.students.getStudent(currentStudentId)
      // setCurrentStudent(student)
      
      // Mock student data with teacher assignments
      const mockStudent = {
        _id: currentStudentId,
        personalInfo: { firstName: "תלמיד", lastName: "דוגמה" },
        teacherAssignments: [
          {
            teacherId: "teacher1",
            instrumentName: "פסנתר",
            lessonDuration: 45,
            frequency: "weekly",
            preferredTimes: ["Monday 16:00", "Wednesday 15:00"],
            isActive: true
          },
          {
            teacherId: "teacher2", 
            instrumentName: "כינור",
            lessonDuration: 45,
            frequency: "weekly",
            preferredTimes: ["Tuesday 17:00", "Thursday 16:00"],
            isActive: true
          }
        ]
      }
      setCurrentStudent(mockStudent)
      
      // Load teachers
      const teachersData = await apiService.teachers.getTeachers({ 
        schoolYearId: currentSchoolYear?._id 
      })
      setTeachers(teachersData)
      
    } catch (err) {
      console.error('Error loading student data:', err)
      setError('שגיאה בטעינת נתוני התלמיד')
    } finally {
      setLoading(false)
    }
  }

  const loadLessons = async () => {
    try {
      // Get lessons for current student
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30) // Last 30 days
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30) // Next 30 days

      const lessonsData = await apiService.schedule.getLessons({
        studentId: currentStudentId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      })
      
      // Mock lessons data if API returns empty
      const mockLessons: StudentLesson[] = [
        {
          _id: "lesson1",
          teacherId: "teacher1",
          teacherName: "מורה דוגמה",
          studentId: currentStudentId,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          startTime: "16:00",
          endTime: "16:45",
          instrument: "פסנתר",
          location: "חדר 5",
          status: "scheduled",
          notes: "חזרה על יצירה קלאסית"
        },
        {
          _id: "lesson2",
          teacherId: "teacher2",
          teacherName: "מורה אחר",
          studentId: currentStudentId,
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          startTime: "17:00",
          endTime: "17:45",
          instrument: "כינור",
          location: "חדר 3",
          status: "completed",
          notes: "עבודה על טכניקת קשת",
          homework: "תרגול סולמות מג'ור",
          rating: 4
        }
      ]
      
      setLessons(lessonsData.length > 0 ? lessonsData : mockLessons)
    } catch (err) {
      console.error('Error loading lessons:', err)
    }
  }

  const loadTeacherAvailability = async () => {
    try {
      const availability = await apiService.schedule.getTeacherAvailability(
        selectedTeacher,
        selectedDate
      )
      
      // Mock availability if API returns empty
      const mockSlots: AvailableSlot[] = [
        {
          startTime: "15:00",
          endTime: "15:45",
          isAvailable: true,
          location: "חדר 5"
        },
        {
          startTime: "16:00",
          endTime: "16:45", 
          isAvailable: false,
          location: "חדר 5",
          bookedBy: "other_student"
        },
        {
          startTime: "17:00",
          endTime: "17:45",
          isAvailable: true,
          location: "חדר 5"
        }
      ]
      
      setAvailableSlots(availability.availableSlots || mockSlots)
    } catch (err) {
      console.error('Error loading teacher availability:', err)
    }
  }

  const getStudentTeachers = () => {
    if (!currentStudent?.teacherAssignments) return []
    
    return currentStudent.teacherAssignments
      .filter((assignment: TeacherAssignment) => assignment.isActive)
      .map((assignment: TeacherAssignment) => {
        const teacher = teachers.find(t => t._id === assignment.teacherId)
        return {
          ...assignment,
          teacherName: getDisplayName(teacher?.personalInfo) || 'מורה לא ידוע'
        }
      })
  }

  const handleBookLesson = async () => {
    if (!selectedSlot || !selectedTeacher || !selectedInstrument) {
      setError('יש לבחור מורה, כלי נגינה ושעה')
      return
    }

    try {
      setBookingLoading(true)
      
      const booking = {
        studentId: currentStudentId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        instrument: selectedInstrument,
        notes: bookingNotes,
        priority: "normal"
      }
      
      await apiService.schedule.bookLesson(selectedTeacher, booking)
      
      // Refresh lessons and availability
      await loadLessons()
      await loadTeacherAvailability()
      
      // Reset booking form
      setSelectedSlot(null)
      setBookingNotes('')
      setActiveTab('myLessons')
      
    } catch (err) {
      console.error('Error booking lesson:', err)
      setError('שגיאה בהזמנת השיעור')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleCancelLesson = async (lessonId: string) => {
    try {
      await apiService.schedule.cancelLesson(lessonId)
      await loadLessons()
    } catch (err) {
      console.error('Error cancelling lesson:', err)
      setError('שגיאה בביטול השיעור')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'scheduled': { label: 'מתוכנן', status: 'active' as const },
      'completed': { label: 'הושלם', status: 'completed' as const },
      'cancelled': { label: 'בוטל', status: 'inactive' as const },
      'noshow': { label: 'לא הגיע', status: 'inactive' as const }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || 
                     { label: status, status: 'active' as const }
    
    return <StatusBadge status={statusInfo.status}>{statusInfo.label}</StatusBadge>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const upcomingLessons = lessons
    .filter(lesson => new Date(lesson.date) >= new Date() && lesson.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastLessons = lessons
    .filter(lesson => new Date(lesson.date) < new Date() || lesson.status !== 'scheduled')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Calendar className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary-600" />
          <div className="text-lg text-gray-600">טוען שיעורים...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">שיעורים פרטיים</h1>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
            <button 
              onClick={() => setError(null)}
              className="mr-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 space-x-reverse">
          <button
            onClick={() => setActiveTab('myLessons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'myLessons'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            השיעורים שלי
          </button>
          <button
            onClick={() => setActiveTab('bookLesson')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookLesson'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            הזמנת שיעור
          </button>
        </nav>
      </div>

      {activeTab === 'myLessons' && (
        <div className="space-y-6">
          {/* Upcoming Lessons */}
          <Card padding="md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              שיעורים קרובים
            </h2>
            
            {upcomingLessons.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                אין שיעורים מתוכננים
                <button 
                  onClick={() => setActiveTab('bookLesson')}
                  className="block mx-auto mt-2 text-primary-600 hover:text-primary-800"
                >
                  הזמן שיעור חדש
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingLessons.map(lesson => (
                  <div key={lesson._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Music className="w-4 h-4 mr-2 text-primary-600" />
                          <span className="font-medium">{lesson.instrument}</span>
                          <span className="text-gray-500 mr-2">עם {lesson.teacherName}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(lesson.date)}
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {lesson.startTime} - {lesson.endTime}
                            {lesson.location && ` • ${lesson.location}`}
                          </div>
                        </div>
                        {lesson.notes && (
                          <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                            {lesson.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getStatusBadge(lesson.status)}
                        {lesson.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelLesson(lesson._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ביטול
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Past Lessons */}
          <Card padding="md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              היסטוריית שיעורים
            </h2>
            
            {pastLessons.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                אין שיעורים קודמים
              </div>
            ) : (
              <div className="space-y-3">
                {pastLessons.slice(0, 5).map(lesson => (
                  <div key={lesson._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Music className="w-4 h-4 mr-2 text-primary-600" />
                          <span className="font-medium">{lesson.instrument}</span>
                          <span className="text-gray-500 mr-2">עם {lesson.teacherName}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {formatDate(lesson.date)} • {lesson.startTime} - {lesson.endTime}
                        </div>
                        {lesson.homework && (
                          <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200">
                            <strong>שיעורי בית:</strong> {lesson.homework}
                          </div>
                        )}
                        {lesson.notes && (
                          <p className="text-sm text-gray-700 mt-2">
                            {lesson.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getStatusBadge(lesson.status)}
                        {lesson.rating && (
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span 
                                key={i} 
                                className={i < lesson.rating! ? 'text-yellow-400' : 'text-gray-300'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'bookLesson' && (
        <div className="space-y-6">
          <Card padding="md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              הזמנת שיעור חדש
            </h2>
            
            <div className="space-y-4">
              {/* Teacher/Instrument Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מורה וכלי נגינה
                  </label>
                  <select
                    value={`${selectedTeacher}|${selectedInstrument}`}
                    onChange={(e) => {
                      const [teacherId, instrumentName] = e.target.value.split('|')
                      setSelectedTeacher(teacherId)
                      setSelectedInstrument(instrumentName)
                      setSelectedSlot(null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">בחר מורה וכלי נגינה</option>
                    {getStudentTeachers().map(assignment => (
                      <option 
                        key={`${assignment.teacherId}|${assignment.instrumentName}`}
                        value={`${assignment.teacherId}|${assignment.instrumentName}`}
                      >
                        {assignment.teacherName} - {assignment.instrumentName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תאריך
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setSelectedSlot(null)
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Available Slots */}
              {selectedTeacher && selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שעות פנויות
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-3 text-sm border rounded-lg transition-colors ${
                          selectedSlot === slot
                            ? 'bg-primary-500 text-white border-primary-500'
                            : slot.isAvailable
                            ? 'bg-white border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div>{slot.startTime}</div>
                        <div className="text-xs opacity-75">{slot.location}</div>
                        {!slot.isAvailable && (
                          <div className="text-xs text-red-500 mt-1">תפוס</div>
                        )}
                      </button>
                    ))}
                  </div>
                  {availableSlots.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      אין שעות פנויות בתאריך זה
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  הערות (אופציונלי)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="הערות לשיעור..."
                />
              </div>

              {/* Book Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleBookLesson}
                  disabled={!selectedSlot || bookingLoading}
                  className="flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      מזמין...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      הזמן שיעור
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}