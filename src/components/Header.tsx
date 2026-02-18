import { User, LogOut, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext.jsx'
import { useSidebar } from '../contexts/SidebarContext'
import SchoolYearSelector from './SchoolYearSelector'
import { getDisplayName, getInitials as getNameInitials } from '../utils/nameUtils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
      className="fixed top-0 left-0 h-16 bg-white border-b border-border flex items-center justify-between z-[45] transition-all duration-300"
      style={{
        direction: 'rtl',
        width: hasSidebar && !isMobile && isDesktopOpen ? 'calc(100% - 280px)' : '100%',
        paddingLeft: '1.5rem',
        paddingRight: hasSidebar && !isMobile && !isDesktopOpen ? '4rem' : '1.5rem'
      }}
    >
      {/* Right side (RTL) - Brand/Logo */}
      <div className="flex items-center gap-4">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-10 w-auto object-contain"
        />

        {/* School Year Selector */}
        <SchoolYearSelector />
      </div>

      {/* Left side (RTL) - User Controls */}
      <div className="flex items-center gap-4" style={{ direction: 'ltr' }}>
        {/* Desktop - Individual Icons */}
        {!isMobile && (
          <>
            {/* Dashboard Icon for non-admin users */}
            {!isAdmin && (
              <button
                onClick={handleDashboardClick}
                className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/15 hover:border-primary/30 transition-all duration-150 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                title="לוח בקרה"
              >
                <Home className="w-5 h-5 text-primary" />
              </button>
            )}
          </>
        )}

        {/* User Avatar with Profile Dropdown — shadcn DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="תפריט פרופיל"
            >
              <span className="text-sm font-semibold text-white font-reisinger-yonatan">
                {getInitials()}
              </span>
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
              <User className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center justify-between cursor-pointer text-destructive focus:text-destructive"
            >
              <span className="font-reisinger-yonatan">יציאה</span>
              <LogOut className="w-4 h-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
