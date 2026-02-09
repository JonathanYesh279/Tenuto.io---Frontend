/**
 * Rehearsal Management Utility Functions
 *
 * Helper functions for formatting and handling rehearsal data
 * according to the specified backend data structure and Hebrew display requirements.
 */

import { getDisplayName } from './nameUtils';

// Valid days of week from backend schema
export const VALID_DAYS_OF_WEEK = {
  0: 'ראשון', // Sunday
  1: 'שני',   // Monday  
  2: 'שלישי', // Tuesday
  3: 'רביעי', // Wednesday
  4: 'חמישי', // Thursday
  5: 'שישי',  // Friday
  6: 'שבת',   // Saturday
} as const;

export const DAYS_OF_WEEK_ARRAY = Object.entries(VALID_DAYS_OF_WEEK).map(([key, value]) => ({
  value: parseInt(key),
  label: value
}));

// Valid rehearsal types (matching orchestra types)
export const VALID_REHEARSAL_TYPES = ['תזמורת', 'הרכב'] as const;

export type RehearsalType = typeof VALID_REHEARSAL_TYPES[number];
export type DayOfWeek = keyof typeof VALID_DAYS_OF_WEEK;

// Rehearsal interface matching backend schema
export interface Rehearsal {
  _id: string;
  groupId: string; // Orchestra ID
  type: RehearsalType;
  date: string; // ISO date string
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  location: string;
  attendance: {
    present: string[];
    absent: string[];
  };
  notes: string;
  schoolYearId: string;
  isActive: boolean;
  
  // Populated fields (may be present when fetched with population)
  orchestra?: {
    _id: string;
    name: string;
    type: RehearsalType;
    memberIds: string[];
    conductor?: {
      _id: string;
      personalInfo: {
        firstName?: string;
        lastName?: string;
        fullName?: string;
      };
    };
    members?: Array<{
      _id: string;
      personalInfo: {
        firstName?: string;
        lastName?: string;
        fullName?: string;
      };
    }>;
  };
}

// Bulk creation interface
export interface BulkRehearsalData {
  orchestraId: string;
  startDate: string;
  endDate: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
  excludeDates?: string[];
  schoolYearId: string;
}

// Rehearsal form data interface
export interface RehearsalFormData {
  groupId: string;
  type: RehearsalType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
  isActive: boolean;
}

// Attendance update interface
export interface AttendanceUpdate {
  present: string[];
  absent: string[];
}

/**
 * Get Hebrew day name from day number
 * @param dayOfWeek - Day number (0-6)
 * @returns Hebrew day name
 */
export const getDayName = (dayOfWeek: number): string => {
  return VALID_DAYS_OF_WEEK[dayOfWeek as DayOfWeek] || 'לא ידוע';
};

/**
 * Get day number from Hebrew day name
 * @param dayName - Hebrew day name
 * @returns Day number (0-6)
 */
export const getDayNumber = (dayName: string): number => {
  const entry = Object.entries(VALID_DAYS_OF_WEEK).find(([, name]) => name === dayName);
  return entry ? parseInt(entry[0]) : 0;
};

/**
 * Format rehearsal date and time for display
 * @param rehearsal - Rehearsal object
 * @returns Formatted date and time string
 */
export const formatRehearsalDateTime = (rehearsal: Rehearsal): {
  date: string;
  time: string;
  dayName: string;
  fullDateTime: string;
} => {
  const date = new Date(rehearsal.date).toLocaleDateString('he-IL');
  const time = `${rehearsal.startTime} - ${rehearsal.endTime}`;
  const dayName = getDayName(rehearsal.dayOfWeek);
  const fullDateTime = `${dayName}, ${date} ${time}`;
  
  return { date, time, dayName, fullDateTime };
};

/**
 * Calculate rehearsal duration in minutes
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration in minutes
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end - start;
};

/**
 * Convert time string to minutes
 * @param time - Time in HH:MM format
 * @returns Total minutes
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes to time string
 * @param minutes - Total minutes
 * @returns Time in HH:MM format
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Format duration in human-readable Hebrew
 * @param duration - Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (duration: number): string => {
  if (duration < 60) {
    return `${duration} דקות`;
  }
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (minutes === 0) {
    return hours === 1 ? 'שעה אחת' : `${hours} שעות`;
  }
  
  const hoursText = hours === 1 ? 'שעה' : `${hours} שעות`;
  return `${hoursText} ו-${minutes} דקות`;
};

/**
 * Calculate attendance statistics
 * @param rehearsal - Rehearsal object
 * @returns Attendance statistics
 */
export const calculateAttendanceStats = (rehearsal: Rehearsal) => {
  const presentCount = rehearsal.attendance?.present?.length || 0;
  const absentCount = rehearsal.attendance?.absent?.length || 0;
  const totalMembers = rehearsal.orchestra?.memberIds?.length || (presentCount + absentCount);
  const attendanceRate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;
  
  return {
    presentCount,
    absentCount,
    totalMembers,
    attendanceRate,
    hasAttendanceData: presentCount > 0 || absentCount > 0
  };
};

/**
 * Get rehearsal status based on date and time
 * @param rehearsal - Rehearsal object
 * @returns Status information
 */
export const getRehearsalStatus = (rehearsal: Rehearsal): {
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  text: string;
  colorClass: string;
} => {
  if (!rehearsal.isActive) {
    return {
      status: 'cancelled',
      text: 'בוטלה',
      colorClass: 'bg-gray-100 text-gray-800'
    };
  }
  
  const now = new Date();
  const rehearsalDate = new Date(rehearsal.date);
  const rehearsalStart = new Date(`${rehearsal.date}T${rehearsal.startTime}:00`);
  const rehearsalEnd = new Date(`${rehearsal.date}T${rehearsal.endTime}:00`);
  
  if (now < rehearsalStart) {
    return {
      status: 'upcoming',
      text: 'עתידה',
      colorClass: 'bg-blue-100 text-blue-800'
    };
  }
  
  if (now >= rehearsalStart && now <= rehearsalEnd) {
    return {
      status: 'in_progress',
      text: 'מתקיימת כעת',
      colorClass: 'bg-green-100 text-green-800'
    };
  }
  
  return {
    status: 'completed',
    text: 'הסתיימה',
    colorClass: 'bg-orange-100 text-orange-800'
  };
};

/**
 * Check for scheduling conflicts between rehearsals
 * @param rehearsal1 - First rehearsal
 * @param rehearsal2 - Second rehearsal
 * @returns Conflict information
 */
export const checkRehearsalConflict = (rehearsal1: Rehearsal, rehearsal2: Rehearsal): {
  hasConflict: boolean;
  conflictType: 'time' | 'location' | 'conductor' | 'members' | 'none';
  severity: 'critical' | 'warning' | 'none';
  message: string;
} => {
  // Different dates, no conflict
  if (rehearsal1.date !== rehearsal2.date) {
    return {
      hasConflict: false,
      conflictType: 'none',
      severity: 'none',
      message: ''
    };
  }
  
  // Same orchestra, different times
  if (rehearsal1.groupId === rehearsal2.groupId) {
    return {
      hasConflict: false,
      conflictType: 'none',
      severity: 'none',
      message: 'אותה תזמורת'
    };
  }
  
  // Check time overlap
  const start1 = timeToMinutes(rehearsal1.startTime);
  const end1 = timeToMinutes(rehearsal1.endTime);
  const start2 = timeToMinutes(rehearsal2.startTime);
  const end2 = timeToMinutes(rehearsal2.endTime);
  
  const hasTimeOverlap = (start1 < end2 && start2 < end1);
  
  if (hasTimeOverlap) {
    // Same location conflict
    if (rehearsal1.location === rehearsal2.location) {
      return {
        hasConflict: true,
        conflictType: 'location',
        severity: 'critical',
        message: `חפיפה במיקום: ${rehearsal1.location}`
      };
    }
    
    // Check conductor conflict
    const conductor1 = rehearsal1.orchestra?.conductor?._id;
    const conductor2 = rehearsal2.orchestra?.conductor?._id;
    
    if (conductor1 && conductor2 && conductor1 === conductor2) {
      return {
        hasConflict: true,
        conflictType: 'conductor',
        severity: 'critical',
        message: 'אותו מנצח בשני מקומות'
      };
    }
    
    // Check member overlap
    const members1 = new Set(rehearsal1.orchestra?.memberIds || []);
    const members2 = new Set(rehearsal2.orchestra?.memberIds || []);
    const sharedMembers = [...members1].filter(id => members2.has(id));
    
    if (sharedMembers.length > 0) {
      return {
        hasConflict: true,
        conflictType: 'members',
        severity: 'warning',
        message: `${sharedMembers.length} חברים משותפים`
      };
    }
    
    return {
      hasConflict: true,
      conflictType: 'time',
      severity: 'warning',
      message: 'חפיפת זמנים'
    };
  }
  
  return {
    hasConflict: false,
    conflictType: 'none',
    severity: 'none',
    message: ''
  };
};

/**
 * Filter rehearsals based on various criteria
 * @param rehearsals - Array of rehearsals
 * @param filters - Filter criteria
 * @returns Filtered rehearsals
 */
export const filterRehearsals = (
  rehearsals: Rehearsal[],
  filters: {
    searchQuery?: string;
    orchestraId?: string;
    type?: RehearsalType | '';
    dayOfWeek?: number | '';
    location?: string;
    startDate?: string;
    endDate?: string;
    status?: 'upcoming' | 'completed' | 'in_progress' | 'all';
    isActive?: boolean;
  }
): Rehearsal[] => {
  return rehearsals.filter(rehearsal => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = 
        rehearsal.orchestra?.name?.toLowerCase().includes(query) ||
        rehearsal.location?.toLowerCase().includes(query) ||
        rehearsal.notes?.toLowerCase().includes(query) ||
        getDayName(rehearsal.dayOfWeek).toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Orchestra filter
    if (filters.orchestraId && rehearsal.groupId !== filters.orchestraId) {
      return false;
    }
    
    // Type filter
    if (filters.type && rehearsal.type !== filters.type) {
      return false;
    }
    
    // Day of week filter
    if (filters.dayOfWeek !== '' && filters.dayOfWeek !== undefined && rehearsal.dayOfWeek !== filters.dayOfWeek) {
      return false;
    }
    
    // Location filter
    if (filters.location && rehearsal.location !== filters.location) {
      return false;
    }
    
    // Date range filter
    if (filters.startDate) {
      const rehearsalDate = new Date(rehearsal.date);
      const startDate = new Date(filters.startDate);
      if (rehearsalDate < startDate) return false;
    }
    
    if (filters.endDate) {
      const rehearsalDate = new Date(rehearsal.date);
      const endDate = new Date(filters.endDate);
      if (rehearsalDate > endDate) return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      const status = getRehearsalStatus(rehearsal);
      if (status.status !== filters.status) return false;
    }
    
    // Active status filter
    if (filters.isActive !== undefined && rehearsal.isActive !== filters.isActive) {
      return false;
    }
    
    return true;
  });
};

/**
 * Sort rehearsals by various criteria
 * @param rehearsals - Array of rehearsals
 * @param sortBy - Sort criteria
 * @param sortOrder - Sort order
 * @returns Sorted rehearsals
 */
export const sortRehearsals = (
  rehearsals: Rehearsal[],
  sortBy: 'date' | 'time' | 'orchestra' | 'location' | 'attendance' | 'duration' = 'date',
  sortOrder: 'asc' | 'desc' = 'asc'
): Rehearsal[] => {
  const sorted = [...rehearsals].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'date':
        compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'time':
        compareValue = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        break;
      case 'orchestra':
        const nameA = a.orchestra?.name || '';
        const nameB = b.orchestra?.name || '';
        compareValue = nameA.localeCompare(nameB, 'he');
        break;
      case 'location':
        compareValue = a.location.localeCompare(b.location, 'he');
        break;
      case 'attendance':
        const attendanceA = calculateAttendanceStats(a).attendanceRate;
        const attendanceB = calculateAttendanceStats(b).attendanceRate;
        compareValue = attendanceA - attendanceB;
        break;
      case 'duration':
        const durationA = calculateDuration(a.startTime, a.endTime);
        const durationB = calculateDuration(b.startTime, b.endTime);
        compareValue = durationA - durationB;
        break;
      default:
        compareValue = 0;
    }
    
    return sortOrder === 'desc' ? -compareValue : compareValue;
  });
  
  return sorted;
};

/**
 * Generate recurring rehearsal dates
 * @param bulkData - Bulk creation data
 * @returns Array of rehearsal dates
 */
export const generateRehearsalDates = (bulkData: BulkRehearsalData): string[] => {
  const dates: string[] = [];
  const startDate = new Date(bulkData.startDate);
  const endDate = new Date(bulkData.endDate);
  const targetDayOfWeek = bulkData.dayOfWeek;
  const excludeDates = new Set(bulkData.excludeDates || []);
  
  // Find first occurrence of target day
  const current = new Date(startDate);
  while (current.getDay() !== targetDayOfWeek && current <= endDate) {
    current.setDate(current.getDate() + 1);
  }
  
  // Generate all occurrences
  while (current <= endDate) {
    const dateString = current.toISOString().split('T')[0];
    if (!excludeDates.has(dateString)) {
      dates.push(dateString);
    }
    current.setDate(current.getDate() + 7); // Next week
  }
  
  return dates;
};

/**
 * Validate rehearsal form data
 * @param data - Rehearsal form data
 * @returns Validation result
 */
export const validateRehearsalForm = (data: Partial<RehearsalFormData>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!data.groupId?.trim()) {
    errors.groupId = 'יש לבחור תזמורת';
  }
  
  if (!data.type) {
    errors.type = 'יש לבחור סוג הרכב';
  }
  
  if (!data.date) {
    errors.date = 'יש לבחור תאריך';
  } else {
    const rehearsalDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (rehearsalDate < today) {
      errors.date = 'לא ניתן לקבוע חזרה בעבר';
    }
  }
  
  if (!data.startTime) {
    errors.startTime = 'יש להזין שעת התחלה';
  }
  
  if (!data.endTime) {
    errors.endTime = 'יש להזין שעת סיום';
  }
  
  if (data.startTime && data.endTime) {
    const duration = calculateDuration(data.startTime, data.endTime);
    if (duration <= 0) {
      errors.endTime = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
    } else if (duration > 300) { // 5 hours
      errors.endTime = 'משך החזרה לא יכול להיות יותר מ-5 שעות';
    }
  }
  
  if (!data.location?.trim()) {
    errors.location = 'יש לבחור מיקום';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate bulk rehearsal creation data
 * @param data - Bulk rehearsal data
 * @returns Validation result
 */
export const validateBulkRehearsalForm = (data: Partial<BulkRehearsalData>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};
  
  if (!data.orchestraId?.trim()) {
    errors.orchestraId = 'יש לבחור תזמורת';
  }
  
  if (!data.startDate) {
    errors.startDate = 'יש לבחור תאריך התחלה';
  }
  
  if (!data.endDate) {
    errors.endDate = 'יש לבחור תאריך סיום';
  }
  
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    if (start >= end) {
      errors.endDate = 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה';
    }
    
    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays > 365) {
      errors.endDate = 'תקופה לא יכולה להיות יותר משנה';
    }
  }
  
  if (data.dayOfWeek === undefined || data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    errors.dayOfWeek = 'יש לבחור יום בשבוע';
  }
  
  if (!data.startTime) {
    errors.startTime = 'יש להזין שעת התחלה';
  }
  
  if (!data.endTime) {
    errors.endTime = 'יש להזין שעת סיום';
  }
  
  if (data.startTime && data.endTime) {
    const duration = calculateDuration(data.startTime, data.endTime);
    if (duration <= 0) {
      errors.endTime = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
    }
  }
  
  if (!data.location?.trim()) {
    errors.location = 'יש לבחור מיקום';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get color for rehearsal based on orchestra or type
 * @param rehearsal - Rehearsal object
 * @returns Color class
 */
export const getRehearsalColor = (rehearsal: Rehearsal): string => {
  // Color by type: blue for orchestras, pink for ensembles
  // Check both rehearsal.type and orchestra.type to handle different data structures
  const type = rehearsal.orchestra?.type || rehearsal.type;
  
  switch (type) {
    case 'תזמורת':
      return 'bg-blue-500';
    case 'הרכב':
      return 'bg-pink-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Format attendance list for display
 * @param attendance - Attendance data
 * @param members - Orchestra members
 * @returns Formatted attendance display
 */
export const formatAttendanceList = (
  attendance: { present: string[]; absent: string[] },
  members?: Array<{ _id: string; personalInfo: { firstName?: string; lastName?: string; fullName?: string } }>
): {
  presentMembers: Array<{ id: string; name: string }>;
  absentMembers: Array<{ id: string; name: string }>;
  unmarkedMembers: Array<{ id: string; name: string }>;
} => {
  const presentMembers: Array<{ id: string; name: string }> = [];
  const absentMembers: Array<{ id: string; name: string }> = [];
  const unmarkedMembers: Array<{ id: string; name: string }> = [];
  
  if (!members) {
    return { presentMembers, absentMembers, unmarkedMembers };
  }
  
  const presentSet = new Set(attendance.present);
  const absentSet = new Set(attendance.absent);
  
  members.forEach(member => {
    const memberInfo = {
      id: member._id,
      name: getDisplayName(member.personalInfo) || 'שם לא ידוע'
    };
    
    if (presentSet.has(member._id)) {
      presentMembers.push(memberInfo);
    } else if (absentSet.has(member._id)) {
      absentMembers.push(memberInfo);
    } else {
      unmarkedMembers.push(memberInfo);
    }
  });
  
  return { presentMembers, absentMembers, unmarkedMembers };
};