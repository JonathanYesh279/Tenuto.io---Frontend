/**
 * Student Tab Navigation Component
 *
 * Provides horizontal tab navigation for different sections of student details.
 * Phase 22: Dossier archetype — simple text links with border-b indicator, no pills.
 */

import { UserIcon, GraduationCapIcon, CalendarIcon, CheckCircleIcon, MusicNotesIcon, BookOpenIcon, FileTextIcon, CertificateIcon } from '@phosphor-icons/react'
import { StudentTabNavigationProps, TabType } from '../types'

// Tab configuration with icons
const tabConfig = {
  personal: { label: 'פרטים אישיים', icon: UserIcon },
  academic: { label: 'מידע אקדמי', icon: GraduationCapIcon },
  schedule: { label: 'לוח זמנים', icon: CalendarIcon },
  attendance: { label: 'נוכחות', icon: CheckCircleIcon },
  orchestra: { label: 'תזמורות', icon: MusicNotesIcon },
  theory: { label: 'תאוריה', icon: BookOpenIcon },
  bagrut: { label: 'בגרות', icon: CertificateIcon },
  documents: { label: 'מסמכים', icon: FileTextIcon },
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
    <nav className="flex gap-6 overflow-x-auto scrollbar-hide" aria-label="Student tabs">
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

export default StudentTabNavigation
