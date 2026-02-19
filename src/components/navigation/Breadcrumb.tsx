import React from 'react'
import { Link, useLocation } from 'react-router-dom'

import { getDisplayName } from '@/utils/nameUtils'
import { CaretLeftIcon, HouseIcon } from '@phosphor-icons/react'

interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

// Hebrew route mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  '/dashboard': 'מידע כללי',
  '/students': 'תלמידים',
  '/students/new': 'הוספת תלמיד חדש',
  '/teachers': 'מורים',
  '/teachers/new': 'הוספת מורה חדש',
  '/theory-lessons': 'שיעורי תיאוריה',
  '/theory-lessons/new': 'יצירת שיעור תיאוריה חדש',
  '/orchestras': 'תזמורות',
  '/orchestras/new': 'יצירת תזמורת חדשה',
  '/rehearsals': 'חזרות',
  '/rehearsals/new': 'תזמון חזרה חדשה',
  '/attendance': 'נוכחות',
  '/reports': 'דוחות',
  '/settings': 'הגדרות'
}

// Generate breadcrumb items from current route
const generateBreadcrumbItems = (pathname: string, contextData?: any): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []
  
  // Always start with home
  items.push({
    label: 'בית',
    href: '/dashboard'
  })

  let currentPath = ''
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    // Handle dynamic routes with context data
    if (segment.match(/^\d+$/) || segment.match(/^[a-f0-9-]{36}$/)) {
      // This is an ID segment - use context data if available
      let label = segment
      
      if (contextData) {
        if (segments[index - 1] === 'students' && contextData.student) {
          label = getDisplayName(contextData.student.personalInfo) || 'תלמיד'
        } else if (segments[index - 1] === 'teachers' && contextData.teacher) {
          label = getDisplayName(contextData.teacher.personalInfo) || 'מורה'
        } else if (segments[index - 1] === 'theory-lessons' && contextData.lesson) {
          label = `שיעור ${contextData.lesson.subject || 'תיאוריה'}`
        } else if (segments[index - 1] === 'orchestras' && contextData.orchestra) {
          label = contextData.orchestra.name || 'תזמורת'
        } else if (segments[index - 1] === 'rehearsals' && contextData.rehearsal) {
          label = `חזרה ${contextData.rehearsal.date || ''}`
        }
      }
      
      items.push({
        label,
        href: isLast ? undefined : currentPath,
        isActive: isLast
      })
    } else {
      // Regular route segment
      const label = routeLabels[currentPath] || segment
      
      items.push({
        label,
        href: isLast ? undefined : currentPath,
        isActive: isLast
      })
    }
  })
  
  return items
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items: customItems, 
  className = '' 
}) => {
  const location = useLocation()
  
  // Use custom items or generate from route
  const items = customItems || generateBreadcrumbItems(location.pathname)
  
  if (items.length <= 1) {
    return null // Don't show breadcrumb for home page only
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`bg-white border-b border-gray-200 px-6 py-3 ${className}`}
      dir="rtl"
    >
      <ol className="flex items-center space-x-2 space-x-reverse text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <CaretLeftIcon 
                className="w-4 h-4 text-gray-400 mx-2" 
                aria-hidden="true"
              />
            )}
            
            {item.href && !item.isActive ? (
              <Link
                to={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-150 font-reisinger-yonatan"
                title={item.label}
              >
                {index === 0 && (
                  <HouseIcon className="w-4 h-4 inline ml-1" aria-hidden="true" />
                )}
                {item.label}
              </Link>
            ) : (
              <span 
                className={`font-reisinger-yonatan ${
                  item.isActive 
                    ? 'text-primary font-semibold' 
                    : 'text-gray-900'
                }`}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {index === 0 && (
                  <HouseIcon className="w-4 h-4 inline ml-1" aria-hidden="true" />
                )}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumb

// Enhanced breadcrumb hook for context-aware navigation
export const useBreadcrumb = (contextData?: any) => {
  const location = useLocation()
  
  const getBreadcrumbItems = () => {
    return generateBreadcrumbItems(location.pathname, contextData)
  }
  
  const setCustomBreadcrumb = (items: BreadcrumbItem[]) => {
    // This could be enhanced with a context provider to manage custom breadcrumbs
    return items
  }
  
  return {
    items: getBreadcrumbItems(),
    setCustomBreadcrumb
  }
}

// Specific breadcrumb configurations for common patterns
export const createStudentBreadcrumb = (student: any, action?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { label: 'בית', href: '/dashboard' },
    { label: 'תלמידים', href: '/students' }
  ]
  
  if (action === 'new') {
    items.push({ label: 'הוספת תלמיד חדש', isActive: true })
  } else if (student) {
    items.push({ 
      label: `פרטי תלמיד > ${getDisplayName(student.personalInfo) || 'תלמיד'}`,
      isActive: true 
    })
  }
  
  return items
}

export const createTeacherBreadcrumb = (teacher: any, action?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { label: 'בית', href: '/dashboard' },
    { label: 'מורים', href: '/teachers' }
  ]
  
  if (action === 'new') {
    items.push({ label: 'הוספת מורה חדש', isActive: true })
  } else if (teacher) {
    items.push({ 
      label: `פרטי מורה > ${getDisplayName(teacher.personalInfo) || 'מורה'}`,
      isActive: true 
    })
  }
  
  return items
}

export const createLessonBreadcrumb = (lesson: any, action?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { label: 'בית', href: '/dashboard' },
    { label: 'שיעורי תיאוריה', href: '/theory-lessons' }
  ]
  
  if (action === 'new') {
    items.push({ label: 'יצירת שיעור תיאוריה חדש', isActive: true })
  } else if (lesson) {
    items.push({ 
      label: `פרטי שיעור > ${lesson.subject || 'תיאוריה'}`, 
      isActive: true 
    })
  }
  
  return items
}

export const createOrchestraBreadcrumb = (orchestra: any, action?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { label: 'בית', href: '/dashboard' },
    { label: 'תזמורות', href: '/orchestras' }
  ]
  
  if (action === 'new') {
    items.push({ label: 'יצירת תזמורת חדשה', isActive: true })
  } else if (orchestra) {
    items.push({ 
      label: `פרטי תזמורת > ${orchestra.name || 'תזמורת'}`, 
      isActive: true 
    })
  }
  
  return items
}

export const createRehearsalBreadcrumb = (rehearsal: any, action?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { label: 'בית', href: '/dashboard' },
    { label: 'חזרות', href: '/rehearsals' }
  ]
  
  if (action === 'new') {
    items.push({ label: 'תזמון חזרה חדשה', isActive: true })
  } else if (rehearsal) {
    items.push({ 
      label: `פרטי חזרה > ${rehearsal.date || 'חזרה'}`, 
      isActive: true 
    })
  }
  
  return items
}