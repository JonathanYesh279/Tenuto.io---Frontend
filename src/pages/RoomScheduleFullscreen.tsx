import { useNavigate } from 'react-router-dom'
import { ArrowsIn } from '@phosphor-icons/react'
import RoomSchedule from './RoomSchedule'

export default function RoomScheduleFullscreen() {
  const navigate = useNavigate()

  return (
    <div className="h-screen flex flex-col bg-white" dir="rtl">
      {/* Compact exit bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 shrink-0">
        <h1 className="text-sm font-semibold text-gray-800">לוח חדרים — מסך מלא</h1>
        <button
          type="button"
          onClick={() => navigate('/room-schedule')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
        >
          <ArrowsIn size={14} />
          <span>יציאה</span>
        </button>
      </div>

      {/* Full-viewport schedule content */}
      <div className="flex-1 overflow-hidden">
        <RoomSchedule isFullscreen={true} />
      </div>
    </div>
  )
}
