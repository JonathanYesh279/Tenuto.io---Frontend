import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import React, { Suspense, useEffect } from 'react'
import { AuthProvider, useAuth } from './services/authContext.jsx'
import { SchoolYearProvider } from './services/schoolYearContext.jsx'
import { BagrutProvider } from './contexts/BagrutContext'
import { QueryProvider } from './providers/QueryProvider'
import { SidebarProvider } from './contexts/SidebarContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { lazyWithRetry, initializeBundleOptimizations } from './utils/bundleOptimization'
import { Toaster, ToastBar } from 'react-hot-toast'

// Lazy load all pages with retry mechanism for better reliability
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), 'Dashboard')
const Students = lazyWithRetry(() => import('./pages/Students'), 'Students')
const Teachers = lazyWithRetry(() => import('./pages/Teachers'), 'Teachers')
const TheoryLessons = lazyWithRetry(() => import('./pages/TheoryLessons'), 'TheoryLessons')
const TheoryLessonDetails = lazyWithRetry(() => import('./pages/TheoryLessonDetails'), 'TheoryLessonDetails')
const Orchestras = lazyWithRetry(() => import('./pages/Orchestras'), 'Orchestras')
const Rehearsals = lazyWithRetry(() => import('./pages/Rehearsals'), 'Rehearsals')
const RehearsalDetails = lazyWithRetry(() => import('./pages/RehearsalDetails'), 'RehearsalDetails')
const Bagruts = lazyWithRetry(() => import('./pages/Bagruts'), 'Bagruts')
const BagrutDetails = lazyWithRetry(() => import('./pages/BagrutDetails'), 'BagrutDetails')
const Profile = lazyWithRetry(() => import('./pages/Profile'), 'Profile')
const MinistryReports = lazyWithRetry(() => import('./pages/MinistryReports'), 'MinistryReports')
const ImportData = lazyWithRetry(() => import('./pages/ImportData'), 'ImportData')
const Settings = lazyWithRetry(() => import('./pages/Settings'), 'Settings')
const AuditTrail = lazyWithRetry(() => import('./pages/AuditTrail'), 'AuditTrail')

// Conductor-specific pages
const ConductorAttendance = lazyWithRetry(() => import('./components/rehearsal/RehearsalAttendance'), 'ConductorAttendance')
const OrchestraEnrollmentManager = lazyWithRetry(() => import('./components/enrollment/OrchestraEnrollmentManager'), 'OrchestraEnrollmentManager')

// Super admin pages
const TenantListPage = lazyWithRetry(() => import('./pages/super-admin/TenantListPage'), 'TenantListPage')
const TenantDetailPage = lazyWithRetry(() => import('./pages/super-admin/TenantDetailPage'), 'TenantDetailPage')
const TenantFormPage = lazyWithRetry(() => import('./pages/super-admin/TenantFormPage'), 'TenantFormPage')
const SuperAdminManagementPage = lazyWithRetry(() => import('./pages/super-admin/SuperAdminManagementPage'), 'SuperAdminManagementPage')
const SuperAdminSettingsPage = lazyWithRetry(() => import('./pages/super-admin/SuperAdminSettingsPage'), 'SuperAdminSettingsPage')

// Lazy load detail pages with optimization
const StudentDetailsPage = lazyWithRetry(
  () => import('./features/students/details/components/StudentDetailsPageSimple'), 
  'StudentDetailsPage'
)
const TeacherDetailsPage = lazyWithRetry(
  () => import('./features/teachers/details/components/TeacherDetailsPage'), 
  'TeacherDetailsPage'
)
const OrchestraDetailsPage = lazyWithRetry(
  () => import('./features/orchestras/details/components/OrchestraDetailsPage'), 
  'OrchestraDetailsPage'
)

// Enhanced loading component with better UX
const PageLoadingFallback: React.FC<{ message?: string }> = ({ message = 'טוען עמוד...' }) => (
  <div className="flex items-center justify-center min-h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <div className="text-gray-600">{message}</div>
    </div>
  </div>
)

// Higher-order component for protected routes with lazy loading
function createProtectedRoute(Component: React.ComponentType, loadingMessage: string) {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<PageLoadingFallback message={loadingMessage} />}>
          <Component />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  )
}

// Protected Route Component with improved authentication handling
interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, authError, checkAuthStatus, user } = useAuth()
  const location = useLocation()
  const [retryAttempts, setRetryAttempts] = React.useState(0)
  const maxRetries = 2

  // Helper function to check if user has required role
  const hasRequiredRole = () => {
    if (!allowedRoles || allowedRoles.length === 0) return true
    if (!user) return false
    if (user.isSuperAdmin) return true // super admin bypasses role checks

    const userRole = user.role || user.roles?.[0] || ''
    const userRoles = user.roles || [userRole]

    // Map Hebrew roles to English for comparison
    const roleMap: Record<string, string> = {
      'מנהל': 'admin',
      'מורה': 'teacher',
      'מנצח': 'conductor',
      'מדריך תדר': 'theory-teacher',
      'מורה תיאוריה': 'theory-teacher',
      'מדריך הרכב': 'ensemble-director'
    }

    const normalizedUserRoles = userRoles.map((r: string) => roleMap[r] || r)
    const normalizedUserRole = roleMap[userRole] || userRole

    return allowedRoles.some(role =>
      normalizedUserRoles.includes(role) ||
      normalizedUserRole === role ||
      (role === 'admin' && !userRole) // Default admin access
    )
  }

  // Auto-retry on auth errors (up to maxRetries)
  React.useEffect(() => {
    if (authError && retryAttempts < maxRetries) {
      const retryTimeout = setTimeout(() => {
        console.log(`🔄 ProtectedRoute - Retrying authentication (${retryAttempts + 1}/${maxRetries})`);
        checkAuthStatus(true);
        setRetryAttempts(prev => prev + 1);
      }, 1000 * (retryAttempts + 1)); // Exponential backoff
      
      return () => clearTimeout(retryTimeout);
    }
  }, [authError, retryAttempts, checkAuthStatus]);

  // Reset retry attempts on successful authentication
  React.useEffect(() => {
    if (isAuthenticated && retryAttempts > 0) {
      setRetryAttempts(0);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">מאמת הרשאות...</div>
          {authError && retryAttempts > 0 && (
            <div className="mt-2 text-sm text-amber-600">
              מנסה שוב ({retryAttempts}/{maxRetries})...
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Super admin can only access these paths
  const SUPER_ADMIN_ALLOWED_PATHS = ['/dashboard', '/settings', '/tenants', '/super-admins']
  if (user?.isSuperAdmin && !SUPER_ADMIN_ALLOWED_PATHS.some(p => location.pathname.startsWith(p))) {
    return <Navigate to="/dashboard" replace />
  }

  // Check role permissions
  if (!hasRequiredRole()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <h3 className="text-lg font-bold">אין הרשאה</h3>
            <p className="text-gray-600">אין לך הרשאה לגשת לעמוד זה</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-neutral-800"
          >
            חזור
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Settings page router — renders super admin or tenant settings based on user type
function SettingsPageRouter() {
  const { user } = useAuth()
  return (
    <Suspense fallback={<PageLoadingFallback message="טוען הגדרות..." />}>
      {user?.isSuperAdmin ? <SuperAdminSettingsPage /> : <Settings />}
    </Suspense>
  )
}

// App Routes Component
function AppRoutes() {
  return (
    <div dir="rtl">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען דשבורד..." />}>
                  <Dashboard />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען רשימת תלמידים..." />}>
                  <Students />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:studentId"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען פרטי תלמיד..." />}>
                  <StudentDetailsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'conductor', 'theory-teacher']}>
              <Layout>
                <Teachers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/:teacherId"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <div className="text-gray-600">טוען פרטי מורה...</div>
                    </div>
                  </div>
                }>
                  <TeacherDetailsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/theory-lessons"
          element={
            <ProtectedRoute>
              <Layout>
                <TheoryLessons />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/theory-lessons/:theoryId"
          element={
            <ProtectedRoute>
              <Layout>
                <TheoryLessonDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orchestras"
          element={
            <ProtectedRoute>
              <Layout>
                <Orchestras />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orchestras/:orchestraId"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <div className="text-gray-600">טוען פרטי תזמורת...</div>
                    </div>
                  </div>
                }>
                  <OrchestraDetailsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rehearsals"
          element={
            <ProtectedRoute>
              <Layout>
                <Rehearsals />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rehearsals/:rehearsalId"
          element={
            <ProtectedRoute>
              <Layout>
                <RehearsalDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagruts"
          element={
            <ProtectedRoute>
              <Layout>
                <Bagruts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagruts/:bagrutId"
          element={
            <ProtectedRoute>
              <Layout>
                <BagrutDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagruts/:bagrutId/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-6" dir="rtl">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">עריכת בגרות</h1>
                  <p className="text-gray-600">עריכת פרטי הבגרות והתקדמות</p>
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-700">🔧 עמוד עריכת בגרות בפיתוח - בינתיים ניתן לערוך דרך עמוד הפרטים</p>
                  </div>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagrut"
          element={<Navigate to="/bagruts" replace />}
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען עמוד אישי..." />}>
                  <Profile />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Settings — renders super admin settings or tenant settings based on user type */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <SettingsPageRouter />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ministry-reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען דוחות משרד..." />}>
                  <MinistryReports />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען ייבוא נתונים..." />}>
                  <ImportData />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-trail"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען יומן ביקורת..." />}>
                  <AuditTrail />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Conductor-specific routes */}
        <Route
          path="/conductor/attendance"
          element={
            <ProtectedRoute allowedRoles={['conductor', 'admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען נוכחות חזרות..." />}>
                  <ConductorAttendance />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/conductor/attendance/:rehearsalId"
          element={
            <ProtectedRoute allowedRoles={['conductor', 'admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען נוכחות חזרה..." />}>
                  <ConductorAttendance />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/conductor/enrollment"
          element={
            <ProtectedRoute allowedRoles={['conductor', 'admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען ניהול רישומים..." />}>
                  <OrchestraEnrollmentManager />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/conductor/orchestras"
          element={
            <ProtectedRoute allowedRoles={['conductor', 'admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען ניהול תזמורות..." />}>
                  <Orchestras />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/conductor/rehearsals"
          element={
            <ProtectedRoute allowedRoles={['conductor', 'admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען חזרות..." />}>
                  <Rehearsals />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/conductor/musicians"
          element={
            <ProtectedRoute allowedRoles={['conductor', 'admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען מוזיקאים..." />}>
                  <Students />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Theory Teacher specific routes */}
        <Route
          path="/theory-teacher/lessons"
          element={
            <ProtectedRoute allowedRoles={['theory-teacher', 'admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען שיעורי תיאוריה..." />}>
                  <TheoryLessons />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/theory-teacher/groups"
          element={
            <ProtectedRoute allowedRoles={['theory-teacher', 'admin']}>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען קבוצות תיאוריה..." />}>
                  <TheoryLessons />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Super admin pages */}
        <Route path="/tenants" element={createProtectedRoute(TenantListPage, 'loading tenants...')} />
        <Route path="/tenants/new" element={createProtectedRoute(TenantFormPage, 'loading form...')} />
        <Route path="/tenants/:tenantId" element={createProtectedRoute(TenantDetailPage, 'loading tenant...')} />
        <Route path="/tenants/:tenantId/edit" element={createProtectedRoute(TenantFormPage, 'loading form...')} />
        <Route path="/super-admins" element={createProtectedRoute(SuperAdminManagementPage, 'loading admins...')} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  // Initialize bundle optimizations on mount
  useEffect(() => {
    initializeBundleOptimizations()
  }, [])

  return (
    <QueryProvider>
      <AuthProvider>
        <SchoolYearProvider>
          <BagrutProvider>
            <SidebarProvider>
              <Toaster
                position="top-left"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                  // Default options for all toasts
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#363636',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Heebo, sans-serif',
                    direction: 'rtl',
                  },
                  // Success toast styling
                  success: {
                    style: {
                      background: '#F0FDF4',
                      color: '#166534',
                      border: '1px solid #86EFAC',
                    },
                    iconTheme: {
                      primary: '#22C55E',
                      secondary: '#F0FDF4',
                    },
                  },
                  // Error toast styling
                  error: {
                    style: {
                      background: '#FEE2E2',
                      color: '#991B1B',
                      border: '1px solid #FCA5A5',
                    },
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#FEE2E2',
                    },
                  },
                }}
              >
                {(t) => (
                  <ToastBar
                    toast={t}
                    style={{
                      ...t.style,
                      animation: t.visible
                        ? 'slideFromRight 0.2s ease-out'
                        : 'slideToRight 0.15s ease-in forwards',
                    }}
                  />
                )}
              </Toaster>
              <AppRoutes />
            </SidebarProvider>
          </BagrutProvider>
        </SchoolYearProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App