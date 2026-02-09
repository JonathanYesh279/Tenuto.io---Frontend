import { Link, useLocation, useNavigate } from 'react-router-dom'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../services/authContext.jsx'
import { useSidebar } from '../contexts/SidebarContext'
import StudentForm from './forms/StudentForm'
import AddTeacherModal from './modals/AddTeacherModal'
import TheoryLessonForm from './TheoryLessonForm'
import RehearsalForm from './RehearsalForm'
import { orchestraService } from '../services/apiService'
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  Music,
  Calendar,
  ClipboardList,
  BarChart3,
  UserCheck,
  Settings,
  Search,
  Menu,
  X,
  Plus,
  Filter,
  Award,
  User,
  Clock,
  FileText,
  UserPlus,
  CalendarPlus,
  CheckSquare,
  Shield,
  ChevronDown
} from 'lucide-react'

// Navigation item interface
interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  category?: string
}

// Admin navigation (full access) - Note: attendance href will be dynamic based on user's additional roles
const adminNavigation: NavigationItem[] = [
  { name: 'מידע כללי', href: '/dashboard', icon: Home, category: 'general' },
  { name: 'תלמידים', href: '/students', icon: Users, category: 'management', roles: ['admin'] },
  { name: 'מורים', href: '/teachers', icon: GraduationCap, category: 'management', roles: ['admin'] },
  { name: 'שיעורי תיאוריה', href: '/theory-lessons', icon: BookOpen, category: 'management', roles: ['admin'] },
  { name: 'תזמורות', href: '/orchestras', icon: Music, category: 'management', roles: ['admin'] },
  { name: 'חזרות', href: '/rehearsals', icon: Calendar, category: 'management', roles: ['admin'] },
  { name: 'בגרויות', href: '/bagruts', icon: Award, category: 'management', roles: ['admin'] },
  { name: 'נוכחות', href: '/teachers', icon: UserCheck, category: 'operations', roles: ['admin'] },
  { name: 'הגדרות', href: '/settings', icon: Settings, category: 'system', roles: ['admin'] },
]

// Teacher navigation
const teacherNavigation: NavigationItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', icon: Home, category: 'general' },
  { name: 'התלמידים שלי', href: '/students', icon: Users, category: 'personal', roles: ['teacher'] },
  { name: 'לוח זמנים שלי', href: '/profile', icon: Calendar, category: 'personal', roles: ['teacher'] },
  { name: 'נוכחות', href: '/profile?tab=attendance', icon: UserCheck, category: 'operations', roles: ['teacher'] },
  { name: 'ניהול בגרויות', href: '/bagruts', icon: Award, category: 'operations', roles: ['teacher'] },
  { name: 'פרופיל', href: '/profile', icon: User, category: 'personal' },
]

// Conductor navigation
const conductorNavigation: NavigationItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', icon: Home, category: 'general' },
  { name: 'התזמורות שלי', href: '/orchestras', icon: Music, category: 'personal', roles: ['conductor'] },
  { name: 'חזרות', href: '/rehearsals', icon: Calendar, category: 'personal', roles: ['conductor'] },
  { name: 'נוכחות', href: '/profile?tab=orchestras', icon: UserCheck, category: 'operations', roles: ['conductor'] },
  { name: 'ניהול רישומים', href: '/conductor/enrollment', icon: UserPlus, category: 'operations', roles: ['conductor'] },
  { name: 'פרופיל', href: '/profile', icon: User, category: 'personal' },
]

// Theory Teacher navigation
const theoryTeacherNavigation: NavigationItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', icon: Home, category: 'general' },
  { name: 'השיעורים שלי', href: '/theory-lessons', icon: BookOpen, category: 'personal', roles: ['theory-teacher'] },
  { name: 'קבוצות תיאוריה', href: '/theory-lessons', icon: Users, category: 'personal', roles: ['theory-teacher'] },
  { name: 'נוכחות', href: '/profile?tab=lessons', icon: UserCheck, category: 'operations', roles: ['theory-teacher'] },
  { name: 'תכנית לימודים', href: '/theory-lessons', icon: FileText, category: 'personal', roles: ['theory-teacher'] },
  { name: 'פרופיל', href: '/profile', icon: User, category: 'personal' },
]

// Quick actions by role
const quickActionsByRole = {
  admin: [
    { name: 'הוסף תלמיד חדש', href: '/students/new', icon: Users, role: 'admin' },
    { name: 'הוסף מורה חדש', href: '/teachers/new', icon: GraduationCap, role: 'admin' },
    { name: 'צור שיעור תיאוריה', href: '/theory-lessons/new', icon: BookOpen, role: 'admin' },
    { name: 'תזמן חזרה', href: '/rehearsals/new', icon: Calendar, role: 'admin' },
  ],
  teacher: [
    { name: 'הוסף שיעור', href: '/profile?tab=students&action=addStudent', icon: Plus, role: 'teacher' },
    { name: 'סמן נוכחות', href: '/profile?tab=attendance', icon: CheckSquare, role: 'teacher' },
    { name: 'צפה בלוח זמנים', href: '/profile?tab=schedule', icon: Clock, role: 'teacher' },
  ],
  conductor: [
    { name: 'תזמן חזרה', href: '/rehearsals/new', icon: CalendarPlus, role: 'conductor' },
    { name: 'נהל תזמורת', href: '/orchestras', icon: Music, role: 'conductor' },
    { name: 'סמן נוכחות', href: '/profile?tab=orchestras', icon: CheckSquare, role: 'conductor' },
  ],
  'theory-teacher': [
    { name: 'תזמן שיעור תיאוריה', href: '/theory-lessons/new', icon: CalendarPlus, role: 'theory-teacher' },
    { name: 'נהל קבוצות', href: '/theory-lessons', icon: UserPlus, role: 'theory-teacher' },
    { name: 'דרג תלמידים', href: '/theory-lessons', icon: Award, role: 'theory-teacher' },
  ]
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const { isDesktopOpen, setIsDesktopOpen, isMobile } = useSidebar()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  // Modal states
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [showTheoryLessonForm, setShowTheoryLessonForm] = useState(false)
  const [showRehearsalForm, setShowRehearsalForm] = useState(false)

  // Data for modals
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [loadingOrchestras, setLoadingOrchestras] = useState(false)

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname])

  // Get all user roles
  const getUserRoles = (): string[] => {
    if (!user) return []

    const roles: string[] = []

    // Collect all roles (don't return early for admin)
    if (user.role) roles.push(user.role)
    if (user.roles && Array.isArray(user.roles)) {
      roles.push(...user.roles)
    }

    // Check for implicit roles based on data
    if (user.teaching?.studentIds?.length > 0 && !roles.includes('teacher') && !roles.includes('מורה')) {
      roles.push('teacher')
    }
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
      return role
    }))]
  }

  // Memoize user roles to prevent recalculation on every render
  const userRoles = useMemo(() => getUserRoles(), [user])
  const isAdmin = useMemo(() => userRoles.includes('admin'), [userRoles])
  const hasMultipleRoles = useMemo(() => userRoles.length > 1, [userRoles])

  // Build merged navigation for multi-role users
  const getMergedNavigation = (): NavigationItem[] => {
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

  const toggleCategory = useCallback((categoryKey: string) => {
    setCollapsedCategories(prev => {
      const newCollapsed = new Set(prev)
      if (newCollapsed.has(categoryKey)) {
        newCollapsed.delete(categoryKey)
      } else {
        newCollapsed.add(categoryKey)
      }
      return newCollapsed
    })
  }, [])

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
      case 'admin': return 'bg-red-100 text-red-700'
      case 'teacher': return 'bg-blue-100 text-blue-700'
      case 'conductor': return 'bg-green-100 text-green-700'
      case 'theory-teacher': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
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
          className="fixed top-[20px] right-4 z-[60] p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      )}

      {/* Desktop Floating Open Button - Shows when sidebar is closed */}
      {!isMobile && !isDesktopOpen && (
        <button
          onClick={() => setIsDesktopOpen(true)}
          className="fixed top-[20px] right-4 z-[60] p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-indigo-600" />
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
        className={`fixed top-0 right-0 w-[280px] h-screen bg-white border-l border-gray-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] rtl z-[55] transition-transform duration-300 ease-in-out flex flex-col ${
          isMobile
            ? isOpen ? 'translate-x-0' : 'translate-x-full'
            : isDesktopOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Desktop Toggle Button - Inside Sidebar Top Left Corner */}
        {!isMobile && (
          <button
            onClick={() => setIsDesktopOpen(!isDesktopOpen)}
            className="absolute top-4 left-4 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 z-10"
            aria-label="Toggle sidebar"
          >
            {isDesktopOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-indigo-600" />
            )}
          </button>
        )}
        {/* Search */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-reisinger-yonatan text-right rtl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* User Role Badges - Show when user has multiple roles */}
        {hasMultipleRoles && (
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              {userRoles.map(role => (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                >
                  <Shield className="w-3 h-3" />
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
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Grouped Navigation */}
              {groupedNavigation.map((category, categoryIndex) => (
                <div key={category.key} className={categoryIndex > 0 ? 'mt-6' : ''}>
                  <div className="px-4 mb-2">
                    <button
                      onClick={() => toggleCategory(category.key)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      <span>{category.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          collapsedCategories.has(category.key) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {!collapsedCategories.has(category.key) && (
                    <div className="space-y-1">
                      {category.items.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)

                        return (
                          <Link
                            key={`${category.key}-${item.href}-${item.name}`}
                            to={item.href}
                            onClick={closeMobileMenu}
                            className={`flex items-center justify-between px-4 py-3 mx-3 rounded-lg text-sm font-medium transition-all duration-150 rtl font-reisinger-yonatan ${
                              active
                                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-right">{item.name}</span>
                              {/* Show role badge for multi-role users */}
                              {hasMultipleRoles && item.roles && item.roles.length === 1 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(item.roles[0])}`}>
                                  {getRoleLabel(item.roles[0])}
                                </span>
                              )}
                            </div>
                            <Icon className="w-4 h-4 flex-shrink-0" />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className="space-y-1 border-t border-gray-200 pt-6 mt-6">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    פעולות מהירות
                  </h3>
                  {quickActions.map((action) => {
                    const Icon = action.icon

                    return (
                      <button
                        key={`${action.href}-${action.name}-${action.role}`}
                        onClick={() => handleQuickActionClick(action.name, action.href)}
                        className="w-full flex items-center justify-between px-4 py-2 mx-3 rounded-lg text-sm font-medium transition-all duration-150 rtl font-reisinger-yonatan text-gray-600 hover:bg-green-50 hover:text-green-700 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-right">{action.name}</span>
                          {/* Show role badge for multi-role quick actions */}
                          {hasMultipleRoles && action.role && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(action.role)}`}>
                              {getRoleLabel(action.role)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Plus className="w-3 h-3 group-hover:text-green-500" />
                          <Icon className="w-3.5 h-3.5" />
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
          onSuccess={handleTeacherFormSubmit}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">טוען תזמורות...</p>
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