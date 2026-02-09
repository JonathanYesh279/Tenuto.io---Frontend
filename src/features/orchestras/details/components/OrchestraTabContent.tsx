import React from 'react'
import { OrchestraTabType, OrchestraTabProps } from '../types'
import PersonalInfoTab from './tabs/PersonalInfoTab'
import MembersTab from './tabs/MembersTab'
import ScheduleTab from './tabs/ScheduleTab'

const OrchestraTabContent: React.FC<OrchestraTabProps> = ({
  activeTab,
  orchestraId,
  orchestra,
  isLoading,
  onUpdate,
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <PersonalInfoTab
            orchestraId={orchestraId}
            orchestra={orchestra}
            isLoading={isLoading}
            activeTab={activeTab}
          />
        )
      case 'members':
        return (
          <MembersTab
            orchestraId={orchestraId}
            orchestra={orchestra}
            isLoading={isLoading}
            activeTab={activeTab}
            onUpdate={onUpdate}
          />
        )
      case 'schedule':
        return (
          <ScheduleTab
            orchestraId={orchestraId}
            orchestra={orchestra}
            isLoading={isLoading}
            activeTab={activeTab}
          />
        )
      default:
        return (
          <div className="p-6 text-center">
            <p className="text-gray-500">תוכן הטאב לא נמצא</p>
          </div>
        )
    }
  }

  return (
    <div className="orchestra-tab-content">
      {renderTabContent()}
    </div>
  )
}

export default OrchestraTabContent