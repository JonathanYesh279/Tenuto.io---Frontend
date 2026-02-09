/**
 * Example data and test for Calendar Data Processor
 * 
 * This demonstrates how the actual backend data should be processed
 * into calendar events for the schedule display.
 */

import { calendarDataProcessor } from './calendarDataProcessor'

// Example student data matching the actual backend structure
const exampleStudentData = {
  _id: "66e36f123456789abcdef012",
  personalInfo: {
    fullName: "דוד כהן"
  },
  
  // Single lesson assignment (Tuesday trumpet lesson)
  teacherAssignments: [
    {
      teacherId: "6880d12f5a3def220d8857d5",
      day: "שלישי",  // Tuesday in Hebrew
      startTime: "14:30",
      duration: 45,  // 45 minutes
      instrumentName: "חצוצרה"  // trumpet
    }
  ],
  
  // Orchestra enrollment (optional)
  orchestraEnrollments: ["6883badc14f0fcfae92ac453"],
  
  // Instrument progress (for fallback instrument name)
  instrumentProgress: [
    {
      instrumentName: "חצוצרה",
      level: "מתחיל"
    }
  ]
}

// Example teacher data 
const exampleTeacherData = {
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

// Example orchestra data
const exampleOrchestraData = {
  _id: "6883badc14f0fcfae92ac453", 
  name: "תזמורת מתחילים",
  rehearsalTimes: [
    {
      day: "חמישי",  // Thursday
      startTime: "16:00",
      duration: 90,  // 90 minutes
      location: "אולם ראשי"
    }
  ]
}

// Expected output format (CalendarEvent array)
const expectedCalendarEvents = [
  // Trumpet lesson event
  {
    _id: "lesson-6880d12f5a3def220d8857d5-שלישי",
    title: "חצוצרה - יונתן ישעיהו",
    day: "שלישי",
    dayOfWeek: 2,  // Tuesday = 2 (0=Sunday)
    startTime: "14:30",
    endTime: "15:15",  // 14:30 + 45 minutes = 15:15
    location: "חדר מחשבים",
    lessonType: "individual",
    teacherName: "יונתן ישעיהו",
    instrumentName: "חצוצרה",
    roomNumber: "חדר מחשבים"
  },
  
  // Orchestra rehearsal event
  {
    _id: "orchestra-6883badc14f0fcfae92ac453-חמישי",
    title: "תזמורת - תזמורת מתחילים",
    day: "חמישי",
    dayOfWeek: 4,  // Thursday = 4
    startTime: "16:00",
    endTime: "17:30",  // 16:00 + 90 minutes = 17:30
    location: "אולם ראשי",
    lessonType: "orchestra",
    teacherName: "תזמורת",
    instrumentName: "תזמורת",
    roomNumber: "אולם ראשי"
  }
]

/**
 * This demonstrates the key aspects of the implementation:
 * 
 * 1. Single lesson case: The student has one trumpet lesson on Tuesday
 *    - Most of the week (Sunday, Monday, Wednesday, Friday, Saturday) will be empty
 *    - Only Tuesday will have an event - this is normal!
 * 
 * 2. Data processing workflow:
 *    - Fetch teacher details using teacherId
 *    - Extract location from teacher's timeBlocks matching the day
 *    - Calculate end time (14:30 + 45 minutes = 15:15)
 *    - Create proper Hebrew title: "חצוצרה - יונתן ישעיהו"
 * 
 * 3. Orchestra handling:
 *    - Fetch orchestra details using orchestraId from enrollments
 *    - Process rehearsal times if they exist
 *    - Add to calendar as separate events
 * 
 * 4. Error handling:
 *    - If teacher/orchestra fetch fails, skip that event
 *    - Log errors but don't break the entire process
 *    - Some students may have no schedule data - that's valid!
 * 
 * Usage in components:
 * - ScheduleTab will show mostly empty days - this is expected
 * - Use the CalendarEvent interface for type safety
 * - Handle loading states and empty schedules gracefully
 */

console.log('Example Student Data:', exampleStudentData)
console.log('Expected Calendar Events:', expectedCalendarEvents)

export { exampleStudentData, exampleTeacherData, exampleOrchestraData, expectedCalendarEvents }