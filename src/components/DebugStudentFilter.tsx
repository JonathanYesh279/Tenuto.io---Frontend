import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/authContext.jsx'
import apiService, { teacherService } from '../services/apiService'

/**
 * Debug component to test student filtering
 * Add this temporarily to the Profile page to debug the student filtering issue
 */
export default function DebugStudentFilter() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      setDebugInfo(null)

      console.log('🔍 Debug: Starting student filter test...')

      // Get teacher profile
      const teacherProfile = await teacherService.getMyProfile()
      const studentIds = teacherProfile?.teaching?.studentIds || []

      console.log('🔍 Debug: Teacher student IDs:', studentIds)

      // Test the batch students API
      const students = await apiService.students.getBatchStudents(studentIds)

      console.log('🔍 Debug: Received students:', students)

      setDebugInfo({
        teacherId: user._id,
        expectedStudentIds: studentIds,
        expectedCount: studentIds.length,
        receivedStudents: students,
        receivedCount: Array.isArray(students) ? students.length : 0,
        correctlyFiltered: Array.isArray(students) && students.length === studentIds.length,
        studentsMatchIds: Array.isArray(students) ? students.every(s => studentIds.includes(s._id || s.id)) : false
      })

    } catch (error) {
      console.error('Debug error:', error)
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-2 border-red-300 bg-red-50 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-red-800 mb-2">Student Filter Debug Tool</h3>
      <p className="text-sm text-red-700 mb-3">This component helps debug the student filtering issue. Remove after testing.</p>
      
      <button
        onClick={runDebug}
        disabled={loading}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 mb-3"
      >
        {loading ? 'Testing...' : 'Test Student Filter'}
      </button>

      {debugInfo && (
        <div className="bg-white p-3 rounded border text-sm" dir="ltr">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}