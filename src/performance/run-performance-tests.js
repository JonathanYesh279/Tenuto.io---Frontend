/**
 * Performance Test Runner
 * 
 * Executes comprehensive performance tests for teacher lesson queries
 * and generates detailed performance reports with optimization recommendations
 */

import { TeacherPerformanceTester } from './teacher-performance-test.js';
import { MongoDBQueryAnalyzer, MongoDBPerformanceValidator } from './mongodb-optimization.js';
import apiService from '../services/apiService.js';

/**
 * Main Performance Test Runner Class
 */
class PerformanceTestRunner {
  constructor() {
    this.tester = new TeacherPerformanceTester();
    this.mongoAnalyzer = new MongoDBQueryAnalyzer();
    this.validator = new MongoDBPerformanceValidator();
    this.reportData = {
      timestamp: new Date().toISOString(),
      environment: {},
      testResults: {},
      mongoOptimization: {},
      recommendations: [],
      summary: {}
    };
  }

  /**
   * Authenticate with the API
   */
  async authenticate() {
    console.log('🔐 Authenticating with API...');
    
    try {
      // Try to validate existing token first
      if (apiService.auth.isAuthenticated()) {
        await apiService.auth.validateToken();
        console.log('✅ Using existing authentication token');
        return true;
      }
    } catch (error) {
      console.log('⚠️ Existing token invalid, need to login');
    }

    // If no valid token, need to login
    console.log('❌ No valid authentication. Please login first.');
    console.log('💡 Use the following command to login:');
    console.log('   await apiService.auth.login("your-email@example.com", "your-password")');
    
    return false;
  }

  /**
   * Gather environment information
   */
  async gatherEnvironmentInfo() {
    console.log('🔍 Gathering environment information...');
    
    try {
      const [students, teachers] = await Promise.all([
        apiService.students.getStudents(),
        apiService.teachers.getTeachers()
      ]);

      this.reportData.environment = {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        studentsWithTeacherAssignments: students.filter(s => 
          s.teacherAssignments && s.teacherAssignments.length > 0
        ).length,
        activeTeacherAssignments: students.reduce((count, student) => {
          return count + (student.teacherAssignments?.filter(ta => ta.isActive)?.length || 0);
        }, 0),
        averageAssignmentsPerStudent: students.length > 0 ? 
          students.reduce((sum, s) => sum + (s.teacherAssignments?.length || 0), 0) / students.length : 0,
        dataQuality: {
          studentsWithFullName: students.filter(s => s.personalInfo?.fullName).length,
          teachersWithInstrument: teachers.filter(t => t.professionalInfo?.instrument).length,
          studentsWithClass: students.filter(s => s.academicInfo?.class).length
        }
      };

      console.log(`📊 Environment: ${this.reportData.environment.totalStudents} students, ${this.reportData.environment.totalTeachers} teachers`);
      console.log(`📋 Active assignments: ${this.reportData.environment.activeTeacherAssignments}`);
      
      return this.reportData.environment;
      
    } catch (error) {
      console.error('❌ Failed to gather environment info:', error);
      throw error;
    }
  }

  /**
   * Run baseline performance tests
   */
  async runBaselineTests() {
    console.log('\n🚀 Running baseline performance tests...');
    
    try {
      // Run the complete performance test suite
      const performanceReport = await this.tester.runCompletePerformanceTest();
      
      this.reportData.testResults = {
        teacherLessons: performanceReport.results.teacherLessons,
        weeklySchedule: performanceReport.results.weeklySchedule,
        pageLoad: performanceReport.results.pageLoad,
        rawMetrics: performanceReport.rawMetrics
      };

      console.log('✅ Baseline performance tests completed');
      return performanceReport;
      
    } catch (error) {
      console.error('❌ Baseline tests failed:', error);
      throw error;
    }
  }

  /**
   * Generate MongoDB optimization recommendations
   */
  generateMongoOptimizations() {
    console.log('\n🔧 Generating MongoDB optimization recommendations...');
    
    const optimizationScript = this.mongoAnalyzer.generateOptimizationScript();
    const validationReport = this.validator.generateValidationReport();
    
    this.reportData.mongoOptimization = {
      requiredIndexes: optimizationScript.sections.indexCreation.commands,
      verificationCommands: optimizationScript.sections.indexVerification.commands,
      executionPlanCommands: optimizationScript.sections.executionPlanAnalysis.commands,
      monitoringSetup: optimizationScript.sections.performanceMonitoring.commands,
      instructions: optimizationScript.instructions,
      validationChecklist: validationReport.validationChecklist
    };

    console.log('✅ MongoDB optimization recommendations generated');
    return this.reportData.mongoOptimization;
  }

  /**
   * Analyze results and generate recommendations
   */
  analyzeResults() {
    console.log('\n📊 Analyzing results and generating recommendations...');
    
    const results = this.reportData.testResults;
    const environment = this.reportData.environment;
    
    // Performance analysis
    const performanceIssues = [];
    const optimizations = [];
    
    // Check teacher lessons performance
    if (results.teacherLessons && !results.teacherLessons.passesTarget) {
      performanceIssues.push({
        type: 'CRITICAL',
        area: 'Teacher Lessons Query',
        metric: `${results.teacherLessons.avgDuration.toFixed(2)}ms average`,
        target: `${results.teacherLessons.target}ms`,
        impact: 'Slow individual lesson loading affects teacher dashboard'
      });
      
      optimizations.push({
        priority: 'HIGH',
        category: 'Database Indexes',
        action: 'Create compound index on teacherAssignments.teacherId + isActive',
        expectedImpact: '60-80% query time reduction'
      });
    }
    
    // Check weekly schedule performance
    if (results.weeklySchedule && !results.weeklySchedule.passesTarget) {
      performanceIssues.push({
        type: 'HIGH',
        area: 'Weekly Schedule Query',
        metric: `${results.weeklySchedule.avgDuration.toFixed(2)}ms average`,
        target: `${results.weeklySchedule.target}ms`,
        impact: 'Slow weekly view loading affects teacher planning'
      });
      
      optimizations.push({
        priority: 'HIGH',
        category: 'Query Optimization',
        action: 'Optimize aggregation pipeline for weekly schedule',
        expectedImpact: '40-60% query time reduction'
      });
    }
    
    // Check page load performance
    if (results.pageLoad && !results.pageLoad.passesTarget) {
      performanceIssues.push({
        type: 'MEDIUM',
        area: 'Teacher Page Load',
        metric: `${results.pageLoad.avgDuration.toFixed(2)}ms average`,
        target: `${results.pageLoad.target}ms`,
        impact: 'Poor user experience for teacher detail pages'
      });
      
      optimizations.push({
        priority: 'MEDIUM',
        category: 'Frontend Optimization',
        action: 'Implement parallel data loading and progressive rendering',
        expectedImpact: '30-50% page load time reduction'
      });
    }
    
    // Environment-specific recommendations
    if (environment.totalStudents > 500) {
      optimizations.push({
        priority: 'HIGH',
        category: 'Scalability',
        action: 'Implement query result caching for large datasets',
        expectedImpact: 'Consistent performance with growing data'
      });
    }
    
    if (environment.averageAssignmentsPerStudent > 3) {
      optimizations.push({
        priority: 'MEDIUM',
        category: 'Data Structure',
        action: 'Consider denormalizing frequently accessed teacher data',
        expectedImpact: 'Reduced query complexity'
      });
    }
    
    this.reportData.recommendations = {
      performanceIssues,
      optimizations,
      immediateActions: this.generateImmediateActions(performanceIssues),
      longTermStrategy: this.generateLongTermStrategy(environment, optimizations)
    };
    
    console.log(`✅ Analysis complete: ${performanceIssues.length} issues, ${optimizations.length} optimizations`);
    return this.reportData.recommendations;
  }

  /**
   * Generate immediate action items
   */
  generateImmediateActions(issues) {
    const actions = [];
    
    // Critical performance issues need immediate attention
    const criticalIssues = issues.filter(issue => issue.type === 'CRITICAL');
    if (criticalIssues.length > 0) {
      actions.push({
        priority: 1,
        action: 'Create database indexes for teacher queries',
        commands: [
          'db.students.createIndex({ "teacherAssignments.teacherId": 1 })',
          'db.students.createIndex({ "teacherAssignments.teacherId": 1, "teacherAssignments.isActive": 1 })'
        ],
        estimatedTime: '10-30 minutes'
      });
    }
    
    // Enable query monitoring
    actions.push({
      priority: 2,
      action: 'Enable MongoDB slow query monitoring',
      commands: [
        'db.setProfilingLevel(1, { slowms: 100 })'
      ],
      estimatedTime: '5 minutes'
    });
    
    // Performance baseline
    actions.push({
      priority: 3,
      action: 'Establish performance monitoring baseline',
      commands: [
        'Run performance tests weekly',
        'Monitor query execution plans monthly'
      ],
      estimatedTime: '1 hour setup'
    });
    
    return actions;
  }

  /**
   * Generate long-term optimization strategy
   */
  generateLongTermStrategy(environment, optimizations) {
    const strategy = {
      phases: [],
      goals: {
        shortTerm: 'Achieve <100ms teacher query response times',
        mediumTerm: 'Scale to 1000+ students without performance degradation',
        longTerm: 'Implement predictive caching and real-time optimization'
      }
    };
    
    // Phase 1: Database optimization (1-2 weeks)
    strategy.phases.push({
      phase: 1,
      title: 'Database Optimization',
      duration: '1-2 weeks',
      tasks: [
        'Create and optimize all required database indexes',
        'Analyze and optimize aggregation pipelines',
        'Implement query performance monitoring',
        'Set up automated index maintenance'
      ],
      expectedOutcome: '70-80% query performance improvement'
    });
    
    // Phase 2: Application optimization (2-3 weeks)
    strategy.phases.push({
      phase: 2,
      title: 'Application Layer Optimization',
      duration: '2-3 weeks',
      tasks: [
        'Implement efficient caching strategies',
        'Optimize frontend data loading patterns',
        'Add progressive loading and skeleton screens',
        'Implement pagination for large datasets'
      ],
      expectedOutcome: 'Improved user experience and reduced server load'
    });
    
    // Phase 3: Scalability preparation (3-4 weeks)
    if (environment.totalStudents > 300) {
      strategy.phases.push({
        phase: 3,
        title: 'Scalability Enhancement',
        duration: '3-4 weeks',
        tasks: [
          'Implement read replicas for query distribution',
          'Set up connection pooling and load balancing',
          'Develop automated performance testing pipeline',
          'Create performance alerting and monitoring dashboards'
        ],
        expectedOutcome: 'Support for 1000+ students with consistent performance'
      });
    }
    
    return strategy;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary() {
    const summary = {
      overallStatus: 'NEEDS_OPTIMIZATION',
      keyFindings: [],
      businessImpact: [],
      recommendations: [],
      timeline: 'Immediate action required'
    };

    const results = this.reportData.testResults;
    
    // Determine overall status
    const allTargetsMet = (
      results.teacherLessons?.passesTarget &&
      results.weeklySchedule?.passesTarget &&
      results.pageLoad?.passesTarget
    );
    
    if (allTargetsMet) {
      summary.overallStatus = 'PERFORMING_WELL';
      summary.timeline = 'Monitor and maintain';
    } else {
      const criticalIssues = this.reportData.recommendations.performanceIssues.filter(
        issue => issue.type === 'CRITICAL'
      ).length;
      
      if (criticalIssues > 0) {
        summary.overallStatus = 'CRITICAL_ISSUES';
        summary.timeline = 'Immediate action required (within 1 week)';
      } else {
        summary.overallStatus = 'NEEDS_OPTIMIZATION';
        summary.timeline = 'Optimization recommended (within 2-3 weeks)';
      }
    }
    
    // Key findings
    if (results.teacherLessons) {
      summary.keyFindings.push(
        `Teacher lesson queries average ${results.teacherLessons.avgDuration.toFixed(2)}ms ` +
        `(target: ${results.teacherLessons.target}ms)`
      );
    }
    
    if (results.weeklySchedule) {
      summary.keyFindings.push(
        `Weekly schedule queries average ${results.weeklySchedule.avgDuration.toFixed(2)}ms ` +
        `(target: ${results.weeklySchedule.target}ms)`
      );
    }
    
    summary.keyFindings.push(
      `Testing environment: ${this.reportData.environment.totalStudents} students, ` +
      `${this.reportData.environment.activeTeacherAssignments} active lesson assignments`
    );
    
    // Business impact
    if (!allTargetsMet) {
      summary.businessImpact.push('Teachers experience delays when accessing lesson information');
      summary.businessImpact.push('Poor user experience may affect teacher productivity');
      
      if (this.reportData.environment.totalStudents > 200) {
        summary.businessImpact.push('Performance issues will worsen as student count grows');
      }
    }
    
    // Top recommendations
    const topOptimizations = this.reportData.recommendations.optimizations
      .filter(opt => opt.priority === 'HIGH')
      .slice(0, 3);
      
    summary.recommendations = topOptimizations.map(opt => opt.action);
    
    this.reportData.summary = summary;
    return summary;
  }

  /**
   * Generate and save comprehensive performance report
   */
  async generateReport() {
    console.log('\n📋 Generating comprehensive performance report...');
    
    const executiveSummary = this.generateExecutiveSummary();
    
    const report = {
      ...this.reportData,
      metadata: {
        title: 'Teacher Lesson Performance Analysis Report',
        generatedAt: new Date().toISOString(),
        version: '1.0',
        testDuration: 'Multiple iterations over test dataset',
        scope: 'Teacher lesson queries and weekly schedule performance'
      },
      executiveSummary
    };
    
    // Log executive summary
    console.log('\n📊 EXECUTIVE SUMMARY');
    console.log('===================');
    console.log(`Status: ${executiveSummary.overallStatus}`);
    console.log(`Timeline: ${executiveSummary.timeline}`);
    console.log('\nKey Findings:');
    executiveSummary.keyFindings.forEach(finding => console.log(`  • ${finding}`));
    
    if (executiveSummary.businessImpact.length > 0) {
      console.log('\nBusiness Impact:');
      executiveSummary.businessImpact.forEach(impact => console.log(`  • ${impact}`));
    }
    
    console.log('\nTop Recommendations:');
    executiveSummary.recommendations.forEach(rec => console.log(`  • ${rec}`));
    
    return report;
  }

  /**
   * Run complete performance testing pipeline
   */
  async runCompleteAnalysis() {
    console.log('🚀 Starting Complete Teacher Lesson Performance Analysis');
    console.log('=========================================================');
    
    try {
      // Step 1: Authenticate
      const isAuthenticated = await this.authenticate();
      if (!isAuthenticated) {
        throw new Error('Authentication required to run performance tests');
      }
      
      // Step 2: Gather environment info
      await this.gatherEnvironmentInfo();
      
      // Step 3: Run baseline tests
      await this.runBaselineTests();
      
      // Step 4: Generate MongoDB optimizations
      this.generateMongoOptimizations();
      
      // Step 5: Analyze results
      this.analyzeResults();
      
      // Step 6: Generate final report
      const finalReport = await this.generateReport();
      
      console.log('\n🎉 Performance analysis completed successfully!');
      console.log('\n📋 Report saved. Use the following to access full details:');
      console.log('   const report = await performanceRunner.getFullReport();');
      
      return finalReport;
      
    } catch (error) {
      console.error('\n❌ Performance analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get full report data
   */
  getFullReport() {
    return this.reportData;
  }
}

// Export for use in other modules
export { PerformanceTestRunner };

// Create global instance for testing
const performanceRunner = new PerformanceTestRunner();

// Export instance for direct use
export { performanceRunner };

// Auto-run if called directly
if (typeof window === 'undefined') {
  console.log('🔧 Performance Test Runner loaded');
  console.log('📞 To run complete analysis: performanceRunner.runCompleteAnalysis()');
}