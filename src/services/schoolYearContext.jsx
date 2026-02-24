/**
 * School Year Context
 * Provides school year state management for the entire app
 * Manages current selected school year and provides it to all components
 */

import { createContext, useContext, useState, useEffect } from 'react'
import apiService from './apiService'
import { useAuth } from './authContext'

const SchoolYearContext = createContext(null)

export const useSchoolYear = () => {
  const context = useContext(SchoolYearContext)
  if (!context) {
    throw new Error('useSchoolYear must be used within a SchoolYearProvider')
  }
  return context
}

export const SchoolYearProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const [currentSchoolYear, setCurrentSchoolYear] = useState(null)
  const [schoolYears, setSchoolYears] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load school years only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Super admin has no school years -- skip tenant-scoped loading
      if (user?.isSuperAdmin) {
        setCurrentSchoolYear(null)
        setSchoolYears([])
        setIsLoading(false)
        setError(null)
        return
      }
      loadSchoolYears()
    } else {
      // Clear data when not authenticated
      setCurrentSchoolYear(null)
      setSchoolYears([])
      setIsLoading(false)
      setError(null)
    }
  }, [isAuthenticated, user?.isSuperAdmin])

  const loadSchoolYears = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load all school years
      const allSchoolYears = await apiService.schoolYears.getSchoolYears()
      setSchoolYears(allSchoolYears)

      // Get current school year
      const current = await apiService.schoolYears.getCurrentSchoolYear()
      
      if (current) {
        setCurrentSchoolYear(current)
      } else if (allSchoolYears.length > 0) {
        // Fallback to the most recent school year if no current one is set
        const mostRecent = allSchoolYears.sort((a, b) => 
          new Date(b.startDate) - new Date(a.startDate)
        )[0]
        setCurrentSchoolYear(mostRecent)
      }

      console.log(`🎓 Loaded ${allSchoolYears.length} school years, current: ${current?.name || 'None'}`)
    } catch (error) {
      console.error('Failed to load school years:', error)
      setError(error.message || 'שגיאה בטעינת שנות הלימוד')
    } finally {
      setIsLoading(false)
    }
  }

  const setCurrentSchoolYearById = async (schoolYearId) => {
    try {
      const schoolYear = schoolYears.find(sy => sy._id === schoolYearId)
      
      if (schoolYear) {
        setCurrentSchoolYear(schoolYear)
        console.log(`🎯 Switched to school year: ${schoolYear.name}`)
      } else {
        // Fetch the school year if not in current list
        const fetchedSchoolYear = await apiService.schoolYears.getSchoolYear(schoolYearId)
        setCurrentSchoolYear(fetchedSchoolYear)
        console.log(`🎯 Switched to fetched school year: ${fetchedSchoolYear.name}`)
      }
    } catch (error) {
      console.error('Failed to set school year:', error)
      setError(error.message || 'שגיאה בעדכון שנת הלימוד')
    }
  }

  const createSchoolYear = async (schoolYearData) => {
    try {
      const newSchoolYear = await apiService.schoolYears.createSchoolYear(schoolYearData)
      
      // Update local state
      setSchoolYears(prev => [...prev, newSchoolYear])
      
      // If this is set as current, update current school year
      if (schoolYearData.isCurrent) {
        setCurrentSchoolYear(newSchoolYear)
      }

      console.log(`➕ Created new school year: ${newSchoolYear.name}`)
      return newSchoolYear
    } catch (error) {
      console.error('Failed to create school year:', error)
      setError(error.message || 'שגיאה ביצירת שנת הלימוד')
      throw error
    }
  }

  const updateSchoolYear = async (schoolYearId, schoolYearData) => {
    try {
      const updatedSchoolYear = await apiService.schoolYears.updateSchoolYear(schoolYearId, schoolYearData)
      
      // Update local state
      setSchoolYears(prev => prev.map(sy => 
        sy._id === schoolYearId ? updatedSchoolYear : sy
      ))
      
      // If this is the current school year, update it
      if (currentSchoolYear && currentSchoolYear._id === schoolYearId) {
        setCurrentSchoolYear(updatedSchoolYear)
      }

      console.log(`✏️ Updated school year: ${updatedSchoolYear.name}`)
      return updatedSchoolYear
    } catch (error) {
      console.error('Failed to update school year:', error)
      setError(error.message || 'שגיאה בעדכון שנת הלימוד')
      throw error
    }
  }

  const deleteSchoolYear = async (schoolYearId) => {
    try {
      await apiService.schoolYears.deleteSchoolYear(schoolYearId)
      
      // Update local state
      setSchoolYears(prev => prev.filter(sy => sy._id !== schoolYearId))
      
      // If this was the current school year, clear it
      if (currentSchoolYear && currentSchoolYear._id === schoolYearId) {
        const remaining = schoolYears.filter(sy => sy._id !== schoolYearId)
        if (remaining.length > 0) {
          setCurrentSchoolYear(remaining[0])
        } else {
          setCurrentSchoolYear(null)
        }
      }

      console.log(`🗑️ Deleted school year: ${schoolYearId}`)
    } catch (error) {
      console.error('Failed to delete school year:', error)
      setError(error.message || 'שגיאה במחיקת שנת הלימוד')
      throw error
    }
  }

  // Helper function to check if a school year is active
  const isSchoolYearActive = (schoolYear) => {
    if (!schoolYear) return false
    const now = new Date()
    const start = new Date(schoolYear.startDate)
    const end = new Date(schoolYear.endDate)
    return now >= start && now <= end && schoolYear.isActive
  }

  // Helper function to get school year display name
  const getSchoolYearDisplayName = (schoolYear) => {
    if (!schoolYear) return 'לא נבחרה שנה'
    
    const isCurrent = schoolYear.isCurrent
    const isActive = isSchoolYearActive(schoolYear)
    
    let displayName = schoolYear.name
    
    if (isCurrent) {
      displayName += ' (נוכחית)'
    } else if (isActive) {
      displayName += ' (פעילה)'
    }
    
    return displayName
  }

  const value = {
    // State
    currentSchoolYear,
    schoolYears,
    isLoading,
    error,
    
    // Actions
    loadSchoolYears,
    setCurrentSchoolYearById,
    createSchoolYear,
    updateSchoolYear,
    deleteSchoolYear,
    
    // Helper functions
    isSchoolYearActive,
    getSchoolYearDisplayName
  }

  return (
    <SchoolYearContext.Provider value={value}>
      {children}
    </SchoolYearContext.Provider>
  )
}

export default SchoolYearContext