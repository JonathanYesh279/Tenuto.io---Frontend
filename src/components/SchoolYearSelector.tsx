import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { useSchoolYear } from '../services/schoolYearContext'
import { CalendarIcon, CaretDownIcon, CheckIcon } from '@phosphor-icons/react'

const glassButtonStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(167,230,210,0.3) 35%, rgba(186,230,253,0.3) 65%, rgba(255,255,255,0.45) 100%)',
  borderColor: 'rgba(255,255,255,0.8)',
  boxShadow: `
    0 4px 16px rgba(0,170,160,0.1),
    0 1px 4px rgba(0,140,210,0.06),
    inset 0 1px 1px rgba(255,255,255,0.9),
    inset 0 -1px 2px rgba(0,170,160,0.04)
  `,
}

const glassDropdownStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,230,210,0.15) 35%, rgba(186,230,253,0.15) 65%, rgba(255,255,255,0.8) 100%)',
  borderColor: 'rgba(255,255,255,0.8)',
  boxShadow: `
    0 8px 32px rgba(0,170,160,0.12),
    0 2px 8px rgba(0,140,210,0.08),
    inset 0 1px 1px rgba(255,255,255,0.9)
  `,
}

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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--glow-x', `${x}%`)
    e.currentTarget.style.setProperty('--glow-y', `${y}%`)
    e.currentTarget.style.setProperty('--glow-opacity', '0.8')
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.setProperty('--glow-opacity', '0')
  }, [])

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 border rounded-md backdrop-blur-xl min-w-[200px] animate-pulse"
        style={{ ...glassButtonStyle }}
      >
        <CalendarIcon className="w-4 h-4 text-gray-400" />
        <div className="w-24 h-4 bg-white/30 rounded"></div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button — liquid glass style */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`border-glow relative flex items-center gap-2 px-3 py-2 text-sm border rounded-md backdrop-blur-2xl overflow-hidden transition-all duration-150 min-w-[200px] ${
          isDropdownOpen
            ? 'ring-2 ring-primary/30'
            : 'hover:shadow-lg'
        }`}
        style={glassButtonStyle}
        dir="rtl"
      >
        {/* Top glossy reflection */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[50%] rounded-t-md"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
          }}
        />
        {/* Edge highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-md"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.95) 50%, transparent 90%)' }}
        />

        <CalendarIcon className="relative w-4 h-4 text-primary flex-shrink-0" />

        <span className="relative font-medium text-slate-700 flex-grow text-right truncate">
          {currentSchoolYear ? getSchoolYearDisplayName(currentSchoolYear) : 'בחר שנת לימוד'}
        </span>

        <CaretDownIcon
          className={`relative w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ease-out ${
            isDropdownOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Dropdown Menu — glass panel */}
      <AnimatePresence>
      {isDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 mt-1 w-full min-w-[250px] rounded-md border backdrop-blur-2xl py-1 z-[1000] overflow-hidden"
          style={glassDropdownStyle}
          dir="rtl"
        >
          {/* Top glossy reflection on dropdown */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[30%]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
            }}
          />

          {/* Header */}
          <div className="relative px-3 py-2 border-b border-white/40">
            <h3 className="text-xs font-semibold text-teal-800/60 uppercase tracking-wide text-right">
              שנות לימוד
            </h3>
          </div>

          {/* School Years List */}
          <div className="relative max-h-64 overflow-y-auto">
            {schoolYears.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500 text-center">
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
                      className={`w-full px-3 py-2.5 text-right flex items-center justify-between transition-colors duration-150 rounded-sm mx-0 hover:bg-white/50 ${
                        isSelected ? 'bg-white/40' : ''
                      }`}
                    >
                      {/* School Year Info */}
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-primary' : 'text-slate-700'
                          }`}>
                            {schoolYear.name}
                          </span>

                          {isCurrentYear && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100/80 text-green-800 rounded-full backdrop-blur-sm">
                              נוכחית
                            </span>
                          )}
                          {!isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100/80 text-gray-600 rounded-full backdrop-blur-sm">
                              לא פעילה
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-slate-500">
                          {new Date(schoolYear.startDate).toLocaleDateString('he-IL')} - {new Date(schoolYear.endDate).toLocaleDateString('he-IL')}
                        </span>
                      </div>

                      {isSelected && (
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  )
                })
            )}
          </div>

          {/* Footer Actions */}
          <div className="relative px-3 py-2 border-t border-white/40">
            <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
              + הוסף שנת לימוד חדשה
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
