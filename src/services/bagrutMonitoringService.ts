interface BagrutMetrics {
  usageStats: {
    newSystemUsage: number;
    oldSystemUsage: number;
    totalCalculations: number;
    errorRate: number;
    completionRate: number;
  };
  performanceStats: {
    averageCalculationTime: number;
    peakLoadTime: number;
    systemResponseTime: number;
  };
  userFeedback: {
    averageRating: number;
    totalFeedback: number;
    issuesReported: number;
  };
  validationErrors: ValidationError[];
}

interface ValidationError {
  id: string;
  type: 'calculation' | 'ui' | 'data' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  userId?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
}

class BagrutMonitoringService {
  private metrics: BagrutMetrics = {
    usageStats: {
      newSystemUsage: 0,
      oldSystemUsage: 0,
      totalCalculations: 0,
      errorRate: 0,
      completionRate: 0
    },
    performanceStats: {
      averageCalculationTime: 0,
      peakLoadTime: 0,
      systemResponseTime: 0
    },
    userFeedback: {
      averageRating: 0,
      totalFeedback: 0,
      issuesReported: 0
    },
    validationErrors: []
  };

  private alertRules: AlertRule[] = [
    {
      id: 'error_rate_high',
      name: 'High Error Rate',
      condition: 'errorRate > threshold',
      threshold: 5,
      severity: 'critical',
      enabled: true,
      notificationChannels: ['email', 'slack']
    },
    {
      id: 'calculation_time_slow',
      name: 'Slow Calculation Performance',
      condition: 'averageCalculationTime > threshold',
      threshold: 3000,
      severity: 'high',
      enabled: true,
      notificationChannels: ['slack']
    },
    {
      id: 'completion_rate_low',
      name: 'Low Completion Rate',
      condition: 'completionRate < threshold',
      threshold: 80,
      severity: 'medium',
      enabled: true,
      notificationChannels: ['email']
    },
    {
      id: 'user_rating_low',
      name: 'Low User Satisfaction',
      condition: 'averageRating < threshold',
      threshold: 3.5,
      severity: 'medium',
      enabled: true,
      notificationChannels: ['email']
    }
  ];

  private isMonitoring: boolean = false;
  private monitoringInterval: number | null = null;

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.evaluateAlerts();
      this.updateDashboard();
    }, 30000); // Every 30 seconds
    
    console.log('🔍 Bagrut monitoring started');
    this.logEvent('monitoring_started', {});
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('🔍 Bagrut monitoring stopped');
    this.logEvent('monitoring_stopped', {});
  }

  trackNewSystemUsage() {
    this.metrics.usageStats.newSystemUsage++;
    this.metrics.usageStats.totalCalculations++;
    this.logEvent('new_system_usage', { timestamp: new Date().toISOString() });
  }

  trackOldSystemUsage() {
    this.metrics.usageStats.oldSystemUsage++;
    this.metrics.usageStats.totalCalculations++;
    this.logEvent('old_system_usage', { timestamp: new Date().toISOString() });
  }

  trackCalculationTime(timeMs: number) {
    const currentAvg = this.metrics.performanceStats.averageCalculationTime;
    const totalCalculations = this.metrics.usageStats.totalCalculations;
    
    this.metrics.performanceStats.averageCalculationTime = 
      (currentAvg * (totalCalculations - 1) + timeMs) / totalCalculations;
    
    if (timeMs > this.metrics.performanceStats.peakLoadTime) {
      this.metrics.performanceStats.peakLoadTime = timeMs;
    }
    
    this.logEvent('calculation_performance', { timeMs, averageTime: currentAvg });
  }

  trackValidationError(error: Omit<ValidationError, 'id' | 'timestamp'>) {
    const validationError: ValidationError = {
      ...error,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    this.metrics.validationErrors.push(validationError);
    this.updateErrorRate();
    
    if (error.severity === 'critical' || error.severity === 'high') {
      this.triggerImmediateAlert(validationError);
    }
    
    this.logEvent('validation_error', validationError);
  }

  trackUserFeedback(rating: number, feedback?: string) {
    const currentTotal = this.metrics.userFeedback.totalFeedback;
    const currentAvg = this.metrics.userFeedback.averageRating;
    
    this.metrics.userFeedback.totalFeedback++;
    this.metrics.userFeedback.averageRating = 
      (currentAvg * currentTotal + rating) / (currentTotal + 1);
    
    if (feedback?.toLowerCase().includes('issue') || feedback?.toLowerCase().includes('problem')) {
      this.metrics.userFeedback.issuesReported++;
    }
    
    this.logEvent('user_feedback', { rating, feedback, newAverage: this.metrics.userFeedback.averageRating });
  }

  trackCompletionRate(completed: boolean) {
    const currentRate = this.metrics.usageStats.completionRate;
    const totalCalculations = this.metrics.usageStats.totalCalculations;
    
    const completions = Math.round(currentRate * (totalCalculations - 1) / 100);
    const newCompletions = completed ? completions + 1 : completions;
    
    this.metrics.usageStats.completionRate = 
      (newCompletions / totalCalculations) * 100;
    
    this.logEvent('completion_tracked', { completed, newRate: this.metrics.usageStats.completionRate });
  }

  getMetrics(): BagrutMetrics {
    return { ...this.metrics };
  }

  getRecentErrors(hours: number = 24): ValidationError[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.validationErrors.filter(error => error.timestamp >= cutoff);
  }

  getUsageComparison() {
    const total = this.metrics.usageStats.totalCalculations;
    if (total === 0) return { newSystemPercentage: 0, oldSystemPercentage: 0 };
    
    return {
      newSystemPercentage: Math.round((this.metrics.usageStats.newSystemUsage / total) * 100),
      oldSystemPercentage: Math.round((this.metrics.usageStats.oldSystemUsage / total) * 100)
    };
  }

  getDashboardData() {
    const usage = this.getUsageComparison();
    const recentErrors = this.getRecentErrors();
    
    return {
      summary: {
        totalCalculations: this.metrics.usageStats.totalCalculations,
        errorRate: this.metrics.usageStats.errorRate,
        completionRate: this.metrics.usageStats.completionRate,
        averageRating: this.metrics.userFeedback.averageRating,
        systemMigrationProgress: usage.newSystemPercentage
      },
      performance: {
        averageCalculationTime: this.metrics.performanceStats.averageCalculationTime,
        peakLoadTime: this.metrics.performanceStats.peakLoadTime,
        systemResponseTime: this.metrics.performanceStats.systemResponseTime
      },
      usage: usage,
      recentErrors: recentErrors.slice(0, 10),
      alerts: this.getActiveAlerts()
    };
  }

  exportMetrics() {
    return {
      metrics: this.metrics,
      exportedAt: new Date().toISOString(),
      monitoringStatus: this.isMonitoring,
      alertRules: this.alertRules
    };
  }

  private collectMetrics() {
    this.updateSystemResponseTime();
    this.cleanupOldErrors();
  }

  private updateErrorRate() {
    const recentErrors = this.getRecentErrors(1);
    const totalCalculations = this.metrics.usageStats.totalCalculations;
    
    this.metrics.usageStats.errorRate = totalCalculations > 0 
      ? (recentErrors.length / totalCalculations) * 100 
      : 0;
  }

  private updateSystemResponseTime() {
    const start = Date.now();
    
    setTimeout(() => {
      const responseTime = Date.now() - start;
      this.metrics.performanceStats.systemResponseTime = responseTime;
    }, 0);
  }

  private evaluateAlerts() {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;
      
      const shouldAlert = this.evaluateAlertCondition(rule);
      
      if (shouldAlert) {
        this.sendAlert(rule);
      }
    });
  }

  private evaluateAlertCondition(rule: AlertRule): boolean {
    const metrics = this.metrics;
    
    switch (rule.condition) {
      case 'errorRate > threshold':
        return metrics.usageStats.errorRate > rule.threshold;
      case 'averageCalculationTime > threshold':
        return metrics.performanceStats.averageCalculationTime > rule.threshold;
      case 'completionRate < threshold':
        return metrics.usageStats.completionRate < rule.threshold;
      case 'averageRating < threshold':
        return metrics.userFeedback.averageRating < rule.threshold;
      default:
        return false;
    }
  }

  private sendAlert(rule: AlertRule) {
    const alert = {
      id: this.generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      currentValue: this.getCurrentValueForRule(rule),
      threshold: rule.threshold
    };
    
    console.warn(`🚨 Alert triggered: ${rule.name}`, alert);
    
    if (window.cascadeDeletionMonitoring) {
      window.cascadeDeletionMonitoring.createAlert({
        type: 'warning',
        service: 'bagrut-monitoring',
        message: `${rule.name}: Current value ${alert.currentValue}, threshold ${rule.threshold}`,
        severity: rule.severity === 'critical' ? 'critical' : 'high'
      });
    }
    
    this.logEvent('alert_triggered', alert);
  }

  private triggerImmediateAlert(error: ValidationError) {
    const alert = {
      type: 'immediate',
      error: error,
      timestamp: new Date().toISOString()
    };
    
    console.error(`🚨 Immediate alert: ${error.type} error`, alert);
    
    if (window.cascadeDeletionMonitoring) {
      window.cascadeDeletionMonitoring.createAlert({
        type: 'error',
        service: 'bagrut-system',
        message: `${error.type}: ${error.message}`,
        severity: error.severity === 'critical' ? 'critical' : 'high'
      });
    }
    
    this.logEvent('immediate_alert', alert);
  }

  private getCurrentValueForRule(rule: AlertRule): number {
    switch (rule.condition) {
      case 'errorRate > threshold':
        return this.metrics.usageStats.errorRate;
      case 'averageCalculationTime > threshold':
        return this.metrics.performanceStats.averageCalculationTime;
      case 'completionRate < threshold':
        return this.metrics.usageStats.completionRate;
      case 'averageRating < threshold':
        return this.metrics.userFeedback.averageRating;
      default:
        return 0;
    }
  }

  private getActiveAlerts() {
    return this.alertRules
      .filter(rule => rule.enabled && this.evaluateAlertCondition(rule))
      .map(rule => ({
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        currentValue: this.getCurrentValueForRule(rule),
        threshold: rule.threshold
      }));
  }

  private cleanupOldErrors() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    this.metrics.validationErrors = this.metrics.validationErrors
      .filter(error => error.timestamp >= cutoff);
  }

  private updateDashboard() {
    const dashboardData = this.getDashboardData();
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bagrutDashboardUpdate', { 
        detail: dashboardData 
      }));
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private logEvent(eventType: string, data: any) {
    const event = {
      type: 'bagrut_monitoring',
      event: eventType,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Bagrut Monitoring Event', event);
    }
    
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('📊 Monitoring event:', event);
    }
  }
}

export const bagrutMonitoringService = new BagrutMonitoringService();
export type { BagrutMetrics, ValidationError, AlertRule };