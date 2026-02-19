/**
 * Daily Teacher-Room Table Component
 * Shows which teacher teaches in which room for each day
 */

import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../../services/apiService';
import { useSchoolYear } from '../../../services/schoolYearContext';

import { getDisplayName } from '@/utils/nameUtils';
import { CalendarIcon, CaretLeftIcon, CaretRightIcon, ClockIcon, MapPinIcon, UserIcon } from '@phosphor-icons/react'

interface TeacherRoomEntry {
  teacherId: string;
  teacherName: string;
  room: string;
  startTime: string;
  endTime: string;
  instrument?: string;
}

interface DailyTeacherRoomTableProps {
  className?: string;
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

const DailyTeacherRoomTable: React.FC<DailyTeacherRoomTableProps> = ({
  className = ''
}) => {
  const { currentSchoolYear } = useSchoolYear();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Start with current day (0 = Sunday)
    const today = new Date().getDay();
    return today < 6 ? today : 0; // If Saturday, show Sunday
  });

  useEffect(() => {
    loadTeachers();
  }, [currentSchoolYear]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const filters = currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {};
      const data = await apiService.teachers.getTeachers(filters);
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Get schedule entries for the selected day
  const dailySchedule = useMemo(() => {
    const selectedDay = HEBREW_DAYS[selectedDayIndex];
    const entries: TeacherRoomEntry[] = [];

    teachers.forEach(teacher => {
      if (!teacher.isActive) return;

      const teacherName = getDisplayName(teacher.personalInfo) || 'מורה';
      const instrument = teacher.professionalInfo?.instrument || '';

      // Check time blocks
      const timeBlocks = teacher.teaching?.timeBlocks || [];
      timeBlocks.forEach((block: any) => {
        if (!block.isActive) return;

        const blockDay = block.day?.trim();
        if (blockDay === selectedDay) {
          entries.push({
            teacherId: teacher._id,
            teacherName,
            room: block.location || block.roomNumber || 'לא צוין',
            startTime: block.startTime || '',
            endTime: block.endTime || '',
            instrument
          });
        }
      });
    });

    // Sort by start time, then by teacher name
    return entries.sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      const minutesA = (timeA[0] || 0) * 60 + (timeA[1] || 0);
      const minutesB = (timeB[0] || 0) * 60 + (timeB[1] || 0);

      if (minutesA !== minutesB) return minutesA - minutesB;
      return a.teacherName.localeCompare(b.teacherName, 'he');
    });
  }, [teachers, selectedDayIndex]);

  // Group by room for alternative view
  const scheduleByRoom = useMemo(() => {
    const rooms: { [room: string]: TeacherRoomEntry[] } = {};

    dailySchedule.forEach(entry => {
      const room = entry.room || 'לא צוין';
      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(entry);
    });

    // Sort rooms
    return Object.entries(rooms).sort(([a], [b]) => {
      if (a === 'לא צוין') return 1;
      if (b === 'לא צוין') return -1;
      return a.localeCompare(b, 'he');
    });
  }, [dailySchedule]);

  const goToPreviousDay = () => {
    setSelectedDayIndex(prev => (prev > 0 ? prev - 1 : 5));
  };

  const goToNextDay = () => {
    setSelectedDayIndex(prev => (prev < 5 ? prev + 1 : 0));
  };

  // Generate row colors for teachers
  const getTeacherColor = (index: number): string => {
    const colors = [
      'bg-blue-50 hover:bg-blue-100',
      'bg-green-50 hover:bg-green-100',
      'bg-purple-50 hover:bg-purple-100',
      'bg-amber-50 hover:bg-amber-100',
      'bg-rose-50 hover:bg-rose-100',
      'bg-cyan-50 hover:bg-cyan-100',
      'bg-orange-50 hover:bg-orange-100',
      'bg-indigo-50 hover:bg-indigo-100',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`} dir="rtl">
      {/* Header with Day Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              לוח חדרים - יום {HEBREW_DAYS[selectedDayIndex]}
            </h3>
            <p className="text-sm text-gray-600">
              {dailySchedule.length} שיעורים | {scheduleByRoom.length} חדרים פעילים
            </p>
          </div>
        </div>

        {/* Day Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
            title="יום קודם"
          >
            <CaretRightIcon className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex gap-1">
            {HEBREW_DAYS.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDayIndex(index)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  index === selectedDayIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {day.charAt(0)}׳
              </button>
            ))}
          </div>

          <button
            onClick={goToNextDay}
            className="p-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
            title="יום הבא"
          >
            <CaretLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Schedule Table */}
      {dailySchedule.length > 0 ? (
        <div className="overflow-hidden rounded border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-l from-blue-600 to-blue-700 text-white">
                <th className="px-4 py-3 text-right font-semibold text-sm w-16">#</th>
                <th className="px-4 py-3 text-right font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    שם המורה
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    חדר
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    שעות
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-sm">כלי נגינה</th>
              </tr>
            </thead>
            <tbody>
              {dailySchedule.map((entry, index) => (
                <tr
                  key={`${entry.teacherId}-${entry.startTime}-${index}`}
                  className={`${getTeacherColor(index)} transition-colors border-b border-gray-100 last:border-b-0`}
                >
                  <td className="px-4 py-3 text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">
                      {entry.teacherName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                      <MapPinIcon className="w-3.5 h-3.5 text-blue-500" />
                      {entry.room}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-700">
                      {entry.startTime} - {entry.endTime}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.instrument || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-200">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg font-medium">אין שיעורים ביום {HEBREW_DAYS[selectedDayIndex]}</p>
          <p className="text-gray-400 text-sm mt-1">נסה לבחור יום אחר</p>
        </div>
      )}

    </div>
  );
};

export default DailyTeacherRoomTable;
