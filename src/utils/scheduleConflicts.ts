/**
 * Smart Scheduling and Conflict Detection Utilities
 * Handles all scheduling logic, conflict detection, and optimization
 */

export interface TimeSlot {
  startTime: string;
  endTime: string;
  date?: string;
  teacherId?: string;
  studentId?: string;
  location?: string;
  type?: 'lesson' | 'rehearsal' | 'theory' | 'meeting';
  isRecurring?: boolean;
}

export interface Conflict {
  type: 'teacher_double_booked' | 'student_double_booked' | 'room_conflict' | 'rehearsal_conflict' | 'theory_conflict';
  message: string;
  conflictingSlot: TimeSlot;
  severity: 'high' | 'medium' | 'low';
  suggestions?: string[];
}

export interface SchedulingResult {
  success: boolean;
  conflicts: Conflict[];
  suggestions: TimeSlot[];
  alternativeSlots: TimeSlot[];
}

/**
 * Convert time string to minutes since midnight for easier comparison
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight back to time string
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Check if two time slots overlap
 */
export const timeSlotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);
  
  return start1 < end2 && end1 > start2;
};

/**
 * Check if two slots are on the same date
 */
export const sameDate = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  if (!slot1.date || !slot2.date) return true; // Assume same date if not specified
  return slot1.date === slot2.date;
};

/**
 * Detect conflicts for a proposed lesson
 */
export const detectScheduleConflicts = async (
  proposedSlot: TimeSlot,
  existingLessons: TimeSlot[],
  rehearsals: TimeSlot[] = [],
  theoryLessons: TimeSlot[] = []
): Promise<Conflict[]> => {
  const conflicts: Conflict[] = [];

  // Check teacher double booking
  const teacherConflicts = existingLessons.filter(lesson => 
    lesson.teacherId === proposedSlot.teacherId &&
    sameDate(lesson, proposedSlot) &&
    timeSlotsOverlap(lesson, proposedSlot)
  );

  teacherConflicts.forEach(conflict => {
    conflicts.push({
      type: 'teacher_double_booked',
      message: `המורה כבר מלמד/ת בזמן הזה`,
      conflictingSlot: conflict,
      severity: 'high',
      suggestions: ['בחר זמן אחר', 'בטל את השיעור הקיים']
    });
  });

  // Check student double booking
  const studentConflicts = existingLessons.filter(lesson => 
    lesson.studentId === proposedSlot.studentId &&
    sameDate(lesson, proposedSlot) &&
    timeSlotsOverlap(lesson, proposedSlot)
  );

  studentConflicts.forEach(conflict => {
    conflicts.push({
      type: 'student_double_booked',
      message: `התלמיד/ה כבר יש לו/ה שיעור בזמן הזה`,
      conflictingSlot: conflict,
      severity: 'high',
      suggestions: ['בחר זמן אחר', 'העבר את השיעור הקיים']
    });
  });

  // Check rehearsal conflicts (for students)
  const rehearsalConflicts = rehearsals.filter(rehearsal =>
    sameDate(rehearsal, proposedSlot) &&
    timeSlotsOverlap(rehearsal, proposedSlot)
  );

  rehearsalConflicts.forEach(conflict => {
    conflicts.push({
      type: 'rehearsal_conflict',
      message: `התלמיד/ה צריך/ה להיות בחזרה בזמן הזה`,
      conflictingSlot: conflict,
      severity: 'medium',
      suggestions: ['בחר זמן אחר', 'וודא עם התלמיד לגבי עדיפות']
    });
  });

  // Check theory lesson conflicts
  const theoryConflicts = theoryLessons.filter(theory =>
    sameDate(theory, proposedSlot) &&
    timeSlotsOverlap(theory, proposedSlot)
  );

  theoryConflicts.forEach(conflict => {
    conflicts.push({
      type: 'theory_conflict',
      message: `התלמיד/ה צריך/ה להיות בשיעור תיאוריה בזמן הזה`,
      conflictingSlot: conflict,
      severity: 'medium',
      suggestions: ['בחר זמן אחר', 'וודא אם שיעור התיאוריה חובה']
    });
  });

  // Check room conflicts
  if (proposedSlot.location) {
    const roomConflicts = existingLessons.filter(lesson =>
      lesson.location === proposedSlot.location &&
      sameDate(lesson, proposedSlot) &&
      timeSlotsOverlap(lesson, proposedSlot)
    );

    roomConflicts.forEach(conflict => {
      conflicts.push({
        type: 'room_conflict',
        message: `החדר תפוס בזמן הזה`,
        conflictingSlot: conflict,
        severity: 'low',
        suggestions: ['בחר חדר אחר', 'בחר זמן אחר']
      });
    });
  }

  return conflicts;
};

/**
 * Find optimal time slots for a student with a specific teacher
 */
export const findOptimalTimeSlots = (
  teacherAvailability: TimeSlot[],
  studentSchedule: TimeSlot[],
  lessonDuration: number = 45,
  preferredTimes: string[] = [],
  bufferMinutes: number = 15
): TimeSlot[] => {
  const suggestions: TimeSlot[] = [];
  
  // Sort availability by preferred times if provided
  const sortedAvailability = [...teacherAvailability].sort((a, b) => {
    if (preferredTimes.length > 0) {
      const aIndex = preferredTimes.findIndex(time => time === a.startTime);
      const bIndex = preferredTimes.findIndex(time => time === b.startTime);
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }
    
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  for (const availableSlot of sortedAvailability) {
    const slotStart = timeToMinutes(availableSlot.startTime);
    const slotEnd = timeToMinutes(availableSlot.endTime);
    
    // Check if the available slot is long enough
    if (slotEnd - slotStart < lessonDuration) continue;
    
    // Try to fit lesson(s) within this available slot
    let currentStart = slotStart;
    
    while (currentStart + lessonDuration <= slotEnd) {
      const proposedSlot: TimeSlot = {
        startTime: minutesToTime(currentStart),
        endTime: minutesToTime(currentStart + lessonDuration),
        date: availableSlot.date,
        teacherId: availableSlot.teacherId,
        location: availableSlot.location
      };
      
      // Check if student is free at this time
      const hasStudentConflict = studentSchedule.some(studentSlot =>
        sameDate(studentSlot, proposedSlot) &&
        timeSlotsOverlap(studentSlot, proposedSlot)
      );
      
      if (!hasStudentConflict) {
        suggestions.push(proposedSlot);
      }
      
      // Move to next possible slot (with buffer)
      currentStart += lessonDuration + bufferMinutes;
    }
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
};

/**
 * Generate back-to-back lesson suggestions for efficiency
 */
export const generateBackToBackSuggestions = (
  teacherAvailability: TimeSlot[],
  studentsSchedules: Record<string, TimeSlot[]>,
  lessonDuration: number = 45
): TimeSlot[] => {
  const suggestions: TimeSlot[] = [];
  
  for (const availableSlot of teacherAvailability) {
    const slotStart = timeToMinutes(availableSlot.startTime);
    const slotEnd = timeToMinutes(availableSlot.endTime);
    
    // Calculate how many lessons can fit back-to-back
    const possibleLessons = Math.floor((slotEnd - slotStart) / lessonDuration);
    
    if (possibleLessons >= 2) {
      let currentStart = slotStart;
      
      for (let i = 0; i < possibleLessons; i++) {
        suggestions.push({
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(currentStart + lessonDuration),
          date: availableSlot.date,
          teacherId: availableSlot.teacherId,
          location: availableSlot.location,
          type: 'lesson'
        });
        
        currentStart += lessonDuration;
      }
    }
  }
  
  return suggestions;
};

/**
 * Smart rescheduling when conflicts occur
 */
export const suggestReschedule = (
  conflictedSlot: TimeSlot,
  teacherAvailability: TimeSlot[],
  existingLessons: TimeSlot[],
  preferredDays: number[] = [1, 2, 3, 4, 5] // Monday to Friday
): TimeSlot[] => {
  const suggestions: TimeSlot[] = [];
  
  // Get lesson duration from conflicted slot
  const duration = timeToMinutes(conflictedSlot.endTime) - timeToMinutes(conflictedSlot.startTime);
  
  // Find alternative slots on preferred days
  for (const slot of teacherAvailability) {
    const slotDuration = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
    
    if (slotDuration >= duration) {
      // Check if this slot conflicts with existing lessons
      const hasConflict = existingLessons.some(lesson =>
        sameDate(lesson, slot) && timeSlotsOverlap(lesson, slot)
      );
      
      if (!hasConflict) {
        suggestions.push({
          ...slot,
          endTime: minutesToTime(timeToMinutes(slot.startTime) + duration),
          studentId: conflictedSlot.studentId,
          type: 'lesson'
        });
      }
    }
  }
  
  return suggestions.slice(0, 3); // Return top 3 alternatives
};

/**
 * Analyze teacher efficiency and provide recommendations
 */
export interface EfficiencyAnalysis {
  utilizationRate: number; // Percentage of available time used
  backToBackPercentage: number; // Percentage of lessons that are back-to-back
  peakHours: string[]; // Most busy hours
  gapHours: string[]; // Hours with gaps
  recommendations: string[];
}

export const analyzeTeacherEfficiency = (
  teacherSchedule: TimeSlot[],
  teacherAvailability: TimeSlot[]
): EfficiencyAnalysis => {
  const totalAvailableMinutes = teacherAvailability.reduce((total, slot) => 
    total + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)), 0
  );
  
  const totalBookedMinutes = teacherSchedule.reduce((total, slot) =>
    total + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)), 0
  );
  
  const utilizationRate = totalAvailableMinutes > 0 ? 
    (totalBookedMinutes / totalAvailableMinutes) * 100 : 0;
  
  // Calculate back-to-back percentage
  const sortedLessons = [...teacherSchedule].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  
  let backToBackCount = 0;
  for (let i = 1; i < sortedLessons.length; i++) {
    const prevEnd = timeToMinutes(sortedLessons[i - 1].endTime);
    const currentStart = timeToMinutes(sortedLessons[i].startTime);
    
    if (currentStart === prevEnd) {
      backToBackCount++;
    }
  }
  
  const backToBackPercentage = teacherSchedule.length > 1 ? 
    (backToBackCount / (teacherSchedule.length - 1)) * 100 : 0;
  
  // Find peak hours (most common lesson times)
  const hourCounts: Record<string, number> = {};
  teacherSchedule.forEach(slot => {
    const hour = slot.startTime.split(':')[0];
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (utilizationRate < 60) {
    recommendations.push('ניתן להוסיף עוד שיעורים לשיפור הניצולת');
  }
  
  if (backToBackPercentage < 40) {
    recommendations.push('כדאי לתאם שיעורים רצופים לחיסכון בזמן מעבר');
  }
  
  if (utilizationRate > 90) {
    recommendations.push('עומס גבוה - כדאי לשקול הפסקות בין השיעורים');
  }
  
  return {
    utilizationRate,
    backToBackPercentage,
    peakHours,
    gapHours: [], // TODO: Implement gap analysis
    recommendations
  };
};

export default {
  detectScheduleConflicts,
  findOptimalTimeSlots,
  generateBackToBackSuggestions,
  suggestReschedule,
  analyzeTeacherEfficiency,
  timeSlotsOverlap,
  timeToMinutes,
  minutesToTime
};