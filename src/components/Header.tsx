import { User, LogOut, Home } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext.jsx'
import { useSidebar } from '../contexts/SidebarContext'
import SchoolYearSelector from './SchoolYearSelector'
import { getDisplayName, getInitials as getNameInitials } from '../utils/nameUtils'

export default function Header() {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
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
    user.teaching?.studentIds?.length > 0 ||
    user.conducting?.orchestraIds?.length > 0
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const handleProfileClick = () => {
    navigate('/profile')
    setIsProfileDropdownOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
    setIsProfileDropdownOpen(false)
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
      className="fixed top-0 left-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between z-[45] transition-all duration-300"
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
                className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-150 ease-in-out cursor-pointer"
                title="לוח בקרה"
              >
                <Home className="w-5 h-5 text-indigo-600" />
              </button>
            )}

          </>
        )}


        {/* User Avatar with Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <div 
            className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <span className="text-sm font-semibold text-white font-reisinger-yonatan">
              {getInitials()}
            </span>
          </div>

          {/* Profile Dropdown */}
          {isProfileDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[70]">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
                  {getUserFullName()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getUserRole()}
                </div>
              </div>
              
              <button
                onClick={handleProfileClick}
                className="w-full px-4 py-3 text-right hover:bg-gray-50 flex items-center justify-between transition-colors duration-150"
                style={{ direction: 'rtl' }}
              >
                <span className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
                  עמוד אישי
                </span>
                <User className="w-4 h-4 text-gray-500" />
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-right hover:bg-gray-50 flex items-center justify-between transition-colors duration-150 text-red-600 hover:bg-red-50"
                style={{ direction: 'rtl' }}
              >
                <span className="text-sm font-medium font-reisinger-yonatan">
                  יציאה
                </span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}