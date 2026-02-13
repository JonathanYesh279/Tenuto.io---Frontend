/**
 * Enhanced Dashboard Analytics Service
 * Provides comprehensive analytics data for the improved dashboard visualizations
 */

import apiService from './apiService.js';
import { getDisplayName } from '../utils/nameUtils';

// Types for analytics data
export interface AttendanceStats {
  present: number;
  absent: number;
  excused: number;
  late: number;
  total: number;
  rate: number;
}

export interface StudentActivityData {
  studentId: string;
  studentName: string;
  privateLessons: AttendanceStats;
  theoryLessons: AttendanceStats;
  orchestraRehearsals: AttendanceStats;
  overall: AttendanceStats;
  weeklyActivity: WeeklyActivityData[];
  progressHistory: ProgressDataPoint[];
}

export interface WeeklyActivityData {
  day: string;
  dayIndex: number;
  activities: number;
  attendance: number;
}

export interface ProgressDataPoint {
  date: string;
  stage: number;
  instrumentName: string;
}

export interface InstrumentDistribution {
  instrumentName: string;
  count: number;
  percentage: number;
  color: string;
  family: string;
}

export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
  activeCount: number;
  inactiveCount: number;
}

export interface TeacherScheduleSlot {
  teacherId: string;
  teacherName: string;
  day: string;
  dayIndex: number;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  roomNumber: string;
  studentName?: string;
  lessonType?: string;
  color?: string;
}

export interface AttendanceTrendData {
  weekLabel: string;
  weekStartDate: string;
  privateLessons: number;
  theoryLessons: number;
  orchestraRehearsals: number;
  overall: number;
}

export interface BagrutProgressData {
  totalStudents: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionRate: number;
  presentations: {
    presentation1: { completed: number; passed: number; total: number };
    presentation2: { completed: number; passed: number; total: number };
    presentation3: { completed: number; passed: number; total: number };
    presentation4: { completed: number; passed: number; total: number };
  };
  gradeDistribution: { range: string; count: number; color: string }[];
  averageGrade: number;
  upcomingExams: { studentName: string; date: string; teacherName: string }[];
}

export interface DashboardSummaryStats {
  students: {
    total: number;
    active: number;
    newThisMonth: number;
    trend: number;
  };
  teachers: {
    total: number;
    active: number;
    withStudents: number;
  };
  orchestras: {
    total: number;
    active: number;
    totalMembers: number;
  };
  rehearsals: {
    thisWeek: number;
    thisMonth: number;
    avgAttendance: number;
  };
  theoryLessons: {
    thisWeek: number;
    activeGroups: number;
    avgAttendance: number;
  };
  bagrut: {
    active: number;
    completed: number;
    upcomingExams: number;
  };
}

// Hebrew day names
const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAY_INDEX_MAP: { [key: string]: number } = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6,
  'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6
};

// Instrument colors by family
const INSTRUMENT_FAMILIES: { [key: string]: { family: string; color: string } } = {
  // Strings - כלי קשת
  'כינור': { family: 'כלי קשת', color: '#3B82F6' },
  'ויולה': { family: 'כלי קשת', color: '#60A5FA' },
  'צ\'לו': { family: 'כלי קשת', color: '#2563EB' },
  'צלו': { family: 'כלי קשת', color: '#2563EB' },
  'קונטרבס': { family: 'כלי קשת', color: '#1D4ED8' },
  'גיטרה': { family: 'כלי קשת', color: '#93C5FD' },
  'גיטרה קלאסית': { family: 'כלי קשת', color: '#93C5FD' },
  'גיטרה חשמלית': { family: 'כלי קשת', color: '#BFDBFE' },
  'נבל': { family: 'כלי קשת', color: '#DBEAFE' },

  // Woodwinds - כלי נשיפה מעץ
  'חליל': { family: 'כלי נשיפה מעץ', color: '#10B981' },
  'חליל צד': { family: 'כלי נשיפה מעץ', color: '#10B981' },
  'קלרינט': { family: 'כלי נשיפה מעץ', color: '#34D399' },
  'אבוב': { family: 'כלי נשיפה מעץ', color: '#6EE7B7' },
  'סקסופון': { family: 'כלי נשיפה מעץ', color: '#059669' },
  'פגוט': { family: 'כלי נשיפה מעץ', color: '#047857' },
  'חלילית': { family: 'כלי נשיפה מעץ', color: '#A7F3D0' },

  // Brass - כלי נשיפה ממתכת
  'חצוצרה': { family: 'כלי נשיפה ממתכת', color: '#F59E0B' },
  'טרומבון': { family: 'כלי נשיפה ממתכת', color: '#FBBF24' },
  'קרן יער': { family: 'כלי נשיפה ממתכת', color: '#FCD34D' },
  'טובה': { family: 'כלי נשיפה ממתכת', color: '#D97706' },

  // Percussion - כלי הקשה
  'תופים': { family: 'כלי הקשה', color: '#EF4444' },
  'כלי הקשה': { family: 'כלי הקשה', color: '#F87171' },
  'מרימבה': { family: 'כלי הקשה', color: '#DC2626' },
  'קסילופון': { family: 'כלי הקשה', color: '#FCA5A5' },

  // Keyboard - פסנתר
  'פסנתר': { family: 'פסנתר', color: '#8B5CF6' },
  'אורגן': { family: 'פסנתר', color: '#A78BFA' },
  'אקורדיון': { family: 'פסנתר', color: '#7C3AED' },

  // Voice - קול
  'שירה': { family: 'קול', color: '#EC4899' },
  'זמרה': { family: 'קול', color: '#F472B6' },

  // Default
  'default': { family: 'אחר', color: '#6B7280' }
};

// Teacher colors for schedule visualization
const TEACHER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
  '#14B8A6', '#A855F7', '#22C55E', '#EAB308', '#0EA5E9'
];

// Utility functions
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getWeekLabel = (date: Date): string => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
};

const isInDateRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

const calculateAttendanceStats = (
  records: any[],
  statusField: string = 'status'
): AttendanceStats => {
  if (!records || records.length === 0) {
    return { present: 0, absent: 0, excused: 0, late: 0, total: 0, rate: 0 };
  }

  let present = 0, absent = 0, excused = 0, late = 0;

  records.forEach(record => {
    const status = record[statusField] || record.attendance?.status || '';
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'present' || normalizedStatus === 'הגיע/ה' || normalizedStatus === 'נוכח') {
      present++;
    } else if (normalizedStatus === 'absent' || normalizedStatus === 'לא הגיע/ה' || normalizedStatus === 'חסר') {
      absent++;
    } else if (normalizedStatus === 'excused' || normalizedStatus === 'נעדר מאושר') {
      excused++;
    } else if (normalizedStatus === 'late' || normalizedStatus === 'איחור') {
      late++;
    }
  });

  const total = present + absent + excused + late;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return { present, absent, excused, late, total, rate };
};

// Main analytics service
export const enhancedDashboardAnalytics = {
  // Cache for expensive computations
  _cache: new Map<string, { data: any; timestamp: number }>(),
  _cacheExpiry: 3 * 60 * 1000, // 3 minutes

  /**
   * Get cached data or fetch fresh
   */
  async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this._cache.has(key)) {
      const cached = this._cache.get(key)!;
      if (now - cached.timestamp < this._cacheExpiry) {
        console.log(`📦 Using cached data for: ${key}`);
        return cached.data as T;
      }
    }

    const data = await fetcher();
    this._cache.set(key, { data, timestamp: now });
    return data;
  },

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this._cache.clear();
    console.log('🧹 Dashboard analytics cache cleared');
  },

  /**
   * Get comprehensive dashboard summary statistics
   */
  async getDashboardSummary(schoolYearId?: string): Promise<DashboardSummaryStats> {
    return this.getCached(`summary_${schoolYearId || 'all'}`, async () => {
      console.log('📊 Fetching dashboard summary...');

      const filters = schoolYearId ? { schoolYearId } : {};

      const [students, teachers, orchestras, rehearsals, theoryLessons, bagruts] =
        await Promise.allSettled([
          apiService.students.getStudents(filters),
          apiService.teachers.getTeachers(filters),
          apiService.orchestras.getOrchestras(filters),
          apiService.rehearsals.getRehearsals(filters),
          apiService.theory.getTheoryLessons(filters),
          apiService.bagrut.getBagruts()
        ]);

      const studentsData = students.status === 'fulfilled' ? students.value : [];
      const teachersData = teachers.status === 'fulfilled' ? teachers.value : [];
      const orchestrasData = orchestras.status === 'fulfilled' ? orchestras.value : [];
      const rehearsalsData = rehearsals.status === 'fulfilled' ? rehearsals.value : [];
      const theoryData = theoryLessons.status === 'fulfilled' ? theoryLessons.value : [];
      const bagrutsData = bagruts.status === 'fulfilled' ? bagruts.value : [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = getWeekStart(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Calculate student stats
      const activeStudents = studentsData.filter((s: any) => s.isActive !== false);
      const newThisMonth = studentsData.filter((s: any) =>
        s.createdAt && new Date(s.createdAt) >= monthStart
      );

      // Calculate teacher stats
      const activeTeachers = teachersData.filter((t: any) =>
        t.isActive !== false && t.professionalInfo?.isActive !== false
      );
      const teachersWithStudents = teachersData.filter((t: any) =>
        (t.studentCount || 0) > 0
      );

      // Calculate orchestra stats
      const activeOrchestras = orchestrasData.filter((o: any) => o.isActive !== false);
      const totalOrchestraMembers = activeOrchestras.reduce((sum: number, o: any) =>
        sum + (o.memberIds?.length || o.memberCount || 0), 0
      );

      // Calculate rehearsal stats
      const thisWeekRehearsals = rehearsalsData.filter((r: any) => {
        if (!r.date) return false;
        const date = new Date(r.date);
        return date >= weekStart && date < weekEnd;
      });

      const thisMonthRehearsals = rehearsalsData.filter((r: any) => {
        if (!r.date) return false;
        const date = new Date(r.date);
        return date >= monthStart;
      });

      // Calculate rehearsal attendance
      const rehearsalAttendance = rehearsalsData.reduce((stats: any, r: any) => {
        if (r.attendance) {
          stats.present += (r.attendance.present?.length || 0);
          stats.total += (r.attendance.present?.length || 0) + (r.attendance.absent?.length || 0);
        }
        return stats;
      }, { present: 0, total: 0 });

      // Calculate theory stats
      const thisWeekTheory = theoryData.filter((t: any) => {
        if (!t.date) return false;
        const date = new Date(t.date);
        return date >= weekStart && date < weekEnd;
      });

      const activeTheoryGroups = [...new Set(theoryData.filter((t: any) =>
        t.isActive !== false
      ).map((t: any) => t.category))].length;

      const theoryAttendance = theoryData.reduce((stats: any, t: any) => {
        if (t.attendance) {
          stats.present += (t.attendance.present?.length || 0);
          stats.total += (t.attendance.present?.length || 0) + (t.attendance.absent?.length || 0);
        }
        return stats;
      }, { present: 0, total: 0 });

      // Calculate bagrut stats
      const activeBagruts = bagrutsData.filter((b: any) => !b.isCompleted && b.isActive !== false);
      const completedBagruts = bagrutsData.filter((b: any) => b.isCompleted);
      const upcomingExams = bagrutsData.filter((b: any) => {
        if (!b.testDate || b.isCompleted) return false;
        const testDate = new Date(b.testDate);
        return testDate > now;
      });

      return {
        students: {
          total: studentsData.length,
          active: activeStudents.length,
          newThisMonth: newThisMonth.length,
          trend: newThisMonth.length > 0 ? Math.round((newThisMonth.length / Math.max(activeStudents.length, 1)) * 100) : 0
        },
        teachers: {
          total: teachersData.length,
          active: activeTeachers.length,
          withStudents: teachersWithStudents.length
        },
        orchestras: {
          total: orchestrasData.length,
          active: activeOrchestras.length,
          totalMembers: totalOrchestraMembers
        },
        rehearsals: {
          thisWeek: thisWeekRehearsals.length,
          thisMonth: thisMonthRehearsals.length,
          avgAttendance: rehearsalAttendance.total > 0
            ? Math.round((rehearsalAttendance.present / rehearsalAttendance.total) * 100)
            : 0
        },
        theoryLessons: {
          thisWeek: thisWeekTheory.length,
          activeGroups: activeTheoryGroups,
          avgAttendance: theoryAttendance.total > 0
            ? Math.round((theoryAttendance.present / theoryAttendance.total) * 100)
            : 0
        },
        bagrut: {
          active: activeBagruts.length,
          completed: completedBagruts.length,
          upcomingExams: upcomingExams.length
        }
      };
    });
  },

  /**
   * Get instrument distribution for students
   */
  async getInstrumentDistribution(schoolYearId?: string): Promise<InstrumentDistribution[]> {
    return this.getCached(`instruments_${schoolYearId || 'all'}`, async () => {
      console.log('🎻 Calculating instrument distribution...');

      const filters = schoolYearId ? { schoolYearId } : {};
      const students = await apiService.students.getStudents(filters);

      const distribution: { [key: string]: number } = {};

      students.forEach((student: any) => {
        if (student.isActive === false) return;

        // Check academicInfo.instrumentProgress
        if (student.academicInfo?.instrumentProgress) {
          student.academicInfo.instrumentProgress.forEach((progress: any) => {
            const instrument = progress.instrumentName;
            if (instrument) {
              distribution[instrument] = (distribution[instrument] || 0) + 1;
            }
          });
        }

        // Also check direct instrument field
        if (student.instrument) {
          distribution[student.instrument] = (distribution[student.instrument] || 0) + 1;
        }
      });

      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

      const result: InstrumentDistribution[] = Object.entries(distribution)
        .map(([instrumentName, count]) => {
          const familyInfo = INSTRUMENT_FAMILIES[instrumentName] || INSTRUMENT_FAMILIES['default'];
          return {
            instrumentName,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            color: familyInfo.color,
            family: familyInfo.family
          };
        })
        .sort((a, b) => b.count - a.count);

      console.log(`✅ Found ${result.length} instruments across ${total} enrollments`);
      return result;
    });
  },

  /**
   * Get class/grade distribution
   */
  async getClassDistribution(schoolYearId?: string): Promise<ClassDistribution[]> {
    return this.getCached(`classes_${schoolYearId || 'all'}`, async () => {
      console.log('🏫 Calculating class distribution...');

      const filters = schoolYearId ? { schoolYearId } : {};
      const students = await apiService.students.getStudents(filters);

      const distribution: { [key: string]: { active: number; inactive: number } } = {};

      students.forEach((student: any) => {
        const className = student.academicInfo?.class || student.class || 'לא הוגדר';
        if (!distribution[className]) {
          distribution[className] = { active: 0, inactive: 0 };
        }

        if (student.isActive !== false) {
          distribution[className].active++;
        } else {
          distribution[className].inactive++;
        }
      });

      const classOrder = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'אחר', 'לא הוגדר'];
      const total = students.filter((s: any) => s.isActive !== false).length;

      const result: ClassDistribution[] = classOrder
        .filter(className => distribution[className])
        .map(className => {
          const data = distribution[className];
          const count = data.active + data.inactive;
          return {
            className,
            count,
            percentage: total > 0 ? Math.round((data.active / total) * 100) : 0,
            activeCount: data.active,
            inactiveCount: data.inactive
          };
        });

      console.log(`✅ Found ${result.length} classes`);
      return result;
    });
  },

  /**
   * Get teacher-room schedule matrix
   */
  async getTeacherRoomSchedule(schoolYearId?: string): Promise<{
    slots: TeacherScheduleSlot[];
    teachers: { id: string; name: string; color: string }[];
    rooms: string[];
    timeSlots: string[];
  }> {
    return this.getCached(`schedule_${schoolYearId || 'all'}`, async () => {
      console.log('📅 Building teacher-room schedule matrix...');

      const filters = schoolYearId ? { schoolYearId } : {};
      const teachers = await apiService.teachers.getTeachers(filters);

      const slots: TeacherScheduleSlot[] = [];
      const teacherMap = new Map<string, { id: string; name: string; color: string }>();
      const roomsSet = new Set<string>();
      const timeSlotsSet = new Set<string>();

      let colorIndex = 0;

      for (const teacher of teachers) {
        if (teacher.isActive === false) continue;

        const teacherId = teacher._id;
        const teacherName = getDisplayName(teacher.personalInfo) || 'מורה';

        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            id: teacherId,
            name: teacherName,
            color: TEACHER_COLORS[colorIndex % TEACHER_COLORS.length]
          });
          colorIndex++;
        }

        // Process time blocks
        const timeBlocks = teacher.teaching?.timeBlocks || [];
        for (const block of timeBlocks) {
          if (!block.isActive) continue;

          const day = block.day || '';
          const dayIndex = DAY_INDEX_MAP[day.toLowerCase()] ?? DAY_INDEX_MAP[day] ?? -1;
          const location = block.location || 'לא צוין';
          const roomNumber = block.roomNumber || location;

          roomsSet.add(roomNumber);
          timeSlotsSet.add(block.startTime || '');

          slots.push({
            teacherId,
            teacherName,
            day,
            dayIndex,
            startTime: block.startTime || '',
            endTime: block.endTime || '',
            duration: block.totalDuration || 60,
            location,
            roomNumber,
            color: teacherMap.get(teacherId)?.color
          });
        }

      }

      // Sort time slots
      const timeSlots = Array.from(timeSlotsSet)
        .filter(t => t)
        .sort((a, b) => {
          const [aH, aM] = a.split(':').map(Number);
          const [bH, bM] = b.split(':').map(Number);
          return (aH * 60 + aM) - (bH * 60 + bM);
        });

      const rooms = Array.from(roomsSet).filter(r => r && r !== 'לא צוין').sort();

      console.log(`✅ Found ${slots.length} schedule slots across ${teacherMap.size} teachers`);

      return {
        slots,
        teachers: Array.from(teacherMap.values()),
        rooms,
        timeSlots
      };
    });
  },

  /**
   * Get attendance trends over time
   */
  async getAttendanceTrends(
    weeks: number = 12,
    schoolYearId?: string
  ): Promise<AttendanceTrendData[]> {
    return this.getCached(`trends_${weeks}_${schoolYearId || 'all'}`, async () => {
      console.log(`📈 Calculating attendance trends for last ${weeks} weeks...`);

      const filters = schoolYearId ? { schoolYearId } : {};

      const [rehearsals, theoryLessons] = await Promise.allSettled([
        apiService.rehearsals.getRehearsals(filters),
        apiService.theory.getTheoryLessons(filters)
      ]);

      const rehearsalsData = rehearsals.status === 'fulfilled' ? rehearsals.value : [];
      const theoryData = theoryLessons.status === 'fulfilled' ? theoryLessons.value : [];

      const now = new Date();
      const trends: AttendanceTrendData[] = [];

      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Calculate rehearsal attendance for this week
        const weekRehearsals = rehearsalsData.filter((r: any) => {
          if (!r.date) return false;
          const date = new Date(r.date);
          return isInDateRange(date, weekStart, weekEnd);
        });

        const rehearsalStats = weekRehearsals.reduce((stats: any, r: any) => {
          if (r.attendance) {
            stats.present += (r.attendance.present?.length || 0);
            stats.total += (r.attendance.present?.length || 0) + (r.attendance.absent?.length || 0);
          }
          return stats;
        }, { present: 0, total: 0 });

        // Calculate theory attendance for this week
        const weekTheory = theoryData.filter((t: any) => {
          if (!t.date) return false;
          const date = new Date(t.date);
          return isInDateRange(date, weekStart, weekEnd);
        });

        const theoryStats = weekTheory.reduce((stats: any, t: any) => {
          if (t.attendance) {
            stats.present += (t.attendance.present?.length || 0);
            stats.total += (t.attendance.present?.length || 0) + (t.attendance.absent?.length || 0);
          }
          return stats;
        }, { present: 0, total: 0 });

        const orchestraRate = rehearsalStats.total > 0
          ? Math.round((rehearsalStats.present / rehearsalStats.total) * 100)
          : 0;

        const theoryRate = theoryStats.total > 0
          ? Math.round((theoryStats.present / theoryStats.total) * 100)
          : 0;

        // Overall is average of available rates
        const rates = [orchestraRate, theoryRate].filter(r => r > 0);
        const overallRate = rates.length > 0
          ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
          : 0;

        trends.push({
          weekLabel: getWeekLabel(weekStart),
          weekStartDate: weekStart.toISOString().split('T')[0],
          privateLessons: 0, // Would need attendance service integration
          theoryLessons: theoryRate,
          orchestraRehearsals: orchestraRate,
          overall: overallRate
        });
      }

      console.log(`✅ Generated ${trends.length} weeks of attendance trends`);
      return trends;
    });
  },

  /**
   * Get bagrut progress statistics
   */
  async getBagrutProgress(schoolYearId?: string): Promise<BagrutProgressData> {
    return this.getCached(`bagrut_${schoolYearId || 'all'}`, async () => {
      console.log('🎓 Calculating bagrut progress...');

      const [bagruts, students] = await Promise.allSettled([
        apiService.bagrut.getBagruts(),
        apiService.students.getStudents(schoolYearId ? { schoolYearId } : {})
      ]);

      const bagrutsData = bagruts.status === 'fulfilled' ? bagruts.value : [];
      const studentsData = students.status === 'fulfilled' ? students.value : [];

      // Create student lookup
      const studentLookup = new Map<string, string>();
      studentsData.forEach((s: any) => {
        studentLookup.set(s._id, getDisplayName(s.personalInfo) || 'תלמיד');
      });

      const activeBagruts = bagrutsData.filter((b: any) => b.isActive !== false);
      const completed = activeBagruts.filter((b: any) => b.isCompleted);
      const inProgress = activeBagruts.filter((b: any) => !b.isCompleted && b.presentations?.some((p: any) => p.completed));
      const notStarted = activeBagruts.filter((b: any) => !b.isCompleted && !b.presentations?.some((p: any) => p.completed));

      // Calculate presentation statistics
      const presentations = {
        presentation1: { completed: 0, passed: 0, total: 0 },
        presentation2: { completed: 0, passed: 0, total: 0 },
        presentation3: { completed: 0, passed: 0, total: 0 },
        presentation4: { completed: 0, passed: 0, total: 0 }
      };

      activeBagruts.forEach((b: any) => {
        if (!b.presentations) return;

        b.presentations.forEach((p: any, index: number) => {
          const key = `presentation${index + 1}` as keyof typeof presentations;
          if (presentations[key]) {
            presentations[key].total++;
            if (p.completed) {
              presentations[key].completed++;
              if (p.status === 'עבר/ה' || p.grade >= 55) {
                presentations[key].passed++;
              }
            }
          }
        });
      });

      // Calculate grade distribution
      const gradeRanges = [
        { range: '90-100', min: 90, max: 100, count: 0, color: '#10B981' },
        { range: '80-89', min: 80, max: 89, count: 0, color: '#3B82F6' },
        { range: '70-79', min: 70, max: 79, count: 0, color: '#6366F1' },
        { range: '60-69', min: 60, max: 69, count: 0, color: '#F59E0B' },
        { range: '55-59', min: 55, max: 59, count: 0, color: '#F97316' },
        { range: 'מתחת ל-55', min: 0, max: 54, count: 0, color: '#EF4444' }
      ];

      let totalGrades = 0;
      let gradeSum = 0;

      completed.forEach((b: any) => {
        const grade = b.finalGrade || 0;
        if (grade > 0) {
          totalGrades++;
          gradeSum += grade;

          for (const range of gradeRanges) {
            if (grade >= range.min && grade <= range.max) {
              range.count++;
              break;
            }
          }
        }
      });

      // Get upcoming exams
      const now = new Date();
      const upcomingExams = activeBagruts
        .filter((b: any) => b.testDate && new Date(b.testDate) > now && !b.isCompleted)
        .sort((a: any, b: any) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
        .slice(0, 5)
        .map((b: any) => ({
          studentName: studentLookup.get(b.studentId) || 'תלמיד',
          date: new Date(b.testDate).toLocaleDateString('he-IL'),
          teacherName: b.teacherName || 'מורה'
        }));

      const result: BagrutProgressData = {
        totalStudents: activeBagruts.length,
        completedCount: completed.length,
        inProgressCount: inProgress.length,
        notStartedCount: notStarted.length,
        completionRate: activeBagruts.length > 0
          ? Math.round((completed.length / activeBagruts.length) * 100)
          : 0,
        presentations,
        gradeDistribution: gradeRanges.map(r => ({ range: r.range, count: r.count, color: r.color })),
        averageGrade: totalGrades > 0 ? Math.round(gradeSum / totalGrades) : 0,
        upcomingExams
      };

      console.log(`✅ Bagrut progress calculated: ${completed.length}/${activeBagruts.length} completed`);
      return result;
    });
  },

  /**
   * Get student-specific activity data
   */
  async getStudentActivity(studentId: string): Promise<StudentActivityData | null> {
    try {
      console.log(`👤 Fetching activity for student ${studentId}...`);

      const [student, theoryLessons, orchestras] = await Promise.allSettled([
        apiService.students.getStudent(studentId),
        apiService.theory.getTheoryLessons(),
        apiService.orchestras.getOrchestras()
      ]);

      if (student.status !== 'fulfilled' || !student.value) {
        return null;
      }

      const studentData = student.value;
      const theoryData = theoryLessons.status === 'fulfilled' ? theoryLessons.value : [];
      const orchestrasData = orchestras.status === 'fulfilled' ? orchestras.value : [];

      // Find student's theory lessons
      const studentTheoryLessons = theoryData.filter((t: any) =>
        t.studentIds?.includes(studentId)
      );

      // Find student's orchestras
      const studentOrchestras = orchestrasData.filter((o: any) =>
        o.memberIds?.includes(studentId)
      );

      // Calculate weekly activity (mock data structure - would need real attendance data)
      const weeklyActivity: WeeklyActivityData[] = HEBREW_DAYS.map((day, index) => ({
        day,
        dayIndex: index,
        activities: 0,
        attendance: 0
      }));

      // Calculate progress history from instrument progress
      const progressHistory: ProgressDataPoint[] = [];
      if (studentData.academicInfo?.instrumentProgress) {
        studentData.academicInfo.instrumentProgress.forEach((prog: any) => {
          if (prog.startDate) {
            progressHistory.push({
              date: new Date(prog.startDate).toISOString().split('T')[0],
              stage: prog.currentStage || 1,
              instrumentName: prog.instrumentName || ''
            });
          }
        });
      }

      return {
        studentId,
        studentName: getDisplayName(studentData.personalInfo) || 'תלמיד',
        privateLessons: { present: 0, absent: 0, excused: 0, late: 0, total: 0, rate: 0 },
        theoryLessons: calculateAttendanceStats(studentTheoryLessons.flatMap((t: any) =>
          t.attendanceList?.filter((a: any) => a.studentId === studentId) || []
        )),
        orchestraRehearsals: { present: 0, absent: 0, excused: 0, late: 0, total: 0, rate: 0 },
        overall: { present: 0, absent: 0, excused: 0, late: 0, total: 0, rate: 0 },
        weeklyActivity,
        progressHistory
      };
    } catch (error) {
      console.error('Error fetching student activity:', error);
      return null;
    }
  },

  /**
   * Get top-level metrics for quick display
   */
  async getQuickMetrics(schoolYearId?: string): Promise<{
    totalStudents: number;
    attendanceRate: number;
    activeTeachers: number;
    upcomingEvents: number;
  }> {
    const summary = await this.getDashboardSummary(schoolYearId);

    return {
      totalStudents: summary.students.active,
      attendanceRate: Math.round(
        (summary.rehearsals.avgAttendance + summary.theoryLessons.avgAttendance) / 2
      ),
      activeTeachers: summary.teachers.active,
      upcomingEvents: summary.rehearsals.thisWeek + summary.theoryLessons.thisWeek
    };
  }
};

export default enhancedDashboardAnalytics;
