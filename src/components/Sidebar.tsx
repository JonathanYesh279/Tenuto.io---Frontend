import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../services/authContext.jsx'
import { useSidebar } from '../contexts/SidebarContext'
import StudentForm from './forms/StudentForm'
import AddTeacherModal from './modals/AddTeacherModal'
import TheoryLessonForm from './TheoryLessonForm'
import RehearsalForm from './RehearsalForm'
import { orchestraService } from '../services/apiService'
import {
  HouseIcon,
  UsersIcon,
  GraduationCapIcon,
  BookOpenIcon,
  MusicNotesIcon,
  CalendarIcon,
  UserCircleCheckIcon,
  GearIcon,
  MagnifyingGlassIcon,
  ListIcon,
  XIcon,
  PlusIcon,
  MedalIcon,
  UserIcon,
  ClockIcon,
  FileTextIcon,
  UserPlusIcon,
  CalendarPlusIcon,
  CheckSquareIcon,
  ShieldIcon,
  BuildingsIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

// Navigation item interface
interface NavigationItem {
  name: string
  href: string
  Icon: Icon
  roles?: string[]
  category?: string
}

// Admin navigation (full access) - Note: attendance href will be dynamic based on user's additional roles
const adminNavigation: NavigationItem[] = [
  { name: 'מידע כללי', href: '/dashboard', Icon: HouseIcon, category: 'general' },
  { name: 'תלמידים', href: '/students', Icon: UsersIcon, category: 'management', roles: ['admin'] },
  { name: 'מורים', href: '/teachers', Icon: GraduationCapIcon, category: 'management', roles: ['admin'] },
  { name: 'שיעורי תיאוריה', href: '/theory-lessons', Icon: BookOpenIcon, category: 'management', roles: ['admin'] },
  { name: 'תזמורות', href: '/orchestras', Icon: MusicNotesIcon, category: 'management', roles: ['admin'] },
  { name: 'חזרות', href: '/rehearsals', Icon: CalendarIcon, category: 'management', roles: ['admin'] },
  { name: 'בגרויות', href: '/bagruts', Icon: MedalIcon, category: 'management', roles: ['admin'] },
  { name: 'נוכחות', href: '/teachers', Icon: UserCircleCheckIcon, category: 'operations', roles: ['admin'] },
  { name: 'דוחות משרד', href: '/ministry-reports', Icon: FileTextIcon, category: 'operations', roles: ['admin'] },
  { name: 'ייבוא נתונים', href: '/import', Icon: PlusIcon, category: 'operations', roles: ['admin'] },
  { name: 'יומן ביקורת', href: '/audit-trail', Icon: ShieldIcon, category: 'operations', roles: ['admin'] },
  { name: 'הגדרות', href: '/settings', Icon: GearIcon, category: 'system', roles: ['admin'] },
]

// Teacher navigation
const teacherNavigation: NavigationItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', Icon: HouseIcon, category: 'general' },
  { name: 'התלמידים שלי', href: '/students', Icon: UsersIcon, category: 'personal', roles: ['teacher'] },
  { name: 'לוח זמנים שלי', href: '/profile', Icon: CalendarIcon, category: 'personal', roles: ['teacher'] },
  { name: 'נוכחות', href: '/profile?tab=attendance', Icon: UserCircleCheckIcon, category: 'operations', roles: ['teacher'] },
  { name: 'ניהול בגרויות', href: '/bagruts', Icon: MedalIcon, category: 'operations', roles: ['teacher'] },
  { name: 'פרופיל', href: '/profile', Icon: UserIcon, category: 'personal' },
]

// Conductor navigation
const conductorNavigation: NavigationItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', Icon: HouseIcon, category: 'general' },
  { name: 'התזמורות שלי', href: '/orchestras', Icon: MusicNotesIcon, category: 'personal', roles: ['conductor'] },
  { name: 'חזרות', href: '/rehearsals', Icon: CalendarIcon, category: 'personal', roles: ['conductor'] },
  { name: 'נוכחות', href: '/profile?tab=orchestras', Icon: UserCircleCheckIcon, category: 'operations', roles: ['conductor'] },
  { name: 'ניהול רישומים', href: '/conductor/enrollment', Icon: UserPlusIcon, category: 'operations', roles: ['conductor'] },
  { name: 'פרופיל', href: '/profile', Icon: UserIcon, category: 'personal' },
]

// Theory Teacher navigation
const theoryTeacherNavigation: NavigationItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', Icon: HouseIcon, category: 'general' },
  { name: 'השיעורים שלי', href: '/theory-lessons', Icon: BookOpenIcon, category: 'personal', roles: ['theory-teacher'] },
  { name: 'קבוצות תיאוריה', href: '/theory-lessons', Icon: UsersIcon, category: 'personal', roles: ['theory-teacher'] },
  { name: 'נוכחות', href: '/profile?tab=lessons', Icon: UserCircleCheckIcon, category: 'operations', roles: ['theory-teacher'] },
  { name: 'תכנית לימודים', href: '/theory-lessons', Icon: FileTextIcon, category: 'personal', roles: ['theory-teacher'] },
  { name: 'פרופיל', href: '/profile', Icon: UserIcon, category: 'personal' },
]

// Super admin navigation (platform-level)
const superAdminNavigation: NavigationItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', Icon: HouseIcon, category: 'general' },
  { name: 'ניהול מוסדות', href: '/dashboard', Icon: BuildingsIcon, category: 'management' },
  { name: 'הגדרות', href: '/settings', Icon: GearIcon, category: 'system' },
]

// Quick actions by role
const quickActionsByRole = {
  admin: [
    { name: 'הוסף תלמיד חדש', href: '/students/new', Icon: UsersIcon, role: 'admin' },
    { name: 'הוסף מורה חדש', href: '/teachers/new', Icon: GraduationCapIcon, role: 'admin' },
    { name: 'צור שיעור תיאוריה', href: '/theory-lessons/new', Icon: BookOpenIcon, role: 'admin' },
    { name: 'תזמן חזרה', href: '/rehearsals/new', Icon: CalendarIcon, role: 'admin' },
  ],
  teacher: [
    { name: 'הוסף שיעור', href: '/profile?tab=students&action=addStudent', Icon: PlusIcon, role: 'teacher' },
    { name: 'סמן נוכחות', href: '/profile?tab=attendance', Icon: CheckSquareIcon, role: 'teacher' },
    { name: 'צפה בלוח זמנים', href: '/profile?tab=schedule', Icon: ClockIcon, role: 'teacher' },
  ],
  conductor: [
    { name: 'תזמן חזרה', href: '/rehearsals/new', Icon: CalendarPlusIcon, role: 'conductor' },
    { name: 'נהל תזמורת', href: '/orchestras', Icon: MusicNotesIcon, role: 'conductor' },
    { name: 'סמן נוכחות', href: '/profile?tab=orchestras', Icon: CheckSquareIcon, role: 'conductor' },
  ],
  'theory-teacher': [
    { name: 'תזמן שיעור תיאוריה', href: '/theory-lessons/new', Icon: CalendarPlusIcon, role: 'theory-teacher' },
    { name: 'נהל קבוצות', href: '/theory-lessons', Icon: UserPlusIcon, role: 'theory-teacher' },
    { name: 'דרג תלמידים', href: '/theory-lessons', Icon: MedalIcon, role: 'theory-teacher' },
  ]
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const { isDesktopOpen, setIsDesktopOpen, isMobile } = useSidebar()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  // Category collapse removed — flat label display

  // Modal states
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [showTheoryLessonForm, setShowTheoryLessonForm] = useState(false)
  const [showRehearsalForm, setShowRehearsalForm] = useState(false)

  // Data for modals
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [loadingOrchestras, setLoadingOrchestras] = useState(false)

  // Get all user roles
  const getUserRoles = (): string[] => {
    if (!user) return []

    const roles: string[] = []

    // Collect all roles (don't return early for admin)
    if (user.role) roles.push(user.role)
    if (user.roles && Array.isArray(user.roles)) {
      roles.push(...user.roles)
    }

    // Note: implicit teacher detection via studentIds removed — use roles[] only
    if (user.conducting?.orchestraIds?.length > 0 && !roles.includes('conductor') && !roles.includes('מנצח')) {
      roles.push('conductor')
    }

    // Normalize role names - convert Hebrew to English for consistent handling
    return [...new Set(roles.map(role => {
      if (role === 'theory_teacher') return 'theory-teacher'
      // Convert Hebrew roles to English
      if (role === 'מנהל') return 'admin'
      if (role === 'מורה') return 'teacher'
      if (role === 'מנצח') return 'conductor'
      if (role === 'מורה תיאוריה') return 'theory-teacher'
      if (role === 'מדריך הרכב') return 'ensemble-director'
      return role
    }))]
  }

  // Memoize user roles to prevent recalculation on every render
  const userRoles = useMemo(() => getUserRoles(), [user])
  const isAdmin = useMemo(() => userRoles.includes('admin'), [userRoles])
  const hasMultipleRoles = useMemo(() => userRoles.length > 1, [userRoles])

  const isSuperAdmin = useMemo(() => !!user?.isSuperAdmin, [user])

  // Build merged navigation for multi-role users
  const getMergedNavigation = (): NavigationItem[] => {
    // Super admin gets its own minimal navigation
    if (isSuperAdmin) {
      return superAdminNavigation
    }

    if (isAdmin) {
      // Admin gets full admin navigation, but we need to adjust the attendance link
      // if they also have teacher or conductor roles
      const navigation = [...adminNavigation]

      // Find the attendance item
      const attendanceIndex = navigation.findIndex(item => item.name === 'נוכחות')

      if (attendanceIndex !== -1) {
        // Determine smart attendance navigation based on additional roles
        let attendanceHref = '/teachers' // Default admin attendance

        // Priority: teacher > conductor > theory-teacher
        if (userRoles.includes('teacher')) {
          attendanceHref = '/profile?tab=attendance'
        } else if (userRoles.includes('conductor')) {
          attendanceHref = '/profile?tab=orchestras'
        } else if (userRoles.includes('theory-teacher')) {
          attendanceHref = '/profile?tab=lessons'
        }

        // Update the attendance navigation
        navigation[attendanceIndex] = {
          ...navigation[attendanceIndex],
          href: attendanceHref
        }
      }

      return navigation
    }

    const navigationMap = new Map<string, NavigationItem>()
    const allNavigations = []

    // Collect navigation items from each role
    if (userRoles.includes('teacher')) {
      allNavigations.push(...teacherNavigation)
    }
    if (userRoles.includes('conductor')) {
      allNavigations.push(...conductorNavigation)
    }
    if (userRoles.includes('theory-teacher')) {
      allNavigations.push(...theoryTeacherNavigation)
    }

    // Merge navigation items, avoiding duplicates
    allNavigations.forEach(item => {
      const key = item.href
      if (!navigationMap.has(key)) {
        navigationMap.set(key, item)
      } else {
        // Merge roles if item already exists
        const existing = navigationMap.get(key)!
        if (item.roles && existing.roles) {
          existing.roles = [...new Set([...existing.roles, ...item.roles])]
        }
      }
    })

    return Array.from(navigationMap.values())
  }

  // Get quick actions for all user roles
  const getQuickActions = () => {
    const actions: typeof quickActionsByRole.admin = []
    const actionMap = new Map<string, boolean>()

    // Collect quick actions from ALL user roles (including multi-role admins)
    userRoles.forEach(role => {
      const roleActions = quickActionsByRole[role as keyof typeof quickActionsByRole]
      if (roleActions) {
        roleActions.forEach(action => {
          const key = `${action.href}-${action.name}`
          if (!actionMap.has(key)) {
            actionMap.set(key, true)
            actions.push(action)
          }
        })
      }
    })

    return actions
  }

  // Group navigation items by category
  const groupNavigationByCategory = (items: NavigationItem[]) => {
    const categories = {
      general: { label: 'כללי', items: [] as NavigationItem[] },
      personal: { label: 'אזור אישי', items: [] as NavigationItem[] },
      management: { label: 'ניהול מערכת', items: [] as NavigationItem[] },
      operations: { label: 'פעולות', items: [] as NavigationItem[] },
      system: { label: 'מערכת', items: [] as NavigationItem[] },
    }

    items.forEach(item => {
      const category = item.category || 'general'
      if (categories[category as keyof typeof categories]) {
        categories[category as keyof typeof categories].items.push(item)
      }
    })

    // Filter out empty categories
    return Object.entries(categories)
      .filter(([_, data]) => data.items.length > 0)
      .map(([key, data]) => ({ key, ...data }))
  }

  // Memoize navigation computations to prevent recalculation on every render
  const navigation = useMemo(() => getMergedNavigation(), [userRoles, isAdmin])
  const groupedNavigation = useMemo(() => groupNavigationByCategory(navigation), [navigation])
  const quickActions = useMemo(() => getQuickActions(), [userRoles])

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById('mobile-sidebar')
        const hamburger = document.getElementById('hamburger-button')
        if (sidebar && !sidebar.contains(event.target as Node) &&
            hamburger && !hamburger.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isOpen])

  const closeMobileMenu = useCallback(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])


  // Get role display labels
  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin': return 'מנהל'
      case 'teacher': return 'מורה'
      case 'conductor': return 'מנצח'
      case 'theory-teacher': return 'מורה תיאוריה'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      case 'teacher': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
      case 'conductor': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      case 'theory-teacher': return 'bg-amber-100 text-amber-700 dark:bg-yellow-900/40 dark:text-yellow-300'
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  // Handle quick action clicks
  const handleQuickActionClick = async (actionName: string, actionHref: string) => {
    closeMobileMenu()

    // Check if this is a modal action
    if (actionName === 'הוסף תלמיד חדש') {
      setShowStudentForm(true)
    } else if (actionName === 'הוסף מורה חדש') {
      setShowTeacherModal(true)
    } else if (actionName === 'צור שיעור תיאוריה') {
      setShowTheoryLessonForm(true)
    } else if (actionName === 'תזמן חזרה') {
      // Load orchestras before showing the form
      await loadOrchestrasData()
      setShowRehearsalForm(true)
    } else {
      // Otherwise navigate to the href
      navigate(actionHref)
    }
  }

  // Load orchestras data for rehearsal form
  const loadOrchestrasData = async () => {
    try {
      setLoadingOrchestras(true)
      const data = await orchestraService.getOrchestras()
      setOrchestras(data || [])
    } catch (error) {
      console.error('Failed to load orchestras:', error)
      setOrchestras([])
    } finally {
      setLoadingOrchestras(false)
    }
  }

  // Handle form submissions
  const handleStudentFormSubmit = async (data: any) => {
    // The form component handles the API call
    setShowStudentForm(false)
    // Optionally refresh data or show success message
  }

  const handleTeacherFormSubmit = async () => {
    setShowTeacherModal(false)
    // Optionally refresh data or show success message
  }

  const handleTheoryLessonFormSubmit = async (data: any) => {
    // The form component handles the API call
    setShowTheoryLessonForm(false)
    // Optionally refresh data or show success message
  }

  const handleRehearsalFormSubmit = async (data: any) => {
    // The form component handles the API call
    setShowRehearsalForm(false)
    // Optionally refresh data or show success message
  }

  return (
    <>
      {/* Mobile Hamburger Button - Top Right of Screen */}
      {isMobile && (
        <button
          id="hamburger-button"
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-[20px] right-4 z-[60] p-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <XIcon size={24} weight="bold" className="text-foreground" />
          ) : (
            <ListIcon size={24} weight="bold" className="text-foreground" />
          )}
        </button>
      )}

      {/* Desktop Floating Open Button - Shows when sidebar is closed */}
      {!isMobile && !isDesktopOpen && (
        <button
          onClick={() => setIsDesktopOpen(true)}
          className="fixed top-[20px] right-4 z-[60] p-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
          aria-label="Open sidebar"
        >
          <ListIcon size={20} weight="bold" className="text-foreground" />
        </button>
      )}

      {/* Backdrop Overlay - Mobile Only */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[50] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`fixed top-0 right-0 w-[280px] h-screen bg-white dark:bg-sidebar-dark text-sidebar-foreground border-l border-slate-200 dark:border-slate-800 shadow-1 rtl z-[55] transition-transform duration-300 ease-in-out flex flex-col ${
          isMobile
            ? isOpen ? 'translate-x-0' : 'translate-x-full'
            : isDesktopOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Desktop Toggle Button - Inside Sidebar Top Left Corner */}
        {!isMobile && (
          <button
            onClick={() => setIsDesktopOpen(!isDesktopOpen)}
            className="absolute top-4 left-4 p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 z-10"
            aria-label="Toggle sidebar"
          >
            {isDesktopOpen ? (
              <XIcon size={20} weight="bold" className="text-slate-500 dark:text-slate-400" />
            ) : (
              <ListIcon size={20} weight="bold" className="text-slate-500 dark:text-slate-400" />
            )}
          </button>
        )}
        {/* Brand Logo */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
            <h2 className="font-bold text-base tracking-tight text-foreground truncate">
              {user?.tenantName || user?.schoolName || 'Tenuto'}
            </h2>
          </div>
        </div>
        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="relative">
            <MagnifyingGlassIcon
              size={16}
              weight="regular"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="חיפוש..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-reisinger-yonatan text-foreground placeholder:text-slate-400 text-right rtl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* User Role Badges - Show when user has multiple roles */}
        {hasMultipleRoles && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              {userRoles.map(role => (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(role)}`}
                >
                  <ShieldIcon size={12} weight="fill" />
                  {getRoleLabel(role)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-2 px-4 py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-sidebar-active-bg rounded w-1/2"></div>
                <div className="h-8 bg-sidebar-active-bg rounded"></div>
                <div className="h-8 bg-sidebar-active-bg rounded"></div>
                <div className="h-8 bg-sidebar-active-bg rounded"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Grouped Navigation */}
              {groupedNavigation.map((category, categoryIndex) => (
                <div key={category.key} className={categoryIndex > 0 ? 'mt-5' : ''}>
                  {/* Category label — static, no collapse */}
                  {categoryIndex > 0 && (
                    <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {category.label}
                    </p>
                  )}

                  <div className="space-y-0.5">
                    {category.items.map((item) => {
                      return (
                        <NavLink
                          key={`${category.key}-${item.href}-${item.name}`}
                          to={item.href}
                          end={item.href === '/dashboard'}
                          onClick={closeMobileMenu}
                          className={({ isActive: active }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                              active
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                            }`
                          }
                        >
                          {({ isActive: active }) => (
                            <>
                              <item.Icon
                                size={20}
                                weight={active ? 'fill' : 'duotone'}
                                className="flex-shrink-0"
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm text-right">{item.name}</span>
                                {hasMultipleRoles && item.roles && item.roles.length === 1 && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(item.roles[0])}`}>
                                    {getRoleLabel(item.roles[0])}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className="space-y-0.5 border-t border-slate-200 dark:border-slate-800 pt-5 mt-5">
                  <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    פעולות מהירות
                  </p>
                  {quickActions.map((action) => {
                    return (
                      <button
                        key={`${action.href}-${action.name}-${action.role}`}
                        onClick={() => handleQuickActionClick(action.name, action.href)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium group"
                      >
                        <PlusIcon size={18} weight="bold" className="flex-shrink-0 text-primary/60" />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-right">{action.name}</span>
                          {hasMultipleRoles && action.role && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(action.role)}`}>
                              {getRoleLabel(action.role)}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Student Form Modal */}
      {showStudentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StudentForm
              onSubmit={handleStudentFormSubmit}
              onCancel={() => setShowStudentForm(false)}
              isEdit={false}
              initialData={null}
            />
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {showTeacherModal && (
        <AddTeacherModal
          isOpen={showTeacherModal}
          onClose={() => setShowTeacherModal(false)}
          onTeacherAdded={handleTeacherFormSubmit}
        />
      )}

      {/* Theory Lesson Form Modal */}
      {showTheoryLessonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TheoryLessonForm
              onSubmit={handleTheoryLessonFormSubmit}
              onCancel={() => setShowTheoryLessonForm(false)}
            />
          </div>
        </div>
      )}

      {/* Rehearsal Form Modal */}
      {showRehearsalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingOrchestras ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                <p className="text-neutral-600">טוען תזמורות...</p>
              </div>
            ) : (
              <RehearsalForm
                orchestras={orchestras}
                onSubmit={handleRehearsalFormSubmit}
                onCancel={() => setShowRehearsalForm(false)}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
