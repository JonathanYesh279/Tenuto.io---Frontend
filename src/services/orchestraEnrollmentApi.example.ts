/**
 * Orchestra Enrollment API - Example Usage and Test Scenarios
 * 
 * This file demonstrates how to use the orchestra enrollment API
 * with real-world scenarios and expected backend interactions
 */

import { orchestraEnrollmentApi } from './orchestraEnrollmentApi'

// Example current student data (from requirements)
const currentStudentData = {
  _id: "66e36f123456789abcdef012",
  personalInfo: {
    fullName: "דוד כהן"
  },
  orchestraIds: ["6883badc14f0fcfae92ac453"], // One orchestra enrolled
  ensembleIds: [], // No ensembles
  instrumentProgress: [
    {
      instrumentName: "חצוצרה",
      level: "מתחיל"
    }
  ],
  teacherAssignments: [
    {
      teacherId: "6880d12f5a3def220d8857d5",
      day: "שלישי",  // Tuesday
      startTime: "14:30",
      duration: 45
    }
  ]
}

// Example orchestra data that would be returned from API
const exampleOrchestras = [
  {
    _id: "6883badc14f0fcfae92ac453",
    name: "תזמורת מתחילים",
    conductor: "דן כהן",
    description: "תזמורת למוזיקאים מתחילים המתמחה במוזיקה קלאסית",
    level: "beginner" as const,
    instruments: ["חצוצרה", "חליל", "כינור", "צ'לו", "פסנתר"],
    rehearsalTimes: [
      {
        day: "חמישי",
        dayOfWeek: 4,
        startTime: "16:00",
        endTime: "17:30",
        location: "אולם ראשי"
      }
    ],
    maxMembers: 30,
    currentMembers: 15,
    isActive: true,
    yearlyFee: 500
  },
  {
    _id: "orchestra_2_id",
    name: "תזמורת נוער",
    conductor: "שרה לוי",
    description: "תזמורת לנוער בגילאי 12-18",
    level: "intermediate" as const,
    instruments: ["חצוצרה", "טרומבון", "חליל", "קלרינט", "סקסופון"],
    rehearsalTimes: [
      {
        day: "שלישי", // Same day as student's lesson - CONFLICT!
        dayOfWeek: 2,
        startTime: "15:00", // Overlaps with lesson end time (15:15)
        endTime: "16:30",
        location: "אולם מספר 2"
      }
    ],
    maxMembers: 40,
    currentMembers: 35,
    isActive: true,
    yearlyFee: 750
  }
]

// Example ensemble data
const exampleEnsembles = [
  {
    _id: "ensemble_1_id",
    name: "חמישיית נחושת",
    director: "יוסי ברק",
    description: "הרכב קאמרי לכלי נחושת",
    type: "chamber" as const,
    instruments: ["חצוצרה", "קרן", "טרומבון", "טובה"],
    rehearsalTimes: [
      {
        day: "ראשון",
        dayOfWeek: 0,
        startTime: "19:00",
        endTime: "20:30",
        location: "חדר חזרות א'"
      }
    ],
    maxMembers: 5,
    currentMembers: 4,
    isActive: true,
    yearlyFee: 300
  }
]

/**
 * Test Scenarios and Expected API Interactions
 */

export const testScenarios = {
  
  /**
   * Scenario 1: Student currently enrolled in one orchestra
   * Expected: Should fetch orchestra details successfully
   */
  async getCurrentEnrollments() {
    console.log('=== Test Scenario 1: Get Current Enrollments ===')
    
    try {
      // API Call: GET /api/orchestra/6883badc14f0fcfae92ac453
      const orchestras = await orchestraEnrollmentApi.getCurrentOrchestraEnrollments(
        currentStudentData.orchestraIds
      )
      
      console.log('✅ Successfully fetched current orchestras:', orchestras)
      return orchestras
    } catch (error) {
      console.error('❌ Failed to fetch current enrollments:', error)
    }
  },

  /**
   * Scenario 2: Check eligibility for new orchestra
   * Expected: Should pass for ensemble (no conflicts), fail for conflicting orchestra
   */
  async checkEligibility() {
    console.log('=== Test Scenario 2: Check Enrollment Eligibility ===')
    
    try {
      // Check eligibility for ensemble (should pass)
      const ensembleEligibility = await orchestraEnrollmentApi.checkEnsembleEligibility(
        currentStudentData._id, 
        "ensemble_1_id",
        currentStudentData
      )
      
      console.log('Ensemble eligibility (should be eligible):', ensembleEligibility)
      
      // Check eligibility for conflicting orchestra (should fail due to schedule conflict)
      const orchestraEligibility = await orchestraEnrollmentApi.checkOrchestraEligibility(
        currentStudentData._id,
        "orchestra_2_id", 
        currentStudentData
      )
      
      console.log('Orchestra eligibility (should have conflicts):', orchestraEligibility)
      
      return { ensembleEligibility, orchestraEligibility }
    } catch (error) {
      console.error('❌ Eligibility check failed:', error)
    }
  },

  /**
   * Scenario 3: Attempt to enroll in ensemble (should succeed)
   * Expected: PUT /api/student/66e36f123456789abcdef012 with updated ensembleIds
   */
  async enrollInEnsemble() {
    console.log('=== Test Scenario 3: Enroll in Ensemble ===')
    
    try {
      await orchestraEnrollmentApi.addEnsembleEnrollment(
        currentStudentData._id,
        "ensemble_1_id"
      )
      
      console.log('✅ Successfully enrolled in ensemble')
    } catch (error) {
      console.error('❌ Ensemble enrollment failed:', error)
    }
  },

  /**
   * Scenario 4: Attempt to enroll in conflicting orchestra (should fail)
   * Expected: Should be rejected due to eligibility check
   */
  async enrollInConflictingOrchestra() {
    console.log('=== Test Scenario 4: Enroll in Conflicting Orchestra ===')
    
    try {
      await orchestraEnrollmentApi.addOrchestraEnrollment(
        currentStudentData._id,
        "orchestra_2_id"
      )
      
      console.log('❌ Unexpectedly succeeded - should have been blocked!')
    } catch (error) {
      console.log('✅ Correctly blocked conflicting enrollment:', error.message)
    }
  },

  /**
   * Scenario 5: Remove existing enrollment (should succeed)
   * Expected: PUT /api/student/66e36f123456789abcdef012 with updated orchestraIds
   */
  async removeExistingEnrollment() {
    console.log('=== Test Scenario 5: Remove Existing Enrollment ===')
    
    try {
      await orchestraEnrollmentApi.removeOrchestraEnrollment(
        currentStudentData._id,
        "6883badc14f0fcfae92ac453"
      )
      
      console.log('✅ Successfully removed orchestra enrollment')
    } catch (error) {
      console.error('❌ Failed to remove enrollment:', error)
    }
  },

  /**
   * Scenario 6: Attempt duplicate enrollment (should fail)
   * Expected: Should detect already enrolled and reject
   */
  async attemptDuplicateEnrollment() {
    console.log('=== Test Scenario 6: Attempt Duplicate Enrollment ===')
    
    try {
      await orchestraEnrollmentApi.addOrchestraEnrollment(
        currentStudentData._id,
        "6883badc14f0fcfae92ac453" // Already enrolled
      )
      
      console.log('❌ Unexpectedly succeeded - should have been blocked!')
    } catch (error) {
      console.log('✅ Correctly blocked duplicate enrollment:', error.message)
    }
  }
}

/**
 * Expected API Endpoints and Payloads
 */
export const expectedApiCalls = {
  
  // GET requests for fetching data
  fetchOrchestra: {
    method: 'GET',
    url: '/api/orchestra/6883badc14f0fcfae92ac453',
    expectedResponse: exampleOrchestras[0]
  },

  fetchAllOrchestras: {
    method: 'GET', 
    url: '/api/orchestra',
    expectedResponse: exampleOrchestras
  },

  fetchTeacher: {
    method: 'GET',
    url: '/api/teacher/6880d12f5a3def220d8857d5',
    expectedResponse: {
      _id: "6880d12f5a3def220d8857d5",
      name: "יונתן ישעיהו",
      timeBlocks: [
        {
          day: "שלישי",
          startTime: "14:00",
          endTime: "17:00", 
          location: "חדר מחשבים"
        }
      ]
    }
  },

  // PUT requests for enrollment changes
  enrollInOrchestra: {
    method: 'PUT',
    url: '/api/student/66e36f123456789abcdef012',
    payload: {
      orchestraIds: ["6883badc14f0fcfae92ac453", "new_orchestra_id"]
    }
  },

  unenrollFromOrchestra: {
    method: 'PUT', 
    url: '/api/student/66e36f123456789abcdef012',
    payload: {
      orchestraIds: [] // Removed the existing orchestra
    }
  },

  enrollInEnsemble: {
    method: 'PUT',
    url: '/api/student/66e36f123456789abcdef012', 
    payload: {
      ensembleIds: ["ensemble_1_id"]
    }
  }
}

/**
 * Error Handling Test Cases
 */
export const errorTestCases = {
  
  // Network errors
  networkTimeout: {
    scenario: 'Network timeout during enrollment',
    expectedError: {
      code: 'NETWORK_ERROR',
      message: 'הבקשה נכשלה - פג זמן ההמתנה'
    }
  },

  // Authorization errors  
  unauthorized: {
    scenario: 'User not authorized to modify enrollment',
    expectedError: {
      code: 'UNAUTHORIZED',
      message: 'נדרשת התחברות מחדש למערכת'
    }
  },

  // Validation errors
  orchestraFull: {
    scenario: 'Orchestra at maximum capacity',
    expectedError: {
      code: 'ENROLLMENT_NOT_ELIGIBLE',
      message: 'לא ניתן להרשם: התזמורת מלאה - אין מקומות זמינים'
    }
  },

  scheduleConflict: {
    scenario: 'Rehearsal conflicts with existing lesson',
    expectedError: {
      code: 'ENROLLMENT_NOT_ELIGIBLE', 
      message: 'לא ניתן להרשם: יש התנגשות עם השיעורים הקיימים שלך'
    }
  },

  instrumentMismatch: {
    scenario: 'Student instrument not compatible with orchestra',
    expectedError: {
      code: 'ENROLLMENT_NOT_ELIGIBLE',
      message: 'לא ניתן להרשם: הכלי שלך (חצוצרה) לא מתאים לתזמורת זו'
    }
  }
}

/**
 * Usage Examples for React Components
 */
export const reactUsageExamples = {
  
  // Basic enrollment management
  basicUsage: `
    import { useEnrollmentManager } from '../hooks/useOrchestraEnrollment'
    
    const MyComponent = ({ studentId }) => {
      const enrollment = useEnrollmentManager(studentId)
      
      const handleEnroll = async (orchestraId) => {
        try {
          await enrollment.enrollInOrchestra(orchestraId)
          toast.success('נרשמת בהצלחה!')
        } catch (error) {
          toast.error(error.message)
        }
      }
      
      return (
        <div>
          {enrollment.availableOrchestras.map(orchestra => (
            <div key={orchestra._id}>
              <h3>{orchestra.name}</h3>
              <button onClick={() => handleEnroll(orchestra._id)}>
                הירשם
              </button>
            </div>
          ))}
        </div>
      )
    }
  `,

  // With eligibility checking
  eligibilityChecking: `
    import { useOrchestraEligibility } from '../hooks/useOrchestraEnrollment'
    
    const OrchestraCard = ({ studentId, orchestra }) => {
      const eligibility = useOrchestraEligibility(studentId, orchestra._id)
      
      if (!eligibility.data?.canEnroll) {
        return (
          <div className="opacity-50">
            <h3>{orchestra.name}</h3>
            <p>לא זמין: {eligibility.data?.reasons.join(', ')}</p>
            {eligibility.data?.conflicts.map(conflict => (
              <div key={conflict.conflictWith} className="text-red-600">
                התנגשות: {conflict.conflictWith}
              </div>
            ))}
          </div>
        )
      }
      
      return (
        <div>
          <h3>{orchestra.name}</h3>
          <button>הירשם עכשיו</button>
        </div>
      )
    }
  `
}

export { exampleOrchestras, exampleEnsembles, currentStudentData }