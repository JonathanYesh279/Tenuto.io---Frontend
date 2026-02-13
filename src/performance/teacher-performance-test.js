/**
 * Teacher Lesson Performance Testing Suite
 * 
 * Tests performance of new teacher lesson queries that search student records
 * Background: Teacher lessons now queried from student collection instead of teacher collection
 * 
 * Performance Requirements:
 * - Teacher detail page loads in < 2 seconds
 * - Weekly schedule loads in < 1 second
 * - Target: < 100ms for teacher lesson queries
 * - Target: < 200ms for weekly schedule
 * - No timeout errors with 500+ students
 */

import apiService from '../services/apiService.js';

// Test configuration
const PERFORMANCE_CONFIG = {
  TARGET_STUDENTS: 100,
  TARGET_TEACHERS: 10,
  LESSON_QUERY_TARGET: 100, // ms
  WEEKLY_SCHEDULE_TARGET: 200, // ms
  PAGE_LOAD_TARGET: 2000, // ms
  WEEKLY_LOAD_TARGET: 1000, // ms
  MAX_DOCUMENT_SCAN: 1000,
  TEST_ITERATIONS: 5
};

// Performance metrics storage
const performanceMetrics = {
  teacherLessons: [],
  weeklySchedule: [],
  pageLoad: [],
  errors: [],
  dbStats: {}
};

/**
 * Generate test data for performance testing
 */
class PerformanceDataGenerator {
  constructor() {
    this.studentCount = 0;
    this.teacherCount = 0;
  }

  /**
   * Create test students with teacher assignments
   */
  generateStudents(count, teacherIds) {
    const students = [];
    
    for (let i = 0; i < count; i++) {
      const student = {
        personalInfo: {
          fullName: `תלמיד בדיקה ${i + 1}`,
          phone: `0501234${String(i).padStart(3, '0')}`,
          age: 12 + (i % 8),
          address: `כתובת ${i + 1}`,
          parentName: `הורה ${i + 1}`,
          parentPhone: `0507654${String(i).padStart(3, '0')}`,
          parentEmail: `parent${i}@test.com`,
          studentEmail: `student${i}@test.com`
        },
        academicInfo: {
          instrumentProgress: [{
            instrumentName: ['פסנתר', 'כינור', 'חלילית', 'גיטרה'][i % 4],
            isPrimary: true,
            currentStage: (i % 8) + 1,
            tests: {
              stageTest: {
                status: 'עבר/ה',
                lastTestDate: new Date().toISOString(),
                nextTestDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
                notes: 'בדיקת ביצועים'
              }
            }
          }],
          class: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח'][i % 8]
        },
        teacherAssignments: this.generateTeacherAssignments(i, teacherIds),
        isActive: true
      };
      
      students.push(student);
    }
    
    return students;
  }

  /**
   * Generate teacher assignments for a student
   */
  generateTeacherAssignments(studentIndex, teacherIds) {
    const assignments = [];
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
    
    // Each student gets 1-3 lessons per week
    const lessonCount = 1 + (studentIndex % 3);
    
    for (let i = 0; i < lessonCount; i++) {
      const teacherId = teacherIds[studentIndex % teacherIds.length];
      const day = days[i % days.length];
      const hour = 14 + (studentIndex % 6); // 14:00-19:00
      
      assignments.push({
        teacherId: teacherId,
        scheduleSlotId: `slot_${studentIndex}_${i}`,
        day: day,
        time: `${hour}:00`,
        duration: [30, 45, 60][(studentIndex + i) % 3],
        startDate: new Date().toISOString(),
        endDate: null,
        isActive: true,
        notes: `שיעור ${i + 1} לתלמיד ${studentIndex + 1}`,
        isRecurring: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return assignments;
  }

  /**
   * Generate test teachers
   */
  generateTeachers(count) {
    const teachers = [];
    const instruments = ['פסנתר', 'כינור', 'חלילית', 'גיטרה', 'צ\'לו', 'ויולה'];
    
    for (let i = 0; i < count; i++) {
      const teacher = {
        personalInfo: {
          fullName: `מורה בדיקה ${i + 1}`,
          phone: `0521234${String(i).padStart(3, '0')}`,
          email: `teacher${i}@test.com`,
          address: `כתובת מורה ${i + 1}`
        },
        roles: ['מורה'],
        professionalInfo: {
          instrument: instruments[i % instruments.length],
          isActive: true
        },
        teaching: {
          schedule: []
        },
        conducting: {
          orchestraIds: []
        },
        ensemblesIds: [],
        schoolYears: [],
        isActive: true
      };
      
      teachers.push(teacher);
    }
    
    return teachers;
  }
}

/**
 * Performance testing class
 */
class TeacherPerformanceTester {
  constructor() {
    this.dataGenerator = new PerformanceDataGenerator();
    this.testTeacherIds = [];
    this.testStudentIds = [];
  }

  /**
   * Setup test environment with required data
   */
  async setupTestEnvironment() {
    console.log('🔧 Setting up performance test environment...');
    
    try {
      // Check if we already have enough data
      const existingStudents = await apiService.students.getStudents();
      const existingTeachers = await apiService.teachers.getTeachers();
      
      console.log(`📊 Current data: ${existingStudents.length} students, ${existingTeachers.length} teachers`);
      
      // If we don't have enough data, create test data
      if (existingStudents.length < PERFORMANCE_CONFIG.TARGET_STUDENTS || 
          existingTeachers.length < PERFORMANCE_CONFIG.TARGET_TEACHERS) {
        
        console.log('⚠️ Insufficient test data. Creating test data...');
        await this.createTestData();
      } else {
        // Use existing data
        this.testTeacherIds = existingTeachers.slice(0, PERFORMANCE_CONFIG.TARGET_TEACHERS).map(t => t._id);
        this.testStudentIds = existingStudents.slice(0, PERFORMANCE_CONFIG.TARGET_STUDENTS).map(s => s._id);
        console.log('✅ Using existing test data');
      }
      
      console.log(`✅ Test environment ready: ${this.testStudentIds.length} students, ${this.testTeacherIds.length} teachers`);
      
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error);
      throw error;
    }
  }

  /**
   * Create test data if needed
   */
  async createTestData() {
    console.log('📝 Creating test data...');
    
    // Create teachers first
    const teachers = this.dataGenerator.generateTeachers(PERFORMANCE_CONFIG.TARGET_TEACHERS);
    const createdTeachers = [];
    
    for (const teacher of teachers) {
      try {
        const created = await apiService.teachers.createTeacher(teacher);
        createdTeachers.push(created);
        this.testTeacherIds.push(created._id);
      } catch (error) {
        console.warn('⚠️ Failed to create teacher:', error.message);
      }
    }
    
    // Create students with teacher assignments
    const students = this.dataGenerator.generateStudents(PERFORMANCE_CONFIG.TARGET_STUDENTS, this.testTeacherIds);
    
    for (const student of students) {
      try {
        const created = await apiService.students.createStudent(student);
        this.testStudentIds.push(created._id);
      } catch (error) {
        console.warn('⚠️ Failed to create student:', error.message);
      }
    }
    
    console.log(`✅ Created ${this.testTeacherIds.length} teachers and ${this.testStudentIds.length} students`);
  }

  /**
   * Test GET /teachers/:id/lessons performance
   */
  async testTeacherLessonsPerformance() {
    console.log('\n📊 Testing GET /teachers/:id/lessons performance...');
    
    const results = [];
    
    for (let i = 0; i < PERFORMANCE_CONFIG.TEST_ITERATIONS; i++) {
      for (const teacherId of this.testTeacherIds) {
        const startTime = performance.now();
        
        try {
          const response = await apiService.teachers.getTeacherLessons(teacherId);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          const result = {
            teacherId,
            iteration: i + 1,
            duration,
            lessonCount: response.lessons?.length || 0,
            source: response.source,
            success: true,
            timestamp: new Date().toISOString()
          };
          
          results.push(result);
          performanceMetrics.teacherLessons.push(result);
          
          // Log slow queries
          if (duration > PERFORMANCE_CONFIG.LESSON_QUERY_TARGET) {
            console.warn(`⚠️ Slow query: ${duration.toFixed(2)}ms for teacher ${teacherId}`);
          }
          
        } catch (error) {
          const result = {
            teacherId,
            iteration: i + 1,
            duration: -1,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
          };
          
          results.push(result);
          performanceMetrics.errors.push(result);
        }
      }
    }
    
    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
    const maxDuration = Math.max(...successfulResults.map(r => r.duration));
    const minDuration = Math.min(...successfulResults.map(r => r.duration));
    
    console.log(`✅ Teacher lessons performance test completed:`);
    console.log(`   - Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`   - Min: ${minDuration.toFixed(2)}ms`);
    console.log(`   - Max: ${maxDuration.toFixed(2)}ms`);
    console.log(`   - Target: ${PERFORMANCE_CONFIG.LESSON_QUERY_TARGET}ms`);
    console.log(`   - Success rate: ${(successfulResults.length / results.length * 100).toFixed(1)}%`);
    
    return {
      avgDuration,
      maxDuration,
      minDuration,
      successRate: successfulResults.length / results.length,
      totalTests: results.length,
      passesTarget: avgDuration <= PERFORMANCE_CONFIG.LESSON_QUERY_TARGET
    };
  }

  /**
   * Test GET /teachers/:id/weekly-schedule performance
   */
  async testWeeklySchedulePerformance() {
    console.log('\n📊 Testing GET /teachers/:id/weekly-schedule performance...');
    
    const results = [];
    
    for (let i = 0; i < PERFORMANCE_CONFIG.TEST_ITERATIONS; i++) {
      for (const teacherId of this.testTeacherIds) {
        const startTime = performance.now();
        
        try {
          const response = await apiService.teachers.getTeacherWeeklySchedule(teacherId);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          const result = {
            teacherId,
            iteration: i + 1,
            duration,
            totalLessons: response.summary?.totalLessons || 0,
            activeDays: response.summary?.activeDays || 0,
            success: true,
            timestamp: new Date().toISOString()
          };
          
          results.push(result);
          performanceMetrics.weeklySchedule.push(result);
          
          // Log slow queries
          if (duration > PERFORMANCE_CONFIG.WEEKLY_SCHEDULE_TARGET) {
            console.warn(`⚠️ Slow weekly schedule query: ${duration.toFixed(2)}ms for teacher ${teacherId}`);
          }
          
        } catch (error) {
          const result = {
            teacherId,
            iteration: i + 1,
            duration: -1,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
          };
          
          results.push(result);
          performanceMetrics.errors.push(result);
        }
      }
    }
    
    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
    const maxDuration = Math.max(...successfulResults.map(r => r.duration));
    const minDuration = Math.min(...successfulResults.map(r => r.duration));
    
    console.log(`✅ Weekly schedule performance test completed:`);
    console.log(`   - Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`   - Min: ${minDuration.toFixed(2)}ms`);
    console.log(`   - Max: ${maxDuration.toFixed(2)}ms`);
    console.log(`   - Target: ${PERFORMANCE_CONFIG.WEEKLY_SCHEDULE_TARGET}ms`);
    console.log(`   - Success rate: ${(successfulResults.length / results.length * 100).toFixed(1)}%`);
    
    return {
      avgDuration,
      maxDuration,
      minDuration,
      successRate: successfulResults.length / results.length,
      totalTests: results.length,
      passesTarget: avgDuration <= PERFORMANCE_CONFIG.WEEKLY_SCHEDULE_TARGET
    };
  }

  /**
   * Test page load performance simulation
   */
  async testPageLoadPerformance() {
    console.log('\n📊 Testing teacher detail page load performance...');
    
    const results = [];
    
    for (const teacherId of this.testTeacherIds) {
      const startTime = performance.now();
      
      try {
        // Simulate teacher detail page load
        const [teacher, lessons, schedule] = await Promise.all([
          apiService.teachers.getTeacher(teacherId),
          apiService.teachers.getTeacherLessons(teacherId),
          apiService.teachers.getTeacherWeeklySchedule(teacherId)
        ]);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const result = {
          teacherId,
          duration,
          success: true,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        performanceMetrics.pageLoad.push(result);
        
        if (duration > PERFORMANCE_CONFIG.PAGE_LOAD_TARGET) {
          console.warn(`⚠️ Slow page load: ${duration.toFixed(2)}ms for teacher ${teacherId}`);
        }
        
      } catch (error) {
        const result = {
          teacherId,
          duration: -1,
          error: error.message,
          success: false,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        performanceMetrics.errors.push(result);
      }
    }
    
    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
    const maxDuration = Math.max(...successfulResults.map(r => r.duration));
    const minDuration = Math.min(...successfulResults.map(r => r.duration));
    
    console.log(`✅ Page load performance test completed:`);
    console.log(`   - Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`   - Min: ${minDuration.toFixed(2)}ms`);
    console.log(`   - Max: ${maxDuration.toFixed(2)}ms`);
    console.log(`   - Target: ${PERFORMANCE_CONFIG.PAGE_LOAD_TARGET}ms`);
    console.log(`   - Success rate: ${(successfulResults.length / results.length * 100).toFixed(1)}%`);
    
    return {
      avgDuration,
      maxDuration,
      minDuration,
      successRate: successfulResults.length / results.length,
      totalTests: results.length,
      passesTarget: avgDuration <= PERFORMANCE_CONFIG.PAGE_LOAD_TARGET
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(lessonStats, scheduleStats, pageLoadStats) {
    const report = {
      testConfig: PERFORMANCE_CONFIG,
      timestamp: new Date().toISOString(),
      environment: {
        studentCount: this.testStudentIds.length,
        teacherCount: this.testTeacherIds.length
      },
      results: {
        teacherLessons: {
          ...lessonStats,
          target: PERFORMANCE_CONFIG.LESSON_QUERY_TARGET
        },
        weeklySchedule: {
          ...scheduleStats,
          target: PERFORMANCE_CONFIG.WEEKLY_SCHEDULE_TARGET
        },
        pageLoad: {
          ...pageLoadStats,
          target: PERFORMANCE_CONFIG.PAGE_LOAD_TARGET
        }
      },
      recommendations: this.generateOptimizationRecommendations(lessonStats, scheduleStats, pageLoadStats),
      rawMetrics: performanceMetrics
    };
    
    return report;
  }

  /**
   * Generate optimization recommendations based on results
   */
  generateOptimizationRecommendations(lessonStats, scheduleStats, pageLoadStats) {
    const recommendations = [];
    
    // Check teacher lesson query performance
    if (!lessonStats.passesTarget) {
      recommendations.push({
        type: 'CRITICAL',
        category: 'Teacher Lessons Query',
        issue: `Average response time (${lessonStats.avgDuration.toFixed(2)}ms) exceeds target (${PERFORMANCE_CONFIG.LESSON_QUERY_TARGET}ms)`,
        recommendations: [
          'Add compound index on { "teacherAssignments.teacherId": 1, "teacherAssignments.isActive": 1 }',
          'Add index on { "teacherAssignments.teacherId": 1, "teacherAssignments.day": 1 }',
          'Consider denormalizing frequently accessed teacher lesson data',
          'Implement query result caching for teacher lessons'
        ]
      });
    }
    
    // Check weekly schedule performance
    if (!scheduleStats.passesTarget) {
      recommendations.push({
        type: 'HIGH',
        category: 'Weekly Schedule Query',
        issue: `Average response time (${scheduleStats.avgDuration.toFixed(2)}ms) exceeds target (${PERFORMANCE_CONFIG.WEEKLY_SCHEDULE_TARGET}ms)`,
        recommendations: [
          'Optimize aggregation pipeline for weekly schedule queries',
          'Add index on { "teacherAssignments.teacherId": 1, "teacherAssignments.day": 1, "teacherAssignments.time": 1 }',
          'Implement weekly schedule caching with TTL',
          'Consider pre-computing weekly schedules during off-peak hours'
        ]
      });
    }
    
    // Check page load performance
    if (!pageLoadStats.passesTarget) {
      recommendations.push({
        type: 'HIGH',
        category: 'Page Load Performance',
        issue: `Average page load time (${pageLoadStats.avgDuration.toFixed(2)}ms) exceeds target (${PERFORMANCE_CONFIG.PAGE_LOAD_TARGET}ms)`,
        recommendations: [
          'Implement parallel loading of teacher data, lessons, and schedule',
          'Add loading states and progressive rendering',
          'Consider implementing data prefetching for frequently accessed teachers',
          'Optimize frontend bundle size and implement code splitting'
        ]
      });
    }
    
    // General recommendations
    recommendations.push({
      type: 'OPTIMIZATION',
      category: 'Database Optimization',
      issue: 'Ensure optimal database performance',
      recommendations: [
        'Monitor MongoDB slow query log',
        'Use db.students.explain("executionStats") to analyze query execution',
        'Verify indexes are being used effectively',
        'Monitor document scan counts to stay under 1000 documents',
        'Consider implementing read replicas for heavy query workloads'
      ]
    });
    
    return recommendations;
  }

  /**
   * Run complete performance test suite
   */
  async runCompletePerformanceTest() {
    console.log('🚀 Starting complete teacher lesson performance test suite');
    console.log('===========================================================');
    
    try {
      // Setup test environment
      await this.setupTestEnvironment();
      
      // Run performance tests
      const lessonStats = await this.testTeacherLessonsPerformance();
      const scheduleStats = await this.testWeeklySchedulePerformance();
      const pageLoadStats = await this.testPageLoadPerformance();
      
      // Generate comprehensive report
      const report = this.generatePerformanceReport(lessonStats, scheduleStats, pageLoadStats);
      
      console.log('\n📊 PERFORMANCE TEST SUMMARY');
      console.log('============================');
      console.log(`Teacher Lessons: ${lessonStats.passesTarget ? '✅ PASS' : '❌ FAIL'} (${lessonStats.avgDuration.toFixed(2)}ms avg)`);
      console.log(`Weekly Schedule: ${scheduleStats.passesTarget ? '✅ PASS' : '❌ FAIL'} (${scheduleStats.avgDuration.toFixed(2)}ms avg)`);
      console.log(`Page Load: ${pageLoadStats.passesTarget ? '✅ PASS' : '❌ FAIL'} (${pageLoadStats.avgDuration.toFixed(2)}ms avg)`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      throw error;
    }
  }
}

// Export for use in other modules
export { TeacherPerformanceTester, PerformanceDataGenerator, PERFORMANCE_CONFIG };

// Run if called directly
if (typeof window === 'undefined') {
  const tester = new TeacherPerformanceTester();
  tester.runCompletePerformanceTest()
    .then(report => {
      console.log('\n📋 Full Performance Report:', JSON.stringify(report, null, 2));
    })
    .catch(error => {
      console.error('Performance test failed:', error);
    });
}