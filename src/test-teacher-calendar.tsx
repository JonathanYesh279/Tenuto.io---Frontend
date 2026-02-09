/**
 * Test the new TeacherWeeklyCalendar component
 */

import TeacherWeeklyCalendar from './components/schedule/TeacherWeeklyCalendar'

// Mock teacher data with time blocks and conducting activities
const mockTeacher = {
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
    orchestraIds: ["orch1", "orch2"],
    ensemblesIds: ["ens1"]
  },
  teaching: {
    studentIds: [
      "68813849abdf329e8afc264c",
      "68813849abdf329e8afc2648", 
      "68813849abdf329e8afc2654",
      "68813849abdf329e8afc2655"
    ],
    schedule: [
      {
        _id: "sched1",
        day: "שלישי",
        startTime: "15:00",
        endTime: "15:45",
        duration: 45,
        studentId: "68813849abdf329e8afc264c",
        location: "חדר 1"
      }
    ],
    timeBlocks: [
      {
        _id: "688bc392fb1d1bfedfa461b6",
        day: "שלישי",
        startTime: "14:00",
        endTime: "18:00",
        totalDuration: 240,
        location: "חדר מחשבים",
        notes: undefined,
        isActive: true,
        assignedLessons: [
          {
            studentName: "דני כהן",
            instrumentName: "חצוצרה",
            startTime: "14:30",
            endTime: "15:15",
            location: "חדר 1"
          },
          {
            studentName: "מיכל לוי",
            instrumentName: "חצוצרה",
            startTime: "15:30",
            endTime: "16:15",
            location: "חדר 1"
          }
        ]
      },
      {
        _id: "688bc392fb1d1bfedfa461b7", 
        day: "חמישי",
        startTime: "14:00",
        endTime: "18:00",
        totalDuration: 240,
        location: "חדר מחשבים",
        notes: undefined,
        isActive: true,
        assignedLessons: []
      }
    ]
  }
}

// Mock orchestra activities
const mockOrchestraActivities = [
  {
    _id: "orch1-rehearsal",
    name: "תזמורת הנוער",
    day: "ראשון",
    startTime: "16:00",
    endTime: "18:00",
    location: "אולם התזמורת",
    participants: 25,
    type: "orchestra" as const
  },
  {
    _id: "ens1-rehearsal",
    name: "אנסמבל כלי נשיפה",
    day: "רביעי",
    startTime: "19:00",
    endTime: "20:30",
    location: "חדר 5",
    participants: 8,
    type: "ensemble" as const
  }
]

const TestTeacherCalendar = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">בדיקת לוח הזמנים החדש</h1>
          <p className="text-gray-600 mt-2">
            בדיקת רכיב לוח הזמנים השבועי החדש עם פעילויות המורה
          </p>
        </div>
        
        <TeacherWeeklyCalendar
          teacher={mockTeacher}
          timeBlocks={mockTeacher.teaching?.timeBlocks || []}
          orchestraActivities={mockOrchestraActivities}
          className=""
          showNavigation={true}
        />
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">נתוני הבדיקה</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">בלוקי זמן</h3>
              <p className="text-gray-600">{mockTeacher.teaching?.timeBlocks?.length || 0} בלוקים</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">שיעורים מתוכננים</h3>
              <p className="text-gray-600">
                {mockTeacher.teaching?.timeBlocks?.reduce((total, block) => 
                  total + (block.assignedLessons?.length || 0), 0
                ) || 0} שיעורים
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">הרכבים</h3>
              <p className="text-gray-600">{mockOrchestraActivities.length} הרכבים</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestTeacherCalendar