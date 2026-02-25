/**
 * Authentication Context
 * Provides authentication state management for the entire app
 * Features:
 * - Debounced authentication validation
 * - Authentication state caching
 * - React Strict Mode compatibility
 * - Token refresh mechanism
 * - Proper error recovery
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import apiService, { superAdminService } from './apiService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  // Authentication state management
  const [authError, setAuthError] = useState(null)
  const [lastValidation, setLastValidation] = useState(null)
  const isValidatingRef = useRef(false)
  const validationTimeoutRef = useRef(null)
  const mountedRef = useRef(true)

  // Check authentication status on app start with proper cleanup
  useEffect(() => {
    mountedRef.current = true
    
    // Debounced initial check to prevent multiple calls in React Strict Mode
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        checkAuthStatus()
      }
    }, 100)
    
    return () => {
      mountedRef.current = false
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
      clearTimeout(timeoutId)
    }
  }, [])

  const checkAuthStatus = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous validation calls
    if (isValidatingRef.current && !forceRefresh) {
      console.log('🔐 AUTH CONTEXT - Validation already in progress, skipping')
      return
    }
    
    // Check cache first (valid for 30 seconds)
    const now = Date.now()
    if (!forceRefresh && lastValidation && (now - lastValidation) < 30000) {
      console.log('🔐 AUTH CONTEXT - Using cached authentication status')
      return
    }
    
    isValidatingRef.current = true
    setAuthError(null)
    
    try {
      if (apiService.auth.isAuthenticated()) {
        const loginType = localStorage.getItem('loginType')

        // Super admin: validate by calling a super admin endpoint
        if (loginType === 'super_admin') {
          console.log('🔐 AUTH CONTEXT - Super admin token found, validating')
          try {
            // Use getTenants as a lightweight auth check
            await superAdminService.getTenants()
            if (!mountedRef.current) return

            // Restore user from localStorage
            const storedUser = localStorage.getItem('superAdminUser')
            if (storedUser) {
              const superAdminUser = JSON.parse(storedUser)
              setIsAuthenticated(true)
              setUser(superAdminUser)
              setLastValidation(now)
              console.log('🔐 AUTH CONTEXT - Super admin session restored')
            } else {
              throw new Error('Super admin user data not found')
            }
          } catch (err) {
            console.error('AUTH CONTEXT - Super admin validation failed:', err)

            // Attempt token refresh before giving up
            try {
              const refreshResponse = await superAdminService.refreshToken()
              const newToken = refreshResponse?.data?.accessToken || refreshResponse?.accessToken
              if (newToken) {
                apiService.client.setToken(newToken)
                // Re-validate with new token
                await superAdminService.getTenants()
                if (!mountedRef.current) return
                const storedUser = localStorage.getItem('superAdminUser')
                if (storedUser) {
                  const superAdminUser = JSON.parse(storedUser)
                  setIsAuthenticated(true)
                  setUser(superAdminUser)
                  setLastValidation(now)
                  console.log('AUTH CONTEXT - Super admin session refreshed')
                  return
                }
              }
            } catch (refreshErr) {
              console.error('AUTH CONTEXT - Super admin refresh also failed:', refreshErr)
            }

            // Refresh failed -- clear auth state
            localStorage.removeItem('loginType')
            localStorage.removeItem('superAdminUser')
            apiService.client.removeToken()
            setIsAuthenticated(false)
            setUser(null)
            setLastValidation(now)
          }
          return
        }

        // Impersonation: validate the impersonation token and restore banner state
        else if (loginType === 'impersonation') {
          console.log('AUTH CONTEXT - Impersonation token found, validating')
          try {
            const validation = await apiService.auth.validateToken()
            if (!mountedRef.current) return

            const teacherData = validation?.data?.user || validation?.user || validation?.data || validation
            const impersonationContext = JSON.parse(localStorage.getItem('impersonationContext') || '{}')

            setIsAuthenticated(true)
            setUser({
              ...teacherData,
              isImpersonating: true,
            })
            setLastValidation(now)
            console.log('AUTH CONTEXT - Impersonation session restored after refresh')
          } catch (err) {
            console.error('AUTH CONTEXT - Impersonation token validation failed:', err)
            // Auto-exit impersonation and try to restore super admin
            const savedToken = sessionStorage.getItem('preImpersonation_authToken')
            if (savedToken) {
              apiService.client.setToken(savedToken)
              localStorage.setItem('loginType', sessionStorage.getItem('preImpersonation_loginType') || 'super_admin')
              localStorage.removeItem('impersonationContext')
              sessionStorage.removeItem('preImpersonation_authToken')
              sessionStorage.removeItem('preImpersonation_loginType')
              sessionStorage.removeItem('preImpersonation_superAdminUser')
              // Re-run auth check as super admin
              await checkAuthStatus(true)
            } else {
              setIsAuthenticated(false)
              setUser(null)
            }
            setLastValidation(now)
          }
          return
        }

        console.log('🔐 AUTH CONTEXT - Token found, validating with server')

        // Validate the token with the server
        const validation = await apiService.auth.validateToken()

        if (!mountedRef.current) return

        // Extract basic user data from validation response
        const basicUserData = validation?.data?.user ||
                             validation?.user ||
                             validation?.data ||
                             validation

        console.log('🔐 AUTH CONTEXT - Token validation successful, fetching full teacher data')

        // Fetch complete teacher data using the ID from the validation response
        let fullTeacherData = null
        if (basicUserData?._id) {
          try {
            fullTeacherData = await apiService.teachers.getTeacher(basicUserData._id)
            console.log('🔐 AUTH CONTEXT - Full teacher data fetched:', {
              hasPersonalInfo: !!fullTeacherData?.personalInfo,
              hasRoles: !!fullTeacherData?.roles,
              name: fullTeacherData?.personalInfo?.firstName || fullTeacherData?.personalInfo?.fullName
            })
          } catch (fetchError) {
            console.warn('🔐 AUTH CONTEXT - Could not fetch full teacher data:', fetchError)
            // Fall back to basic user data if fetch fails
            fullTeacherData = basicUserData
          }
        }

        // Use full teacher data if available, otherwise use basic data
        const userData = fullTeacherData || basicUserData

        // Ensure the user object has the expected structure
        const normalizedUser = {
          ...userData,
          teacherId: userData?.teacherId || userData?._id,
          personalInfo: userData?.personalInfo || {
            firstName: userData?.firstName || basicUserData?.firstName || '',
            lastName: userData?.lastName || basicUserData?.lastName || '',
            fullName: userData?.fullName || basicUserData?.fullName || '', // backward compat
            email: userData?.email || basicUserData?.email || '',
            phone: userData?.phone || '',
            address: userData?.address || ''
          },
          roles: userData?.roles || basicUserData?.roles || [],
          role: userData?.role || userData?.roles?.[0] || basicUserData?.roles?.[0] || ''
        }

        console.log('🔐 AUTH CONTEXT - User data normalized:', {
          hasUserData: !!normalizedUser,
          userRole: normalizedUser?.role || normalizedUser?.roles,
          userId: normalizedUser?.teacherId || normalizedUser?._id,
          name: normalizedUser?.personalInfo?.firstName || normalizedUser?.personalInfo?.fullName
        })

        setIsAuthenticated(true)
        setUser(normalizedUser)
        setLastValidation(now)
      } else {
        console.log('🔐 AUTH CONTEXT - No valid token found')
        setIsAuthenticated(false)
        setUser(null)
        setLastValidation(now)
      }
    } catch (error) {
      console.error('🔐 AUTH CONTEXT - Auth validation failed:', error)
      
      if (!mountedRef.current) return
      
      setAuthError(error.message)
      setIsAuthenticated(false)
      setUser(null)
      setLastValidation(now)
      
      // If validation fails due to token expiry, try to refresh
      if (error.message.includes('Authentication failed') && apiService.auth.isAuthenticated()) {
        console.log('🔐 AUTH CONTEXT - Attempting token refresh')
        // Token refresh logic will be implemented next
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
      isValidatingRef.current = false
    }
  }, [lastValidation])

  const login = async (email, password, tenantId = null) => {
    try {
      setIsLoading(true)
      setAuthError(null)

      const loginResponse = await apiService.auth.login(email, password, tenantId)

      if (!mountedRef.current) return

      // Handle multi-tenant: tenant selection required
      if (loginResponse.requiresTenantSelection) {
        console.log('🔐 AUTH CONTEXT - Tenant selection required:', loginResponse.tenants?.length, 'tenants')
        setIsLoading(false)
        return {
          success: false,
          requiresTenantSelection: true,
          tenants: loginResponse.tenants || []
        }
      }

      console.log('🔐 AUTH CONTEXT - Login successful:', {
        hasToken: !!loginResponse.token,
        hasUserData: !!(loginResponse.teacher || loginResponse.user)
      })

      const { token } = loginResponse
      // Extract basic user data from login response
      const basicUserData = loginResponse.teacher ||
                           loginResponse.user ||
                           loginResponse.data?.teacher ||
                           loginResponse.data?.user ||
                           loginResponse.data

      if (!token || !basicUserData) {
        throw new Error('Invalid login response: missing token or user data')
      }
      
      console.log('🔐 AUTH CONTEXT - Fetching full teacher data after login')
      
      // Fetch complete teacher data using the ID from the login response
      let fullTeacherData = null
      if (basicUserData?._id || basicUserData?.teacherId) {
        try {
          const teacherId = basicUserData._id || basicUserData.teacherId
          fullTeacherData = await apiService.teachers.getTeacher(teacherId)
          console.log('🔐 AUTH CONTEXT - Full teacher data fetched after login:', {
            hasPersonalInfo: !!fullTeacherData?.personalInfo,
            hasRoles: !!fullTeacherData?.roles,
            name: fullTeacherData?.personalInfo?.firstName || fullTeacherData?.personalInfo?.fullName
          })
        } catch (fetchError) {
          console.warn('🔐 AUTH CONTEXT - Could not fetch full teacher data after login:', fetchError)
          // Fall back to basic user data if fetch fails
          fullTeacherData = basicUserData
        }
      }
      
      // Use full teacher data if available, otherwise use basic data
      const userData = fullTeacherData || basicUserData
      
      // Ensure the user object has the expected structure
      const normalizedUser = {
        ...userData,
        teacherId: userData?.teacherId || userData?._id,
        tenantId: userData?.tenantId || basicUserData?.tenantId || tenantId,
        personalInfo: userData?.personalInfo || {
          firstName: userData?.firstName || basicUserData?.personalInfo?.firstName || basicUserData?.firstName || '',
          lastName: userData?.lastName || basicUserData?.personalInfo?.lastName || basicUserData?.lastName || '',
          fullName: userData?.fullName || basicUserData?.personalInfo?.fullName || basicUserData?.fullName || '', // backward compat
          email: userData?.email || basicUserData?.credentials?.email || basicUserData?.personalInfo?.email || basicUserData?.email || email,
          phone: userData?.phone || basicUserData?.personalInfo?.phone || '',
          address: userData?.address || basicUserData?.personalInfo?.address || ''
        },
        roles: userData?.roles || basicUserData?.roles || [],
        role: userData?.role || userData?.roles?.[0] || basicUserData?.roles?.[0] || ''
      }

      console.log('🔐 AUTH CONTEXT - User data normalized after login:', {
        hasUserData: !!normalizedUser,
        userRole: normalizedUser?.role || normalizedUser?.roles,
        userId: normalizedUser?.teacherId || normalizedUser?._id,
        tenantId: normalizedUser?.tenantId || 'none',
        name: normalizedUser?.personalInfo?.firstName || normalizedUser?.personalInfo?.fullName
      })
      
      setIsAuthenticated(true)
      setUser(normalizedUser)
      setLastValidation(Date.now())
      return { success: true, user: normalizedUser }
    } catch (error) {
      console.error('🔐 AUTH CONTEXT - Login failed:', error)
      
      if (mountedRef.current) {
        setAuthError(error.message)
        setIsAuthenticated(false)
        setUser(null)
      }
      throw error
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const loginAsSuperAdmin = async (email, password) => {
    try {
      setIsLoading(true)
      setAuthError(null)

      const response = await superAdminService.login(email, password)

      if (!mountedRef.current) return

      // Backend returns: { success, data: { accessToken, refreshToken, admin } }
      const token = response?.data?.accessToken || response?.accessToken
      const admin = response?.data?.admin || response?.admin

      if (!token || !admin) {
        throw new Error('תגובת התחברות לא תקינה')
      }

      // Store token via apiClient so both localStorage AND in-memory token are updated
      apiService.client.setToken(token)

      // Mark as super admin login so checkAuthStatus knows how to validate
      localStorage.setItem('loginType', 'super_admin')

      // Normalize super admin as a user compatible with the app
      const normalizedUser = {
        _id: admin._id,
        teacherId: admin._id,
        tenantId: null, // super admin is cross-tenant
        isSuperAdmin: true,
        personalInfo: {
          firstName: admin.name || 'מנהל-על',
          lastName: '',
          fullName: admin.name || 'מנהל-על',
          email: admin.email,
          phone: '',
          address: '',
        },
        roles: ['admin'],
        role: 'admin',
        permissions: admin.permissions || [],
      }

      // Store user data for restoration on page refresh
      localStorage.setItem('superAdminUser', JSON.stringify(normalizedUser))

      console.log('🔐 AUTH CONTEXT - Super admin login successful:', {
        userId: admin._id,
        email: admin.email,
        permissions: admin.permissions,
      })

      setIsAuthenticated(true)
      setUser(normalizedUser)
      setLastValidation(Date.now())
      return { success: true, user: normalizedUser }
    } catch (error) {
      console.error('🔐 AUTH CONTEXT - Super admin login failed:', error)

      if (mountedRef.current) {
        setAuthError(error.message)
        setIsAuthenticated(false)
        setUser(null)
      }
      throw error
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const startImpersonation = async (tenantId) => {
    try {
      setIsLoading(true)

      // Call backend to get impersonation token
      const response = await superAdminService.startImpersonation(tenantId)
      const data = response?.data || response

      if (!data?.accessToken) {
        throw new Error('No impersonation token received')
      }

      // 1. Stash current super admin state in sessionStorage
      const currentToken = localStorage.getItem('authToken')
      const currentLoginType = localStorage.getItem('loginType')
      const currentSuperAdminUser = localStorage.getItem('superAdminUser')

      sessionStorage.setItem('preImpersonation_authToken', currentToken)
      sessionStorage.setItem('preImpersonation_loginType', currentLoginType)
      sessionStorage.setItem('preImpersonation_superAdminUser', currentSuperAdminUser)

      // 2. Set impersonation state in localStorage
      apiService.client.setToken(data.accessToken)
      localStorage.setItem('loginType', 'impersonation')
      localStorage.setItem('impersonationContext', JSON.stringify({
        superAdminId: data.sessionId, // sessionId doubles as identifier
        sessionId: data.sessionId,
        tenantId: data.tenant._id,
        tenantName: data.tenant.name,
        impersonatedAdminName: data.impersonatedAdmin.name,
        impersonatedAdminEmail: data.impersonatedAdmin.email,
        startedAt: new Date().toISOString(),
      }))

      // 3. Validate the impersonation token to get full teacher data
      const validation = await apiService.auth.validateToken()
      if (!mountedRef.current) return

      const teacherData = validation?.data?.user || validation?.user || validation?.data || validation

      // 4. Update auth state to reflect impersonated admin
      setIsAuthenticated(true)
      setUser({
        ...teacherData,
        isImpersonating: true,
      })
      setLastValidation(Date.now())

      console.log('AUTH CONTEXT - Impersonation started:', {
        tenantName: data.tenant.name,
        adminName: data.impersonatedAdmin.name,
      })

      return { success: true }
    } catch (error) {
      console.error('AUTH CONTEXT - Start impersonation failed:', error)
      if (mountedRef.current) {
        setAuthError(error.message)
      }
      throw error
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const stopImpersonation = async () => {
    try {
      setIsLoading(true)

      // 1. Restore super admin token FIRST so the stop-impersonation API call
      //    authenticates as super admin (the route requires authenticateSuperAdmin)
      const savedToken = sessionStorage.getItem('preImpersonation_authToken')
      const savedLoginType = sessionStorage.getItem('preImpersonation_loginType')
      const savedUser = sessionStorage.getItem('preImpersonation_superAdminUser')

      if (savedToken) {
        apiService.client.setToken(savedToken)
        localStorage.setItem('loginType', savedLoginType || 'super_admin')
        if (savedUser) {
          localStorage.setItem('superAdminUser', savedUser)
        }
      }

      // 2. Log the end of impersonation on the backend (now using super admin JWT)
      const impersonationContext = JSON.parse(localStorage.getItem('impersonationContext') || '{}')
      if (impersonationContext.sessionId) {
        try {
          await superAdminService.stopImpersonation(impersonationContext.sessionId)
        } catch (err) {
          console.warn('AUTH CONTEXT - Stop impersonation API call failed:', err)
          // Continue with local cleanup regardless
        }
      }

      // 3. Clean up impersonation state
      localStorage.removeItem('impersonationContext')
      sessionStorage.removeItem('preImpersonation_authToken')
      sessionStorage.removeItem('preImpersonation_loginType')
      sessionStorage.removeItem('preImpersonation_superAdminUser')

      // 4. Restore super admin user in auth context
      if (savedUser) {
        const superAdminUser = JSON.parse(savedUser)
        setIsAuthenticated(true)
        setUser(superAdminUser)
        setLastValidation(Date.now())
      } else {
        // Fallback: force re-check
        await checkAuthStatus(true)
      }

      console.log('AUTH CONTEXT - Impersonation stopped, super admin session restored')

      return { success: true }
    } catch (error) {
      console.error('AUTH CONTEXT - Stop impersonation failed:', error)
      // If restoration fails, force a full re-auth
      await logout()
      throw error
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const logout = async () => {
    const loginType = localStorage.getItem('loginType')
    try {
      setIsLoading(true)
      if (loginType === 'super_admin') {
        await superAdminService.logout()
      } else {
        await apiService.auth.logout()
      }
      console.log('🔐 AUTH CONTEXT - Logout successful')
    } catch (error) {
      console.warn('🔐 AUTH CONTEXT - Logout API call failed:', error)
    } finally {
      // Clean up super admin data
      localStorage.removeItem('loginType')
      localStorage.removeItem('superAdminUser')
      // Clean up impersonation data
      localStorage.removeItem('impersonationContext')
      sessionStorage.removeItem('preImpersonation_authToken')
      sessionStorage.removeItem('preImpersonation_loginType')
      sessionStorage.removeItem('preImpersonation_superAdminUser')
      if (mountedRef.current) {
        setIsAuthenticated(false)
        setUser(null)
        setAuthError(null)
        setLastValidation(null)
        setIsLoading(false)
      }
    }
  }
  
  // Token refresh mechanism
  const refreshToken = useCallback(async () => {
    try {
      console.log('AUTH CONTEXT - Attempting token refresh')
      const loginType = localStorage.getItem('loginType')

      if (loginType === 'impersonation') {
        // During impersonation, if token expires, exit impersonation
        // (impersonation tokens have no refresh mechanism by design)
        console.log('AUTH CONTEXT - Impersonation token expired, exiting impersonation')
        await stopImpersonation()
        return false
      }

      if (loginType === 'super_admin') {
        // Super admin refresh: call dedicated endpoint (reads httpOnly cookie)
        const response = await superAdminService.refreshToken()
        const newToken = response?.data?.accessToken || response?.accessToken

        if (newToken) {
          apiService.client.setToken(newToken)
          console.log('AUTH CONTEXT - Super admin token refreshed successfully')
          return true
        }
        throw new Error('No access token in refresh response')
      }

      // Regular auth refresh: re-validate (existing behavior)
      await checkAuthStatus(true)
      return isAuthenticated
    } catch (error) {
      console.error('AUTH CONTEXT - Token refresh failed:', error)
      await logout()
      return false
    }
  }, [isAuthenticated])

  // Debug helper for testing improvements
  const debugAuth = useCallback(() => {
    return {
      isAuthenticated,
      isLoading,
      user: user ? { id: user.teacherId || user.id, role: user.role } : null,
      authError,
      lastValidation: lastValidation ? new Date(lastValidation).toISOString() : null,
      isValidating: isValidatingRef.current,
      cacheAge: lastValidation ? Date.now() - lastValidation : null
    }
  }, [isAuthenticated, isLoading, user, authError, lastValidation])

  const value = {
    isAuthenticated,
    isLoading,
    user,
    authError,
    login,
    loginAsSuperAdmin,
    startImpersonation,
    stopImpersonation,
    logout,
    checkAuthStatus,
    refreshToken,
    debugAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext