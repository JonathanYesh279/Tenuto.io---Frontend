import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import GlobalSearch from '../search/GlobalSearch'
import { BookOpenIcon, CalendarIcon, CaretDownIcon, CaretUpIcon, ChartBarIcon, GearIcon, GraduationCapIcon, HouseIcon, ListIcon, MagnifyingGlassIcon, MusicNotesIcon, PlusIcon, UserCircleCheckIcon, UsersIcon, XIcon } from '@phosphor-icons/react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  badge?: number
}

interface MobileNavigationProps {
  className?: string
}

// Main navigation items with Hebrew labels
const mainNavigation: NavigationItem[] = [
  { name: 'מידע כללי', href: '/dashboard', icon: HouseIcon },
  { name: 'תלמידים', href: '/students', icon: UsersIcon, badge: 156 },
  { name: 'מורים', href: '/teachers', icon: GraduationCapIcon, badge: 48 },
  { name: 'שיעורי תיאוריה', href: '/theory-lessons', icon: BookOpenIcon },
  { name: 'תזמורות', href: '/orchestras', icon: MusicNotesIcon, badge: 5 },
  { name: 'חזרות', href: '/rehearsals', icon: CalendarIcon },
  { name: 'דוחות', href: '/reports', icon: ChartBarIcon },
  { name: 'הגדרות', href: '/settings', icon: GearIcon }
]

// Quick actions for mobile
const quickActions: NavigationItem[] = [
  { name: 'הוסף תלמיד', href: '/students/new', icon: UsersIcon },
  { name: 'הוסף מורה', href: '/teachers/new', icon: GraduationCapIcon },
  { name: 'צור שיעור', href: '/theory-lessons/new', icon: BookOpenIcon },
  { name: 'תזמן חזרה', href: '/rehearsals/new', icon: CalendarIcon }
]

const MobileNavigation: React.FC<MobileNavigationProps> = ({ className = '' }) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Close menu when switching to desktop
      if (!mobile) {
        setIsOpen(false)
        setShowSearch(false)
        setShowQuickActions(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setShowSearch(false)
    setShowQuickActions(false)
  }, [location.pathname])

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && isMobile) {
        const mobileNav = document.getElementById('mobile-navigation')
        const hamburger = document.getElementById('mobile-hamburger')
        
        if (mobileNav && !mobileNav.contains(event.target as Node) && 
            hamburger && !hamburger.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isMobile])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isMobile, isOpen])

  const isActive = (path: string) => location.pathname === path

  // Don't render on desktop
  if (!isMobile) {
    return null
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <div className={`fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 ${className}`}>
        <div className="flex items-center justify-between h-full px-4" dir="rtl">
          {/* Logo/Title */}
          <div className="flex items-center">
            <MusicNotesIcon className="w-8 h-8 text-primary ml-2" />
            <h1 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
              קונסרבטוריון
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 space-x-reverse">
            {/* MagnifyingGlassIcon Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-colors ${
                showSearch 
                  ? 'bg-muted text-primary' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="חיפוש"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* Quick Actions Button */}
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`p-2 rounded-lg transition-colors ${
                showQuickActions 
                  ? 'bg-green-100 text-green-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="פעולות מהירות"
            >
              <PlusIcon className="w-5 h-5" />
            </button>

            {/* Hamburger ListIcon */}
            <button
              id="mobile-hamburger"
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isOpen 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="תפריט"
            >
              {isOpen ? <XIcon className="w-5 h-5" /> : <ListIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MagnifyingGlassIcon Bar (Expandable) */}
        {showSearch && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <GlobalSearch 
              variant="header" 
              autoFocus={true}
              onResultSelect={() => setShowSearch(false)}
            />
          </div>
        )}

        {/* Quick Actions (Expandable) */}
        {showQuickActions && (
          <div className="border-t border-gray-200 p-4 bg-white" dir="rtl">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.name}
                    to={action.href}
                    onClick={() => setShowQuickActions(false)}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-green-600 ml-3" />
                    <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                      {action.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-45 transition-opacity"
          style={{ top: showSearch || showQuickActions ? '120px' : '64px' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Navigation ListIcon */}
      <div
        id="mobile-navigation"
        className={`fixed top-16 right-0 h-screen w-80 max-w-[85vw] bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: showSearch || showQuickActions ? '120px' : '64px' }}
        dir="rtl"
      >
        {/* Navigation Content */}
        <div className="flex flex-col h-full">
          {/* User Info (if available) */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">מ</span>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                  מנהל המערכת
                </p>
                <p className="text-xs text-gray-500">admin@conservatory.co.il</p>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                תפריט ראשי
              </h3>
              
              {mainNavigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-between px-3 py-3 mx-2 rounded-lg text-sm font-medium transition-colors font-reisinger-yonatan ${
                      active
                        ? 'bg-muted/50 text-primary border border-border'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="mr-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <Icon className="w-5 h-5" />
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={() => {
                // Handle logout
                console.log('Logout clicked')
              }}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-reisinger-yonatan"
            >
              יציאה מהמערכת
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  )
}

export default MobileNavigation

// Hook for mobile navigation state
export const useMobileNavigation = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  return { isMobile }
}