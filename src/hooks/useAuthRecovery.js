/**
 * Authentication Recovery Hook
 * Provides utilities for handling authentication errors and recovery
 */

import { useState, useCallback } from 'react'
import { useAuth } from '../services/authContext.jsx'

export const useAuthRecovery = () => {
  const { checkAuthStatus, isAuthenticated, authError } = useAuth()
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryAttempts, setRecoveryAttempts] = useState(0)
  
  const maxRecoveryAttempts = 3
  
  const attemptRecovery = useCallback(async () => {
    if (isRecovering || recoveryAttempts >= maxRecoveryAttempts) {
      return false
    }
    
    setIsRecovering(true)
    setRecoveryAttempts(prev => prev + 1)
    
    try {
      console.log(`🔄 Auth Recovery - Attempt ${recoveryAttempts + 1}/${maxRecoveryAttempts}`)
      await checkAuthStatus(true)
      
      if (isAuthenticated) {
        console.log('✅ Auth Recovery - Successful')
        setRecoveryAttempts(0)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Auth Recovery - Failed:', error)
      return false
    } finally {
      setIsRecovering(false)
    }
  }, [checkAuthStatus, isAuthenticated, isRecovering, recoveryAttempts])
  
  const resetRecovery = useCallback(() => {
    setRecoveryAttempts(0)
    setIsRecovering(false)
  }, [])
  
  return {
    attemptRecovery,
    resetRecovery,
    isRecovering,
    recoveryAttempts,
    canRecovery: recoveryAttempts < maxRecoveryAttempts && !isRecovering,
    hasAuthError: !!authError
  }
}

export default useAuthRecovery