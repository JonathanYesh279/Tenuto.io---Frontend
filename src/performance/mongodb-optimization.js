/**
 * MongoDB Index Verification and Query Optimization Script
 * 
 * Verifies required indexes exist for optimal teacher lesson query performance
 * Tests query execution plans and provides optimization recommendations
 */

/**
 * Required MongoDB Indexes for Teacher Lesson Queries
 */
const REQUIRED_INDEXES = [
  {
    name: 'teacherAssignments_teacherId',
    spec: { "teacherAssignments.teacherId": 1 },
    purpose: 'Primary index for finding students by teacher ID'
  },
  {
    name: 'teacherAssignments_teacherId_day',
    spec: { "teacherAssignments.teacherId": 1, "teacherAssignments.day": 1 },
    purpose: 'Compound index for teacher lessons by day queries'
  },
  {
    name: 'teacherAssignments_isActive',
    spec: { "teacherAssignments.isActive": 1 },
    purpose: 'Index for filtering active assignments'
  },
  {
    name: 'teacherAssignments_compound_optimized',
    spec: { 
      "teacherAssignments.teacherId": 1, 
      "teacherAssignments.isActive": 1,
      "teacherAssignments.day": 1 
    },
    purpose: 'Optimized compound index for teacher lesson queries'
  },
  {
    name: 'teacherAssignments_time_sorted',
    spec: { 
      "teacherAssignments.teacherId": 1, 
      "teacherAssignments.day": 1,
      "teacherAssignments.time": 1
    },
    purpose: 'Time-sorted index for weekly schedule queries'
  }
];

/**
 * MongoDB Query Analyzer Class
 */
class MongoDBQueryAnalyzer {
  constructor() {
    this.mongoCommands = [];
    this.indexAnalysis = {};
    this.queryStats = {};
  }

  /**
   * Generate MongoDB commands to verify indexes
   */
  generateIndexVerificationCommands() {
    const commands = [];
    
    // Check existing indexes
    commands.push({
      command: 'db.students.getIndexes()',
      purpose: 'List all existing indexes on students collection',
      category: 'INDEX_VERIFICATION'
    });

    // Check index usage stats
    commands.push({
      command: 'db.students.aggregate([{ $indexStats: {} }])',
      purpose: 'Get index usage statistics',
      category: 'INDEX_STATS'
    });

    return commands;
  }

  /**
   * Generate MongoDB commands to create required indexes
   */
  generateIndexCreationCommands() {
    const commands = [];
    
    for (const index of REQUIRED_INDEXES) {
      commands.push({
        command: `db.students.createIndex(${JSON.stringify(index.spec)}, { name: "${index.name}" })`,
        purpose: index.purpose,
        category: 'INDEX_CREATION',
        indexName: index.name
      });
    }

    return commands;
  }

  /**
   * Generate MongoDB query execution plan tests
   */
  generateExecutionPlanCommands() {
    const commands = [];
    
    // Teacher lessons query execution plan
    commands.push({
      command: `db.students.explain("executionStats").aggregate([
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("TEACHER_ID_PLACEHOLDER"),
      "teacherAssignments.isActive": true
    }
  },
  {
    $unwind: "$teacherAssignments"
  },
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("TEACHER_ID_PLACEHOLDER"),
      "teacherAssignments.isActive": true
    }
  },
  {
    $project: {
      studentId: "$_id",
      studentName: "$personalInfo.fullName",
      lesson: "$teacherAssignments"
    }
  }
])`,
      purpose: 'Analyze teacher lessons query execution plan',
      category: 'EXECUTION_PLAN',
      queryType: 'TEACHER_LESSONS'
    });

    // Weekly schedule query execution plan
    commands.push({
      command: `db.students.explain("executionStats").aggregate([
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("TEACHER_ID_PLACEHOLDER"),
      "teacherAssignments.isActive": true
    }
  },
  {
    $unwind: "$teacherAssignments"
  },
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("TEACHER_ID_PLACEHOLDER"),
      "teacherAssignments.isActive": true
    }
  },
  {
    $group: {
      _id: "$teacherAssignments.day",
      lessons: {
        $push: {
          studentId: "$_id",
          studentName: "$personalInfo.fullName",
          time: "$teacherAssignments.time",
          duration: "$teacherAssignments.duration",
          notes: "$teacherAssignments.notes"
        }
      }
    }
  },
  {
    $sort: { "_id": 1 }
  }
])`,
      purpose: 'Analyze weekly schedule query execution plan',
      category: 'EXECUTION_PLAN',
      queryType: 'WEEKLY_SCHEDULE'
    });

    // Day-specific query execution plan
    commands.push({
      command: `db.students.explain("executionStats").aggregate([
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("TEACHER_ID_PLACEHOLDER"),
      "teacherAssignments.day": "DAY_PLACEHOLDER",
      "teacherAssignments.isActive": true
    }
  },
  {
    $unwind: "$teacherAssignments"
  },
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("TEACHER_ID_PLACEHOLDER"),
      "teacherAssignments.day": "DAY_PLACEHOLDER",
      "teacherAssignments.isActive": true
    }
  },
  {
    $sort: { "teacherAssignments.time": 1 }
  }
])`,
      purpose: 'Analyze day-specific schedule query execution plan',
      category: 'EXECUTION_PLAN',
      queryType: 'DAY_SCHEDULE'
    });

    return commands;
  }

  /**
   * Generate performance monitoring commands
   */
  generatePerformanceMonitoringCommands() {
    const commands = [];

    // Enable profiling for slow queries
    commands.push({
      command: 'db.setProfilingLevel(1, { slowms: 100 })',
      purpose: 'Enable profiling for queries slower than 100ms',
      category: 'PERFORMANCE_MONITORING'
    });

    // Check current profile data
    commands.push({
      command: 'db.system.profile.find().limit(10).sort({ ts: -1 }).pretty()',
      purpose: 'View recent slow queries',
      category: 'PERFORMANCE_MONITORING'
    });

    // Collection stats
    commands.push({
      command: 'db.students.stats()',
      purpose: 'Get collection statistics including index sizes',
      category: 'PERFORMANCE_MONITORING'
    });

    return commands;
  }

  /**
   * Analyze execution stats and provide recommendations
   */
  analyzeExecutionStats(executionStats) {
    const analysis = {
      indexUsed: null,
      documentsExamined: 0,
      documentsReturned: 0,
      executionTime: 0,
      isOptimal: false,
      recommendations: []
    };

    if (executionStats.executionStats) {
      const stats = executionStats.executionStats;
      
      analysis.documentsExamined = stats.totalDocsExamined || 0;
      analysis.documentsReturned = stats.totalDocsReturned || 0;
      analysis.executionTime = stats.executionTimeMillis || 0;

      // Check if index was used
      if (stats.stages && stats.stages[0]) {
        const firstStage = stats.stages[0];
        if (firstStage.$match && firstStage.indexName) {
          analysis.indexUsed = firstStage.indexName;
        }
      }

      // Determine if query is optimal
      const scanRatio = analysis.documentsExamined / Math.max(analysis.documentsReturned, 1);
      analysis.isOptimal = (
        analysis.documentsExamined <= 1000 && // Don't scan more than 1000 docs
        scanRatio <= 10 && // Don't examine more than 10x returned docs
        analysis.executionTime <= 100 // Complete within 100ms
      );

      // Generate recommendations
      if (!analysis.isOptimal) {
        if (analysis.documentsExamined > 1000) {
          analysis.recommendations.push('Query scans too many documents. Add more selective indexes.');
        }
        
        if (scanRatio > 10) {
          analysis.recommendations.push('Query examines too many documents relative to results. Optimize index selectivity.');
        }
        
        if (analysis.executionTime > 100) {
          analysis.recommendations.push('Query execution time exceeds target. Consider compound indexes or query optimization.');
        }
        
        if (!analysis.indexUsed) {
          analysis.recommendations.push('Query is not using an index. Create appropriate indexes for query predicates.');
        }
      }
    }

    return analysis;
  }

  /**
   * Generate complete MongoDB optimization script
   */
  generateOptimizationScript() {
    const script = {
      metadata: {
        title: 'Teacher Lesson Performance Optimization Script',
        description: 'MongoDB commands to verify indexes, analyze queries, and optimize performance',
        generatedAt: new Date().toISOString(),
        requirements: [
          'MongoDB shell or MongoDB Compass',
          'Database admin privileges for index creation',
          'Test teacher IDs for query analysis'
        ]
      },
      sections: {
        indexVerification: {
          title: 'Index Verification',
          commands: this.generateIndexVerificationCommands()
        },
        indexCreation: {
          title: 'Index Creation',
          commands: this.generateIndexCreationCommands()
        },
        executionPlanAnalysis: {
          title: 'Query Execution Plan Analysis',
          commands: this.generateExecutionPlanCommands()
        },
        performanceMonitoring: {
          title: 'Performance Monitoring Setup',
          commands: this.generatePerformanceMonitoringCommands()
        }
      },
      instructions: {
        setup: [
          '1. Connect to your MongoDB instance',
          '2. Switch to the conservatory database: use conservatory',
          '3. Replace TEACHER_ID_PLACEHOLDER with actual teacher ObjectIds',
          '4. Replace DAY_PLACEHOLDER with Hebrew day names (ראשון, שני, etc.)'
        ],
        execution: [
          '1. Run index verification commands first',
          '2. Create missing indexes using index creation commands',
          '3. Test query execution plans with sample teacher IDs',
          '4. Set up performance monitoring for ongoing optimization'
        ],
        analysis: [
          '1. Check that totalDocsExamined < 1000 for each query',
          '2. Verify execution time < 100ms for lesson queries',
          '3. Ensure indexes are being used (check winning plan)',
          '4. Monitor slow query logs for optimization opportunities'
        ]
      }
    };

    return script;
  }

  /**
   * Generate performance testing queries with real ObjectIds
   */
  generateTestQueries(teacherIds) {
    const queries = [];

    for (const teacherId of teacherIds) {
      // Teacher lessons query
      queries.push({
        name: `Teacher Lessons - ${teacherId}`,
        query: `db.students.aggregate([
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("${teacherId}"),
      "teacherAssignments.isActive": true
    }
  },
  {
    $unwind: "$teacherAssignments"
  },
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("${teacherId}"),
      "teacherAssignments.isActive": true
    }
  },
  {
    $project: {
      studentId: "$_id",
      studentName: "$personalInfo.fullName",
      lesson: "$teacherAssignments"
    }
  }
])`,
        explainQuery: `db.students.explain("executionStats").aggregate([...])`
      });

      // Weekly schedule query
      queries.push({
        name: `Weekly Schedule - ${teacherId}`,
        query: `db.students.aggregate([
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("${teacherId}"),
      "teacherAssignments.isActive": true
    }
  },
  {
    $unwind: "$teacherAssignments"
  },
  {
    $match: {
      "teacherAssignments.teacherId": ObjectId("${teacherId}"),
      "teacherAssignments.isActive": true
    }
  },
  {
    $group: {
      _id: "$teacherAssignments.day",
      lessons: {
        $push: {
          studentId: "$_id",
          studentName: "$personalInfo.fullName",
          time: "$teacherAssignments.time",
          duration: "$teacherAssignments.duration"
        }
      }
    }
  },
  {
    $sort: { "_id": 1 }
  }
])`
      });
    }

    return queries;
  }
}

/**
 * MongoDB Performance Validation Class
 */
class MongoDBPerformanceValidator {
  constructor() {
    this.analyzer = new MongoDBQueryAnalyzer();
    this.validationResults = {};
  }

  /**
   * Validate that required indexes exist
   */
  validateIndexes(existingIndexes) {
    const validation = {
      hasAllRequired: true,
      missingIndexes: [],
      existingIndexes: existingIndexes || [],
      recommendations: []
    };

    for (const requiredIndex of REQUIRED_INDEXES) {
      const exists = existingIndexes.some(index => 
        JSON.stringify(index.key) === JSON.stringify(requiredIndex.spec)
      );

      if (!exists) {
        validation.hasAllRequired = false;
        validation.missingIndexes.push(requiredIndex);
      }
    }

    if (!validation.hasAllRequired) {
      validation.recommendations.push('Create missing indexes before running performance tests');
      validation.recommendations.push('Index creation may take time on large collections');
    }

    return validation;
  }

  /**
   * Validate query performance against targets
   */
  validateQueryPerformance(executionStats, targetMs = 100) {
    const validation = {
      passesTarget: false,
      executionTime: 0,
      documentsScanned: 0,
      efficiency: 0,
      recommendations: []
    };

    if (executionStats.executionStats) {
      const stats = executionStats.executionStats;
      validation.executionTime = stats.executionTimeMillis || 0;
      validation.documentsScanned = stats.totalDocsExamined || 0;
      validation.passesTarget = validation.executionTime <= targetMs;
      
      const docsReturned = stats.totalDocsReturned || 1;
      validation.efficiency = docsReturned / Math.max(validation.documentsScanned, 1);

      if (!validation.passesTarget) {
        validation.recommendations.push(`Query takes ${validation.executionTime}ms, target is ${targetMs}ms`);
      }

      if (validation.documentsScanned > 1000) {
        validation.recommendations.push(`Query scans ${validation.documentsScanned} documents, should be < 1000`);
      }

      if (validation.efficiency < 0.1) {
        validation.recommendations.push(`Low query efficiency: ${(validation.efficiency * 100).toFixed(1)}%`);
      }
    }

    return validation;
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    return {
      timestamp: new Date().toISOString(),
      requiredIndexes: REQUIRED_INDEXES,
      mongoCommands: this.analyzer.generateOptimizationScript(),
      performanceTargets: {
        teacherLessonsQuery: '< 100ms',
        weeklyScheduleQuery: '< 200ms',
        maxDocumentScan: '< 1000 documents',
        queryEfficiency: '> 10%'
      },
      validationChecklist: [
        'Verify all required indexes exist',
        'Test query execution plans with explain()',
        'Monitor document scan counts',
        'Validate response times meet targets',
        'Check index usage in query plans',
        'Monitor slow query logs'
      ]
    };
  }
}

// Export classes and constants
export { 
  MongoDBQueryAnalyzer, 
  MongoDBPerformanceValidator, 
  REQUIRED_INDEXES 
};

// Generate and log the complete optimization script
const analyzer = new MongoDBQueryAnalyzer();
const validator = new MongoDBPerformanceValidator();

console.log('📋 MongoDB Optimization Script Generated');
console.log('========================================');

const optimizationScript = analyzer.generateOptimizationScript();
const validationReport = validator.generateValidationReport();

// Export for external use
export { optimizationScript, validationReport };

// Log the script for immediate use
if (typeof window === 'undefined') {
  console.log('\n🔧 INDEX VERIFICATION COMMANDS:');
  optimizationScript.sections.indexVerification.commands.forEach(cmd => {
    console.log(`-- ${cmd.purpose}`);
    console.log(cmd.command);
    console.log('');
  });

  console.log('\n🏗️ INDEX CREATION COMMANDS:');
  optimizationScript.sections.indexCreation.commands.forEach(cmd => {
    console.log(`-- ${cmd.purpose}`);
    console.log(cmd.command);
    console.log('');
  });

  console.log('\n📊 EXECUTION PLAN COMMANDS:');
  optimizationScript.sections.executionPlanAnalysis.commands.forEach(cmd => {
    console.log(`-- ${cmd.purpose}`);
    console.log(cmd.command.replace(/TEACHER_ID_PLACEHOLDER/g, 'YOUR_TEACHER_OBJECTID'));
    console.log('');
  });
}