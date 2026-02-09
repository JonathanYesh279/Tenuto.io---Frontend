/**
 * Authentication Test Utilities
 * Helper functions for testing and validating authentication improvements
 */

/**
 * Monitor authentication calls to ensure no duplicate validation requests
 */
export const createAuthCallMonitor = () => {
  const calls = []
  let startTime = Date.now()
  
  // Override console.log to capture auth-related calls
  const originalLog = console.log
  console.log = (...args) => {
    const message = args.join(' ')
    if (message.includes('AUTH CONTEXT') || message.includes('API Request') && message.includes('auth/validate')) {
      calls.push({
        timestamp: Date.now() - startTime,
        message
      })
    }
    originalLog.apply(console, args)
  }
  
  return {
    getCalls: () => calls,
    getCallCount: () => calls.length,
    getUniqueValidationCalls: () => {
      return calls.filter(call => 
        call.message.includes('auth/validate') || 
        call.message.includes('Token validation')
      ).length
    },
    getValidationCallsInTimeWindow: (windowMs = 1000) => {
      const now = Date.now() - startTime
      return calls.filter(call => 
        (call.message.includes('auth/validate') || call.message.includes('Token validation')) &&
        (now - call.timestamp) < windowMs
      ).length
    },
    reset: () => {
      calls.length = 0
      startTime = Date.now()
      console.log = originalLog
    }
  }
}

/**
 * Test authentication caching behavior
 */
export const testAuthCaching = async (checkAuthStatus) => {
  console.log('🧪 Testing authentication caching...')
  
  const monitor = createAuthCallMonitor()
  
  // Make multiple auth checks in quick succession
  const promises = Array(5).fill(null).map(() => checkAuthStatus())
  await Promise.allSettled(promises)
  
  const validationCalls = monitor.getUniqueValidationCalls()
  
  console.log(`🧪 Cache Test Result: ${validationCalls} validation calls (expected: 1)`)
  
  monitor.reset()
  return validationCalls === 1
}

/**
 * Test React Strict Mode compatibility
 */
export const testStrictModeCompatibility = () => {
  console.log('🧪 Testing React Strict Mode compatibility...')
  
  // This would be used in a React component test
  return {
    checkDoubleExecution: (callback) => {
      let executionCount = 0
      const wrappedCallback = () => {
        executionCount++
        callback()
      }
      
      // Simulate React Strict Mode double execution
      wrappedCallback()
      wrappedCallback()
      
      return executionCount
    }
  }
}

/**
 * Test error recovery mechanism
 */
export const testErrorRecovery = async (authContext) => {
  console.log('🧪 Testing error recovery mechanism...')
  
  const { checkAuthStatus } = authContext
  let recoveryAttempts = 0
  
  // Mock a failing auth check
  const originalCheck = checkAuthStatus
  const mockFailingCheck = async () => {
    recoveryAttempts++
    if (recoveryAttempts < 3) {
      throw new Error('Simulated auth failure')
    }
    return originalCheck()
  }
  
  try {
    await mockFailingCheck()
    console.log(`🧪 Error Recovery Test: Succeeded after ${recoveryAttempts} attempts`)
    return recoveryAttempts >= 2 && recoveryAttempts <= 3
  } catch (error) {
    console.log(`🧪 Error Recovery Test: Failed after ${recoveryAttempts} attempts`)
    return false
  }
}

/**
 * Performance monitoring for authentication
 */
export const createPerformanceMonitor = () => {
  const metrics = {
    authValidationTime: [],
    totalAuthCalls: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
  
  return {
    startValidation: () => performance.now(),
    endValidation: (startTime) => {
      const duration = performance.now() - startTime
      metrics.authValidationTime.push(duration)
      return duration
    },
    recordAuthCall: () => metrics.totalAuthCalls++,
    recordCacheHit: () => metrics.cacheHits++,
    recordCacheMiss: () => metrics.cacheMisses++,
    getMetrics: () => ({
      ...metrics,
      averageValidationTime: metrics.authValidationTime.reduce((a, b) => a + b, 0) / metrics.authValidationTime.length || 0,
      cacheHitRate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) || 0
    }),
    reset: () => {
      metrics.authValidationTime.length = 0
      metrics.totalAuthCalls = 0
      metrics.cacheHits = 0
      metrics.cacheMisses = 0
    }
  }
}

/**
 * Validate authentication improvements in browser console
 */
export const runAuthValidationTests = async (authContext) => {
  console.log('🧪 Starting Authentication Validation Tests...')
  
  const results = {
    caching: false,
    errorRecovery: false,
    performance: null
  }
  
  try {
    // Test caching
    results.caching = await testAuthCaching(authContext.checkAuthStatus)
    
    // Test error recovery
    results.errorRecovery = await testErrorRecovery(authContext)
    
    // Performance test
    const perfMonitor = createPerformanceMonitor()
    const startTime = perfMonitor.startValidation()
    await authContext.checkAuthStatus()
    const duration = perfMonitor.endValidation(startTime)
    results.performance = duration
    
    console.log('🧪 Authentication Test Results:', results)
    
    const allPassed = results.caching && results.errorRecovery && results.performance < 1000
    console.log(allPassed ? '✅ All authentication tests passed!' : '❌ Some authentication tests failed')
    
    return results
  } catch (error) {
    console.error('🧪 Authentication tests failed:', error)
    return results
  }
}

export default {
  createAuthCallMonitor,
  testAuthCaching,
  testStrictModeCompatibility,
  testErrorRecovery,
  createPerformanceMonitor,
  runAuthValidationTests
}