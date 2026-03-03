import { useNavigate } from 'react-router-dom'
import { ArrowsIn } from '@phosphor-icons/react'
import RoomSchedule from './RoomSchedule'

export default function RoomScheduleFullscreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Minimal exit bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <h1 className="text-lg font-semibold text-gray-800">לוח חדרים — מסך מלא</h1>
        <button
          type="button"
          onClick={() => navigate('/room-schedule')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowsIn size={16} />
          <span>יציאה ממסך מלא</span>
        </button>
      </div>

      {/* Full-width schedule content -- no sidebar padding */}
      <div className="p-4">
        <RoomSchedule />
      </div>
    </div>
  )
}
