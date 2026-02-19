import React from 'react'

import { Card } from './ui/Card'
import { CalendarIcon, MedalIcon, MusicNotesIcon, PencilIcon, StarIcon, TrashIcon } from '@phosphor-icons/react'

interface InstrumentProgress {
  instrumentName: string
  isPrimary: boolean
  currentStage: number
  tests: {
    stageTest: {
      status: string
      lastTestDate?: string
      nextTestDate?: string
      notes?: string
    }
    technicalTest: {
      status: string
      lastTestDate?: string
      nextTestDate?: string
      notes?: string
    }
  }
}

interface InstrumentProgressProps {
  instruments: InstrumentProgress[]
  showTests?: boolean
  editable?: boolean
  compact?: boolean
  onEdit?: (index: number) => void
  onDelete?: (index: number) => void
  className?: string
}

const InstrumentProgress: React.FC<InstrumentProgressProps> = ({
  instruments,
  showTests = true,
  editable = false,
  compact = false,
  onEdit,
  onDelete,
  className = ''
}) => {
  // Get stage color
  const getStageColor = (stage: number): string => {
    const colors = {
      1: 'bg-gray-500',
      2: 'bg-blue-500',
      3: 'bg-green-500',
      4: 'bg-yellow-500',
      5: 'bg-orange-500',
      6: 'bg-red-500',
      7: 'bg-purple-500',
      8: 'bg-indigo-500'
    }
    return colors[stage as keyof typeof colors] || 'bg-gray-500'
  }

  // Get test status color
  const getTestStatusColor = (status: string): string => {
    const colors = {
      'לא נבחן': 'bg-gray-100 text-gray-800',
      'עבר/ה': 'bg-green-100 text-green-800',
      'לא עבר/ה': 'bg-red-100 text-red-800',
      'עבר/ה בהצטיינות': 'bg-blue-100 text-blue-800',
      'עבר/ה בהצטיינות יתרה': 'bg-purple-100 text-purple-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('he-IL')
    } catch {
      return dateString
    }
  }

  // Generate progress bar percentage (stage / 8 * 100)
  const getProgressPercentage = (stage: number): number => {
    return Math.min((stage / 8) * 100, 100)
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {instruments.map((instrument, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2 space-x-reverse">
              {instrument.isPrimary && (
                <StarIcon className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm font-medium">{instrument.instrumentName}</span>
              <span className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white
                ${getStageColor(instrument.currentStage)}
              `}>
                שלב {instrument.currentStage}
              </span>
            </div>
            
            {editable && (
              <div className="flex items-center space-x-1 space-x-reverse">
                {onEdit && (
                  <button
                    onClick={() => onEdit(index)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <PencilIcon className="w-3 h-3" />
                  </button>
                )}
                {onDelete && instruments.length > 1 && (
                  <button
                    onClick={() => onDelete(index)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {instruments.map((instrument, index) => (
        <Card key={index} padding="md">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <MusicNotesIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {instrument.instrumentName}
                    </h3>
                    {instrument.isPrimary && (
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <StarIcon className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-medium">כלי ראשי</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {editable && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(index)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && instruments.length > 1 && (
                    <button
                      onClick={() => onDelete(index)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stage Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">שלב נוכחי</span>
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white
                  ${getStageColor(instrument.currentStage)}
                `}>
                  שלב {instrument.currentStage} מתוך 8
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getStageColor(instrument.currentStage)}`}
                  style={{ width: `${getProgressPercentage(instrument.currentStage)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>שלב 1</span>
                <span>שלב 8</span>
              </div>
            </div>

            {/* Test Results */}
            {showTests && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2 space-x-reverse">
                  <MedalIcon className="w-4 h-4" />
                  <span>תוצאות בחינות</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Stage Test */}
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">בחינת שלב</span>
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${getTestStatusColor(instrument.tests.stageTest.status)}
                      `}>
                        {instrument.tests.stageTest.status}
                      </span>
                    </div>
                    
                    {instrument.tests.stageTest.lastTestDate && (
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-600 mb-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>בחינה אחרונה: {formatDate(instrument.tests.stageTest.lastTestDate)}</span>
                      </div>
                    )}
                    
                    {instrument.tests.stageTest.nextTestDate && (
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-blue-600">
                        <CalendarIcon className="w-3 h-3" />
                        <span>בחינה הבאה: {formatDate(instrument.tests.stageTest.nextTestDate)}</span>
                      </div>
                    )}
                    
                    {instrument.tests.stageTest.notes && (
                      <p className="text-xs text-gray-600 mt-2">{instrument.tests.stageTest.notes}</p>
                    )}
                  </div>

                  {/* Technical Test */}
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">בחינה טכנית</span>
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${getTestStatusColor(instrument.tests.technicalTest.status)}
                      `}>
                        {instrument.tests.technicalTest.status}
                      </span>
                    </div>
                    
                    {instrument.tests.technicalTest.lastTestDate && (
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-600 mb-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>בחינה אחרונה: {formatDate(instrument.tests.technicalTest.lastTestDate)}</span>
                      </div>
                    )}
                    
                    {instrument.tests.technicalTest.nextTestDate && (
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-blue-600">
                        <CalendarIcon className="w-3 h-3" />
                        <span>בחינה הבאה: {formatDate(instrument.tests.technicalTest.nextTestDate)}</span>
                      </div>
                    )}
                    
                    {instrument.tests.technicalTest.notes && (
                      <p className="text-xs text-gray-600 mt-2">{instrument.tests.technicalTest.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

export default InstrumentProgress