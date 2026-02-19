import React, { useState, useEffect } from 'react'
import { BookOpenIcon, CalendarIcon, CheckCircleIcon, GraduationCapIcon, InfoIcon, MusicNotesIcon, UsersIcon, WarningIcon, XCircleIcon, XIcon } from '@phosphor-icons/react'


export interface NotificationProps {
  id?: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  showIcon?: boolean
  context?: 'students' | 'teachers' | 'lessons' | 'orchestras' | 'general'
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
  className?: string
}

interface NotificationToastProps extends NotificationProps {
  onRemove: (id: string) => void
}

// Single notification component
export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  showIcon = true,
  context = 'general',
  action,
  onClose,
  className = ''
}) => {
  const getTypeStyles = () => {
    const styles = {
      success: {
        container: 'bg-green-50 border-green-200 text-green-800',
        icon: CheckCircleIcon,
        iconColor: 'text-green-500'
      },
      error: {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: XCircleIcon,
        iconColor: 'text-red-500'
      },
      warning: {
        container: 'bg-orange-50 border-orange-200 text-orange-800',
        icon: WarningIcon,
        iconColor: 'text-orange-500'
      },
      info: {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: InfoIcon,
        iconColor: 'text-blue-500'
      }
    }
    return styles[type]
  }

  const getContextIcon = () => {
    const icons = {
      students: UsersIcon,
      teachers: GraduationCapIcon,
      lessons: BookOpenIcon,
      orchestras: MusicNotesIcon,
      general: InfoIcon
    }
    return icons[context]
  }

  const typeStyles = getTypeStyles()
  const TypeIcon = typeStyles.icon
  const ContextIcon = getContextIcon()

  return (
    <div 
      className={`relative p-4 border rounded-lg ${typeStyles.container} ${className}`}
      dir="rtl"
      role="alert"
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0 ml-3">
            {context !== 'general' ? (
              <div className="flex items-center">
                <ContextIcon className={`w-5 h-5 ${typeStyles.iconColor} ml-1`} />
                <TypeIcon className={`w-4 h-4 ${typeStyles.iconColor}`} />
              </div>
            ) : (
              <TypeIcon className={`w-5 h-5 ${typeStyles.iconColor}`} />
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold font-reisinger-yonatan">
            {title}
          </h3>
          
          {message && (
            <p className="mt-1 text-sm font-reisinger-yonatan">
              {message}
            </p>
          )}
          
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={`text-sm font-medium underline hover:no-underline transition-all font-reisinger-yonatan ${
                  type === 'success' ? 'text-green-700 hover:text-green-800' :
                  type === 'error' ? 'text-red-700 hover:text-red-800' :
                  type === 'warning' ? 'text-orange-700 hover:text-orange-800' :
                  'text-blue-700 hover:text-blue-800'
                }`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 mr-2 p-1 rounded transition-colors ${
              type === 'success' ? 'hover:bg-green-100' :
              type === 'error' ? 'hover:bg-red-100' :
              type === 'warning' ? 'hover:bg-orange-100' :
              'hover:bg-blue-100'
            }`}
            aria-label="סגור הודעה"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Toast notification component
export const NotificationToast: React.FC<NotificationToastProps> = ({
  id = '',
  duration = 5000,
  persistent = false,
  onRemove,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => {
          setIsVisible(false)
          onRemove(id)
        }, 300) // Animation duration
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, persistent, id, onRemove])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onRemove(id)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isExiting 
          ? 'translate-x-full opacity-0 scale-95' 
          : 'translate-x-0 opacity-100 scale-100'
      }`}
    >
      <Notification
        {...props}
        onClose={handleClose}
        className="shadow-lg max-w-sm w-full"
      />
    </div>
  )
}

// Status message component for forms and pages
export const StatusMessage: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  context?: 'students' | 'teachers' | 'lessons' | 'orchestras' | 'general'
  onRetry?: () => void
  className?: string
}> = ({
  type,
  title,
  message,
  context = 'general',
  onRetry,
  className = ''
}) => {
  return (
    <Notification
      type={type}
      title={title || getDefaultTitle(type, context)}
      message={message}
      context={context}
      action={onRetry ? { label: 'נסה שוב', onClick: onRetry } : undefined}
      className={`text-center ${className}`}
    />
  )
}

// Empty state component
export const EmptyState: React.FC<{
  context: 'students' | 'teachers' | 'lessons' | 'orchestras' | 'search' | 'general'
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}> = ({
  context,
  title,
  message,
  action,
  className = ''
}) => {
  const getEmptyStateContent = () => {
    const content = {
      students: {
        title: 'אין תלמידים',
        message: 'לא נמצאו תלמידים במערכת. התחל בהוספת תלמיד ראשון.',
        icon: UsersIcon
      },
      teachers: {
        title: 'אין מורים',
        message: 'לא נמצאו מורים במערכת. התחל בהוספת מורה ראשון.',
        icon: GraduationCapIcon
      },
      lessons: {
        title: 'אין שיעורים',
        message: 'לא נמצאו שיעורים במערכת. התחל ביצירת שיעור ראשון.',
        icon: BookOpenIcon
      },
      orchestras: {
        title: 'אין תזמורות',
        message: 'לא נמצאו תזמורות במערכת. התחל ביצירת תזמורת ראשונה.',
        icon: MusicNotesIcon
      },
      search: {
        title: 'לא נמצאו תוצאות',
        message: 'נסה לחפש עם מילות מפתח אחרות או בדוק את הפילטרים.',
        icon: InfoIcon
      },
      general: {
        title: 'אין נתונים',
        message: 'לא נמצאו נתונים להצגה.',
        icon: InfoIcon
      }
    }
    return content[context]
  }

  const content = getEmptyStateContent()
  const Icon = content.icon

  return (
    <div className={`text-center py-12 ${className}`} dir="rtl">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 font-reisinger-yonatan">
          {title || content.title}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md font-reisinger-yonatan">
          {message || content.message}
        </p>
        
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-reisinger-yonatan"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

// Helper function to get default titles
const getDefaultTitle = (type: string, context: string): string => {
  const titles = {
    success: {
      students: 'תלמיד נשמר בהצלחה',
      teachers: 'מורה נשמר בהצלחה',
      lessons: 'שיעור נשמר בהצלחה',
      orchestras: 'תזמורת נשמרה בהצלחה',
      general: 'פעולה הושלמה בהצלחה'
    },
    error: {
      students: 'שגיאה בשמירת תלמיד',
      teachers: 'שגיאה בשמירת מורה',
      lessons: 'שגיאה בשמירת שיעור',
      orchestras: 'שגיאה בשמירת תזמורת',
      general: 'אירעה שגיאה'
    },
    warning: {
      students: 'אזהרה - תלמיד',
      teachers: 'אזהרה - מורה',
      lessons: 'אזהרה - שיעור',
      orchestras: 'אזהרה - תזמורת',
      general: 'אזהרה'
    },
    info: {
      students: 'מידע על תלמיד',
      teachers: 'מידע על מורה',
      lessons: 'מידע על שיעור',
      orchestras: 'מידע על תזמורת',
      general: 'מידע'
    }
  }
  
  return titles[type as keyof typeof titles]?.[context as keyof typeof titles.success] || 'הודעה'
}

// Common notification messages in Hebrew
export const NotificationMessages = {
  students: {
    created: 'תלמיד נוסף בהצלחה למערכת',
    updated: 'פרטי התלמיד עודכנו בהצלחה',
    deleted: 'תלמיד הוסר מהמערכת',
    error: 'שגיאה בטיפול בפרטי התלמיד'
  },
  teachers: {
    created: 'מורה נוסף בהצלחה למערכת',
    updated: 'פרטי המורה עודכנו בהצלחה',
    deleted: 'מורה הוסר מהמערכת',
    error: 'שגיאה בטיפול בפרטי המורה'
  },
  lessons: {
    created: 'שיעור נוצר בהצלחה',
    updated: 'פרטי השיעור עודכנו בהצלחה',
    deleted: 'שיעור בוטל',
    scheduled: 'שיעור תוזמן בהצלחה',
    error: 'שגיאה בטיפול בשיעור'
  },
  orchestras: {
    created: 'תזמורת נוצרה בהצלחה',
    updated: 'פרטי התזמורת עודכנו בהצלחה',
    deleted: 'תזמורת הוסרה מהמערכת',
    error: 'שגיאה בטיפול בתזמורת'
  },
  general: {
    saved: 'הנתונים נשמרו בהצלחה',
    deleted: 'הפריט הוסר בהצלחה',
    error: 'אירעה שגיאה במערכת',
    networkError: 'שגיאת תקשורת - בדוק את החיבור לאינטרנט',
    unauthorized: 'אין הרשאה לבצע פעולה זו',
    validationError: 'יש שגיאות בטופס - אנא תקן ונסה שוב'
  }
}