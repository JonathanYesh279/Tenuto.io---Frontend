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
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6" aria-label="Orchestra Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default OrchestraTabNavigation