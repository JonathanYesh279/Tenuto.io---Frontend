
import { 
import { CalendarIcon, ClockIcon, EyeIcon, MapPinIcon, MusicNotesIcon, PencilIcon, TrashIcon, UserIcon, UsersIcon } from '@phosphor-icons/react'
  getOrchestraTypeInfo,
  getOrchestraStatus,
  calculateOrchestraStats,
  getConductorName,
  formatMemberCount,
  formatRehearsalCount,
  getMemberInstrumentsSummary,
  type Orchestra
} from '../utils/orchestraUtils'

interface OrchestraCardProps {
  orchestra: Orchestra
  onEdit?: (orchestra: Orchestra) => void
  onDelete?: (orchestraId: string) => void
  onViewDetails?: (orchestraId: string) => void
}

export default function OrchestraCard({ orchestra, onEdit, onDelete, onViewDetails }: OrchestraCardProps) {
  const typeInfo = getOrchestraTypeInfo(orchestra.type)
  const status = getOrchestraStatus(orchestra)
  const stats = calculateOrchestraStats(orchestra)
  const instrumentsSummary = getMemberInstrumentsSummary(orchestra.members)

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(orchestra._id)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(orchestra)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(orchestra._id)
    }
  }

  return (
    <div 
      className={`bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group hover:border-blue-300 ${onViewDetails ? 'cursor-pointer' : ''}`}
      onClick={onViewDetails ? handleViewDetails : undefined}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                {typeInfo.text}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                {status.text}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight group-hover:text-blue-900 transition-colors">
              {orchestra.name}
            </h3>
            <p className="text-sm text-gray-600 flex items-center group-hover:text-blue-600 transition-colors">
              <UserIcon className="w-3 h-3 ml-1" />
              {getConductorName(orchestra)}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 mr-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit()
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="ערוך תזמורת"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="מחק תזמורת"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="w-4 h-4 ml-2 text-gray-400" />
          <span className="font-medium text-gray-900 ml-1">מיקום:</span>
          {orchestra.location}
        </div>

        {/* Members and Rehearsals */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <UsersIcon className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">חברים:</span>
            {formatMemberCount(stats.memberCount)}
          </div>
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">חזרות:</span>
            {formatRehearsalCount(stats.rehearsalCount)}
          </div>
        </div>

        {/* Instruments Summary */}
        {instrumentsSummary.totalInstruments > 0 && (
          <div className="bg-gray-50 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                <MusicNotesIcon className="w-4 h-4 inline ml-1" />
                כלי נגינה
              </span>
              <span className="text-xs text-gray-500">
                {instrumentsSummary.totalInstruments} סוגים
              </span>
            </div>
            
            {instrumentsSummary.primaryInstruments.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {instrumentsSummary.primaryInstruments.slice(0, 4).map(instrument => (
                  <span 
                    key={instrument}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                  >
                    {instrument}
                    <span className="mr-1 text-gray-600">
                      ({instrumentsSummary.instrumentCounts[instrument]})
                    </span>
                  </span>
                ))}
                {instrumentsSummary.primaryInstruments.length > 4 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{instrumentsSummary.primaryInstruments.length - 4} נוספים
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Attendance Rate */}
        {stats.averageAttendance > 0 && (
          <div className="flex items-center bg-gray-50 rounded p-3">
            <div className="flex items-center text-sm">
              <ClockIcon className="w-4 h-4 ml-2 text-gray-400" />
              <span className="font-medium text-gray-900 ml-1">נוכחות ממוצעת:</span>
              <span className="text-gray-600">{stats.averageAttendance}%</span>
            </div>
          </div>
        )}


        {/* Footer Statistics */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100 flex justify-between">
          <span>
            הרכב {stats.orchestraSize}
          </span>
          <span>
            {stats.isFullyConfigured ? 'מוגדר במלואו' : 'דורש השלמה'}
          </span>
        </div>
      </div>
    </div>
  )
}