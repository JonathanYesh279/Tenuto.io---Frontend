/**
 * Emergency Data Sync Utility for Theory Lesson Enrollments
 * Use this to fix immediate data inconsistency between student and theory lesson documents
 */

import apiService from '../services/apiService'

/**
 * Sync theory lesson enrollments for a specific student
 * Makes theory lesson documents the source of truth
 */
export const syncStudentTheoryLessons = async (studentId) => {
  console.log(`🔧 Starting sync for student: ${studentId}`)
  
  try {
    // Step 1: Get all theory lessons
    const allLessons = await apiService.theoryLessons.getTheoryLessons()
    console.log(`📚 Found ${allLessons.length} total theory lessons`)
    
    // Step 2: Find lessons where this student is enrolled (based on lesson's studentIds)
    const enrolledLessons = allLessons.filter(lesson => 
      lesson.studentIds?.includes(studentId)
    )
    console.log(`🎯 Student is enrolled in ${enrolledLessons.length} lessons (based on theory lesson documents)`)
    
    // Step 3: Get current student data
    const student = await apiService.students.getStudent(studentId)
    const currentTheoryLessons = student.enrollments?.theoryLessonIds || student.theoryLessonIds || []
    console.log(`👤 Current student theoryLessonIds: [${currentTheoryLessons.join(', ')}]`)
    
    // Step 4: Extract the lesson IDs that should be in student document
    const correctLessonIds = enrolledLessons.map(lesson => lesson._id)
    console.log(`✅ Correct lesson IDs: [${correctLessonIds.join(', ')}]`)
    
    // Step 5: Update student document with correct theory lesson IDs using proper format
    const updatedData = {
      ...student,
      enrollments: {
        ...student.enrollments,
        theoryLessonIds: correctLessonIds,
        orchestraIds: student.enrollments?.orchestraIds || [],
        ensembleIds: student.enrollments?.ensembleIds || []
      }
    }
    
    console.log(`🔄 Updating student with data structure:`, { 
      enrollments: updatedData.enrollments 
    })
    
    await apiService.students.updateStudent(studentId, updatedData)
    console.log(`💾 Updated student document with ${correctLessonIds.length} theory lesson IDs`)
    
    return {
      success: true,
      studentId,
      syncedLessons: correctLessonIds.length,
      lessonIds: correctLessonIds,
      enrolledLessons: enrolledLessons.map(l => ({ id: l._id, title: l.title || l.name, category: l.category }))
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
    return {
      success: false,
      error: error.message,
      studentId
    }
  }
}

/**
 * Run sync from browser console for immediate fix
 * Usage: window.syncTheoryLessons('68813849abdf329e8afc2688')
 */
export const setupConsoleSync = () => {
  if (typeof window !== 'undefined') {
    window.syncTheoryLessons = async (studentId) => {
      console.log('🚀 Running theory lesson enrollment sync...')
      const result = await syncStudentTheoryLessons(studentId)
      
      if (result.success) {
        console.log('✅ SYNC SUCCESSFUL!')
        console.table(result.enrolledLessons)
        console.log(`Student ${studentId} is now correctly enrolled in ${result.syncedLessons} theory lessons`)
        alert(`Sync successful! Student is enrolled in ${result.syncedLessons} theory lessons. Refresh the page to see changes.`)
      } else {
        console.error('❌ SYNC FAILED:', result.error)
        alert(`Sync failed: ${result.error}`)
      }
      
      return result
    }
    
    console.log('🔧 Sync utility loaded. Use: window.syncTheoryLessons("STUDENT_ID")')
  }
}

// Auto-setup when imported
setupConsoleSync()

export default { syncStudentTheoryLessons, setupConsoleSync }