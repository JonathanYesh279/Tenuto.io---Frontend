/**
 * Dashboard Analytics Service
 * Aggregates data from multiple API services when dedicated analytics endpoints aren't available
 */

import apiService from './apiService.js';

// Utility functions
const isThisWeek = (date) => {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  return date >= weekStart && date <= weekEnd;
};

const isThisMonth = (date) => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const calculateAttendanceRate = (activities) => {
  if (!activities || activities.length === 0) return 0;
  
  let totalSessions = 0;
  let totalPresent = 0;
  
  activities.forEach(activity => {
    if (activity.attendance) {
      const sessionTotal = activity.attendance.present.length + activity.attendance.absent.length;
      if (sessionTotal > 0) {
        totalSessions += sessionTotal;
        totalPresent += activity.attendance.present.length;
      }
    }
  });
  
  return totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
};

export const dashboardAnalytics = {
  /**
   * Get comprehensive dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    try {
      console.log('📊 Aggregating dashboard statistics from all services...');
      
      // Fetch data from all services
      const [
        students,
        teachers,
        rehearsals,
        theoryLessons,
        orchestras,
        bagruts,
        currentYear
      ] = await Promise.allSettled([
        apiService.students.getStudents(),
        apiService.teachers.getTeachers(),
        apiService.rehearsals.getRehearsals(),
        apiService.theory.getTheoryLessons(),
        apiService.orchestras.getOrchestras(),
        apiService.bagrut.getBagruts(),
        apiService.schoolYears.getCurrentSchoolYear()
      ]);

      // Process results
      const studentsData = students.status === 'fulfilled' ? students.value : [];
      const teachersData = teachers.status === 'fulfilled' ? teachers.value : [];
      const rehearsalsData = rehearsals.status === 'fulfilled' ? rehearsals.value : [];
      const theoryData = theoryLessons.status === 'fulfilled' ? theoryLessons.value : [];
      const orchestrasData = orchestras.status === 'fulfilled' ? orchestras.value : [];
      const bagrutsData = bagruts.status === 'fulfilled' ? bagruts.value : [];
      const currentYearData = currentYear.status === 'fulfilled' ? currentYear.value : null;

      // Calculate statistics
      const stats = {
        // Basic counts
        totalStudents: studentsData.length,
        activeStudents: studentsData.filter(s => s.isActive !== false).length,
        totalTeachers: teachersData.length,
        activeTeachers: teachersData.filter(t => t.professionalInfo?.isActive !== false).length,
        totalOrchestras: orchestrasData.length,
        activeOrchestras: orchestrasData.filter(o => o.isActive !== false).length,
        
        // Time-based statistics
        totalRehearsals: rehearsalsData.length,
        thisWeekRehearsals: rehearsalsData.filter(r => 
          r.date && isThisWeek(new Date(r.date))
        ).length,
        totalTheoryLessons: theoryData.length,
        thisWeekTheoryLessons: theoryData.filter(t => 
          t.date && isThisWeek(new Date(t.date))
        ).length,
        
        // Bagrut statistics
        totalBagruts: bagrutsData.length,
        activeBagruts: bagrutsData.filter(b => !b.isCompleted).length,
        completedBagruts: bagrutsData.filter(b => b.isCompleted).length,
        
        // School year info
        currentSchoolYear: currentYearData?.name || 'לא הוגדר',
        schoolYearId: currentYearData?._id || null,
        
        // Attendance rates
        rehearsalAttendanceRate: calculateAttendanceRate(rehearsalsData),
        theoryAttendanceRate: calculateAttendanceRate(theoryData),
        
        // Recent activity counts
        newStudentsThisMonth: studentsData.filter(s => 
          s.createdAt && isThisMonth(new Date(s.createdAt))
        ).length,
        newTeachersThisMonth: teachersData.filter(t => 
          t.createdAt && isThisMonth(new Date(t.createdAt))
        ).length,
        
        // Calculated metrics
        averageStudentsPerTeacher: teachersData.length > 0 ? 
          Math.round((studentsData.length / teachersData.length) * 10) / 10 : 0,
        
        lastUpdated: new Date()
      };

      console.log('✅ Dashboard statistics calculated:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Failed to calculate dashboard statistics:', error);
      throw error;
    }
  },

  /**
   * Get attendance statistics across all activities
   * @returns {Promise<Object>} Attendance statistics
   */
  async getAttendanceStats() {
    try {
      console.log('📈 Calculating attendance statistics...');
      
      const [rehearsals, theoryLessons] = await Promise.allSettled([
        apiService.rehearsals.getRehearsals(),
        apiService.theory.getTheoryLessons()
      ]);

      const rehearsalsData = rehearsals.status === 'fulfilled' ? rehearsals.value : [];
      const theoryData = theoryLessons.status === 'fulfilled' ? theoryLessons.value : [];
      
      const stats = {
        rehearsalAttendance: {
          totalSessions: rehearsalsData.length,
          averageAttendance: calculateAttendanceRate(rehearsalsData),
          thisWeekSessions: rehearsalsData.filter(r => 
            r.date && isThisWeek(new Date(r.date))
          ).length
        },
        theoryAttendance: {
          totalSessions: theoryData.length,
          averageAttendance: calculateAttendanceRate(theoryData),
          thisWeekSessions: theoryData.filter(t => 
            t.date && isThisWeek(new Date(t.date))
          ).length
        },
        overallAttendance: {
          totalSessions: rehearsalsData.length + theoryData.length,
          averageRate: Math.round(
            (calculateAttendanceRate(rehearsalsData) + calculateAttendanceRate(theoryData)) / 2
          )
        }
      };

      console.log('✅ Attendance statistics calculated:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Failed to calculate attendance statistics:', error);
      throw error;
    }
  },

  /**
   * Get instrument distribution statistics
   * @returns {Promise<Object>} Instrument distribution
   */
  async getInstrumentDistribution() {
    try {
      console.log('🎻 Calculating instrument distribution...');
      
      const students = await apiService.students.getStudents();
      const distribution = {};
      
      students.forEach(student => {
        if (student.academicInfo?.instrumentProgress) {
          student.academicInfo.instrumentProgress.forEach(progress => {
            const instrument = progress.instrumentName;
            if (instrument) {
              distribution[instrument] = (distribution[instrument] || 0) + 1;
            }
          });
        }
      });

      // Sort by popularity
      const sortedDistribution = Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)
        .reduce((acc, [instrument, count]) => {
          acc[instrument] = count;
          return acc;
        }, {});

      console.log('✅ Instrument distribution calculated:', sortedDistribution);
      return sortedDistribution;
      
    } catch (error) {
      console.error('❌ Failed to calculate instrument distribution:', error);
      throw error;
    }
  },

  /**
   * Get class distribution statistics
   * @returns {Promise<Object>} Class distribution
   */
  async getClassDistribution() {
    try {
      console.log('🏫 Calculating class distribution...');
      
      const students = await apiService.students.getStudents();
      const distribution = {};
      
      students.forEach(student => {
        const studentClass = student.academicInfo?.class || 'לא הוגדר';
        distribution[studentClass] = (distribution[studentClass] || 0) + 1;
      });

      // Sort by class order (Hebrew classes)
      const classOrder = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'אחר', 'לא הוגדר'];
      const sortedDistribution = {};
      
      classOrder.forEach(className => {
        if (distribution[className]) {
          sortedDistribution[className] = distribution[className];
        }
      });

      console.log('✅ Class distribution calculated:', sortedDistribution);
      return sortedDistribution;
      
    } catch (error) {
      console.error('❌ Failed to calculate class distribution:', error);
      throw error;
    }
  },

  /**
   * Get upcoming events across all services
   * @param {number} daysAhead - Number of days to look ahead (default: 7)
   * @returns {Promise<Array>} Array of upcoming events
   */
  async getUpcomingEvents(daysAhead = 7) {
    try {
      console.log(`📅 Getting upcoming events for next ${daysAhead} days...`);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
      const now = new Date();

      const [rehearsals, theoryLessons, bagruts] = await Promise.allSettled([
        apiService.rehearsals.getRehearsals(),
        apiService.theory.getTheoryLessons(),
        apiService.bagrut.getBagruts()
      ]);

      const events = [];

      // Add rehearsals
      if (rehearsals.status === 'fulfilled') {
        rehearsals.value
          .filter(r => {
            const date = new Date(r.date);
            return date > now && date <= endDate && r.isActive !== false;
          })
          .forEach(r => {
            events.push({
              type: 'rehearsal',
              title: `חזרה`,
              date: r.date,
              startTime: r.startTime,
              endTime: r.endTime,
              location: r.location,
              groupId: r.groupId
            });
          });
      }

      // Add theory lessons
      if (theoryLessons.status === 'fulfilled') {
        theoryLessons.value
          .filter(t => {
            const date = new Date(t.date);
            return date > now && date <= endDate && t.isActive !== false;
          })
          .forEach(t => {
            events.push({
              type: 'theory',
              title: `תאוריה - ${t.category}`,
              date: t.date,
              startTime: t.startTime,
              endTime: t.endTime,
              location: t.location,
              category: t.category
            });
          });
      }

      // Add bagrut tests
      if (bagruts.status === 'fulfilled') {
        bagruts.value
          .filter(b => {
            if (!b.testDate || b.isCompleted) return false;
            const date = new Date(b.testDate);
            return date > now && date <= endDate;
          })
          .forEach(b => {
            events.push({
              type: 'bagrut',
              title: `בחינת בגרות`,
              date: b.testDate,
              startTime: '09:00',
              endTime: '16:00',
              location: 'אולם בחינות',
              studentId: b.studentId
            });
          });
      }

      // Sort by date and time
      events.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      });

      console.log(`✅ Found ${events.length} upcoming events`);
      return events;
      
    } catch (error) {
      console.error('❌ Failed to get upcoming events:', error);
      throw error;
    }
  },

  /**
   * Cache dashboard data for performance
   */
  _cache: new Map(),
  _cacheExpiry: 5 * 60 * 1000, // 5 minutes

  async getCachedDashboardStats() {
    const cacheKey = 'dashboard_stats';
    const now = Date.now();
    
    if (this._cache.has(cacheKey)) {
      const { data, timestamp } = this._cache.get(cacheKey);
      if (now - timestamp < this._cacheExpiry) {
        console.log('📦 Using cached dashboard stats');
        return data;
      }
    }
    
    const data = await this.getDashboardStats();
    this._cache.set(cacheKey, { data, timestamp: now });
    return data;
  }
};

export default dashboardAnalytics;