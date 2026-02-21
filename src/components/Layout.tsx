import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../services/authContext.jsx'
import { useSidebar } from '../contexts/SidebarContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth()
  const { isDesktopOpen, isMobile } = useSidebar()

  // Check if user should see the sidebar (all users with roles)
  // Support both English and Hebrew role names
  const shouldShowSidebar = user && (
    // Admin - English and Hebrew
    user.role === 'admin' ||
    user.roles?.includes('admin') ||
    user.role === 'מנהל' ||
    user.roles?.includes('מנהל') ||
    // Teacher - English and Hebrew
    user.role === 'teacher' ||
    user.roles?.includes('teacher') ||
    user.role === 'מורה' ||
    user.roles?.includes('מורה') ||
    // Conductor - English and Hebrew
    user.role === 'conductor' ||
    user.roles?.includes('conductor') ||
    user.role === 'מנצח' ||
    user.roles?.includes('מנצח') ||
    // Theory Teacher - English and Hebrew
    user.role === 'theory-teacher' ||
    user.roles?.includes('theory-teacher') ||
    user.role === 'theory_teacher' ||
    user.roles?.includes('theory_teacher') ||
    user.role === 'מורה תיאוריה' ||
    user.roles?.includes('מורה תיאוריה') ||
    // Implicit roles based on data
    user.conducting?.orchestraIds?.length > 0
  )

  return (
    <div className="h-screen overflow-hidden bg-background" dir="rtl">
      {/* Sidebar - Show for all users with roles */}
      {shouldShowSidebar && <div className="no-print"><Sidebar /></div>}

      {/* Header */}
      <div className="no-print"><Header /></div>

      {/* Main Content - Adjust margin based on sidebar presence and state */}
      <main
        className="mt-16 ml-0 p-0 bg-background h-[calc(100vh-64px)] rtl transition-all duration-300 overflow-hidden"
        style={{
          marginRight: shouldShowSidebar && !isMobile && isDesktopOpen ? '280px' : '0'
        }}
      >
        <div className="p-6 bg-background animate-fade-in h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}