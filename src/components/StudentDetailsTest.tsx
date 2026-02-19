/**
 * Simple test component for student details navigation
 */

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const StudentDetailsTest: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()

  return (
    <div className="p-6">
      <div className="mb-4">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזור לרשימת תלמידים
        </button>
      </div>
      
      <div className="bg-white rounded shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">פרטי תלמיד</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">מזהה תלמיד:</label>
            <div className="text-lg text-gray-900">{studentId}</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">ניווט עובד בהצלחה!</span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              הגעת לעמוד פרטי התלמיד עם המזהה: {studentId}
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-medium text-blue-900 mb-2">מה קורה כאן?</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• הניווט מהטבלה עובד כראוי</li>
              <li>• הפרמטר studentId מועבר נכון</li>
              <li>• הנתב מוגדר כהלכה</li>
              <li>• זהו עמוד בדיקה פשוט</li>
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-medium text-yellow-900 mb-2">השלבים הבאים:</h4>
            <p className="text-yellow-700 text-sm">
              כעת ניתן לחזור לקומפוננט המלא StudentDetailsPage לאחר תיקון כל הבעיות בייבוא המודולים.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDetailsTest