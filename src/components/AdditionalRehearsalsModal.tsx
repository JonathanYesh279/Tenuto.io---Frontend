import { X } from 'lucide-react'
import { Rehearsal } from '../utils/rehearsalUtils'
import RehearsalCard from './RehearsalCard'

interface AdditionalRehearsalsModalProps {
  rehearsals: Rehearsal[]
  date: Date
  onClose: () => void
  onRehearsalClick: (rehearsal: Rehearsal) => void
}

export default function AdditionalRehearsalsModal({
  rehearsals,
  date,
  onClose,
  onRehearsalClick
}: AdditionalRehearsalsModalProps) {
  const dateString = date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{
        position: 'fixed !important',
        top: '0 !important',
        left: '0 !important',
        right: '0 !important',
        bottom: '0 !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        zIndex: 9999
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">חזרות ליום</h3>
            <p className="text-sm text-gray-600">{dateString}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Rehearsals List */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3">
            {rehearsals.map((rehearsal, index) => (
              <div
                key={rehearsal._id}
                className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => onRehearsalClick(rehearsal)}
              >
                <RehearsalCard
                  rehearsal={rehearsal}
                  compact={true}
                  onRehearsalClick={() => {}} // We handle click on the wrapper
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            {rehearsals.length} חזרות ביום זה
          </p>
        </div>
      </div>
    </div>
  )
}