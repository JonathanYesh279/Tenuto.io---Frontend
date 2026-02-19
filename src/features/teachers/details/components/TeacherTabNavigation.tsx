/**
 * Teacher Tab Navigation Component
 * 
 * Provides horizontal tab navigation for different sections of teacher details.
 * Responsive design with mobile-friendly scrolling.
 */

import { User, Users, Calendar, Music, Clock } from 'lucide-react'
import { TeacherTabNavigationProps, TeacherTabType } from '../types'

// Tab configuration with icons
const tabConfig = {
  personal: { label: 'מידע אישי', icon: User },
  students: { label: 'ניהול תלמידים', icon: Users },
  schedule: { label: 'לוח זמנים', icon: Calendar },
  conducting: { label: 'ניצוח', icon: Music },
  hours: { label: 'שעות שבועיות', icon: Clock },
}

const TeacherTabNavigation: React.FC<TeacherTabNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs = []
}) => {
  // Safety check to prevent crashes
  if (!tabs || tabs.length === 0) {
    return null
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm w-full overflow-hidden teacher-tab-navigation">
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
                    ? 'border-primary text-primary bg-muted/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  minHeight: '44px', // WCAG AA minimum touch target
                }}
              >
                <Icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive
                    ? 'text-primary scale-110'
                    : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                }`} />
                <span className="whitespace-nowrap">
                  {config?.label || tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-scale-in" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden w-full overflow-hidden mobile-tab-nav">
        <div className="overflow-x-auto scrollbar-hide w-full">
          <nav className="flex gap-3 ps-4 pe-4 py-3 min-w-max" aria-label="Tabs" style={{width: 'max-content'}}>
            {tabs.map((tab, index) => {
              const config = tabConfig[tab.id]
              const Icon = config?.icon || User
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex flex-col items-center gap-1 px-4 py-3 rounded font-medium text-xs transition-all duration-300 whitespace-nowrap transform tab-button
                    ${isActive
                      ? 'bg-muted text-foreground border-2 border-border scale-105 shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-102 border-2 border-transparent'
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
                      ? 'text-primary'
                      : 'text-muted-foreground'
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
              className="h-full bg-primary rounded-full transition-all duration-300"
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

export default TeacherTabNavigation