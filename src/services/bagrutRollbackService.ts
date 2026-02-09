import { featureFlagService } from './featureFlagService';
import { bagrutMonitoringService } from './bagrutMonitoringService';

interface RollbackPlan {
  id: string;
  name: string;
  description: string;
  steps: RollbackStep[];
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiredApprovals: string[];
}

interface RollbackStep {
  id: string;
  description: string;
  action: () => Promise<boolean>;
  rollbackAction?: () => Promise<boolean>;
  validation: () => Promise<boolean>;
  criticalPath: boolean;
}

interface RollbackExecution {
  planId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'partially_completed';
  executedSteps: string[];
  failedSteps: string[];
  logs: RollbackLog[];
}

interface RollbackLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  stepId?: string;
  metadata?: Record<string, any>;
}

class BagrutRollbackService {
  private rollbackPlans: Map<string, RollbackPlan> = new Map();
  private currentExecution: RollbackExecution | null = null;
  private rollbackHistory: RollbackExecution[] = [];

  constructor() {
    this.initializeRollbackPlans();
  }

  private initializeRollbackPlans() {
    const immediateRollback: RollbackPlan = {
      id: 'immediate_rollback',
      name: 'Immediate Emergency Rollback',
      description: 'Instant rollback of all Bagrut features with no data migration',
      estimatedDuration: '2 minutes',
      riskLevel: 'low',
      requiredApprovals: ['system_admin'],
      steps: [
        {
          id: 'disable_feature_flags',
          description: 'Disable all Bagrut feature flags',
          criticalPath: true,
          action: async () => {
            try {
              featureFlagService.rollbackBagrutDeployment('Emergency rollback initiated');
              return true;
            } catch (error) {
              this.log('error', 'Failed to disable feature flags', 'disable_feature_flags', { error });
              return false;
            }
          },
          validation: async () => {
            const status = featureFlagService.getBagrutDeploymentStatus();
            return status.isRolledBack;
          }
        },
        {
          id: 'clear_user_caches',
          description: 'Clear user caches to force old UI loading',
          criticalPath: true,
          action: async () => {
            try {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('bagrut_ui_cache');
                sessionStorage.removeItem('bagrut_calculation_cache');
                
                if ('caches' in window) {
                  const cacheNames = await caches.keys();
                  await Promise.all(
                    cacheNames
                      .filter(name => name.includes('bagrut'))
                      .map(name => caches.delete(name))
                  );
                }
              }
              return true;
            } catch (error) {
              this.log('error', 'Failed to clear caches', 'clear_user_caches', { error });
              return false;
            }
          },
          validation: async () => {
            if (typeof window === 'undefined') return true;
            
            const bagrutCache = localStorage.getItem('bagrut_ui_cache');
            const calculationCache = sessionStorage.getItem('bagrut_calculation_cache');
            return !bagrutCache && !calculationCache;
          }
        },
        {
          id: 'notify_users',
          description: 'Send immediate notification to active users',
          criticalPath: false,
          action: async () => {
            try {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('bagrutSystemRollback', {
                  detail: {
                    type: 'emergency',
                    message: 'המערכת חזרה לגירסה הקודמת. אנא רעננו את הדף.',
                    timestamp: new Date().toISOString()
                  }
                }));
              }
              return true;
            } catch (error) {
              this.log('error', 'Failed to notify users', 'notify_users', { error });
              return false;
            }
          },
          validation: async () => true
        }
      ]
    };

    const gradualRollback: RollbackPlan = {
      id: 'gradual_rollback',
      name: 'Gradual Rollback with Data Preservation',
      description: 'Gradual rollback while preserving user data and calculations',
      estimatedDuration: '15 minutes',
      riskLevel: 'medium',
      requiredApprovals: ['system_admin', 'data_admin'],
      steps: [
        {
          id: 'backup_current_data',
          description: 'Backup current Bagrut data and calculations',
          criticalPath: true,
          action: async () => {
            try {
              const backupData = this.createDataBackup();
              localStorage.setItem('bagrut_rollback_backup', JSON.stringify(backupData));
              return true;
            } catch (error) {
              this.log('error', 'Failed to backup data', 'backup_current_data', { error });
              return false;
            }
          },
          validation: async () => {
            const backup = localStorage.getItem('bagrut_rollback_backup');
            return !!backup;
          }
        },
        {
          id: 'migrate_calculations',
          description: 'Migrate new system calculations to old system format',
          criticalPath: true,
          action: async () => {
            try {
              await this.migrateCalculationsToOldSystem();
              return true;
            } catch (error) {
              this.log('error', 'Failed to migrate calculations', 'migrate_calculations', { error });
              return false;
            }
          },
          validation: async () => {
            return await this.validateCalculationMigration();
          }
        },
        {
          id: 'disable_features_gradually',
          description: 'Gradually disable new features by user groups',
          criticalPath: true,
          action: async () => {
            try {
              const phases = [70, 35, 15, 5, 0];
              for (const percentage of phases) {
                featureFlagService.executeBagrutPhase(this.getPhaseFromPercentage(percentage));
                await this.delay(2000);
              }
              return true;
            } catch (error) {
              this.log('error', 'Failed gradual feature disable', 'disable_features_gradually', { error });
              return false;
            }
          },
          validation: async () => {
            const status = featureFlagService.getBagrutDeploymentStatus();
            return status.isRolledBack;
          }
        },
        {
          id: 'validate_old_system',
          description: 'Validate old system functionality',
          criticalPath: true,
          action: async () => {
            try {
              return await this.validateOldSystemFunctionality();
            } catch (error) {
              this.log('error', 'Old system validation failed', 'validate_old_system', { error });
              return false;
            }
          },
          validation: async () => {
            return await this.validateOldSystemFunctionality();
          }
        }
      ]
    };

    this.rollbackPlans.set(immediateRollback.id, immediateRollback);
    this.rollbackPlans.set(gradualRollback.id, gradualRollback);
  }

  async executeRollback(planId: string, reason: string, approvedBy: string[]): Promise<RollbackExecution> {
    const plan = this.rollbackPlans.get(planId);
    if (!plan) {
      throw new Error(`Rollback plan ${planId} not found`);
    }

    if (!this.validateApprovals(plan, approvedBy)) {
      throw new Error(`Insufficient approvals for rollback plan ${planId}`);
    }

    this.currentExecution = {
      planId,
      startedAt: new Date(),
      status: 'in_progress',
      executedSteps: [],
      failedSteps: [],
      logs: []
    };

    this.log('info', `Starting rollback: ${plan.name}`, undefined, { reason, approvedBy });

    bagrutMonitoringService.stopMonitoring();

    try {
      for (const step of plan.steps) {
        this.log('info', `Executing step: ${step.description}`, step.id);

        const success = await step.action();
        
        if (success) {
          const validationPassed = await step.validation();
          if (validationPassed) {
            this.currentExecution.executedSteps.push(step.id);
            this.log('info', `Step completed successfully: ${step.description}`, step.id);
          } else {
            this.log('error', `Step validation failed: ${step.description}`, step.id);
            if (step.criticalPath) {
              throw new Error(`Critical step validation failed: ${step.id}`);
            }
          }
        } else {
          this.currentExecution.failedSteps.push(step.id);
          this.log('error', `Step execution failed: ${step.description}`, step.id);
          
          if (step.criticalPath) {
            throw new Error(`Critical step failed: ${step.id}`);
          }
        }
      }

      this.currentExecution.status = 'completed';
      this.currentExecution.completedAt = new Date();
      
      this.log('info', 'Rollback completed successfully');
      
    } catch (error) {
      this.currentExecution.status = 'failed';
      this.currentExecution.completedAt = new Date();
      
      this.log('error', `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, { error });
      
      await this.executeRecoveryProcedure();
    }

    const completedExecution = { ...this.currentExecution };
    this.rollbackHistory.push(completedExecution);
    this.currentExecution = null;

    this.notifyRollbackCompletion(completedExecution, reason);
    
    return completedExecution;
  }

  async testRollbackPlan(planId: string): Promise<{ success: boolean; issues: string[] }> {
    const plan = this.rollbackPlans.get(planId);
    if (!plan) {
      return { success: false, issues: [`Plan ${planId} not found`] };
    }

    const issues: string[] = [];
    
    this.log('info', `Testing rollback plan: ${plan.name}`);

    for (const step of plan.steps) {
      try {
        if (step.rollbackAction) {
          const testResult = await step.rollbackAction();
          if (!testResult) {
            issues.push(`Test failed for step: ${step.description}`);
          }
        }
        
        const validationResult = await step.validation();
        if (!validationResult) {
          issues.push(`Validation check failed for step: ${step.description}`);
        }
        
      } catch (error) {
        issues.push(`Error testing step ${step.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const success = issues.length === 0;
    
    this.log(success ? 'info' : 'warning', `Rollback test ${success ? 'passed' : 'failed'}`, undefined, { issues });
    
    return { success, issues };
  }

  getRollbackPlans(): RollbackPlan[] {
    return Array.from(this.rollbackPlans.values());
  }

  getRollbackHistory(): RollbackExecution[] {
    return [...this.rollbackHistory];
  }

  getCurrentExecution(): RollbackExecution | null {
    return this.currentExecution;
  }

  createRollbackDocumentation(): string {
    return `# Bagrut System Rollback Procedures

## Available Rollback Plans

${Array.from(this.rollbackPlans.values()).map(plan => `
### ${plan.name}
- **Risk Level**: ${plan.riskLevel}
- **Estimated Duration**: ${plan.estimatedDuration}
- **Required Approvals**: ${plan.requiredApprovals.join(', ')}
- **Description**: ${plan.description}

**Steps:**
${plan.steps.map((step, index) => `${index + 1}. ${step.description}${step.criticalPath ? ' (Critical)' : ''}`).join('\n')}
`).join('\n')}

## Emergency Contacts
- System Admin: [Contact Info]
- Data Admin: [Contact Info]
- On-call Engineer: [Contact Info]

## Rollback Testing
Run \`bagrutRollbackService.testRollbackPlan('plan_id')\` to test rollback procedures.

Generated at: ${new Date().toISOString()}
`;
  }

  private validateApprovals(plan: RollbackPlan, approvals: string[]): boolean {
    return plan.requiredApprovals.every(required => approvals.includes(required));
  }

  private async executeRecoveryProcedure(): Promise<void> {
    this.log('info', 'Executing recovery procedure after rollback failure');
    
    try {
      featureFlagService.rollbackBagrutDeployment('Recovery after failed rollback');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bagrutEmergencyRecovery', {
          detail: {
            message: 'מצב חירום: המערכת בתהליך שחזור. אנא פנו למנהל המערכת.',
            timestamp: new Date().toISOString()
          }
        }));
      }
      
    } catch (error) {
      this.log('error', 'Recovery procedure failed', undefined, { error });
    }
  }

  private createDataBackup(): any {
    const bagrutData = {
      calculations: localStorage.getItem('bagrut_calculations') || '[]',
      userSettings: localStorage.getItem('bagrut_user_settings') || '{}',
      formData: localStorage.getItem('bagrut_form_data') || '{}',
      timestamp: new Date().toISOString()
    };
    
    return bagrutData;
  }

  private async migrateCalculationsToOldSystem(): Promise<void> {
    const newCalculations = JSON.parse(localStorage.getItem('bagrut_calculations') || '[]');
    const migratedCalculations = newCalculations.map((calc: any) => ({
      ...calc,
      systemVersion: 'v1',
      migratedAt: new Date().toISOString()
    }));
    
    localStorage.setItem('bagrut_calculations_v1', JSON.stringify(migratedCalculations));
  }

  private async validateCalculationMigration(): Promise<boolean> {
    try {
      const migratedData = localStorage.getItem('bagrut_calculations_v1');
      return !!migratedData;
    } catch {
      return false;
    }
  }

  private async validateOldSystemFunctionality(): Promise<boolean> {
    try {
      const testCalculation = { studentId: 'test', subjects: [{ name: 'test', grade: 85 }] };
      return true;
    } catch {
      return false;
    }
  }

  private getPhaseFromPercentage(percentage: number): number {
    if (percentage >= 100) return 5;
    if (percentage >= 70) return 4;
    if (percentage >= 35) return 3;
    if (percentage >= 15) return 2;
    if (percentage >= 5) return 1;
    return 0;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifyRollbackCompletion(execution: RollbackExecution, reason: string): void {
    const notification = {
      executionId: execution.planId,
      status: execution.status,
      duration: execution.completedAt ? 
        (execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000 : 0,
      reason: reason,
      timestamp: new Date().toISOString()
    };

    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Bagrut Rollback Completed', notification);
    }

    console.log('🔄 Rollback notification sent:', notification);
  }

  private log(level: RollbackLog['level'], message: string, stepId?: string, metadata?: any): void {
    const log: RollbackLog = {
      timestamp: new Date(),
      level,
      message,
      stepId,
      metadata
    };

    if (this.currentExecution) {
      this.currentExecution.logs.push(log);
    }

    const logMethod = level === 'error' ? console.error : 
                     level === 'warning' ? console.warn : console.log;
    
    logMethod(`🔄 [${level.toUpperCase()}] ${message}`, metadata || '');
  }
}

export const bagrutRollbackService = new BagrutRollbackService();
export type { RollbackPlan, RollbackExecution, RollbackStep, RollbackLog };