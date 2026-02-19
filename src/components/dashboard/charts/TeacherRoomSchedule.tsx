/**
 * Teacher-Room Schedule Component
 * Displays a matrix showing which teacher teaches in which room on each day
 */

import React, { useState, useEffect, useMemo } from 'react';
import { enhancedDashboardAnalytics, type TeacherScheduleSlot } from '../../../services/enhancedDashboardAnalytics';
import { Calendar, MapPin, User, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface TeacherRoomScheduleProps {
  schoolYearId?: string;
  className?: string;
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const TeacherRoomSchedule: React.FC<TeacherRoomScheduleProps> = ({
  schoolYearId,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<{
    slots: TeacherScheduleSlot[];
    teachers: { id: string; name: string; color: string }[];
    rooms: string[];
    timeSlots: string[];
  } | null>(null);

  // Filters
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [schoolYearId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enhancedDashboardAnalytics.getTeacherRoomSchedule(schoolYearId);
      setScheduleData(data);
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError('שגיאה בטעינת לוח הזמנים');
    } finally {
      setLoading(false);
    }
  };

  // Filter slots based on selections
  const filteredSlots = useMemo(() => {
    if (!scheduleData) return [];

    return scheduleData.slots.filter(slot => {
      if (selectedDay !== 'all' && slot.day !== selectedDay) return false;
      if (selectedRoom !== 'all' && slot.roomNumber !== selectedRoom) return false;
      if (selectedTeacher !== 'all' && slot.teacherId !== selectedTeacher) return false;
      return true;
    });
  }, [scheduleData, selectedDay, selectedRoom, selectedTeacher]);

  // Group slots by day and time for matrix view
  const matrixData = useMemo(() => {
    const matrix: { [day: string]: { [time: string]: TeacherScheduleSlot[] } } = {};

    HEBREW_DAYS.forEach(day => {
      matrix[day] = {};
      TIME_SLOTS.forEach(time => {
        matrix[day][time] = [];
      });
    });

    filteredSlots.forEach(slot => {
      const day = slot.day;
      const time = slot.startTime;

      if (matrix[day] && time) {
        // Find the closest time slot
        const closestTime = TIME_SLOTS.find(t => {
          const slotMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
          const gridMinutes = parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);
          return Math.abs(slotMinutes - gridMinutes) < 30;
        });

        if (closestTime && matrix[day][closestTime]) {
          matrix[day][closestTime].push(slot);
        }
      }
    });

    return matrix;
  }, [filteredSlots]);

  // Get unique values for filters
  const uniqueRooms = useMemo(() => {
    if (!scheduleData) return [];
    return [...new Set(scheduleData.slots.map(s => s.roomNumber).filter(Boolean))].sort();
  }, [scheduleData]);

  const uniqueTeachers = useMemo(() => {
    if (!scheduleData) return [];
    return scheduleData.teachers;
  }, [scheduleData]);

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2 bg-blue-100 rounded">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">לוח מורים וחדרים</h3>
            <p className="text-sm text-gray-600">
              {filteredSlots.length} שיעורים מוצגים
            </p>
          </div>
        </div>

        {/* View Toggle & Filters Button */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded p-1">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              טבלה
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              רשימה
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 rounded border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">סינון</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Day Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">יום</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">כל הימים</option>
              {HEBREW_DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* Room Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">חדר</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">כל החדרים</option>
              {uniqueRooms.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מורה</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">כל המורים</option>
              {uniqueTeachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="p-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 sticky right-0 z-10 min-w-[80px]">
                  שעה
                </th>
                {HEBREW_DAYS.filter(day => selectedDay === 'all' || day === selectedDay).map(day => (
                  <th
                    key={day}
                    className="p-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 min-w-[140px]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.filter((_, index) => index % 2 === 0).map(time => (
                <tr key={time}>
                  <td className="p-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 sticky right-0 z-10 font-medium">
                    {time}
                  </td>
                  {HEBREW_DAYS.filter(day => selectedDay === 'all' || day === selectedDay).map(day => {
                    const cellSlots = matrixData[day]?.[time] || [];
                    const nextTimeIndex = TIME_SLOTS.indexOf(time) + 1;
                    const nextTime = TIME_SLOTS[nextTimeIndex];
                    const nextSlots = nextTime ? (matrixData[day]?.[nextTime] || []) : [];
                    const allSlots = [...cellSlots, ...nextSlots];

                    return (
                      <td
                        key={`${day}-${time}`}
                        className="p-1 border border-gray-200 align-top min-h-[60px]"
                      >
                        {allSlots.length > 0 ? (
                          <div className="space-y-1">
                            {allSlots.slice(0, 2).map((slot, index) => (
                              <div
                                key={index}
                                className="p-1.5 rounded text-xs"
                                style={{
                                  backgroundColor: `${slot.color}20`,
                                  borderRight: `3px solid ${slot.color}`
                                }}
                                title={`${slot.teacherName} | ${slot.roomNumber} | ${slot.startTime}-${slot.endTime}`}
                              >
                                <div className="font-medium text-gray-900 truncate">
                                  {slot.teacherName}
                                </div>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{slot.roomNumber || 'לא צוין'}</span>
                                </div>
                              </div>
                            ))}
                            {allSlots.length > 2 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{allSlots.length - 2} נוספים
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-[50px]"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {HEBREW_DAYS.filter(day => selectedDay === 'all' || day === selectedDay).map(day => {
            const daySlots = filteredSlots
              .filter(s => s.day === day)
              .sort((a, b) => {
                const aTime = a.startTime?.split(':').map(Number) || [0, 0];
                const bTime = b.startTime?.split(':').map(Number) || [0, 0];
                return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
              });

            if (daySlots.length === 0) return null;

            return (
              <div key={day} className="border border-gray-200 rounded overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">יום {day}</h4>
                  <span className="text-sm text-gray-600">{daySlots.length} שיעורים</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {daySlots.map((slot, index) => (
                    <div
                      key={index}
                      className="p-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Color indicator */}
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: slot.color }}
                      />

                      {/* Time */}
                      <div className="flex items-center gap-1 text-sm text-gray-600 min-w-[100px]">
                        <Clock className="w-4 h-4" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>

                      {/* Teacher */}
                      <div className="flex items-center gap-2 min-w-[150px]">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{slot.teacherName}</span>
                      </div>

                      {/* Room */}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{slot.roomNumber || slot.location || 'לא צוין'}</span>
                      </div>

                      {/* Student (if available) */}
                      {slot.studentName && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>→</span>
                          <span>{slot.studentName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredSlots.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>לא נמצאו שיעורים</p>
              <p className="text-sm mt-1">נסה לשנות את הסינון</p>
            </div>
          )}
        </div>
      )}

      {/* Teacher Legend */}
      {scheduleData && scheduleData.teachers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">מקרא מורים</h4>
          <div className="flex flex-wrap gap-2">
            {scheduleData.teachers.slice(0, 15).map(teacher => (
              <div
                key={teacher.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: `${teacher.color}20`,
                  color: teacher.color
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: teacher.color }}
                />
                <span className="font-medium">{teacher.name}</span>
              </div>
            ))}
            {scheduleData.teachers.length > 15 && (
              <div className="px-2 py-1 text-xs text-gray-500">
                +{scheduleData.teachers.length - 15} נוספים
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherRoomSchedule;
