import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Plus, Settings, ChevronLeft, ChevronRight,
  Clock, MapPin, User, Phone, Mail
} from 'lucide-react';
import { Card } from '../ui/Card';
import apiService from '../../services/apiService';
import { getDisplayName } from '@/utils/nameUtils';

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

interface MobileScheduleInterfaceProps {
  teacherId: string;
  schoolYearId?: string;
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

const MobileScheduleInterface: React.FC<MobileScheduleInterfaceProps> = ({
  teacherId,
  schoolYearId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daySchedule, setDaySchedule] = useState<TimeSlot[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDaySchedule();
    loadAvailableStudents();
  }, [currentDate, teacherId]);

  const loadDaySchedule = async () => {
    try {
      setLoading(true);
      const dateStr = currentDate.toISOString().split('T')[0];
      const schedule = await apiService.schedule.getTeacherSchedule(
        teacherId, 
        dateStr, 
        dateStr
      );
      
      setDaySchedule(schedule[0]?.timeSlots || []);
    } catch (error) {
      console.error('Error loading day schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const students = await apiService.students.getStudents({
        schoolYearId,
        teacherId
      });
      
      setAvailableStudents(students.filter((student: Student) => 
        student.teacherAssignments?.some(assignment => assignment.teacherId === teacherId)
      ));
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleSlotTap = (slot: TimeSlot) => {
    if (slot.isAvailable && !slot.studentId) {
      // Available slot - show student selection
      setSelectedSlot(slot);
      setShowStudentList(true);
    } else if (slot.studentId) {
      // Booked slot - show lesson details
      setSelectedSlot(slot);
      setShowStudentList(false);
    }
  };

  const handleStudentSelect = async (student: Student) => {
    if (!selectedSlot) return;

    try {
      const assignment = student.teacherAssignments.find(a => a.teacherId === teacherId);
      if (!assignment) return;

      const lessonData = {
        studentId: student._id,
        date: currentDate.toISOString().split('T')[0],
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        instrument: assignment.instrument,
        location: selectedSlot.location || 'חדר 5',
        status: 'scheduled',
        teacherId
      };

      await apiService.schedule.bookLesson(teacherId, lessonData);
      await loadDaySchedule();
      
      setShowStudentList(false);
      setSelectedSlot(null);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error booking lesson:', error);
    }
  };

  const handleCancelLesson = async (slot: TimeSlot) => {
    try {
      if (slot._id) {
        await apiService.schedule.cancelLesson(slot._id);
        await loadDaySchedule();
        setSelectedSlot(null);
      }
    } catch (error) {
      console.error('Error cancelling lesson:', error);
    }
  };

  const formatDate = () => {
    return currentDate.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getSlotStatusColor = (slot: TimeSlot) => {
    if (slot.hasConflict) return 'bg-red-100 border-red-300';
    
    switch (slot.status) {
      case 'available':
        return 'bg-green-50 border-green-200';
      case 'booked':
        return 'bg-blue-50 border-blue-200';
      case 'blocked':
        return 'bg-gray-100 border-gray-300';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return slot.isAvailable
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-100 border-gray-300';
    }
  };

  // Student List Modal
  const StudentListModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              בחר תלמיד לשיעור
            </h3>
            <button
              onClick={() => setShowStudentList(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          {selectedSlot && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedSlot.startTime}-{selectedSlot.endTime} • {selectedSlot.location}
            </p>
          )}
        </div>
        
        <div className="p-4 space-y-3">
          {availableStudents.map((student) => {
            const assignment = student.teacherAssignments.find(a => a.teacherId === teacherId);
            return (
              <button
                key={student._id}
                onClick={() => handleStudentSelect(student)}
                className="w-full p-4 text-right bg-white border border-gray-200 rounded-lg active:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">
                  {getDisplayName(student.personalInfo)}
                </div>
                <div className="text-sm text-gray-600">
                  {assignment?.instrument} • {assignment?.lessonDuration || 45} דק'
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Lesson Details Modal
  const LessonDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-xl w-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              פרטי השיעור
            </h3>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
        
        {selectedSlot && (
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{selectedSlot.studentName}</p>
                <p className="text-sm text-gray-600">{selectedSlot.instrument}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <p className="text-gray-700">
                {selectedSlot.startTime}-{selectedSlot.endTime}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <p className="text-gray-700">{selectedSlot.location}</p>
            </div>
            
            {selectedSlot.notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{selectedSlot.notes}</p>
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => handleCancelLesson(selectedSlot)}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium active:bg-red-600"
              >
                בטל שיעור
              </button>
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium active:bg-gray-50"
              >
                סגור
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">לוח זמנים</h1>
          </div>
          
          <button className="p-2 text-gray-600 hover:text-gray-800">
            <Settings className="w-6 h-6" />
          </button>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
          <button
            onClick={() => navigateDay('prev')}
            className="p-2 text-gray-600 active:bg-gray-200 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDate()}
          </h2>
          
          <button
            onClick={() => navigateDay('next')}
            className="p-2 text-gray-600 active:bg-gray-200 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">טוען...</p>
          </div>
        ) : daySchedule.length > 0 ? (
          daySchedule.map((slot, index) => (
            <button
              key={index}
              onClick={() => handleSlotTap(slot)}
              className={`
                w-full p-4 rounded-lg border-2 text-right active:scale-95 transition-all
                ${getSlotStatusColor(slot)}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {slot.startTime}-{slot.endTime}
                </span>
                
                {slot.location && (
                  <span className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {slot.location}
                  </span>
                )}
              </div>
              
              {slot.studentId && slot.studentName ? (
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    {slot.studentName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {slot.instrument}
                  </p>
                </div>
              ) : slot.isAvailable ? (
                <div className="flex items-center justify-center py-2">
                  <Plus className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-700 font-medium">
                    הוסף תלמיד
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  זמן חסום
                </p>
              )}
              
              {slot.hasConflict && (
                <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  קיים קונפליקט
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              אין שיעורים היום
            </h3>
            <p className="text-gray-600 mb-4">
              תוכל ליצור יום לימוד חדש בהגדרות
            </p>
            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg">
              צור יום לימוד
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowStudentList(true)}
            className="flex items-center justify-center py-3 bg-primary-600 text-white rounded-lg font-medium active:bg-primary-700"
          >
            <Users className="w-5 h-5 mr-2" />
            תלמידים
          </button>
          <button className="flex items-center justify-center py-3 border border-gray-300 text-gray-700 rounded-lg font-medium active:bg-gray-50">
            <Settings className="w-5 h-5 mr-2" />
            הגדרות
          </button>
        </div>
      </div>

      {/* Modals */}
      {showStudentList && <StudentListModal />}
      {selectedSlot && selectedSlot.studentId && <LessonDetailsModal />}
    </div>
  );
};

export default MobileScheduleInterface;