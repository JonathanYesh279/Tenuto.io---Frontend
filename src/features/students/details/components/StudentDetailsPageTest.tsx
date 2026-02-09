/**
 * Minimal Student Details Page for Testing Routing
 */

import { useParams } from 'react-router-dom'

const StudentDetailsPageTest: React.FC = () => {
  console.log('🟢 MINIMAL STUDENT DETAILS PAGE LOADING')
  const { studentId } = useParams<{ studentId: string }>()
  console.log('🔍 Student ID from params:', studentId)
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">פרטי תלמיד - בדיקה</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-lg">מזהה תלמיד: <strong>{studentId}</strong></p>
        <p className="text-green-600 mt-4">✅ הניווט עובד בהצלחה!</p>
        <p className="text-gray-600 mt-2">הגעת לעמוד פרטי התלמיד עם המזהה: {studentId}</p>
      </div>
    </div>
  )
}

export default StudentDetailsPageTest