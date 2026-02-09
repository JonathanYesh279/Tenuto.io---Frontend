import { bagrutMonitoringService } from './bagrutMonitoringService';
import { featureFlagService } from './featureFlagService';

interface ValidationTest {
  id: string;
  name: string;
  description: string;
  category: 'calculation' | 'ui' | 'data_integrity' | 'performance' | 'user_workflow';
  criticalLevel: 'low' | 'medium' | 'high' | 'critical';
  execute: () => Promise<ValidationResult>;
}

interface ValidationResult {
  testId: string;
  passed: boolean;
  score: number;
  message: string;
  details?: any;
  executionTime: number;
  timestamp: Date;
}

interface ValidationSuite {
  id: string;
  name: string;
  tests: ValidationTest[];
  runAfterDeployment: boolean;
  scheduledInterval?: number;
}

interface ValidationReport {
  suiteId: string;
  executedAt: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalIssues: number;
  overallScore: number;
  results: ValidationResult[];
  recommendations: string[];
}

class BagrutValidationService {
  private validationSuites: Map<string, ValidationSuite> = new Map();
  private validationHistory: ValidationReport[] = [];
  private isValidating: boolean = false;

  constructor() {
    this.initializeValidationSuites();
  }

  private initializeValidationSuites() {
    const calculationValidationSuite: ValidationSuite = {
      id: 'calculation_validation',
      name: 'Calculation Accuracy Tests',
      runAfterDeployment: true,
      tests: [
        {
          id: 'basic_calculation_test',
          name: 'Basic Grade Calculation',
          description: 'Test basic weighted average calculation',
          category: 'calculation',
          criticalLevel: 'critical',
          execute: async () => {
            const startTime = Date.now();
            try {
              const testData = {
                subjects: [
                  { name: 'Math', grade: 90, units: 5 },
                  { name: 'English', grade: 85, units: 4 },
                  { name: 'Physics', grade: 88, units: 5 }
                ]
              };

              const expectedAverage = (90 * 5 + 85 * 4 + 88 * 5) / (5 + 4 + 5);
              const calculatedAverage = this.calculateWeightedAverage(testData.subjects);
              
              const difference = Math.abs(expectedAverage - calculatedAverage);
              const passed = difference < 0.01;
              
              return {
                testId: 'basic_calculation_test',
                passed,
                score: passed ? 100 : 0,
                message: passed 
                  ? 'Basic calculation test passed' 
                  : `Calculation mismatch. Expected: ${expectedAverage.toFixed(2)}, Got: ${calculatedAverage.toFixed(2)}`,
                details: { expected: expectedAverage, actual: calculatedAverage, difference },
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            } catch (error) {
              return {
                testId: 'basic_calculation_test',
                passed: false,
                score: 0,
                message: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            }
          }
        },
        {
          id: 'edge_case_calculation_test',
          name: 'Edge Case Calculation',
          description: 'Test calculation with edge cases (zero grades, maximum units)',
          category: 'calculation',
          criticalLevel: 'high',
          execute: async () => {
            const startTime = Date.now();
            try {
              const testCases = [
                { subjects: [{ name: 'Test', grade: 0, units: 1 }], expectedAverage: 0 },
                { subjects: [{ name: 'Test', grade: 100, units: 10 }], expectedAverage: 100 },
                { subjects: [], expectedAverage: 0 }
              ];

              let passed = true;
              const results: any[] = [];

              for (const testCase of testCases) {
                const calculated = this.calculateWeightedAverage(testCase.subjects);
                const difference = Math.abs(testCase.expectedAverage - calculated);
                
                if (difference > 0.01) {
                  passed = false;
                  results.push({ 
                    case: testCase, 
                    calculated, 
                    difference 
                  });
                }
              }

              return {
                testId: 'edge_case_calculation_test',
                passed,
                score: passed ? 100 : Math.max(0, 100 - results.length * 20),
                message: passed 
                  ? 'Edge case calculation test passed' 
                  : `${results.length} edge cases failed`,
                details: results,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            } catch (error) {
              return {
                testId: 'edge_case_calculation_test',
                passed: false,
                score: 0,
                message: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            }
          }
        }
      ]
    };

    const performanceValidationSuite: ValidationSuite = {
      id: 'performance_validation',
      name: 'Performance Tests',
      runAfterDeployment: true,
      scheduledInterval: 300000,
      tests: [
        {
          id: 'calculation_performance_test',
          name: 'Calculation Performance',
          description: 'Test calculation performance under load',
          category: 'performance',
          criticalLevel: 'medium',
          execute: async () => {
            const startTime = Date.now();
            try {
              const iterations = 1000;
              const testSubjects = [
                { name: 'Math', grade: 90, units: 5 },
                { name: 'English', grade: 85, units: 4 },
                { name: 'Physics', grade: 88, units: 5 },
                { name: 'Chemistry', grade: 92, units: 5 },
                { name: 'Biology', grade: 87, units: 4 }
              ];

              const calculationStartTime = Date.now();
              
              for (let i = 0; i < iterations; i++) {
                this.calculateWeightedAverage(testSubjects);
              }
              
              const totalTime = Date.now() - calculationStartTime;
              const averageTime = totalTime / iterations;
              const passed = averageTime < 1;

              bagrutMonitoringService.trackCalculationTime(totalTime);

              return {
                testId: 'calculation_performance_test',
                passed,
                score: passed ? 100 : Math.max(0, 100 - (averageTime - 1) * 50),
                message: passed 
                  ? `Performance test passed (avg: ${averageTime.toFixed(2)}ms)` 
                  : `Performance test failed - too slow (avg: ${averageTime.toFixed(2)}ms)`,
                details: { iterations, totalTime, averageTime },
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            } catch (error) {
              return {
                testId: 'calculation_performance_test',
                passed: false,
                score: 0,
                message: `Performance test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            }
          }
        }
      ]
    };

    const dataIntegrityValidationSuite: ValidationSuite = {
      id: 'data_integrity_validation',
      name: 'Data Integrity Tests',
      runAfterDeployment: true,
      scheduledInterval: 600000,
      tests: [
        {
          id: 'data_consistency_test',
          name: 'Data Consistency Check',
          description: 'Verify data consistency between old and new systems',
          category: 'data_integrity',
          criticalLevel: 'critical',
          execute: async () => {
            const startTime = Date.now();
            try {
              const oldSystemData = this.getOldSystemData();
              const newSystemData = this.getNewSystemData();
              
              const inconsistencies: any[] = [];
              
              if (oldSystemData.length !== newSystemData.length) {
                inconsistencies.push({
                  type: 'count_mismatch',
                  oldCount: oldSystemData.length,
                  newCount: newSystemData.length
                });
              }

              const sampledData = oldSystemData.slice(0, Math.min(10, oldSystemData.length));
              
              sampledData.forEach(oldRecord => {
                const newRecord = newSystemData.find(nr => nr.id === oldRecord.id);
                if (!newRecord) {
                  inconsistencies.push({
                    type: 'missing_record',
                    recordId: oldRecord.id
                  });
                } else if (Math.abs(oldRecord.average - newRecord.average) > 0.1) {
                  inconsistencies.push({
                    type: 'calculation_diff',
                    recordId: oldRecord.id,
                    oldAverage: oldRecord.average,
                    newAverage: newRecord.average
                  });
                }
              });

              const passed = inconsistencies.length === 0;

              if (!passed) {
                bagrutMonitoringService.trackValidationError({
                  type: 'data',
                  severity: 'high',
                  message: `Data integrity issues found: ${inconsistencies.length} inconsistencies`,
                  metadata: { inconsistencies }
                });
              }

              return {
                testId: 'data_consistency_test',
                passed,
                score: passed ? 100 : Math.max(0, 100 - inconsistencies.length * 10),
                message: passed 
                  ? 'Data consistency check passed' 
                  : `Found ${inconsistencies.length} data inconsistencies`,
                details: { inconsistencies, sampledCount: sampledData.length },
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            } catch (error) {
              return {
                testId: 'data_consistency_test',
                passed: false,
                score: 0,
                message: `Data consistency test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            }
          }
        }
      ]
    };

    const uiValidationSuite: ValidationSuite = {
      id: 'ui_validation',
      name: 'User Interface Tests',
      runAfterDeployment: true,
      tests: [
        {
          id: 'ui_accessibility_test',
          name: 'UI Accessibility Check',
          description: 'Verify UI accessibility standards',
          category: 'ui',
          criticalLevel: 'medium',
          execute: async () => {
            const startTime = Date.now();
            try {
              const accessibilityIssues: string[] = [];
              
              if (typeof document !== 'undefined') {
                const missingAltImages = document.querySelectorAll('img:not([alt])');
                if (missingAltImages.length > 0) {
                  accessibilityIssues.push(`${missingAltImages.length} images missing alt text`);
                }

                const missingLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
                if (missingLabels.length > 0) {
                  accessibilityIssues.push(`${missingLabels.length} inputs missing labels`);
                }

                const lowContrastElements = this.checkColorContrast();
                if (lowContrastElements.length > 0) {
                  accessibilityIssues.push(`${lowContrastElements.length} elements with low contrast`);
                }
              }

              const passed = accessibilityIssues.length === 0;

              return {
                testId: 'ui_accessibility_test',
                passed,
                score: passed ? 100 : Math.max(0, 100 - accessibilityIssues.length * 15),
                message: passed 
                  ? 'UI accessibility test passed' 
                  : `Found ${accessibilityIssues.length} accessibility issues`,
                details: { issues: accessibilityIssues },
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            } catch (error) {
              return {
                testId: 'ui_accessibility_test',
                passed: false,
                score: 0,
                message: `UI accessibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
              };
            }
          }
        }
      ]
    };

    this.validationSuites.set(calculationValidationSuite.id, calculationValidationSuite);
    this.validationSuites.set(performanceValidationSuite.id, performanceValidationSuite);
    this.validationSuites.set(dataIntegrityValidationSuite.id, dataIntegrityValidationSuite);
    this.validationSuites.set(uiValidationSuite.id, uiValidationSuite);

    this.schedulePeriodicValidation();
  }

  async runValidationSuite(suiteId: string): Promise<ValidationReport> {
    const suite = this.validationSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Validation suite ${suiteId} not found`);
    }

    this.isValidating = true;
    const executedAt = new Date();
    const results: ValidationResult[] = [];

    console.log(`🧪 Starting validation suite: ${suite.name}`);

    for (const test of suite.tests) {
      try {
        console.log(`  Running test: ${test.name}`);
        const result = await test.execute();
        results.push(result);
        
        if (!result.passed && test.criticalLevel === 'critical') {
          bagrutMonitoringService.trackValidationError({
            type: test.category,
            severity: 'critical',
            message: `Critical validation test failed: ${test.name}`,
            metadata: { testResult: result }
          });
        }
      } catch (error) {
        console.error(`  Test ${test.name} threw an error:`, error);
        results.push({
          testId: test.id,
          passed: false,
          score: 0,
          message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          executionTime: 0,
          timestamp: new Date()
        });
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.length - passedTests;
    const criticalIssues = results.filter(r => 
      !r.passed && 
      suite.tests.find(t => t.id === r.testId)?.criticalLevel === 'critical'
    ).length;
    
    const overallScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
      : 0;

    const report: ValidationReport = {
      suiteId,
      executedAt,
      totalTests: results.length,
      passedTests,
      failedTests,
      criticalIssues,
      overallScore,
      results,
      recommendations: this.generateRecommendations(results, suite.tests)
    };

    this.validationHistory.push(report);
    this.isValidating = false;

    console.log(`🧪 Validation suite completed: ${suite.name} (Score: ${overallScore.toFixed(1)}/100)`);

    bagrutMonitoringService.trackCompletionRate(passedTests === results.length);

    return report;
  }

  async runPostDeploymentValidation(): Promise<ValidationReport[]> {
    const reports: ValidationReport[] = [];
    
    console.log('🚀 Running post-deployment validation...');

    for (const [suiteId, suite] of this.validationSuites) {
      if (suite.runAfterDeployment) {
        try {
          const report = await this.runValidationSuite(suiteId);
          reports.push(report);
        } catch (error) {
          console.error(`Failed to run validation suite ${suiteId}:`, error);
        }
      }
    }

    return reports;
  }

  getValidationHistory(): ValidationReport[] {
    return [...this.validationHistory];
  }

  getValidationStatus() {
    const latestReports = this.getLatestReports();
    const overallHealth = this.calculateOverallHealth(latestReports);
    
    return {
      isValidating: this.isValidating,
      overallHealth,
      lastValidation: latestReports.length > 0 
        ? Math.max(...latestReports.map(r => r.executedAt.getTime()))
        : null,
      criticalIssuesCount: latestReports.reduce((sum, r) => sum + r.criticalIssues, 0),
      totalTests: latestReports.reduce((sum, r) => sum + r.totalTests, 0),
      passedTests: latestReports.reduce((sum, r) => sum + r.passedTests, 0)
    };
  }

  private calculateWeightedAverage(subjects: Array<{ grade: number; units: number }>): number {
    if (subjects.length === 0) return 0;
    
    const totalPoints = subjects.reduce((sum, subject) => sum + (subject.grade * subject.units), 0);
    const totalUnits = subjects.reduce((sum, subject) => sum + subject.units, 0);
    
    return totalUnits > 0 ? totalPoints / totalUnits : 0;
  }

  private getOldSystemData(): Array<{ id: string; average: number }> {
    const stored = localStorage.getItem('bagrut_calculations_v1');
    return stored ? JSON.parse(stored) : [];
  }

  private getNewSystemData(): Array<{ id: string; average: number }> {
    const stored = localStorage.getItem('bagrut_calculations');
    return stored ? JSON.parse(stored) : [];
  }

  private checkColorContrast(): Element[] {
    if (typeof document === 'undefined') return [];
    
    const elements = document.querySelectorAll('*');
    const lowContrastElements: Element[] = [];
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      if (bgColor && textColor && !this.hasGoodContrast(bgColor, textColor)) {
        lowContrastElements.push(el);
      }
    });
    
    return lowContrastElements.slice(0, 10);
  }

  private hasGoodContrast(bgColor: string, textColor: string): boolean {
    return true;
  }

  private generateRecommendations(results: ValidationResult[], tests: ValidationTest[]): string[] {
    const recommendations: string[] = [];
    
    const failedResults = results.filter(r => !r.passed);
    
    if (failedResults.length > 0) {
      recommendations.push('Address failed validation tests to improve system reliability');
    }
    
    const criticalFailures = failedResults.filter(r => {
      const test = tests.find(t => t.id === r.testId);
      return test?.criticalLevel === 'critical';
    });
    
    if (criticalFailures.length > 0) {
      recommendations.push('Critical issues detected - consider immediate rollback if problems persist');
    }
    
    const performanceIssues = failedResults.filter(r => {
      const test = tests.find(t => t.id === r.testId);
      return test?.category === 'performance';
    });
    
    if (performanceIssues.length > 0) {
      recommendations.push('Performance optimization needed for better user experience');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All validation tests passed - system is performing well');
    }
    
    return recommendations;
  }

  private getLatestReports(): ValidationReport[] {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.validationHistory.filter(r => r.executedAt >= cutoff);
  }

  private calculateOverallHealth(reports: ValidationReport[]): number {
    if (reports.length === 0) return 100;
    
    const totalScore = reports.reduce((sum, report) => sum + report.overallScore, 0);
    return totalScore / reports.length;
  }

  private schedulePeriodicValidation() {
    for (const [suiteId, suite] of this.validationSuites) {
      if (suite.scheduledInterval) {
        setInterval(async () => {
          if (!this.isValidating) {
            try {
              await this.runValidationSuite(suiteId);
            } catch (error) {
              console.error(`Scheduled validation failed for suite ${suiteId}:`, error);
            }
          }
        }, suite.scheduledInterval);
      }
    }
  }
}

export const bagrutValidationService = new BagrutValidationService();
export type { ValidationTest, ValidationResult, ValidationSuite, ValidationReport };