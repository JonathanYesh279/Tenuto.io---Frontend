/**
 * Teacher Tab Content Component
 * 
 * Renders the appropriate tab content based on the active tab.
 * Handles loading states and error boundaries for each tab.
 */

import { TeacherTabContentProps } from '../types'
import PersonalInfoTab from './tabs/PersonalInfoTab'
import StudentManagementTab from './tabs/StudentManagementTab'
import ScheduleTab from './tabs/ScheduleTab'
import ConductingTab from './tabs/ConductingTab'

const TeacherTabContent: React.FC<TeacherTabContentProps> = ({
  activeTab,
  teacherId,
  teacher,
  isLoading
}) => {
  // Show loading state if teacher data is still loading
  if (isLoading || !teacher) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    )
  }

  // Render the appropriate tab content
  switch (activeTab) {
    case 'personal':
      return <PersonalInfoTab teacher={teacher} teacherId={teacherId} />
    
    case 'students':
      return <StudentManagementTab teacher={teacher} teacherId={teacherId} />
    
    case 'schedule':
      return <ScheduleTab teacher={teacher} teacherId={teacherId} />
    
    case 'conducting':
      return <ConductingTab teacher={teacher} teacherId={teacherId} />
    
    default:
      return (
        <div className="p-6 text-center text-gray-500">
          <p>תוכן הכרטיסייה לא נמצא</p>
        </div>
      )
  }
}

export default TeacherTabContent