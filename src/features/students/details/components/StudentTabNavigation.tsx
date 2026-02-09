/**
 * Student Tab Navigation Component
 * 
 * Provides horizontal tab navigation for different sections of student details.
 * Responsive design with mobile-friendly scrolling.
 */

import { User, GraduationCap, Calendar, CheckCircle, Music, BookOpen, FileText, Award } from 'lucide-react'
import { StudentTabNavigationProps, TabType } from '../types'

// Tab configuration with icons
const tabConfig = {
  personal: { label: 'פרטים אישיים', icon: User },
  academic: { label: 'מידע אקדמי', icon: GraduationCap },
  schedule: { label: 'לוח זמנים', icon: Calendar },
  attendance: { label: 'נוכחות', icon: CheckCircle },
  orchestra: { label: 'תזמורות', icon: Music },
  theory: { label: 'תאוריה', icon: BookOpen },
  bagrut: { label: 'בגרות', icon: Award },
  documents: { label: 'מסמכים', icon: FileText },
}

const StudentTabNavigation: React.FC<StudentTabNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs = []
}) => {
  // Safety check to prevent crashes
  if (!tabs || tabs.length === 0) {
    return null
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm w-full overflow-hidden student-tab-navigation">
      {/* Desktop Tab Navigation */}
      <div className="hidden md:flex w-full overflow-x-auto desktop-tab-nav">
        <nav className="flex gap-8 px-6 relative min-w-full" aria-label="Tabs">
          {tabs.map((tab, index) => {
            const config = tabConfig[tab.id]
            const Icon = config?.icon || User
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group inline-flex items-center gap-3 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-300 relative tab-button
                  ${isActive
                    ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  minHeight: '44px', // WCAG AA minimum touch target
                }}
              >
                <Icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive 
                    ? 'text-primary-500 scale-110' 
                    : 'text-gray-400 group-hover:text-gray-500 group-hover:scale-105'
                }`} />
                <span className="whitespace-nowrap">
                  {config?.label || tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-scale-in" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden w-full overflow-hidden mobile-tab-nav">
        <div className="overflow-x-auto scrollbar-hide w-full">
          <nav className="flex gap-3 px-4 py-3 min-w-max" aria-label="Tabs" style={{width: 'max-content'}}>
            {tabs.map((tab, index) => {
              const config = tabConfig[tab.id]
              const Icon = config?.icon || User
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex flex-col items-center gap-1 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-300 whitespace-nowrap transform tab-button
                    ${isActive
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-200 scale-105 shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-102 border-2 border-transparent'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    minWidth: '80px',
                    minHeight: '44px', // WCAG AA minimum touch target
                  }}
                >
                  <Icon className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? 'text-primary-600' 
                      : 'text-gray-500'
                  }`} />
                  <span className="leading-tight">
                    {config?.label || tab.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
        
        {/* Mobile scroll indicator */}
        <div className="flex justify-center py-1">
          <div className="w-8 h-1 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-primary-400 rounded-full transition-all duration-300"
              style={{
                width: `${tabs?.length > 0 ? ((tabs.findIndex(t => t.id === activeTab) + 1) / tabs.length * 100) : 0}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentTabNavigation