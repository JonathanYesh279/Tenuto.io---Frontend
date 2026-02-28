/**
 * Orchestra Management Utility Functions
 *
 * Helper functions for formatting and handling orchestra data
 * according to the specified backend data structure and Hebrew display requirements.
 */

import { VALID_LOCATIONS, type Location } from '../constants/locations';
import { getDisplayName } from './nameUtils';

// Valid orchestra types from backend schema
export const VALID_ORCHESTRA_TYPES = ['הרכב', 'תזמורת'] as const;

// Re-export for convenience
export { VALID_LOCATIONS };

export type OrchestraType = typeof VALID_ORCHESTRA_TYPES[number];
export type LocationType = Location;

// Orchestra interface matching backend schema
export interface Orchestra {
  _id: string;
  name: string;
  type: OrchestraType;
  conductorId: string;
  memberIds: string[];
  rehearsalIds: string[];
  schoolYearId: string;
  location: LocationType;
  isActive: boolean;

  // Imported fields from ensemble import
  subType?: string | null;
  performanceLevel?: string | null;
  scheduleSlots?: Array<{
    day: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    actualHours: number | null;
  }>;
  ministryData?: {
    coordinationHours?: number | null;
    totalReportingHours?: number | null;
    ministryUseCode?: number | null;
    importedParticipantCount?: number | null;
  };

  // Populated fields (may be present when fetched with population)
  conductor?: {
    _id: string;
    personalInfo: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };
    professionalInfo?: {
      instrument?: string;
    };
  } | null;
  members?: Array<{
    _id: string;
    personalInfo: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
    };
    academicInfo?: {
      class?: string;
      instrumentProgress?: Array<{
        instrumentName: string;
        isPrimary: boolean;
        currentStage: number;
      }>;
    };
  }>;
  rehearsals?: Array<{
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    attendance?: {
      present: string[];
      absent: string[];
    };
  }>;
}

// Helper interface for creating/editing orchestras
export interface OrchestraFormData {
  name: string;
  type: OrchestraType;
  conductorId: string;
  memberIds: string[];
  rehearsalIds?: string[];
  schoolYearId?: string;
  location: LocationType;
  isActive: boolean;
}

/**
 * Get orchestra type display information
 * @param type - Orchestra type
 * @returns Object with display text and styling
 */
export const getOrchestraTypeInfo = (type: OrchestraType): { 
  text: string; 
  colorClass: string; 
  icon: string;
} => {
  switch (type) {
    case 'תזמורת':
      return {
        text: 'תזמורת',
        colorClass: 'bg-blue-100 text-blue-800',
        icon: ''
      };
    case 'הרכב':
      return {
        text: 'הרכב',
        colorClass: 'bg-green-100 text-green-800',
        icon: ''
      };
    default:
      return {
        text: type,
        colorClass: 'bg-gray-100 text-gray-800',
        icon: ''
      };
  }
};

/**
 * Get orchestra status color and text based on active state and member count
 * @param orchestra - Orchestra object
 * @returns Object with status text and color class
 */
export const getOrchestraStatus = (orchestra: Orchestra): {
  text: string;
  colorClass: string;
} => {
  if (!orchestra.isActive) {
    return { text: 'לא פעיל', colorClass: 'bg-gray-100 text-gray-800' };
  }

  const memberCount = orchestra.memberIds?.length || 0;
  
  if (memberCount === 0) {
    return { text: 'ללא חברים', colorClass: 'bg-yellow-100 text-yellow-800' };
  }
  
  if (memberCount < 5) {
    return { text: 'הרכב קטן', colorClass: 'bg-orange-100 text-orange-800' };
  }
  
  if (memberCount >= 15) {
    return { text: 'הרכב גדול', colorClass: 'bg-purple-100 text-purple-800' };
  }
  
  return { text: 'פעיל', colorClass: 'bg-green-100 text-green-800' };
};

/**
 * Calculate orchestra statistics
 * @param orchestra - Orchestra object
 * @returns Statistics object
 */
export const calculateOrchestraStats = (orchestra: Orchestra) => {
  const memberCount = orchestra.memberIds?.length || 0;
  const rehearsalCount = orchestra.rehearsalIds?.length || 0;
  const hasConductor = !!orchestra.conductorId;
  
  // Calculate recent attendance if rehearsals data is available
  let averageAttendance = 0;
  if (orchestra.rehearsals && orchestra.rehearsals.length > 0) {
    const recentRehearsals = orchestra.rehearsals.slice(-5); // Last 5 rehearsals
    const attendanceRates = recentRehearsals.map(rehearsal => {
      const presentCount = rehearsal.attendance?.present?.length || 0;
      const totalMembers = memberCount;
      return totalMembers > 0 ? (presentCount / totalMembers) * 100 : 0;
    });
    
    averageAttendance = attendanceRates.length > 0 
      ? Math.round(attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length)
      : 0;
  }

  return {
    memberCount,
    rehearsalCount,
    hasConductor,
    averageAttendance,
    isFullyConfigured: hasConductor && memberCount > 0,
    orchestraSize: memberCount >= 15 ? 'גדול' : memberCount >= 5 ? 'בינוני' : 'קטן'
  };
};

/**
 * Filter orchestras based on various criteria
 * @param orchestras - Array of orchestras
 * @param filters - Filter criteria
 * @returns Filtered orchestras array
 */
export const filterOrchestras = (
  orchestras: Orchestra[],
  filters: {
    searchQuery?: string;
    type?: OrchestraType | '';
    conductorId?: string;
    location?: LocationType | '';
    isActive?: boolean;
    hasMembers?: boolean;
  }
): Orchestra[] => {
  return orchestras.filter(orchestra => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const conductorName = getConductorName(orchestra);
      const matchesSearch =
        orchestra.name?.toLowerCase().includes(query) ||
        conductorName.toLowerCase().includes(query) ||
        orchestra.location?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Type filter
    if (filters.type && orchestra.type !== filters.type) {
      return false;
    }

    // Conductor filter
    if (filters.conductorId && orchestra.conductorId !== filters.conductorId) {
      return false;
    }

    // Location filter
    if (filters.location && orchestra.location !== filters.location) {
      return false;
    }

    // Active status filter
    if (filters.isActive !== undefined && orchestra.isActive !== filters.isActive) {
      return false;
    }

    // Has members filter
    if (filters.hasMembers !== undefined) {
      const hasMembers = (orchestra.memberIds?.length || 0) > 0;
      if (hasMembers !== filters.hasMembers) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort orchestras by various criteria
 * @param orchestras - Array of orchestras
 * @param sortBy - Sort criteria
 * @param sortOrder - Sort order (asc/desc)
 * @returns Sorted orchestras array
 */
export const sortOrchestras = (
  orchestras: Orchestra[],
  sortBy: 'name' | 'type' | 'conductor' | 'memberCount' | 'location' | 'rehearsalCount' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Orchestra[] => {
  const sorted = [...orchestras].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name, 'he');
        break;
      case 'type':
        compareValue = a.type.localeCompare(b.type, 'he');
        break;
      case 'conductor':
        const conductorA = getConductorName(a);
        const conductorB = getConductorName(b);
        compareValue = conductorA.localeCompare(conductorB, 'he');
        break;
      case 'memberCount':
        compareValue = (a.memberIds?.length || 0) - (b.memberIds?.length || 0);
        break;
      case 'location':
        compareValue = a.location.localeCompare(b.location, 'he');
        break;
      case 'rehearsalCount':
        compareValue = (a.rehearsalIds?.length || 0) - (b.rehearsalIds?.length || 0);
        break;
      default:
        compareValue = 0;
    }

    return sortOrder === 'desc' ? -compareValue : compareValue;
  });

  return sorted;
};

/**
 * Format orchestra member count with text
 * @param memberCount - Number of members
 * @returns Formatted string
 */
export const formatMemberCount = (memberCount: number): string => {
  if (memberCount === 0) return 'אין חברים';
  if (memberCount === 1) return 'חבר אחד';
  if (memberCount === 2) return 'שני חברים';
  return `${memberCount} חברים`;
};

/**
 * Format rehearsal count with text
 * @param rehearsalCount - Number of rehearsals
 * @returns Formatted string
 */
export const formatRehearsalCount = (rehearsalCount: number): string => {
  if (rehearsalCount === 0) return 'אין חזרות';
  if (rehearsalCount === 1) return 'חזרה אחת';
  if (rehearsalCount === 2) return 'שתי חזרות';
  return `${rehearsalCount} חזרות`;
};

/**
 * Get conductor display name
 * @param orchestra - Orchestra object with conductor data
 * @returns Conductor name or default text
 */
export const getConductorName = (orchestra: Orchestra): string => {
  // Check for populated conductor data first
  const conductorName = getDisplayName(orchestra.conductor?.personalInfo);
  if (conductorName) {
    return conductorName;
  }

  // Check for conductorInfo (from detailed fetch)
  if ((orchestra as any).conductorInfo?.name) {
    return (orchestra as any).conductorInfo.name;
  }

  // Check for conductorDetails (from management dashboard)
  const conductorDetailsName = getDisplayName((orchestra as any).conductorDetails?.personalInfo);
  if (conductorDetailsName) {
    return conductorDetailsName;
  }

  // Check if conductorId exists but no populated data
  if (orchestra.conductorId) {
    return 'טוען נתוני מנצח...';
  }

  return 'לא הוקצה מנצח';
};

/**
 * Validate orchestra form data
 * @param data - Orchestra form data
 * @returns Validation result with errors
 */
export const validateOrchestraForm = (data: Partial<OrchestraFormData>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.name?.trim()) {
    errors.name = 'שם התזמורת נדרש';
  } else if (data.name.length < 2) {
    errors.name = 'שם התזמורת חייב להכיל לפחות 2 תווים';
  } else if (data.name.length > 100) {
    errors.name = 'שם התזמורת לא יכול לעלות על 100 תווים';
  }

  if (!data.type) {
    errors.type = 'סוג הרכב נדרש';
  } else if (!VALID_ORCHESTRA_TYPES.includes(data.type as OrchestraType)) {
    errors.type = 'סוג הרכב לא תקין';
  }

  if (!data.location) {
    errors.location = 'מיקום נדרש';
  } else if (!VALID_LOCATIONS.includes(data.location as LocationType)) {
    errors.location = 'מיקום לא תקין';
  }

  if (!data.conductorId?.trim()) {
    errors.conductorId = 'מנצח נדרש';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get location category for grouping
 * @param location - Location string
 * @returns Category name
 */
export const getLocationCategory = (location: LocationType): string => {
  if (location.includes('אולם')) return 'אולמות';
  if (location.includes('סטודיו')) return 'סטודיואים';
  if (location.includes('חדר חזרות')) return 'חדרי חזרות';
  if (location.includes('חדר תאוריה')) return 'חדרי תיאוריה';
  if (location.startsWith('חדר')) return 'חדרי לימוד';
  return 'אחר';
};

/**
 * Get member instruments summary
 * @param members - Array of members with instrument information
 * @returns Summary of instruments in the orchestra
 */
export const getMemberInstrumentsSummary = (members?: Orchestra['members']): {
  instrumentCounts: Record<string, number>;
  totalInstruments: number;
  primaryInstruments: string[];
} => {
  const instrumentCounts: Record<string, number> = {};
  const primaryInstruments: string[] = [];

  if (!members || members.length === 0) {
    return { instrumentCounts, totalInstruments: 0, primaryInstruments };
  }

  members.forEach(member => {
    if (member.academicInfo?.instrumentProgress) {
      member.academicInfo.instrumentProgress.forEach(progress => {
        const instrument = progress.instrumentName;
        instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
        
        if (progress.isPrimary && !primaryInstruments.includes(instrument)) {
          primaryInstruments.push(instrument);
        }
      });
    }
  });

  return {
    instrumentCounts,
    totalInstruments: Object.keys(instrumentCounts).length,
    primaryInstruments: primaryInstruments.sort()
  };
};

/**
 * Check if orchestra is ready for performance
 * @param orchestra - Orchestra object
 * @returns Readiness assessment
 */
export const getOrchestraReadiness = (orchestra: Orchestra): {
  isReady: boolean;
  score: number;
  issues: string[];
  strengths: string[];
} => {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 0;

  // Check conductor
  if (orchestra.conductorId) {
    score += 25;
    strengths.push('יש מנצח מוקצה');
  } else {
    issues.push('אין מנצח מוקצה');
  }

  // Check member count
  const memberCount = orchestra.memberIds?.length || 0;
  if (memberCount >= 8) {
    score += 25;
    strengths.push(`${memberCount} חברים בהרכב`);
  } else if (memberCount >= 4) {
    score += 15;
    strengths.push(`${memberCount} חברים בהרכב`);
  } else if (memberCount > 0) {
    score += 5;
    issues.push('מעט חברים בהרכב');
  } else {
    issues.push('אין חברים בהרכב');
  }

  // Check location
  if (orchestra.location && orchestra.location !== 'חדר 1') {
    score += 10;
    strengths.push(`מיקום מוגדר: ${orchestra.location}`);
  } else {
    score += 5;
    issues.push('מיקום ברירת מחדל');
  }

  // Check rehearsals
  const rehearsalCount = orchestra.rehearsalIds?.length || 0;
  if (rehearsalCount >= 3) {
    score += 25;
    strengths.push(`${rehearsalCount} חזרות מתוכננות`);
  } else if (rehearsalCount >= 1) {
    score += 15;
    strengths.push(`${rehearsalCount} חזרות מתוכננות`);
  } else {
    issues.push('אין חזרות מתוכננות');
  }

  // Check if active
  if (orchestra.isActive) {
    score += 15;
    strengths.push('הרכב פעיל');
  } else {
    issues.push('הרכב לא פעיל');
  }

  return {
    isReady: score >= 75,
    score: Math.min(100, score),
    issues,
    strengths
  };
};