import React, { useState, useEffect } from 'react';
import { featureFlagService } from '../services/featureFlagService';
import { bagrutMonitoringService, BagrutMetrics } from '../services/bagrutMonitoringService';
import { bagrutRollbackService, RollbackExecution } from '../services/bagrutRollbackService';
import { bagrutValidationService, ValidationReport } from '../services/bagrutValidationService';

const BagrutDeploymentDashboard: React.FC = () => {
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);
  const [metrics, setMetrics] = useState<BagrutMetrics | null>(null);
  const [validationStatus, setValidationStatus] = useState<any>(null);
  const [rollbackHistory, setRollbackHistory] = useState<RollbackExecution[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    const updateDashboard = () => {
      setDeploymentStatus(featureFlagService.getBagrutDeploymentStatus());
      setMetrics(bagrutMonitoringService.getMetrics());
      setValidationStatus(bagrutValidationService.getValidationStatus());
      setRollbackHistory(bagrutRollbackService.getRollbackHistory());
    };

    updateDashboard();
    const interval = setInterval(updateDashboard, 30000);

    const handleDashboardUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setMetrics(prevMetrics => ({ ...prevMetrics, ...event.detail }));
      }
    };

    window.addEventListener('bagrutDashboardUpdate', handleDashboardUpdate as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bagrutDashboardUpdate', handleDashboardUpdate as EventListener);
    };
  }, []);

  const handlePhaseExecution = async (phase: number) => {
    try {
      const result = featureFlagService.executeBagrutPhase(phase);
      if (result.success) {
        alert(`Successfully executed phase ${phase}: ${result.config?.description}`);
        setDeploymentStatus(featureFlagService.getBagrutDeploymentStatus());
      } else {
        alert(`Failed to execute phase ${phase}: ${result.error}`);
      }
    } catch (error) {
      alert(`Error executing phase ${phase}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRollback = async () => {
    const reason = prompt('Please enter the reason for rollback:');
    if (!reason) return;

    const confirmed = confirm(
      'Are you sure you want to rollback the Bagrut system? This will disable all new features and revert users to the old system.'
    );
    
    if (confirmed) {
      try {
        await bagrutRollbackService.executeRollback('immediate_rollback', reason, ['system_admin']);
        alert('Rollback completed successfully');
        setDeploymentStatus(featureFlagService.getBagrutDeploymentStatus());
      } catch (error) {
        alert(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleRunValidation = async () => {
    try {
      const reports = await bagrutValidationService.runPostDeploymentValidation();
      alert(`Validation completed. ${reports.length} test suites executed.`);
      setValidationStatus(bagrutValidationService.getValidationStatus());
    } catch (error) {
      alert(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPhaseStatus = (currentPhase: number) => {
    if (currentPhase === 0) return 'Not Started';
    if (currentPhase === 5) return 'Fully Deployed';
    return `Phase ${currentPhase}/5`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'deployment', label: 'Deployment', icon: '🚀' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
    { id: 'validation', label: 'Validation', icon: '✅' },
    { id: 'rollback', label: 'Rollback', icon: '🔄' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bagrut System Deployment Dashboard</h1>
        <p className="text-gray-600">Monitor and manage the Bagrut system deployment</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Deployment Phase</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {deploymentStatus ? getPhaseStatus(deploymentStatus.currentPhase) : 'Loading...'}
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">System Health</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {validationStatus ? `${validationStatus.overallHealth.toFixed(1)}%` : 'Loading...'}
                  </p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-2">Total Users</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics ? metrics.usageStats.totalCalculations : 'Loading...'}
                  </p>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-medium text-orange-900 mb-2">Error Rate</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics ? `${metrics.usageStats.errorRate.toFixed(2)}%` : 'Loading...'}
                  </p>
                </div>
              </div>

              {deploymentStatus && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Deployment Status</h3>
                  <div className="space-y-2">
                    {deploymentStatus.flags.map((flag: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{flag.flag.replace(/_/g, ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <span className="text-sm text-gray-500">{flag.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Phases</h3>
                
                <div className="space-y-4">
                  {Object.entries(featureFlagService.getBagrutDeploymentPhases()).map(([phaseKey, phase], index) => (
                    <div key={phaseKey} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">Phase {index + 1}: {phase.description}</h4>
                          <p className="text-sm text-gray-600">Duration: {phase.duration} | Users: {phase.users.join(', ')}</p>
                          <p className="text-sm text-gray-500">Criteria: {phase.criteria}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-600">{phase.percentage}%</span>
                          <br />
                          <button
                            onClick={() => handlePhaseExecution(index + 1)}
                            disabled={deploymentStatus?.currentPhase === index + 1}
                            className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {deploymentStatus?.currentPhase === index + 1 ? 'Active' : 'Execute'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-red-900">Emergency Actions</h4>
                      <p className="text-sm text-red-600">Use these actions only in emergency situations</p>
                    </div>
                    <button
                      onClick={handleRollback}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Emergency Rollback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              {metrics && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-4">Usage Statistics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>New System Usage:</span>
                          <span className="font-medium">{metrics.usageStats.newSystemUsage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Old System Usage:</span>
                          <span className="font-medium">{metrics.usageStats.oldSystemUsage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completion Rate:</span>
                          <span className="font-medium">{metrics.usageStats.completionRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Rate:</span>
                          <span className={`font-medium ${metrics.usageStats.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {metrics.usageStats.errorRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-4">Performance Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Avg Calculation Time:</span>
                          <span className="font-medium">{metrics.performanceStats.averageCalculationTime.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peak Load Time:</span>
                          <span className="font-medium">{metrics.performanceStats.peakLoadTime.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>System Response:</span>
                          <span className="font-medium">{metrics.performanceStats.systemResponseTime.toFixed(0)}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">User Feedback</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{metrics.userFeedback.averageRating.toFixed(1)}</div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{metrics.userFeedback.totalFeedback}</div>
                        <div className="text-sm text-gray-600">Total Feedback</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{metrics.userFeedback.issuesReported}</div>
                        <div className="text-sm text-gray-600">Issues Reported</div>
                      </div>
                    </div>
                  </div>

                  {metrics.validationErrors.length > 0 && (
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 mb-4">Recent Validation Errors</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {metrics.validationErrors.slice(0, 5).map((error, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-3 bg-red-50 rounded">
                            <div>
                              <span className="text-sm font-medium text-red-900">{error.type}:</span>
                              <span className="text-sm text-red-800 ml-2">{error.message}</span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              error.severity === 'critical' ? 'bg-red-200 text-red-800' : 
                              error.severity === 'high' ? 'bg-orange-200 text-orange-800' : 
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {error.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">System Validation</h3>
                <button
                  onClick={handleRunValidation}
                  disabled={validationStatus?.isValidating}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {validationStatus?.isValidating ? 'Running...' : 'Run Validation'}
                </button>
              </div>

              {validationStatus && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Tests Passed</h4>
                    <p className="text-2xl font-bold text-green-600">{validationStatus.passedTests}/{validationStatus.totalTests}</p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Critical Issues</h4>
                    <p className="text-2xl font-bold text-red-600">{validationStatus.criticalIssuesCount}</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Overall Health</h4>
                    <p className="text-2xl font-bold text-blue-600">{validationStatus.overallHealth.toFixed(1)}%</p>
                  </div>
                </div>
              )}

              {validationStatus?.lastValidation && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Last Validation</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(validationStatus.lastValidation).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rollback' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rollback History</h3>
                
                {rollbackHistory.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No rollback history available</p>
                ) : (
                  <div className="space-y-3">
                    {rollbackHistory.slice(0, 10).map((execution, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{execution.planId}</h4>
                            <p className="text-sm text-gray-600">
                              Started: {execution.startedAt.toLocaleString()}
                            </p>
                            {execution.completedAt && (
                              <p className="text-sm text-gray-600">
                                Completed: {execution.completedAt.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                            execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                            execution.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {execution.status}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600">
                          <span>Executed Steps: {execution.executedSteps.length}</span>
                          {execution.failedSteps.length > 0 && (
                            <span className="ml-4 text-red-600">Failed Steps: {execution.failedSteps.length}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rollback Plans</h3>
                
                <div className="space-y-3">
                  {bagrutRollbackService.getRollbackPlans().map((plan, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{plan.name}</h4>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            <span>Duration: {plan.estimatedDuration}</span>
                            <span className="ml-4">Risk: {plan.riskLevel}</span>
                            <span className="ml-4">Approvals: {plan.requiredApprovals.join(', ')}</span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const reason = prompt('Enter reason for rollback:');
                            if (reason) {
                              try {
                                await bagrutRollbackService.executeRollback(plan.id, reason, ['system_admin']);
                                alert('Rollback executed successfully');
                                setRollbackHistory(bagrutRollbackService.getRollbackHistory());
                              } catch (error) {
                                alert(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                              }
                            }
                          }}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BagrutDeploymentDashboard;