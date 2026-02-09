import React, { useState } from 'react'
import WeeklyCalendarGrid from '../components/schedule/WeeklyCalendarGrid'
import { Play, Pause, RotateCcw, Calendar } from 'lucide-react'

const WeeklyCalendarDemo: React.FC = () => {
  // Demo lesson scenarios
  const singleLesson = [
    {
      id: 'trumpet-lesson',
      instrumentName: 'חצוצרה',
      teacherName: 'יונתן ישעיהו',
      startTime: '14:30',
      endTime: '15:15',
      dayOfWeek: 2, // Tuesday
      roomNumber: 'מחשבים',
      lessonType: 'individual' as const
    }
  ]

  const multipleLessons = [
    {
      id: 'trumpet-lesson',
      instrumentName: 'חצוצרה',
      teacherName: 'יונתן ישעיהו',
      startTime: '14:30',
      endTime: '15:15',
      dayOfWeek: 2, // Tuesday
      roomNumber: 'מחשבים',
      lessonType: 'individual' as const
    },
    {
      id: 'theory-lesson',
      instrumentName: 'תיאוריה',
      teacherName: 'רחל כהן',
      startTime: '16:00',
      endTime: '17:00',
      dayOfWeek: 0, // Sunday
      roomNumber: '5',
      lessonType: 'theory' as const
    },
    {
      id: 'orchestra-rehearsal',
      instrumentName: 'תזמורת נוער',
      teacherName: 'דוד לוי',
      startTime: '18:00',
      endTime: '19:30',
      dayOfWeek: 3, // Wednesday
      location: 'אולם הקונצרטים',
      lessonType: 'orchestra' as const
    },
    {
      id: 'group-lesson',
      instrumentName: 'נשיפה קבוצתית',
      teacherName: 'מרים גולד',
      startTime: '15:30',
      endTime: '16:30',
      dayOfWeek: 4, // Thursday
      roomNumber: '8',
      lessonType: 'group' as const
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
    single: 'שיעור אחד בשבוע (הנתונים הנוכחיים)',
    multiple: 'מספר שיעורים (דוגמה מורחבת)',
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary-600" />
              לוח זמנים שבועי - תצוגת רשת
            </h1>
            <p className="text-gray-600">
              לוח זמנים אמיתי עם רשת שעות מ-8:00 עד 20:00, ימים א׳-ו׳ ותמיכה בעברית RTL
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
                  {currentScenario === 'single' && 'מציג שיעור חצוצרה אחד ביום שלישי 14:30-15:15'}
                  {currentScenario === 'multiple' && 'מציג מספר סוגי שיעורים בימים שונים'}
                  {currentScenario === 'empty' && 'מציג רשת ריקה ללא שיעורים'}
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
              ריק
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
                    עצור
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

        {/* Calendar Grid Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <WeeklyCalendarGrid lessons={scenarios[currentScenario]} />
        </div>

        {/* Implementation Notes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">מאפיינים טכניים</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📚 ספרייה</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• react-big-calendar</li>
                <li>• moment.js לתאריכים</li>
                <li>• תמיכה בהעברית RTL</li>
                <li>• CSS מותאם אישית</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🕐 תצורת זמן</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• שעות: 8:00 - 20:00</li>
                <li>• ימים: א׳ - ו׳ (רק ימי לימוד)</li>
                <li>• רשת של 30 דקות</li>
                <li>• פורמט 24 שעות</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🎨 עיצוב</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• צבעים לפי סוג שיעור</li>
                <li>• רשת נקייה עם גבולות</li>
                <li>• מקרא צבעים</li>
                <li>• תגובה למובייל</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyCalendarDemo