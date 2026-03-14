
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext.jsx'
import { getUploadUrl } from '../services/apiService'
import { useSidebar } from '../contexts/SidebarContext'
import SchoolYearSelector from './SchoolYearSelector'
import { getDisplayName, getInitials as getNameInitials } from '../utils/nameUtils'
import { HouseIcon, SignOutIcon, UserIcon, BellIcon } from '@phosphor-icons/react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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
    // Super admin
    user.isSuperAdmin ||
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

  const isSuperAdmin = !!user?.isSuperAdmin

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
    if (user?.isSuperAdmin) return 'מנהל-על'
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
      className="fixed top-0 left-0 h-20 flex items-center justify-between px-8 shrink-0 z-[45] transition-all duration-300"
      style={{
        direction: 'rtl',
        width: hasSidebar && !isMobile ? (isDesktopOpen ? 'calc(100% - 280px)' : 'calc(100% - 64px)') : '100%',
        background: 'linear-gradient(to bottom, rgba(64, 155, 120, 0.28) 0%, rgba(64, 155, 120, 0.12) 60%, transparent 100%)',
      }}
    >
      {/* Right side (RTL) - Conservatory Name + Search */}
      <div className="flex items-center gap-6">
        {/* Conservatory logo + name */}
        {!isSuperAdmin && (
          <div className="flex items-center gap-3">
            {user?.tenantLogoUrl && (
              <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={getUploadUrl(user.tenantLogoUrl)}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <h1 className="text-sm font-bold text-[#082753] truncate max-w-[250px]">
              {user?.tenantName || user?.schoolName || 'Tenuto'}
            </h1>
          </div>
        )}

      </div>

      {/* Left side (RTL) - Profile + Bell + School Year */}
      <div className="flex items-center gap-4" style={{ direction: 'ltr' }}>
        {/* User profile section with DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
              aria-label="תפריט פרופיל"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm font-bold">{getUserFullName()}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">{getUserRole()}</div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-48">
            {!isSuperAdmin && (
              <DropdownMenuItem
                onClick={handleProfileClick}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>עמוד אישי</span>
                <UserIcon className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center justify-between cursor-pointer text-destructive focus:text-destructive"
            >
              <span>יציאה</span>
              <SignOutIcon className="w-4 h-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* Notification bell */}
        <button
          className="relative text-slate-500 hover:text-primary transition-colors"
          aria-label="התראות"
          // TODO: wire to notifications API
        >
          <BellIcon size={22} weight="regular" />
          <span className="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-sidebar-dark"></span>
        </button>

        {/* School Year Selector - hidden for super admin */}
        {!isSuperAdmin && (
          <div className="text-xs">
            <SchoolYearSelector />
          </div>
        )}
      </div>
    </header>
  )
}
