import React from 'react'
import { OrchestraTab, OrchestraTabType } from '../types'

interface OrchestraTabNavigationProps {
  activeTab: OrchestraTabType
  onTabChange: (tab: OrchestraTabType) => void
  tabs: OrchestraTab[]
}

const OrchestraTabNavigation: React.FC<OrchestraTabNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs,
}) => {
  return (
    <nav className="flex gap-6 border-b border-border" aria-label="Orchestra Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            whitespace-nowrap py-3 border-b-2 text-sm transition-colors duration-200
            ${
              activeTab === tab.id
                ? 'text-foreground font-semibold border-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }
          `}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export default OrchestraTabNavigation
