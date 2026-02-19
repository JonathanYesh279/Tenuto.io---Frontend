/**
 * Teacher Tab Navigation Component
 *
 * Provides horizontal tab navigation for different sections of teacher details.
 * Phase 22: Dossier archetype — simple text links with border-b indicator, no pills.
 */

import { UserIcon, UsersIcon, CalendarIcon, MusicNotesIcon, ClockIcon } from '@phosphor-icons/react'
import { TeacherTabNavigationProps, TeacherTabType } from '../types'

// Tab configuration with icons
const tabConfig = {
  personal: { label: 'מידע אישי', icon: UserIcon },
  students: { label: 'ניהול תלמידים', icon: UsersIcon },
  schedule: { label: 'לוח זמנים', icon: CalendarIcon },
  conducting: { label: 'ניצוח', icon: MusicNotesIcon },
  hours: { label: 'שעות שבועיות', icon: ClockIcon },
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
    <nav className="flex gap-6 overflow-x-auto" aria-label="Teacher tabs">
      {tabs.map((tab) => {
        const config = tabConfig[tab.id]
        const Icon = config?.icon || UserIcon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors
              ${isActive
                ? 'text-foreground font-semibold border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
              }
            `}
            aria-current={isActive ? 'page' : undefined}
            style={{ minHeight: '44px' }}
          >
            <Icon className="w-4 h-4" />
            <span>{config?.label || tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default TeacherTabNavigation
