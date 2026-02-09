# Teacher Lesson Performance Testing Suite

## Overview

This performance testing suite validates the performance of teacher lesson queries that now search student records instead of teacher collections. The architecture change moves from direct teacher collection queries to aggregating `teacherAssignments` within student documents.

## Quick Start

### Prerequisites
- Node.js 16+ 
- Access to backend API (localhost:3001)
- Valid authentication credentials
- MongoDB access for index creation

### Running Tests

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Start backend API server
# Make sure your backend is running on localhost:3001

# 3. Run performance tests
cd src/performance
node run-performance-tests.js

# 4. Review results in console and generated reports
```

### Authentication Setup

```javascript
// Option 1: Use existing token
import apiService from '../services/apiService.js';
// Token should already be stored from previous login

// Option 2: Login programmatically  
await apiService.auth.login('your-email@example.com', 'your-password');

// Option 3: Set token manually
apiService.client.setToken('your-jwt-token');
```

## Test Suite Components

### 1. Teacher Performance Test (`teacher-performance-test.js`)
- **Purpose**: Core performance testing for teacher lesson queries
- **Tests**: GET /teachers/:id/lessons, GET /teachers/:id/weekly-schedule, page load simulation
- **Metrics**: Response times, success rates, document scan counts
- **Output**: Detailed performance statistics and recommendations

### 2. MongoDB Optimization (`mongodb-optimization.js`)
- **Purpose**: Database index verification and query analysis
- **Features**: Index creation commands, execution plan analysis, performance validation
- **Output**: MongoDB commands for optimization and monitoring setup

### 3. Test Runner (`run-performance-tests.js`)  
- **Purpose**: Orchestrates complete performance testing pipeline
- **Features**: Environment setup, test execution, report generation
- **Output**: Comprehensive performance analysis report

### 4. Performance Report (`PERFORMANCE_REPORT.md`)
- **Purpose**: Detailed analysis and optimization recommendations
- **Content**: Executive summary, database optimizations, implementation timeline

## Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|---------|------------|----------|
| Teacher lesson queries | < 100ms | < 200ms | > 500ms |
| Weekly schedule queries | < 200ms | < 400ms | > 1000ms |
| Teacher page load | < 2000ms | < 3000ms | > 5000ms |
| Weekly schedule page | < 1000ms | < 2000ms | > 3000ms |
| Document scan ratio | < 10:1 | < 20:1 | > 50:1 |

## Database Requirements

### Critical Indexes (Must Create First)

```mongodb
// Connect to MongoDB and run these commands:
use your_database_name

// 1. Primary teacher assignment index
db.students.createIndex({ "teacherAssignments.teacherId": 1 })

// 2. Compound index for active assignments
db.students.createIndex({ 
  "teacherAssignments.teacherId": 1, 
  "teacherAssignments.isActive": 1 
})

// 3. Day-specific queries
db.students.createIndex({ 
  "teacherAssignments.teacherId": 1, 
  "teacherAssignments.day": 1 
})

// 4. Time-sorted queries for schedules
db.students.createIndex({ 
  "teacherAssignments.teacherId": 1, 
  "teacherAssignments.day": 1,
  "teacherAssignments.time": 1
})
```

### Query Performance Monitoring

```mongodb
// Enable slow query profiling
db.setProfilingLevel(1, { slowms: 100 })

// Check slow queries
db.system.profile.find().limit(10).sort({ ts: -1 }).pretty()

// Analyze specific query
db.students.explain("executionStats").aggregate([
  { $match: { "teacherAssignments.teacherId": ObjectId("teacher_id") }}
])
```

## Test Data Requirements

### Minimum Test Environment
- **Students**: 100+ with teacher assignments
- **Teachers**: 10+ active teachers
- **Assignments**: Multiple lessons per student
- **Data Quality**: Complete personalInfo and teacherAssignments

### Recommended Test Environment  
- **Students**: 500+ for scalability testing
- **Teachers**: 25+ for load distribution
- **Assignments**: 1000+ active assignments
- **Variety**: Different days, times, durations

### Test Data Generation

The test suite includes automatic test data generation:

```javascript
import { PerformanceDataGenerator } from './teacher-performance-test.js';

const generator = new PerformanceDataGenerator();

// Generate test students with teacher assignments
const students = generator.generateStudents(100, teacherIds);

// Generate test teachers
const teachers = generator.generateTeachers(10);
```

## API Endpoints Tested

### Teacher Lesson Endpoints
```javascript
// 1. Get all lessons for a teacher
GET /api/teacher/:teacherId/lessons
// Query: students collection with teacherAssignments filter

// 2. Get weekly schedule for a teacher  
GET /api/teacher/:teacherId/weekly-schedule
// Query: aggregated lessons grouped by day

// 3. Get teacher details
GET /api/teacher/:teacherId
// Query: teacher collection (baseline)

// 4. Get day-specific schedule
GET /api/teacher/:teacherId/day-schedule/:day
// Query: filtered by specific day
```

### Query Performance Analysis
```javascript
// Each endpoint is tested for:
- Response time (target < 100ms for lessons, < 200ms for schedule)
- Success rate (target 100%)
- Document scan efficiency 
- Memory usage patterns
- Concurrent request handling
```

## Running Individual Tests

### Test Specific Endpoints

```javascript
import { TeacherPerformanceTester } from './teacher-performance-test.js';

const tester = new TeacherPerformanceTester();
await tester.setupTestEnvironment();

// Test individual endpoints
const lessonResults = await tester.testTeacherLessonsPerformance();
const scheduleResults = await tester.testWeeklySchedulePerformance();
const pageResults = await tester.testPageLoadPerformance();
```

### Validate Database Indexes

```javascript
import { MongoDBPerformanceValidator } from './mongodb-optimization.js';

const validator = new MongoDBPerformanceValidator();
const validation = validator.generateValidationReport();
console.log(validation);
```

### Generate MongoDB Commands

```javascript
import { MongoDBQueryAnalyzer } from './mongodb-optimization.js';

const analyzer = new MongoDBQueryAnalyzer();
const script = analyzer.generateOptimizationScript();

// Get index creation commands
console.log(script.sections.indexCreation.commands);

// Get execution plan commands  
console.log(script.sections.executionPlanAnalysis.commands);
```

## Interpreting Results

### Successful Test Output
```
📊 PERFORMANCE TEST SUMMARY
============================
Teacher Lessons: ✅ PASS (85.2ms avg)
Weekly Schedule: ✅ PASS (142.8ms avg)
Page Load: ✅ PASS (1847ms avg)

Environment: 150 students, 12 teachers
Active assignments: 342
Success rate: 100.0%
```

### Warning Signs
```
⚠️ Slow query: 250.5ms for teacher 507f1f77bcf86cd799439011
⚠️ Query scans 1500 documents, should be < 1000
⚠️ Low query efficiency: 5.2%
```

### Critical Issues
```
❌ Teacher lessons: FAIL (450.2ms avg, target: 100ms)
❌ No indexes found for teacherAssignments queries
❌ Page load timeout: 8500ms > 5000ms critical threshold
```

## Optimization Workflow

### 1. Initial Assessment
```bash
# Run baseline tests
node run-performance-tests.js

# Check current performance against targets
# Identify critical performance bottlenecks
```

### 2. Database Optimization
```bash
# Create required indexes
mongo your_database < mongodb-optimization-script.js

# Verify index creation
db.students.getIndexes()

# Test query execution plans
db.students.explain("executionStats").aggregate([...])
```

### 3. Performance Validation
```bash
# Re-run tests after optimization
node run-performance-tests.js

# Compare before/after metrics
# Verify all targets are met
```

### 4. Continuous Monitoring
```bash
# Set up performance monitoring
db.setProfilingLevel(1, { slowms: 100 })

# Schedule regular performance tests
# Weekly: Full performance test suite
# Monthly: Scalability testing with increased load
```

## Troubleshooting

### Common Issues

#### Authentication Errors
```javascript
// Error: No valid authentication token
// Solution: Login before running tests
await apiService.auth.login('email', 'password');
```

#### Database Connection Issues  
```javascript
// Error: Failed to connect to MongoDB
// Solution: Verify MongoDB is running and accessible
// Check connection string and credentials
```

#### Slow Query Performance
```javascript
// Error: Queries taking > 1000ms
// Solution: Create required database indexes
// Check MongoDB slow query logs
```

#### Insufficient Test Data
```javascript
// Error: Not enough students/teachers for testing
// Solution: Run data generation or create test data
const generator = new PerformanceDataGenerator();
await generator.createTestData();
```

### Performance Debugging

#### Enable Verbose Logging
```javascript
// Set debug mode for detailed output
process.env.DEBUG_PERFORMANCE = 'true';

// Enable MongoDB query logging
db.setLogLevel(2, "query");
```

#### Monitor Resource Usage
```bash
# Check MongoDB performance
mongostat
mongotop

# Monitor system resources
top -p `pgrep mongod`
```

#### Analyze Query Execution
```mongodb
// Get detailed execution statistics
db.students.explain("allPlansExecution").aggregate([...])

// Check index usage statistics  
db.students.aggregate([{ $indexStats: {} }])
```

## Integration with CI/CD

### Automated Performance Testing

```yaml
# .github/workflows/performance-tests.yml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Start MongoDB
        uses: supercharge/mongodb-github-action@1.7.0
      - name: Install dependencies
        run: npm install
      - name: Run performance tests
        run: |
          cd src/performance
          node run-performance-tests.js
      - name: Upload performance report
        uses: actions/upload-artifact@v2
        with:
          name: performance-report
          path: src/performance/PERFORMANCE_REPORT.md
```

### Performance Regression Detection

```javascript
// Store baseline metrics
const baselineMetrics = {
  teacherLessonsAvg: 85.2,
  weeklyScheduleAvg: 142.8,
  pageLoadAvg: 1847
};

// Compare against baseline (fail if > 20% regression)
const regressionThreshold = 1.2;
if (currentMetrics.teacherLessonsAvg > baselineMetrics.teacherLessonsAvg * regressionThreshold) {
  throw new Error('Performance regression detected in teacher lessons');
}
```

## Best Practices

### Test Environment Management
- Use consistent test data across runs
- Reset database state between major test cycles  
- Monitor test environment resource usage
- Separate performance testing from production data

### Performance Testing Strategy
- Run tests during off-peak hours for consistent results
- Test with realistic data volumes and patterns
- Include both synthetic and production-like workloads
- Validate performance under various load conditions

### Continuous Improvement
- Establish performance baselines and track trends
- Set up automated alerts for performance regressions
- Regular review and updating of performance targets
- Document all optimizations and their impact

---

**Last Updated**: `new Date().toISOString()`  
**Version**: 1.0  
**Contact**: Performance Engineering Team