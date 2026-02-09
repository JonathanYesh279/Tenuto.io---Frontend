/**
 * Feature Flag Service for Cascade Deletion System
 * Enables gradual rollout and A/B testing of cascade deletion features
 * Supports real-time flag updates and user-based targeting
 */

interface FeatureFlag {
  key: string
  enabled: boolean
  percentage?: number // 0-100, percentage of users to enable for
  userTypes?: string[] // ['admin', 'teacher', 'student']
  userIds?: string[] // Specific user IDs
  metadata?: {
    description: string
    createdAt: string
    updatedAt: string
    rolloutPlan?: string
    dependencies?: string[]
  }
}

interface FeatureFlagContext {
  userId: string
  userType: string
  sessionId: string
  environment: 'development' | 'staging' | 'production'
  browserSupport: boolean
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

interface RolloutConfig {
  schedule: {
    phase: string
    startDate: string
    endDate: string
    targetPercentage: number
    targetUserTypes: string[]
  }[]
  killSwitch: boolean
  monitoring: {
    errorThreshold: number
    performanceThreshold: number
    userFeedbackThreshold: number
  }
}

class CascadeDeletionFeatureFlags {
  private flags: Map<string, FeatureFlag> = new Map()
  private context?: FeatureFlagContext
  private rolloutConfigs: Map<string, RolloutConfig> = new Map()
  private updateCallbacks: Map<string, ((enabled: boolean) => void)[]> = new Map()

  constructor() {
    this.initializeDefaultFlags()
    this.loadRemoteFlags()
    this.setupPeriodicUpdates()
  }

  private initializeDefaultFlags() {
    const defaultFlags: FeatureFlag[] = [
      {
        key: 'cascade_deletion_preview',
        enabled: import.meta.env.VITE_FEATURE_CASCADE_DELETION_PREVIEW === 'true',
        percentage: 10,
        userTypes: ['admin'],
        metadata: {
          description: 'Shows cascade deletion preview but does not allow execution',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rolloutPlan: 'Week 1: 10% admin, Week 2: 50% admin, Week 3: 100% admin'
        }
      },
      {
        key: 'cascade_deletion_execute',
        enabled: import.meta.env.VITE_FEATURE_CASCADE_DELETION_EXECUTE === 'true',
        percentage: 0, // Start disabled
        userTypes: ['admin'],
        metadata: {
          description: 'Allows actual execution of cascade deletion operations',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rolloutPlan: 'Week 2: 10% admin, Week 3: 50% admin, Week 4: 100% admin',
          dependencies: ['cascade_deletion_preview']
        }
      },
      {
        key: 'bulk_deletion_enabled',
        enabled: import.meta.env.VITE_FEATURE_BULK_DELETION_ENABLED === 'true',
        percentage: 0,
        userTypes: ['admin'],
        metadata: {
          description: 'Enables bulk deletion of multiple entities at once',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rolloutPlan: 'Week 4: 25% admin, Week 5: 100% admin',
          dependencies: ['cascade_deletion_execute']
        }
      },
      {
        key: 'cascade_deletion_analytics',
        enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
        percentage: 100,
        userTypes: ['admin', 'teacher'],
        metadata: {
          description: 'Tracks analytics for cascade deletion operations',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        key: 'performance_monitoring_dashboard',
        enabled: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
        percentage: 100,
        userTypes: ['admin'],
        metadata: {
          description: 'Shows performance monitoring dashboard for deletion operations',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        key: 'enhanced_deletion_ui',
        enabled: false,
        percentage: 0,
        userTypes: ['admin'],
        metadata: {
          description: 'New enhanced UI with better UX for deletion operations',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rolloutPlan: 'A/B test against current UI'
        }
      },
      {
        key: 'websocket_deletion_updates',
        enabled: true,
        percentage: 100,
        userTypes: ['admin', 'teacher'],
        metadata: {
          description: 'Real-time updates for deletion operations via WebSocket',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        key: 'new_bagrut_grading_system',
        enabled: false,
        percentage: 0,
        userTypes: ['admin', 'teacher'],
        metadata: {
          description: 'New Bagrut grading system with enhanced calculations and UI',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rolloutPlan: 'Phase 1: 5% test users, Phase 2: 15% extended test, Phase 3: 35% partial, Phase 4: 70% majority, Phase 5: 100% full'
        }
      },
      {
        key: 'bagrut_calculation_v2',
        enabled: false,
        percentage: 0,
        userTypes: ['admin', 'teacher'],
        metadata: {
          description: 'Updated Bagrut calculation algorithm with improved accuracy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dependencies: ['new_bagrut_grading_system']
        }
      },
      {
        key: 'bagrut_ui_updates',
        enabled: false,
        percentage: 0,
        userTypes: ['admin', 'teacher'],
        metadata: {
          description: 'New Bagrut UI components with improved user experience',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dependencies: ['new_bagrut_grading_system']
        }
      },
      {
        key: 'bagrut_monitoring_dashboard',
        enabled: true,
        percentage: 100,
        userTypes: ['admin'],
        metadata: {
          description: 'Monitoring dashboard for Bagrut system deployment and usage',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ]

    defaultFlags.forEach(flag => {
      this.flags.set(flag.key, flag)
    })
  }

  private setupRolloutConfigs() {
    // Cascade deletion preview rollout
    this.rolloutConfigs.set('cascade_deletion_preview', {
      schedule: [
        {
          phase: 'week1',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-07T23:59:59Z',
          targetPercentage: 10,
          targetUserTypes: ['admin']
        },
        {
          phase: 'week2',
          startDate: '2024-01-08T00:00:00Z',
          endDate: '2024-01-14T23:59:59Z',
          targetPercentage: 50,
          targetUserTypes: ['admin']
        },
        {
          phase: 'week3',
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-21T23:59:59Z',
          targetPercentage: 100,
          targetUserTypes: ['admin']
        }
      ],
      killSwitch: false,
      monitoring: {
        errorThreshold: 5, // 5% error rate
        performanceThreshold: 10000, // 10 second timeout
        userFeedbackThreshold: 3 // Min rating of 3/5
      }
    })

    // Cascade deletion execute rollout (more conservative)
    this.rolloutConfigs.set('cascade_deletion_execute', {
      schedule: [
        {
          phase: 'week2',
          startDate: '2024-01-08T00:00:00Z',
          endDate: '2024-01-14T23:59:59Z',
          targetPercentage: 5,
          targetUserTypes: ['admin']
        },
        {
          phase: 'week3',
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-21T23:59:59Z',
          targetPercentage: 25,
          targetUserTypes: ['admin']
        },
        {
          phase: 'week4',
          startDate: '2024-01-22T00:00:00Z',
          endDate: '2024-01-28T23:59:59Z',
          targetPercentage: 100,
          targetUserTypes: ['admin']
        }
      ],
      killSwitch: false,
      monitoring: {
        errorThreshold: 2, // 2% error rate (stricter)
        performanceThreshold: 15000, // 15 second timeout
        userFeedbackThreshold: 4 // Min rating of 4/5
      }
    })
  }

  setContext(context: FeatureFlagContext) {
    this.context = context
    
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('🏁 Feature flag context set:', context)
    }
  }

  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey)
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found`)
      return false
    }

    if (!flag.enabled) {
      return false
    }

    if (!this.context) {
      console.warn('Feature flag context not set, using default behavior')
      return flag.enabled
    }

    // Check user type restrictions
    if (flag.userTypes && !flag.userTypes.includes(this.context.userType)) {
      return false
    }

    // Check specific user ID restrictions
    if (flag.userIds && !flag.userIds.includes(this.context.userId)) {
      return false
    }

    // Check percentage rollout
    if (flag.percentage !== undefined && flag.percentage < 100) {
      const userHash = this.hashUserId(this.context.userId + flagKey)
      return userHash < flag.percentage
    }

    // Check dependencies
    if (flag.metadata?.dependencies) {
      for (const dependency of flag.metadata.dependencies) {
        if (!this.isEnabled(dependency)) {
          if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
            console.log(`🏁 Feature flag '${flagKey}' disabled due to dependency '${dependency}'`)
          }
          return false
        }
      }
    }

    return true
  }

  // Get feature flag with metadata
  getFlag(flagKey: string): FeatureFlag | null {
    return this.flags.get(flagKey) || null
  }

  // Update flag (for remote updates)
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>) {
    const existingFlag = this.flags.get(flagKey)
    if (!existingFlag) {
      console.warn(`Cannot update non-existent flag: ${flagKey}`)
      return
    }

    const updatedFlag: FeatureFlag = {
      ...existingFlag,
      ...updates,
      metadata: {
        ...existingFlag.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    this.flags.set(flagKey, updatedFlag)

    // Notify callbacks
    const callbacks = this.updateCallbacks.get(flagKey)
    if (callbacks) {
      const isEnabled = this.isEnabled(flagKey)
      callbacks.forEach(callback => callback(isEnabled))
    }

    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log(`🏁 Feature flag '${flagKey}' updated:`, updatedFlag)
    }
  }

  // Subscribe to flag changes
  subscribe(flagKey: string, callback: (enabled: boolean) => void) {
    if (!this.updateCallbacks.has(flagKey)) {
      this.updateCallbacks.set(flagKey, [])
    }
    this.updateCallbacks.get(flagKey)!.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(flagKey)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  // Emergency kill switch
  killSwitch(flagKey: string) {
    console.warn(`🚨 KILL SWITCH ACTIVATED for flag: ${flagKey}`)
    
    this.updateFlag(flagKey, {
      enabled: false,
      percentage: 0,
      metadata: {
        ...this.flags.get(flagKey)?.metadata,
        killSwitchActivated: true,
        killSwitchTime: new Date().toISOString()
      }
    })

    // Send alert to monitoring systems
    if (window.cascadeDeletionMonitoring) {
      window.cascadeDeletionMonitoring.createAlert({
        type: 'error',
        service: 'feature-flags',
        message: `Kill switch activated for feature flag: ${flagKey}`,
        severity: 'critical'
      })
    }
  }

  // Load flags from remote service
  private async loadRemoteFlags() {
    try {
      const endpoint = import.meta.env.VITE_FEATURE_FLAGS_ENDPOINT
      if (!endpoint) return

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_FEATURE_FLAGS_TOKEN}`
        }
      })

      if (response.ok) {
        const remoteFlags = await response.json()
        
        // Merge remote flags with local flags
        remoteFlags.forEach((flag: FeatureFlag) => {
          this.flags.set(flag.key, flag)
        })

        if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
          console.log(`🏁 Loaded ${remoteFlags.length} remote feature flags`)
        }
      }
    } catch (error) {
      console.warn('Failed to load remote feature flags:', error)
    }
  }

  // Periodic updates from remote service
  private setupPeriodicUpdates() {
    const updateInterval = 300000 // 5 minutes
    
    setInterval(async () => {
      await this.loadRemoteFlags()
    }, updateInterval)
  }

  // Hash user ID for consistent percentage rollouts
  private hashUserId(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash) % 100
  }

  // Get all enabled flags for debugging
  getEnabledFlags(): string[] {
    return Array.from(this.flags.keys()).filter(key => this.isEnabled(key))
  }

  // Admin function to get all flags
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  // Export configuration for backup/analysis
  exportConfiguration() {
    return {
      flags: Array.from(this.flags.entries()),
      context: this.context,
      rolloutConfigs: Array.from(this.rolloutConfigs.entries()),
      exportedAt: new Date().toISOString()
    }
  }

  // Bagrut system deployment methods
  getBagrutDeploymentPhases() {
    return {
      phase1: { 
        percentage: 5, 
        duration: '3 days', 
        description: 'Test users and admin staff',
        users: ['admin'],
        criteria: 'System stability and basic functionality'
      },
      phase2: { 
        percentage: 15, 
        duration: '3 days', 
        description: 'Extended test group including senior teachers',
        users: ['admin', 'senior_teacher'],
        criteria: 'Calculation accuracy and UI usability'
      },
      phase3: { 
        percentage: 35, 
        duration: '4 days', 
        description: 'Partial rollout to all teachers',
        users: ['admin', 'teacher'],
        criteria: 'Performance and user feedback'
      },
      phase4: { 
        percentage: 70, 
        duration: '3 days', 
        description: 'Majority rollout',
        users: ['admin', 'teacher'],
        criteria: 'System load handling and error rates'
      },
      phase5: { 
        percentage: 100, 
        duration: 'Ongoing', 
        description: 'Full deployment to all users',
        users: ['admin', 'teacher'],
        criteria: 'Complete migration from old system'
      }
    }
  }

  executeBagrutPhase(phase: number) {
    const phases = this.getBagrutDeploymentPhases()
    const phaseKeys = Object.keys(phases) as Array<keyof typeof phases>
    
    if (phase >= 1 && phase <= phaseKeys.length) {
      const phaseKey = phaseKeys[phase - 1]
      const phaseConfig = phases[phaseKey]
      
      // Update all Bagrut-related flags
      const bagrutFlags = ['new_bagrut_grading_system', 'bagrut_calculation_v2', 'bagrut_ui_updates']
      
      bagrutFlags.forEach(flagKey => {
        this.updateFlag(flagKey, {
          enabled: true,
          percentage: phaseConfig.percentage,
          userTypes: phaseConfig.users
        })
      })
      
      // Log deployment event
      this.logDeploymentEvent('phase_execution', {
        phase: phase,
        phaseKey: phaseKey,
        percentage: phaseConfig.percentage,
        description: phaseConfig.description,
        timestamp: new Date().toISOString()
      })
      
      console.log(`🚀 Executed Bagrut deployment phase ${phase}: ${phaseConfig.description}`)
      
      return {
        success: true,
        phase: phase,
        config: phaseConfig,
        affectedFlags: bagrutFlags
      }
    }
    
    return { success: false, error: 'Invalid phase number' }
  }

  rollbackBagrutDeployment(reason?: string) {
    const bagrutFlags = [
      'new_bagrut_grading_system', 
      'bagrut_calculation_v2', 
      'bagrut_ui_updates'
    ]
    
    bagrutFlags.forEach(flagKey => {
      this.updateFlag(flagKey, {
        enabled: false,
        percentage: 0
      })
    })
    
    // Log rollback event
    this.logDeploymentEvent('rollback', {
      reason: reason || 'Manual rollback initiated',
      affectedFlags: bagrutFlags,
      timestamp: new Date().toISOString()
    })
    
    // Send critical alert
    if (window.cascadeDeletionMonitoring) {
      window.cascadeDeletionMonitoring.createAlert({
        type: 'warning',
        service: 'bagrut-deployment',
        message: `Bagrut system rollback executed. Reason: ${reason || 'Manual rollback'}`,
        severity: 'high'
      })
    }
    
    console.warn('🔄 Bagrut system rolled back to previous version')
    
    return {
      success: true,
      rolledBackFlags: bagrutFlags,
      reason: reason
    }
  }

  setUserOverrideForBagrut(userId: string, enabled: boolean) {
    const bagrutFlags = [
      'new_bagrut_grading_system', 
      'bagrut_calculation_v2', 
      'bagrut_ui_updates'
    ]
    
    bagrutFlags.forEach(flagKey => {
      const flag = this.flags.get(flagKey)
      if (flag) {
        if (!flag.userIds) flag.userIds = []
        
        if (enabled && !flag.userIds.includes(userId)) {
          flag.userIds.push(userId)
        } else if (!enabled && flag.userIds.includes(userId)) {
          flag.userIds = flag.userIds.filter(id => id !== userId)
        }
        
        this.flags.set(flagKey, flag)
      }
    })
    
    this.logDeploymentEvent('user_override', {
      userId: userId,
      enabled: enabled,
      flags: bagrutFlags,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: true,
      userId: userId,
      enabled: enabled,
      affectedFlags: bagrutFlags
    }
  }

  getBagrutDeploymentStatus() {
    const bagrutFlags = [
      'new_bagrut_grading_system', 
      'bagrut_calculation_v2', 
      'bagrut_ui_updates'
    ]
    
    const status = bagrutFlags.map(flagKey => {
      const flag = this.flags.get(flagKey)
      return {
        flag: flagKey,
        enabled: flag?.enabled || false,
        percentage: flag?.percentage || 0,
        userOverrides: flag?.userIds?.length || 0
      }
    })
    
    const currentPhase = this.detectCurrentPhase(status[0].percentage)
    
    return {
      flags: status,
      currentPhase: currentPhase,
      isFullyDeployed: status.every(s => s.enabled && s.percentage === 100),
      isRolledBack: status.every(s => !s.enabled && s.percentage === 0)
    }
  }

  private detectCurrentPhase(percentage: number): number {
    if (percentage === 0) return 0
    if (percentage <= 5) return 1
    if (percentage <= 15) return 2
    if (percentage <= 35) return 3
    if (percentage <= 70) return 4
    return 5
  }

  private logDeploymentEvent(eventType: string, data: any) {
    const event = {
      type: 'bagrut_deployment',
      event: eventType,
      data: data,
      timestamp: new Date().toISOString()
    }
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Bagrut Deployment Event', event)
    }
    
    // Store in local storage for debugging
    const events = JSON.parse(localStorage.getItem('bagrut_deployment_events') || '[]')
    events.push(event)
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100)
    }
    
    localStorage.setItem('bagrut_deployment_events', JSON.stringify(events))
    
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('📊 Bagrut deployment event logged:', event)
    }
  }
}

// Create singleton instance
export const featureFlagService = new CascadeDeletionFeatureFlags()

// React hook for using feature flags
export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = React.useState(() => featureFlagService.isEnabled(flagKey))

  React.useEffect(() => {
    const unsubscribe = featureFlagService.subscribe(flagKey, setEnabled)
    return unsubscribe
  }, [flagKey])

  return enabled
}

// React hook for feature flag metadata
export function useFeatureFlagMeta(flagKey: string): FeatureFlag | null {
  return featureFlagService.getFlag(flagKey)
}

export type { FeatureFlag, FeatureFlagContext, RolloutConfig }
export default featureFlagService