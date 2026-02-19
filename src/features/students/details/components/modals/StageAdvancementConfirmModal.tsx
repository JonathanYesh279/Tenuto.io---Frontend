/**
 * Stage Advancement Confirmation Modal
 *
 * Displays a confirmation dialog when a student's stage test status
 * is updated to a passing status, prompting automatic stage advancement.
 */

import React from 'react'
import { X, AlertTriangle, TrendingUp } from 'lucide-react'

interface StageAdvancementConfirmModalProps {
  isOpen: boolean
  currentStage: number
  newStage: number
  instrumentName: string
  onConfirm: () => void
  onCancel: () => void
}

// Hebrew stage definitions
const HEBREW_STAGES: Record<number, { name: string; description: string }> = {
  1: { name: "א'", description: 'שלב התחלתי' },
  2: { name: "ב'", description: 'שלב בסיסי' },
  3: { name: "ג'", description: 'שלב בינוני נמוך' },
  4: { name: "ד'", description: 'שלב בינוני' },
  5: { name: "ה'", description: 'שלב בינוני גבוה' },
  6: { name: "ו'", description: 'שלב מתקדם' },
  7: { name: "ז'", description: 'שלב מתקדם גבוה' },
  8: { name: "ח'", description: 'שלב מוכשר' }
}

const StageAdvancementConfirmModal: React.FC<StageAdvancementConfirmModalProps> = ({
  isOpen,
  currentStage,
  newStage,
  instrumentName,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null

  const currentStageInfo = HEBREW_STAGES[currentStage] || { name: currentStage.toString(), description: '' }
  const newStageInfo = HEBREW_STAGES[newStage] || { name: newStage.toString(), description: '' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <h2 id="modal-title" className="text-xl font-bold text-gray-900">
              אישור העלאת שלב
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-gray-800 text-center leading-relaxed">
              שים לב: עדכון תוצאת מבחן השלב יעלה את התלמיד באופן אוטומטי משלב{' '}
              <strong className="text-orange-600">
                {currentStageInfo.name} ({currentStageInfo.description})
              </strong>
              {' '}לשלב{' '}
              <strong className="text-green-600">
                {newStageInfo.name} ({newStageInfo.description})
              </strong>
              .
            </p>
          </div>

          {/* Instrument Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">כלי נגינה:</span>
              <span className="text-base font-bold text-gray-900">{instrumentName}</span>
            </div>

            {/* Stage Visualization */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="text-center">
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-bold text-2xl mb-1">
                  {currentStageInfo.name}
                </div>
                <div className="text-xs text-gray-600">שלב נוכחי</div>
              </div>

              <TrendingUp className="w-8 h-8 text-green-600 animate-pulse" />

              <div className="text-center">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-2xl mb-1">
                  {newStageInfo.name}
                </div>
                <div className="text-xs text-gray-600">שלב חדש</div>
              </div>
            </div>
          </div>

          {/* Confirmation Question */}
          <p className="text-center text-gray-700 font-medium">
            האם להמשיך ולעדכן את השלב?
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            כן, עדכן את השלב
          </button>
        </div>
      </div>
    </div>
  )
}

export default StageAdvancementConfirmModal
