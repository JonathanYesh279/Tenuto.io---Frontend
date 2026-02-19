
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext.jsx'
import { useSidebar } from '../contexts/SidebarContext'
import SchoolYearSelector from './SchoolYearSelector'
import { getDisplayName, getInitials as getNameInitials } from '../utils/nameUtils'
import { HouseIcon, SignOutIcon, UserIcon, MagnifyingGlassIcon, BellIcon } from '@phosphor-icons/react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDesktopOpen, isMobile } = useSidebar()

  // Check if user is admin (support both English and Hebrew)
  const isAdmin = user && (
    user.role === 'admin' ||
    user.roles?.includes('admin') ||
    user.role === 'מנהל' ||
    user.roles?.includes('מנהל')
  )

  // Check if user should see the sidebar (all users with roles now get sidebar)
  // Support both English and Hebrew role names
  const hasSidebar = user && (
    // Admin
    user.role === 'admin' ||
    user.roles?.includes('admin') ||
    user.role === 'מנהל' ||
    user.roles?.includes('מנהל') ||
    // Teacher
    user.role === 'teacher' ||
    user.roles?.includes('teacher') ||
    user.role === 'מורה' ||
    user.roles?.includes('מורה') ||
    // Conductor
    user.role === 'conductor' ||
    user.roles?.includes('conductor') ||
    user.role === 'מנצח' ||
    user.roles?.includes('מנצח') ||
    // Theory Teacher
    user.role === 'theory-teacher' ||
    user.roles?.includes('theory-teacher') ||
    user.role === 'theory_teacher' ||
    user.roles?.includes('theory_teacher') ||
    user.role === 'מורה תיאוריה' ||
    user.roles?.includes('מורה תיאוריה') ||
    // Implicit roles
    user.conducting?.orchestraIds?.length > 0
  )

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleDashboardClick = () => {
    navigate('/dashboard')
  }

  const getInitials = () => {
    const initials = getNameInitials(user?.personalInfo)
    return initials || 'מ'
  }

  const getUserFullName = () => {
    return getDisplayName(user?.personalInfo) || user?.fullName || user?.name || 'משתמש'
  }

  const getUserRole = () => {
    const role = user?.role || user?.roles?.[0] || ''
    // Handle Hebrew role names from backend
    switch (role) {
      case 'teacher': return 'מורה'
      case 'מורה': return 'מורה'
      case 'conductor': return 'מנצח'
      case 'מנצח': return 'מנצח'
      case 'theory_teacher': return 'מורה תיאוריה'
      case 'מורה תיאוריה': return 'מורה תיאוריה'
      case 'admin': return 'מנהל'
      case 'מנהל': return 'מנהל'
      default: return role || 'משתמש'
    }
  }

  return (
    <header
      className="fixed top-0 left-0 h-20 bg-white dark:bg-sidebar-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-[45] transition-all duration-300"
      style={{
        direction: 'rtl',
        width: hasSidebar && !isMobile && isDesktopOpen ? 'calc(100% - 280px)' : '100%',
      }}
    >
      {/* Right side (RTL) - Brand/Logo + Search */}
      <div className="flex items-center gap-6">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-10 w-auto object-contain"
        />

        {/* Search input - Desktop only */}
        {!isMobile && (
          <div className="relative w-96">
            <MagnifyingGlassIcon
              size={18}
              weight="regular"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="חיפוש שיעורים, תלמידים..."
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-2.5 pr-11 pl-4 focus:ring-2 focus:ring-primary text-sm transition-all text-right font-reisinger-yonatan placeholder:text-slate-400"
              // TODO: wire to global search
            />
          </div>
        )}
      </div>

      {/* Left side (RTL) - School Year + Bell + Profile */}
      <div className="flex items-center gap-4" style={{ direction: 'ltr' }}>
        {/* School Year Selector - muted styling */}
        <div className="text-xs">
          <SchoolYearSelector />
        </div>

        {/* Notification bell */}
        <button
          className="relative text-slate-500 hover:text-primary transition-colors"
          aria-label="התראות"
          // TODO: wire to notifications API
        >
          <BellIcon size={22} weight="regular" />
          <span className="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-sidebar-dark"></span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* Desktop - Dashboard Icon for non-admin users */}
        {!isMobile && !isAdmin && (
          <button
            onClick={handleDashboardClick}
            className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/15 hover:border-primary/30 transition-all duration-150 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title="לוח בקרה"
          >
            <HouseIcon className="w-5 h-5 text-primary" />
          </button>
        )}

        {/* User profile section with DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
              aria-label="תפריט פרופיל"
            >
              <div className="text-left">
                <div className="text-sm font-bold font-reisinger-yonatan">{getUserFullName()}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">{getUserRole()}</div>
              </div>
              <div className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 bg-primary flex items-center justify-center">
                <span className="text-sm font-semibold text-white font-reisinger-yonatan">
                  {getInitials()}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="font-medium text-sm text-foreground font-reisinger-yonatan">
                {getUserFullName()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {getUserRole()}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleProfileClick}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="font-reisinger-yonatan">עמוד אישי</span>
              <UserIcon className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center justify-between cursor-pointer text-destructive focus:text-destructive"
            >
              <span className="font-reisinger-yonatan">יציאה</span>
              <SignOutIcon className="w-4 h-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
