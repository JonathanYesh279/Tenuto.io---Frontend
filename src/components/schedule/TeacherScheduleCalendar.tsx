import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings, Users, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import ScheduleTimeSlot from './ScheduleTimeSlot';
import StudyDayTemplateManager from './StudyDayTemplateManager';
import apiService from '../../services/apiService';
import { getDisplayName } from '@/utils/nameUtils';

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

interface Student {
  _id: string;
  personalInfo: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  teacherAssignments: Array<{
    teacherId: string;
    instrument: string;
    lessonDuration: number;
  }>;
}

interface TimeSlot {
  _id?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  location?: string;
  studentId?: string;
  studentName?: string;
  instrument?: string;
  status?: 'available' | 'booked' | 'blocked' | 'pending';
  notes?: string;
  hasConflict?: boolean;
}

interface DaySchedule {
  date: string;
  dayOfWeek: number;
  timeSlots: TimeSlot[];
}

interface TeacherScheduleCalendarProps {
  teacherId: string;
  schoolYearId?: string;
  onLessonBooked?: (lesson: any) => void;
  onLessonCancelled?: (lesson: any) => void;
}

const TeacherScheduleCalendar: React.FC<TeacherScheduleCalendarProps> = ({
  teacherId,
  schoolYearId,
  onLessonBooked,
  onLessonCancelled
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStudyDayManager, setShowStudyDayManager] = useState(false);
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [conflicts, setConflicts] = useState<Record<string, boolean>>({});

  // Get week dates
  const getWeekDates = useCallback((date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Adjust for Sunday start
    startOfWeek.setDate(diff);

    for (let i = 0; i < 6; i++) { // Sunday to Friday
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      week.push(currentDate);
    }
    return week;
  }, []);

  // Load teacher schedule for current week
  const loadWeekSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const weekDates = getWeekDates(currentWeek);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[weekDates.length - 1].toISOString().split('T')[0];

      const scheduleData = await apiService.schedule.getTeacherSchedule(teacherId, startDate, endDate);
      
      // Transform schedule data into week format
      const weekScheduleData: DaySchedule[] = weekDates.map((date, index) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayData = scheduleData.find((d: any) => d.date === dateStr);
        
        return {
          date: dateStr,
          dayOfWeek: index,
          timeSlots: dayData?.timeSlots || []
        };
      });

      setWeekSchedule(weekScheduleData);
      
      // Detect conflicts
      await detectConflicts(weekScheduleData);
      
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת לוח הזמנים');
    } finally {
      setLoading(false);
    }
  }, [teacherId, currentWeek, getWeekDates]);

  // Load available students for this teacher
  const loadAvailableStudents = useCallback(async () => {
    try {
      const students = await apiService.students.getStudents({
        schoolYearId,
        teacherId // Filter students assigned to this teacher
      });
      
      setAvailableStudents(students.filter((student: Student) => 
        student.teacherAssignments?.some(assignment => assignment.teacherId === teacherId)
      ));
    } catch (err: any) {
      console.error('Error loading students:', err);
    }
  }, [teacherId, schoolYearId]);

  // Detect scheduling conflicts
  const detectConflicts = async (schedule: DaySchedule[]) => {
    const conflictMap: Record<string, boolean> = {};
    
    for (const day of schedule) {
      for (const slot of day.timeSlots) {
        if (slot.studentId) {
          // Check for conflicts with rehearsals, theory lessons, etc.
          try {
            const studentSchedule = await apiService.schedule.getStudentConflicts(
              slot.studentId, day.date, slot.startTime, slot.endTime
            );
            
            const hasConflict = studentSchedule.conflicts && studentSchedule.conflicts.length > 0;
            conflictMap[`${day.date}-${slot.startTime}`] = hasConflict;
          } catch (error) {
            // Ignore conflict check errors for now
          }
        }
      }
    }
    
    setConflicts(conflictMap);
  };

  useEffect(() => {
    loadWeekSchedule();
    loadAvailableStudents();
  }, [loadWeekSchedule, loadAvailableStudents]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const handleStudentDragStart = (e: React.DragEvent, student: Student) => {
    e.dataTransfer.setData('application/student-id', student._id);
    e.dataTransfer.setData('application/student-name', getDisplayName(student.personalInfo));
    setDraggedStudent(student);
  };

  const handleStudentDragEnd = () => {
    setDraggedStudent(null);
  };

  const handleStudentDrop = async (studentId: string, timeSlot: TimeSlot, date: string) => {
    try {
      const student = availableStudents.find(s => s._id === studentId);
      if (!student) return;

      const assignment = student.teacherAssignments.find(a => a.teacherId === teacherId);
      if (!assignment) return;

      const lessonData = {
        studentId,
        date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        instrument: assignment.instrument,
        location: timeSlot.location || 'חדר 5',
        status: 'scheduled',
        teacherId
      };

      const bookedLesson = await apiService.schedule.bookLesson(teacherId, lessonData);
      
      // Refresh schedule
      await loadWeekSchedule();
      
      if (onLessonBooked) {
        onLessonBooked(bookedLesson);
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בקביעת השיעור');
    }
  };

  const handleSlotEdit = (timeSlot: TimeSlot) => {
    // Open lesson edit modal
    console.log('Edit lesson:', timeSlot);
  };

  const handleSlotCancel = async (timeSlot: TimeSlot) => {
    try {
      if (timeSlot._id) {
        await apiService.schedule.cancelLesson(timeSlot._id);
        await loadWeekSchedule();
        
        if (onLessonCancelled) {
          onLessonCancelled(timeSlot);
        }
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בביטול השיעור');
    }
  };

  const formatWeekRange = () => {
    const weekDates = getWeekDates(currentWeek);
    const start = weekDates[0];
    const end = weekDates[weekDates.length - 1];
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${HEBREW_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    } else {
      return `${start.getDate()} ${HEBREW_MONTHS[start.getMonth()]} - ${end.getDate()} ${HEBREW_MONTHS[end.getMonth()]} ${start.getFullYear()}`;
    }
  };

  if (showStudyDayManager) {
    return (
      <StudyDayTemplateManager
        teacherId={teacherId}
        schoolYearId={schoolYearId}
        onSave={() => {
          setShowStudyDayManager(false);
          loadWeekSchedule();
        }}
        onCancel={() => setShowStudyDayManager(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען לוח זמנים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">לוח זמנים שבועי</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowStudyDayManager(true)}
              className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <Settings className="w-4 h-4 mr-1" />
              נהל ימי לימוד
            </button>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <span className="text-lg font-semibold text-gray-900 px-4">
                {formatWeekRange()}
              </span>
              
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Students Sidebar */}
        <Card padding="md" className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              תלמידים ({availableStudents.length})
            </h3>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableStudents.map((student) => {
              const assignment = student.teacherAssignments.find(a => a.teacherId === teacherId);
              return (
                <div
                  key={student._id}
                  draggable
                  onDragStart={(e) => handleStudentDragStart(e, student)}
                  onDragEnd={handleStudentDragEnd}
                  className={`
                    p-3 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors
                    ${draggedStudent?._id === student._id ? 'bg-blue-50 border-blue-300' : ''}
                  `}
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {getDisplayName(student.personalInfo)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {assignment?.instrument} • {assignment?.lessonDuration || 45} דק'
                  </div>
                </div>
              );
            })}
            
            {availableStudents.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                אין תלמידים זמינים
              </div>
            )}
          </div>
        </Card>

        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekSchedule.map((day, dayIndex) => {
              const date = new Date(day.date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <Card
                  key={day.date}
                  padding="md"
                  className={`${isToday ? 'ring-2 ring-primary-300 bg-primary-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {HEBREW_DAYS[dayIndex]}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {day.timeSlots.length > 0 ? (
                      day.timeSlots.map((slot, slotIndex) => {
                        const conflictKey = `${day.date}-${slot.startTime}`;
                        const hasConflict = conflicts[conflictKey];
                        
                        return (
                          <ScheduleTimeSlot
                            key={slotIndex}
                            timeSlot={{ ...slot, hasConflict }}
                            teacherId={teacherId}
                            date={day.date}
                            onDrop={handleStudentDrop}
                            onEdit={handleSlotEdit}
                            onCancel={handleSlotCancel}
                          />
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        אין שיעורים מוגדרים
                        <br />
                        <button
                          onClick={() => setShowStudyDayManager(true)}
                          className="text-primary-600 hover:text-primary-800 text-sm mt-2"
                        >
                          צור יום לימוד
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherScheduleCalendar;