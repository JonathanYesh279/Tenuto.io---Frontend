import React, { useState } from 'react'
import OrchestraEnrollmentManager from '../components/OrchestraEnrollmentManager'
import { Users, RefreshCw } from 'lucide-react'

const OrchestraEnrollmentDemo: React.FC = () => {
  // Mock data - Current enrollments
  const [currentEnrollments, setCurrentEnrollments] = useState([
    {
      id: 'enrollment-1',
      orchestraId: 'youth-orchestra',
      orchestraName: 'תזמורת הנוער',
      conductorName: 'דוד לוי',
      rehearsalDay: 'Wednesday',
      rehearsalTime: '18:00-19:30',
      instrumentSection: 'נשיפה',
      enrollmentDate: new Date('2024-09-01'),
      type: 'orchestra' as const
    }
  ])

  // Mock data - Available orchestras
  const [availableOrchestras] = useState([
    {
      id: 'chamber-orchestra',
      name: 'תזמורת קאמרית',
      conductorName: 'רחל כהן',
      rehearsalDay: 'Monday',
      rehearsalTime: '17:00-18:30',
      type: 'orchestra' as const,
      currentEnrollment: 18,
      maxEnrollment: 25,
      instrumentSections: ['מיתרים', 'נשיפה', 'כלי הקשה']
    },
    {
      id: 'brass-ensemble',
      name: 'הרכב נחושת',
      conductorName: 'יונתן ישעיהו',
      rehearsalDay: 'Tuesday',
      rehearsalTime: '16:00-17:00',
      type: 'ensemble' as const,
      currentEnrollment: 8,
      maxEnrollment: 12,
      instrumentSections: ['חצוצרה', 'חרן', 'טרומבון', 'טובה']
    },
    {
      id: 'string-ensemble',
      name: 'הרכב מיתרים',
      conductorName: 'מרים גולד',
      rehearsalDay: 'Thursday',
      rehearsalTime: '15:00-16:30',
      type: 'ensemble' as const,
      currentEnrollment: 15,
      maxEnrollment: 16,
      instrumentSections: ['כינור', 'ויולה', 'צ\'לו', 'קונטרבס']
    },
    {
      id: 'wind-orchestra',
      name: 'תזמורת נשיפה',
      conductorName: 'אלי שמיר',
      rehearsalDay: 'Sunday',
      rehearsalTime: '10:00-12:00',
      type: 'orchestra' as const,
      currentEnrollment: 30,
      maxEnrollment: 35,
      instrumentSections: ['נשיפה עץ', 'נשיפה נחושת', 'כלי הקשה']
    },
    {
      id: 'full-orchestra',
      name: 'תזמורת מלאה - מתקדמים',
      conductorName: 'משה דנון',
      rehearsalDay: 'Friday',
      rehearsalTime: '16:00-18:30',
      type: 'orchestra' as const,
      currentEnrollment: 45,
      maxEnrollment: 45, // Full
      instrumentSections: ['כל הכלים']
    }
  ])

  // Mock conflicts - simulate rehearsal conflicts
  const conflicts = [
    {
      orchestraId: 'brass-ensemble',
      conflictsWith: 'שיעור חצוצרה',
      conflictTime: 'יום שלישי 14:30',
      severity: 'warning' as const
    }
  ]

  // Mock enrollment function
  const handleEnroll = async (orchestraId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const orchestra = availableOrchestras.find(o => o.id === orchestraId)
        if (orchestra) {
          const newEnrollment = {
            id: `enrollment-${Date.now()}`,
            orchestraId: orchestra.id,
            orchestraName: orchestra.name,
            conductorName: orchestra.conductorName,
            rehearsalDay: orchestra.rehearsalDay,
            rehearsalTime: orchestra.rehearsalTime,
            instrumentSection: orchestra.instrumentSections?.[0],
            enrollmentDate: new Date(),
            type: orchestra.type
          }
          setCurrentEnrollments(prev => [...prev, newEnrollment])
        }
        resolve()
      }, 1000) // Simulate API call
    })
  }

  // Mock unenrollment function
  const handleUnenroll = async (enrollmentId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setCurrentEnrollments(prev => prev.filter(e => e.id !== enrollmentId))
        resolve()
      }, 800) // Simulate API call
    })
  }

  // Reset demo data
  const resetDemo = () => {
    setCurrentEnrollments([
      {
        id: 'enrollment-1',
        orchestraId: 'youth-orchestra',
        orchestraName: 'תזמורת הנוער',
        conductorName: 'דוד לוי',
        rehearsalDay: 'Wednesday',
        rehearsalTime: '18:00-19:30',
        instrumentSection: 'נשיפה',
        enrollmentDate: new Date('2024-09-01'),
        type: 'orchestra' as const
      }
    ])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ניהול הרשמות לתזמורות והרכבים
                </h1>
                <p className="text-gray-600 mt-1">
                  ממשק לניהול הרשמות התלמיד לתזמורות והרכבים שונים
                </p>
              </div>
            </div>
            
            <button
              onClick={resetDemo}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              איפוס דמו
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <OrchestraEnrollmentManager
          studentId="demo-student"
          currentEnrollments={currentEnrollments}
          availableOrchestras={availableOrchestras}
          conflicts={conflicts}
          onEnroll={handleEnroll}
          onUnenroll={handleUnenroll}
        />
      </div>

      {/* Demo Information */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">תכונות הדמו</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🎯 ניהול הרשמות</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• הצגת הרשמות נוכחיות</li>
                <li>• הסרת הרשמות עם אישור</li>
                <li>• הוספת הרשמות חדשות</li>
                <li>• מעקב אחר מקומות פנויים</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">⚠️ זיהוי התנגשויות</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• התראה על חפיפות זמן</li>
                <li>• חסימת הרשמה במקרה התנגשות</li>
                <li>• מידע על סוג ההתנגשות</li>
                <li>• הצגת פרטי הקונפליקט</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📱 עיצוב רספונסיבי</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• הסתגלות למסכים קטנים</li>
                <li>• כרטיסים במלוא הרוחב</li>
                <li>• כפתורי מגע נוחים</li>
                <li>• תפריט סינון מותאם</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrchestraEnrollmentDemo