import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenIcon, CalendarIcon, CaretDownIcon, CaretUpIcon, ClockIcon, FileTextIcon, GearIcon, GraduationCapIcon, LightningIcon, MapPinIcon, MusicNotesIcon, PlusIcon, UserCircleCheckIcon, UsersIcon } from '@phosphor-icons/react'


interface QuickAction {
  id: string
  label: string
  href: string
  icon: React.ComponentType<any>
  description?: string
  category?: string
  shortcut?: string
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'orange' | 'red'
}

interface QuickActionsProps {
  variant?: 'sidebar' | 'header' | 'dashboard' | 'floating'
  maxVisible?: number
  showCategories?: boolean
  className?: string
}

// Comprehensive quick actions with Hebrew labels
const allQuickActions: QuickAction[] = [
  // Student Management
  {
    id: 'add-student',
    label: 'הוסף תלמיד חדש',
    href: '/students/new',
    icon: UsersIcon,
    description: 'רישום תלמיד חדש במערכת',
    category: 'ניהול תלמידים',
    shortcut: 'Ctrl+N',
    color: 'primary'
  },
  {
    id: 'student-attendance',
    label: 'רישום נוכחות תלמידים',
    href: '/profile?tab=attendance',
    icon: UserCircleCheckIcon,
    description: 'רישום נוכחות לשיעור או חזרה',
    category: 'ניהול תלמידים',
    color: 'green'
  },
  
  // Teacher Management
  {
    id: 'add-teacher',
    label: 'הוסף מורה חדש',
    href: '/teachers/new',
    icon: GraduationCapIcon,
    description: 'הוספת מורה חדש לצוות',
    category: 'ניהול מורים',
    color: 'blue'
  },
  
  // Lesson Management
  {
    id: 'create-theory-lesson',
    label: 'צור שיעור תיאוריה',
    href: '/theory-lessons/new',
    icon: BookOpenIcon,
    description: 'יצירת שיעור תיאוריה חדש',
    category: 'ניהול שיעורים',
    color: 'purple'
  },
  {
    id: 'schedule-individual-lesson',
    label: 'תזמן שיעור פרטי',
    href: '/lessons/individual/new',
    icon: ClockIcon,
    description: 'תזמון שיעור פרטי לתלמיד',
    category: 'ניהול שיעורים',
    color: 'orange'
  },
  
  // Orchestra Management
  {
    id: 'create-orchestra',
    label: 'צור תזמורת חדשה',
    href: '/orchestras/new',
    icon: MusicNotesIcon,
    description: 'יצירת תזמורת או קבוצת נגינה',
    category: 'ניהול תזמורות',
    color: 'purple'
  },
  {
    id: 'schedule-rehearsal',
    label: 'תזמן חזרה',
    href: '/rehearsals/new',
    icon: CalendarIcon,
    description: 'תזמון חזרה לתזמורת',
    category: 'ניהול תזמורות',
    color: 'blue'
  },
  
  // Room and Resource Management
  {
    id: 'book-practice-room',
    label: 'הזמן חדר תרגול',
    href: '/rooms/book',
    icon: MapPinIcon,
    description: 'הזמנת חדר תרגול פנוי',
    category: 'ניהול משאבים',
    color: 'green'
  },
  
  // Reports and Analytics
  {
    id: 'generate-report',
    label: 'צור דוח',
    href: '/reports/new',
    icon: FileTextIcon,
    description: 'יצירת דוח נוכחות או התקדמות',
    category: 'דוחות',
    color: 'red'
  },
  
  // System Management
  {
    id: 'system-settings',
    label: 'הגדרות מערכת',
    href: '/settings',
    icon: GearIcon,
    description: 'ניהול הגדרות כלליות',
    category: 'ניהול מערכת',
    color: 'primary'
  }
]

// Color mapping for action buttons
const colorClasses = {
  primary: 'bg-muted/50 text-primary hover:bg-muted border-border',
  green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
  blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
  orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200',
  red: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
}

const QuickActions: React.FC<QuickActionsProps> = ({
  variant = 'dashboard',
  maxVisible = 6,
  showCategories = false,
  className = ''
}) => {
  const [showAll, setShowAll] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Get categories for filtering
  const categories = ['all', ...Array.from(new Set(allQuickActions.map(action => action.category).filter(Boolean)))]
  
  // Filter actions by category
  const filteredActions = selectedCategory === 'all' 
    ? allQuickActions 
    : allQuickActions.filter(action => action.category === selectedCategory)
  
  // Get visible actions based on showAll state
  const visibleActions = showAll ? filteredActions : filteredActions.slice(0, maxVisible)
  const hasMore = filteredActions.length > maxVisible
  
  // Render methods for different variants
  const renderSidebarVariant = () => (
    <div className="space-y-1">
      {visibleActions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.id}
            to={action.href}
            className="flex items-center justify-between px-4 py-2 mx-3 rounded-lg text-sm font-medium transition-all duration-150 rtl font-reisinger-yonatan text-gray-600 hover:bg-green-50 hover:text-green-700 group"
            title={action.description}
          >
            <span className="text-right">{action.label}</span>
            <div className="flex items-center space-x-1 space-x-reverse">
              <PlusIcon className="w-3 h-3 group-hover:text-green-500" />
              <Icon className="w-4 h-4" />
            </div>
          </Link>
        )
      })}
      
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-4 py-2 mx-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showAll ? (
            <>
              <CaretUpIcon className="w-4 h-4 inline ml-1" />
              הצג פחות
            </>
          ) : (
            <>
              <CaretDownIcon className="w-4 h-4 inline ml-1" />
              הצג עוד ({filteredActions.length - maxVisible})
            </>
          )}
        </button>
      )}
    </div>
  )
  
  const renderDashboardVariant = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      {showCategories && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-muted text-primary'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'הכל' : category}
            </button>
          ))}
        </div>
      )}
      
      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleActions.map((action) => {
          const Icon = action.icon
          const colorClass = colorClasses[action.color || 'primary']
          
          return (
            <Link
              key={action.id}
              to={action.href}
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md group ${colorClass}`}
              title={action.shortcut ? `${action.description} (${action.shortcut})` : action.description}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-6 h-6" />
                <LightningIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h3 className="font-semibold text-sm mb-1 font-reisinger-yonatan text-right">
                {action.label}
              </h3>
              
              {action.description && (
                <p className="text-xs opacity-75 text-right">
                  {action.description}
                </p>
              )}
              
              {action.shortcut && (
                <div className="mt-2 text-xs font-mono opacity-50">
                  {action.shortcut}
                </div>
              )}
            </Link>
          )
        })}
      </div>
      
      {/* Show More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm text-primary hover:text-primary transition-colors"
          >
            {showAll ? (
              <>
                <CaretUpIcon className="w-4 h-4 inline ml-1" />
                הצג פחות פעולות
              </>
            ) : (
              <>
                <CaretDownIcon className="w-4 h-4 inline ml-1" />
                הצג עוד פעולות ({filteredActions.length - maxVisible})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
  
  const renderHeaderVariant = () => (
    <div className="flex items-center space-x-2 space-x-reverse">
      {visibleActions.slice(0, 3).map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.id}
            to={action.href}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title={action.description}
          >
            <Icon className="w-4 h-4 ml-2" />
            {action.label}
          </Link>
        )
      })}
      
      {filteredActions.length > 3 && (
        <div className="relative">
          <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <PlusIcon className="w-4 h-4 ml-2" />
            עוד ({filteredActions.length - 3})
          </button>
        </div>
      )}
    </div>
  )
  
  const renderFloatingVariant = () => (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="flex flex-col space-y-2">
        {visibleActions.slice(0, 4).map((action, index) => {
          const Icon = action.icon
          return (
            <Link
              key={action.id}
              to={action.href}
              className="w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-primary transition-all duration-200 flex items-center justify-center group"
              style={{ 
                transform: showAll ? `translateY(${-60 * (index + 1)}px)` : 'translateY(0)',
                opacity: showAll ? 1 : index === 0 ? 1 : 0
              }}
              title={action.label}
            >
              <Icon className="w-5 h-5" />
            </Link>
          )
        })}
        
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-primary transition-all duration-200 flex items-center justify-center"
        >
          {showAll ? <CaretDownIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
  
  // Main render logic
  return (
    <div className={`rtl ${className}`} dir="rtl">
      {variant === 'sidebar' && renderSidebarVariant()}
      {variant === 'dashboard' && renderDashboardVariant()}
      {variant === 'header' && renderHeaderVariant()}
      {variant === 'floating' && renderFloatingVariant()}
    </div>
  )
}

export default QuickActions

// Utility function to get actions by category
export const getActionsByCategory = (category: string): QuickAction[] => {
  return allQuickActions.filter(action => action.category === category)
}

// Utility function to get most used actions (this could be enhanced with user analytics)
export const getMostUsedActions = (limit = 6): QuickAction[] => {
  // For now, return the first few actions. In a real app, this would be based on usage analytics
  return allQuickActions.slice(0, limit)
}