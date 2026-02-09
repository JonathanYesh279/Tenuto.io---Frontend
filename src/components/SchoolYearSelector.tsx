import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Calendar, Check } from 'lucide-react'
import { useSchoolYear } from '../services/schoolYearContext'

export default function SchoolYearSelector() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const {
    currentSchoolYear,
    schoolYears,
    isLoading,
    setCurrentSchoolYearById,
    getSchoolYearDisplayName
  } = useSchoolYear()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSchoolYearChange = async (schoolYearId: string) => {
    await setCurrentSchoolYearById(schoolYearId)
    setIsDropdownOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <Calendar className="w-4 h-4 text-gray-400" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 ease-in-out min-w-[200px]"
        style={{ direction: 'rtl' }}
      >
        {/* Calendar Icon */}
        <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        
        {/* School Year Text */}
        <span className="text-sm font-medium text-gray-700 font-reisinger-yonatan flex-grow text-right truncate">
          {currentSchoolYear ? getSchoolYearDisplayName(currentSchoolYear) : 'בחר שנת לימוד'}
        </span>
        
        {/* Dropdown Arrow */}
        {isDropdownOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-full min-w-[250px] bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[1000]">
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-reisinger-yonatan text-right">
              שנות לימוד
            </h3>
          </div>

          {/* School Years List */}
          <div className="max-h-64 overflow-y-auto">
            {schoolYears.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 font-reisinger-yonatan text-center">
                לא נמצאו שנות לימוד
              </div>
            ) : (
              schoolYears
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                .map((schoolYear) => {
                  const isSelected = currentSchoolYear?._id === schoolYear._id
                  const isCurrentYear = schoolYear.isCurrent
                  const isActive = schoolYear.isActive

                  return (
                    <button
                      key={schoolYear._id}
                      onClick={() => handleSchoolYearChange(schoolYear._id)}
                      className={`w-full px-4 py-3 text-right hover:bg-gray-50 flex items-center justify-between transition-colors duration-150 ${
                        isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                      }`}
                      style={{ direction: 'rtl' }}
                    >
                      {/* School Year Info */}
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium font-reisinger-yonatan ${
                            isSelected ? 'text-indigo-700' : 'text-gray-700'
                          }`}>
                            {schoolYear.name}
                          </span>
                          
                          {/* Status Indicators */}
                          {isCurrentYear && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              נוכחית
                            </span>
                          )}
                          {!isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              לא פעילה
                            </span>
                          )}
                        </div>
                        
                        {/* Date Range */}
                        <span className="text-xs text-gray-500 font-reisinger-yonatan">
                          {new Date(schoolYear.startDate).toLocaleDateString('he-IL')} - {new Date(schoolYear.endDate).toLocaleDateString('he-IL')}
                        </span>
                      </div>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      )}
                    </button>
                  )
                })
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-2 border-t border-gray-100">
            <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium font-reisinger-yonatan">
              + הוסף שנת לימוד חדשה
            </button>
          </div>
        </div>
      )}
    </div>
  )
}