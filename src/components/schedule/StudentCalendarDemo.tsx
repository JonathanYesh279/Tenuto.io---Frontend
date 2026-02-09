import React, { useState } from 'react'
import WeeklyStudentCalendar from './WeeklyStudentCalendar'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface DemoLesson {
  id: string
  instrumentName: string
  teacherName: string
  startTime: string
  endTime: string
  dayOfWeek: number
  location?: string
  roomNumber?: string
  lessonType: 'individual' | 'group' | 'orchestra' | 'theory'
}

const StudentCalendarDemo: React.FC = () => {
  // Single lesson scenario - Tuesday 14:30-15:15
  const singleLesson: DemoLesson[] = [
    {
      id: '1',
      instrumentName: 'חצוצרה',
      teacherName: 'יונתן ישעיהו',
      startTime: '14:30',
      endTime: '15:15',
      dayOfWeek: 2, // Tuesday (0=Sunday, 1=Monday, 2=Tuesday...)
      roomNumber: 'מחשבים',
      lessonType: 'individual'
    }
  ]

  // Multiple lessons scenario for comparison
  const multipleLessons: DemoLesson[] = [
    {
      id: '1',
      instrumentName: 'חצוצרה',
      teacherName: 'יונתן ישעיהו',
      startTime: '14:30',
      endTime: '15:15',
      dayOfWeek: 2, // Tuesday
      roomNumber: 'מחשבים',
      lessonType: 'individual'
    },
    {
      id: '2',
      instrumentName: 'תיאוריה',
      teacherName: 'רחל כהן',
      startTime: '16:00',
      endTime: '17:00',
      dayOfWeek: 0, // Sunday
      roomNumber: '5',
      lessonType: 'theory'
    },
    {
      id: '3',
      instrumentName: 'תזמורת נוער',
      teacherName: 'דוד לוי',
      startTime: '18:00',
      endTime: '19:30',
      dayOfWeek: 3, // Wednesday
      location: 'אולם הקונצרטים',
      lessonType: 'orchestra'
    }
  ]

  const [currentScenario, setCurrentScenario] = useState<'single' | 'multiple' | 'empty'>('single')
  const [isAutoDemo, setIsAutoDemo] = useState(false)
  const [demoTimer, setDemoTimer] = useState<NodeJS.Timeout | null>(null)

  const scenarios = {
    single: singleLesson,
    multiple: multipleLessons,
    empty: []
  }

  const scenarioLabels = {
    single: 'שיעור אחד בשבוע (המצב הנוכחי)',
    multiple: 'מספר שיעורים (לדוגמה)',
    empty: 'אין שיעורים'
  }

  const startAutoDemo = () => {
    if (isAutoDemo) {
      if (demoTimer) {
        clearInterval(demoTimer)
        setDemoTimer(null)
      }
      setIsAutoDemo(false)
      return
    }

    setIsAutoDemo(true)
    const scenarios = ['single', 'multiple', 'empty'] as const
    let currentIndex = 0

    const timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % scenarios.length
      setCurrentScenario(scenarios[currentIndex])
    }, 4000)

    setDemoTimer(timer)
  }

  const resetDemo = () => {
    if (demoTimer) {
      clearInterval(demoTimer)
      setDemoTimer(null)
    }
    setIsAutoDemo(false)
    setCurrentScenario('single')
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Demo Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            לוח זמנים שבועי לתלמיד - דמו
          </h1>
          <p className="text-gray-600">
            דמונסטרציה של לוח הזמנים שמתמודד עם לוח זמנים דליל (שיעור אחד בשבוע)
          </p>
        </div>

        {/* Current Scenario */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                תרחיש נוכחי: {scenarioLabels[currentScenario]}
              </h3>
              <p className="text-sm text-blue-700">
                {currentScenario === 'single' && 'מציג שיעור יחיד ביום שלישי'}
                {currentScenario === 'multiple' && 'מציג מספר שיעורים בימים שונים'}
                {currentScenario === 'empty' && 'מציג מצב ללא שיעורים'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 mb-1">שיעורים השבוע</div>
              <div className="text-2xl font-bold text-blue-900">
                {scenarios[currentScenario].length}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setCurrentScenario('single')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentScenario === 'single' 
                ? 'bg-primary-500 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            שיעור אחד
          </button>
          
          <button
            onClick={() => setCurrentScenario('multiple')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentScenario === 'multiple' 
                ? 'bg-primary-500 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            מספר שיעורים
          </button>
          
          <button
            onClick={() => setCurrentScenario('empty')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentScenario === 'empty' 
                ? 'bg-primary-500 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            אין שיעורים
          </button>

          <div className="flex gap-2 mr-auto">
            <button
              onClick={startAutoDemo}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isAutoDemo
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isAutoDemo ? (
                <>
                  <Pause className="w-4 h-4" />
                  עצור דמו
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  דמו אוטומטי
                </>
              )}
            </button>
            
            <button
              onClick={resetDemo}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              איפוס
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Display */}
      <WeeklyStudentCalendar 
        lessons={scenarios[currentScenario]}
        studentName="תלמיד לדוגמה"
        showHeader={true}
      />

      {/* Design Notes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">עקרונות עיצוב</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">✅ מה עובד טוב:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• תצוגה פשוטה כברירת מחדל לשיעור יחיד</li>
              <li>• מעבר חלק לתצוגה שבועית מלאה</li>
              <li>• הדגשת הימים עם שיעורים</li>
              <li>• מטפל בחן במצבי "אין תוכן"</li>
              <li>• תגובה למכשירים ניידים</li>
              <li>• סגנון חזותי עקבי</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">🎯 תכונות מרכזיות:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• זיהוי זמן נוכחי (8:00-20:00)</li>
              <li>• קוד צבע לפי סוג שיעור</li>
              <li>• מידע מלא על כל שיעור</li>
              <li>• הודעות מעודדות לתלמיד</li>
              <li>• מיטוב ללוחות זמנים דלילים</li>
              <li>• תמיכה בעברית מלאה</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentCalendarDemo