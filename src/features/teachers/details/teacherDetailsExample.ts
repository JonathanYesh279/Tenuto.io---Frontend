/**
 * Teacher Details API Integration - Example Usage and Documentation
 * 
 * This file demonstrates how to use the teacher details system
 * with the actual backend data structure provided
 */

import { teacherDetailsApi } from '../../../services/teacherDetailsApi'

// Example teacher data matching the actual backend structure
const exampleTeacherData = {
  _id: "6880d12f5a3def220d8857d5",
  
  personalInfo: {
    fullName: "יונתן ישעיהו",
    phone: "0542395020",
    email: "yona279@gmail.com",
    address: "בר אילן 49 הרצליה"
  },
  
  roles: ["מורה"],
  
  professionalInfo: {
    instrument: "חצוצרה",
    isActive: true
  },
  
  isActive: true,
  
  conducting: {
    orchestraIds: []
  },
  
  orchestraIds: [], // Legacy field
  ensemblesIds: [],
  
  schoolYears: [
    {
      schoolYearId: "67e153be046a2782476d17fe",
      isActive: true
    }
  ],
  
  teaching: {
    studentIds: [
      "68813849abdf329e8afc264c",
      "68813849abdf329e8afc2648", 
      "68813849abdf329e8afc2654",
      "68813849abdf329e8afc2655"
    ],
    schedule: [] // Will be populated with actual lesson slots
  },
  
  timeBlocks: [
    {
      _id: "688bc392fb1d1bfedfa461b6",
      day: "שלישי",
      startTime: "14:00",
      endTime: "18:00",
      totalDuration: 240, // 4 hours
      location: "חדר מחשבים",
      notes: null,
      isActive: true,
      assignedLessons: [],
      recurring: {
        isRecurring: true,
        excludeDates: []
      },
      createdAt: new Date("2025-07-31T19:27:14.414Z"),
      updatedAt: new Date("2025-07-31T19:27:14.414Z")
    },
    {
      _id: "688bc392fb1d1bfedfa461b7", 
      day: "חמישי",
      startTime: "14:00",
      endTime: "18:00",
      totalDuration: 240, // 4 hours
      location: "חדר מחשבים",
      notes: null,
      isActive: true,
      assignedLessons: [],
      recurring: {
        isRecurring: true,
        excludeDates: []
      },
      createdAt: new Date("2025-07-31T19:27:14.948Z"),
      updatedAt: new Date("2025-07-31T19:27:14.948Z")
    }
  ],
  
  credentials: {
    email: "yona279@gmail.com",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    password: "$2b$10$SbkjN02OCzZgHaXfucC2cuLd09FoHsyQ5Uls3.QpQQRcyv4XSF0aq",
    passwordSetAt: new Date("2025-07-31T19:30:33.291Z"),
    lastLogin: new Date("2025-08-18T01:04:20.373Z")
  },
  
  createdAt: new Date("2025-07-23T12:10:23.422Z"),
  updatedAt: new Date("2025-08-18T01:04:20.373Z")
}

/**
 * API Usage Examples
 */
export const teacherDetailsExamples = {

  /**
   * Example 1: Fetch teacher details
   * Expected API call: GET /api/teacher/6880d12f5a3def220d8857d5
   */
  async fetchTeacherDetails() {
    console.log('=== Fetching Teacher Details ===')
    
    try {
      const teacher = await teacherDetailsApi.getTeacherDetails("6880d12f5a3def220d8857d5")
      
      console.log('✅ Teacher details fetched successfully:')
      console.log('Name:', teacher.personalInfo?.fullName)
      console.log('Instrument:', teacher.professionalInfo?.instrument)
      console.log('Students:', teacher.teaching?.studentIds?.length || 0)
      console.log('Time Blocks:', teacher.teaching?.timeBlocks?.length || 0)
      console.log('Active:', teacher.isActive)
      
      return teacher
    } catch (error) {
      console.error('❌ Failed to fetch teacher details:', error)
    }
  },

  /**
   * Example 2: Fetch teacher's students
   * Expected API calls: GET /api/teacher/6880d12f5a3def220d8857d5 + multiple /api/student/{id}
   */
  async fetchTeacherStudents() {
    console.log('=== Fetching Teacher Students ===')
    
    try {
      const students = await teacherDetailsApi.getTeacherStudents("6880d12f5a3def220d8857d5")
      
      console.log('✅ Students fetched successfully:')
      console.log('Total students:', students.length)
      students.forEach((student, index) => {
        console.log(`${index + 1}. ${student.personalInfo?.fullName || 'Unnamed'} (${student._id})`)
      })
      
      return students
    } catch (error) {
      console.error('❌ Failed to fetch students:', error)
    }
  },

  /**
   * Example 3: Update teacher personal information
   * Expected API call: PUT /api/teacher/6880d12f5a3def220d8857d5
   */
  async updatePersonalInfo() {
    console.log('=== Updating Teacher Personal Info ===')
    
    try {
      const updatedData = {
        phone: "0542395021", // Updated phone
        address: "בר אילן 50 הרצליה" // Updated address
      }
      
      const result = await teacherDetailsApi.updateTeacherPersonalInfo(
        "6880d12f5a3def220d8857d5", 
        updatedData
      )
      
      console.log('✅ Personal info updated successfully')
      return result
    } catch (error) {
      console.error('❌ Failed to update personal info:', error)
    }
  },

  /**
   * Example 4: Add new time block
   * Expected API call: POST /api/teacher/6880d12f5a3def220d8857d5/timeblock
   */
  async addTimeBlock() {
    console.log('=== Adding New Time Block ===')
    
    try {
      const newTimeBlock = {
        day: "ראשון",
        startTime: "16:00",
        endTime: "19:00",
        location: "חדר פסנתר",
        notes: "זמן נוסף לשיעורים פרטיים",
        isActive: true
      }
      
      const result = await teacherDetailsApi.addTimeBlock(
        "6880d12f5a3def220d8857d5",
        newTimeBlock
      )
      
      console.log('✅ Time block added successfully')
      return result
    } catch (error) {
      console.error('❌ Failed to add time block:', error)
    }
  },

  /**
   * Example 5: Schedule a new lesson
   * Expected API call: POST /api/teacher/6880d12f5a3def220d8857d5/schedule
   */
  async scheduleLesson() {
    console.log('=== Scheduling New Lesson ===')
    
    try {
      const lessonData = {
        studentId: "68813849abdf329e8afc264c",
        day: "שלישי",
        startTime: "14:30",
        duration: 45,
        location: "חדר מחשבים",
        notes: "שיעור חצוצרה למתחילים",
        startDate: new Date(),
        recurring: {
          isRecurring: true,
          excludeDates: []
        }
      }
      
      const result = await teacherDetailsApi.updateTeacherSchedule(
        "6880d12f5a3def220d8857d5",
        lessonData
      )
      
      console.log('✅ Lesson scheduled successfully')
      return result
    } catch (error) {
      console.error('❌ Failed to schedule lesson:', error)
    }
  },

  /**
   * Example 6: Get teacher statistics
   * Expected API call: GET /api/analytics/teacher/6880d12f5a3def220d8857d5
   */
  async getStatistics() {
    console.log('=== Fetching Teacher Statistics ===')
    
    try {
      const dateRange = {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date()
      }
      
      const stats = await teacherDetailsApi.getTeacherStatistics(
        "6880d12f5a3def220d8857d5",
        dateRange
      )
      
      console.log('✅ Statistics fetched successfully:')
      console.log('Total Students:', stats.totalStudents)
      console.log('Weekly Hours:', stats.weeklyHours)
      console.log('Utilization Rate:', stats.utilizationRate)
      
      return stats
    } catch (error) {
      console.error('❌ Failed to fetch statistics:', error)
    }
  },

  /**
   * Example 7: Create new teacher
   * Expected API call: POST /api/teacher
   */
  async createNewTeacher() {
    console.log('=== Creating New Teacher ===')
    
    try {
      const newTeacherData = {
        personalInfo: {
          fullName: "שרה כהן",
          phone: "0541234567",
          email: "sarah.cohen@example.com",
          address: "רחוב הרצל 10 תל אביב"
        },
        roles: ["מורה"],
        professionalInfo: {
          instrument: "כינור",
          isActive: true
        },
        isActive: true,
        teaching: {
          studentIds: [],
          schedule: []
        },
        timeBlocks: [
          {
            day: "ראשון",
            startTime: "15:00", 
            endTime: "18:00",
            location: "חדר כינור",
            isActive: true
          }
        ]
      }
      
      const result = await teacherDetailsApi.createTeacher(
        newTeacherData,
        "admin_user_id"
      )
      
      console.log('✅ New teacher created successfully:')
      console.log('ID:', result._id)
      console.log('Invitation Mode:', result.invitationInfo?.mode)
      
      if (result.invitationInfo?.defaultPassword) {
        console.log('Default Password:', result.invitationInfo.defaultPassword)
      }
      
      return result
    } catch (error) {
      console.error('❌ Failed to create teacher:', error)
    }
  }
}

/**
 * React Hook Usage Examples
 */
export const reactHookExamples = {
  
  // Basic teacher details usage
  basicUsage: `
    import { useTeacherDetails } from '../features/teachers/details/hooks/useTeacherDetailsHooks'
    
    const TeacherComponent = ({ teacherId }) => {
      const { teacher, isLoading, error, refetch } = useTeacherDetails(teacherId)
      
      if (isLoading) return <div>טוען...</div>
      if (error) return <div>שגיאה: {error.message}</div>
      if (!teacher) return <div>מורה לא נמצא</div>
      
      return (
        <div>
          <h1>{teacher.personalInfo?.fullName}</h1>
          <p>כלי: {teacher.professionalInfo?.instrument}</p>
          <p>תלמידים: {teacher.teaching?.studentIds?.length || 0}</p>
          <p>בלוקי זמן: {teacher.teaching?.timeBlocks?.length || 0}</p>
        </div>
      )
    }
  `,

  // Teacher students management
  studentsManagement: `
    import { useTeacherStudents, useAddStudentToTeacher } from '../hooks/useTeacherDetailsHooks'
    
    const TeacherStudentsComponent = ({ teacherId }) => {
      const { students, isLoading } = useTeacherStudents(teacherId)
      const addStudent = useAddStudentToTeacher()
      
      const handleAddStudent = async (studentId) => {
        try {
          await addStudent.mutateAsync({ teacherId, studentId })
        } catch (error) {
          console.error('Failed to add student:', error)
        }
      }
      
      return (
        <div>
          <h2>תלמידי המורה ({students?.length || 0})</h2>
          {students?.map(student => (
            <div key={student._id}>
              {student.personalInfo?.fullName}
            </div>
          ))}
        </div>
      )
    }
  `,

  // Schedule management
  scheduleManagement: `
    import { useTeacherSchedule, useAddTimeBlock } from '../hooks/useTeacherDetailsHooks'
    
    const TeacherScheduleComponent = ({ teacherId }) => {
      const { schedule, isLoading } = useTeacherSchedule(teacherId)
      const addTimeBlock = useAddTimeBlock()
      
      const handleAddTimeBlock = async (timeBlockData) => {
        try {
          await addTimeBlock.mutateAsync({ teacherId, timeBlockData })
        } catch (error) {
          console.error('Failed to add time block:', error)
        }
      }
      
      return (
        <div>
          <h2>לוח זמנים</h2>
          <p>קיבולת שבועית: {schedule?.weeklyCapacity} שעות</p>
          <p>ניצול: {schedule?.utilizationRate}%</p>
          
          {schedule?.timeBlocks?.map(block => (
            <div key={block._id}>
              {block.day} {block.startTime}-{block.endTime} ({block.location})
            </div>
          ))}
        </div>
      )
    }
  `
}

/**
 * Expected API Endpoints and Data Flow
 */
export const apiEndpointsDocumentation = {
  
  // GET endpoints
  getTeacher: {
    method: 'GET',
    url: '/api/teacher/:teacherId',
    description: 'Fetch complete teacher details',
    example: '/api/teacher/6880d12f5a3def220d8857d5',
    expectedResponse: exampleTeacherData
  },

  getAllTeachers: {
    method: 'GET', 
    url: '/api/teacher',
    description: 'Fetch all teachers with optional filtering',
    queryParams: {
      name: 'Filter by teacher name',
      instrument: 'Filter by instrument',
      isActive: 'Filter by active status',
      studentId: 'Find teachers of specific student',
      orchestraId: 'Find teachers conducting specific orchestra'
    }
  },

  getTeacherStudents: {
    method: 'GET',
    url: '/api/student/:studentId (multiple calls)',
    description: 'Fetch details of all students assigned to teacher',
    note: 'Uses teacher.teaching.studentIds array to fetch individual student details'
  },

  // POST/PUT endpoints
  createTeacher: {
    method: 'POST',
    url: '/api/teacher',
    description: 'Create new teacher with invitation system',
    payload: 'Full teacher object',
    response: 'Created teacher + invitation info'
  },

  updateTeacher: {
    method: 'PUT', 
    url: '/api/teacher/:teacherId',
    description: 'Update teacher information',
    payload: 'Partial teacher data to update'
  },

  addTimeBlock: {
    method: 'POST',
    url: '/api/teacher/:teacherId/timeblock',
    description: 'Add new time block to teacher schedule',
    payload: 'Time block data'
  },

  scheduleLesson: {
    method: 'POST',
    url: '/api/teacher/:teacherId/schedule', 
    description: 'Schedule a lesson with student',
    payload: 'Lesson scheduling data'
  },

  // DELETE endpoints
  removeTeacher: {
    method: 'DELETE',
    url: '/api/teacher/:teacherId',
    description: 'Deactivate teacher (soft delete)',
    note: 'Sets isActive to false instead of hard delete'
  }
}

/**
 * Key Features Implemented:
 * 
 * ✅ Complete Teacher Details API Integration
 * ✅ React Hooks with TanStack Query
 * ✅ Real Backend Data Structure Support
 * ✅ Time Block Management
 * ✅ Student Assignment Management
 * ✅ Statistics and Analytics
 * ✅ Teacher Creation with Invitation System
 * ✅ Comprehensive Error Handling
 * ✅ Hebrew UI Support
 * ✅ Optimistic Updates
 * ✅ Cache Management
 * ✅ Data Transformation Utilities
 * ✅ Duplicate Detection Support
 * ✅ Schedule Conflict Detection
 * ✅ Professional Teacher Details Page UI
 */

console.log('Teacher Details System Ready!')
console.log('Example teacher data:', exampleTeacherData)

export { exampleTeacherData }