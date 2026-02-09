/**
 * Bagrut System Integration Component
 * Connects existing Bagrut components with the new role-based dashboard system
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { BagrutProvider } from '../../contexts/BagrutContext'

// Import existing Bagrut components
import MagenBagrutForm from './MagenBagrutForm'
import OptimizedMagenBagrutForm from './OptimizedMagenBagrutForm'
import DetailedMagenBagrutEditor from '../DetailedMagenBagrutEditor'
import BagrutExporter from './BagrutExporter'
import BagrutHeader from './BagrutHeader'
import LazyBagrutTab from './LazyBagrutTab'

// Import new dashboard components
import BagrutDashboard from '../dashboard/BagrutDashboard'
import BagrutStudentManager from './BagrutStudentManager'
import BagrutRoleView from './BagrutRoleView'

// Import existing forms and cards
import BagrutForm from '../BagrutForm'
import BagrutCard from '../BagrutCard'
import SimplifiedBagrutForm from '../SimplifiedBagrutForm'

// Import tab component
import BagrutTab from '../../features/students/details/components/tabs/BagrutTab'

interface BagrutIntegrationProps {
  mode?: 'dashboard' | 'student_view' | 'form' | 'manager' | 'full'
  studentId?: string
  teacherId?: string
  bagrutId?: string
  role?: 'teacher' | 'admin' | 'conductor' | 'theory_teacher'
  showHeader?: boolean
  compact?: boolean
}

export default function BagrutIntegration({
  mode = 'full',
  studentId,
  teacherId,
  bagrutId,
  role,
  showHeader = true,
  compact = false
}: BagrutIntegrationProps) {
  const { user } = useAuth()
  const [activeComponent, setActiveComponent] = useState<string>('dashboard')
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(studentId)
  const [selectedBagrut, setSelectedBagrut] = useState<string | undefined>(bagrutId)

  const actualRole = role || user?.role || 'teacher'

  useEffect(() => {
    // Set default component based on mode and role
    switch (mode) {
      case 'dashboard':
        setActiveComponent('dashboard')
        break
      case 'student_view':
        setActiveComponent(studentId ? 'student_tab' : 'dashboard')
        break
      case 'form':
        setActiveComponent(bagrutId ? 'detailed_editor' : 'simplified_form')
        break
      case 'manager':
        setActiveComponent('manager')
        break
      case 'full':
      default:
        setActiveComponent('role_view')
        break
    }
  }, [mode, studentId, bagrutId, actualRole])

  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <BagrutDashboard />

      case 'role_view':
        return <BagrutRoleView role={actualRole} userId={teacherId || user?._id} />

      case 'manager':
        return <BagrutStudentManager teacherId={teacherId} role={actualRole} />

      case 'student_tab':
        return selectedStudent ? (
          <BagrutTab studentId={selectedStudent} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">נא לבחור תלמיד</p>
          </div>
        )

      case 'magen_form':
        return selectedBagrut ? (
          <MagenBagrutForm bagrutId={selectedBagrut} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">נא לבחור בגרות</p>
          </div>
        )

      case 'optimized_form':
        return selectedBagrut ? (
          <OptimizedMagenBagrutForm bagrutId={selectedBagrut} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">נא לבחור בגרות</p>
          </div>
        )

      case 'detailed_editor':
        return selectedBagrut ? (
          <DetailedMagenBagrutEditor bagrutId={selectedBagrut} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">נא לבחור בגרות לעריכה</p>
          </div>
        )

      case 'simplified_form':
        return <SimplifiedBagrutForm />

      case 'bagrut_form':
        return <BagrutForm />

      case 'bagrut_card':
        return selectedBagrut ? (
          <BagrutCard bagrutId={selectedBagrut} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">נא לבחור בגרות</p>
          </div>
        )

      case 'exporter':
        return <BagrutExporter />

      default:
        return <BagrutRoleView role={actualRole} userId={teacherId || user?._id} />
    }
  }

  const getNavigationItems = () => {
    const items = []

    // Role-based navigation
    if (actualRole === 'admin') {
      items.push(
        { id: 'role_view', label: 'ניהול כללי', icon: '🏢' },
        { id: 'manager', label: 'ניהול תלמידים', icon: '👥' },
        { id: 'dashboard', label: 'לוח בקרה', icon: '📊' },
        { id: 'exporter', label: 'ייצוא נתונים', icon: '📤' }
      )
    } else if (actualRole === 'teacher') {
      items.push(
        { id: 'role_view', label: 'התלמידים שלי', icon: '👨‍🏫' },
        { id: 'manager', label: 'ניהול תלמידים', icon: '👥' },
        { id: 'dashboard', label: 'לוח בקרה', icon: '📊' }
      )
    } else if (actualRole === 'conductor') {
      items.push(
        { id: 'role_view', label: 'חברי תזמורת', icon: '🎼' },
        { id: 'dashboard', label: 'לוח בקרה', icon: '📊' }
      )
    } else if (actualRole === 'theory_teacher') {
      items.push(
        { id: 'role_view', label: 'תיאוריה', icon: '📚' },
        { id: 'dashboard', label: 'לוח בקרה', icon: '📊' }
      )
    }

    // Form components (when in form mode or specific context)
    if (mode === 'form' || selectedBagrut) {
      items.push(
        { id: 'detailed_editor', label: 'עורך מפורט', icon: '✏️' },
        { id: 'magen_form', label: 'טופס מגן בגרות', icon: '📝' },
        { id: 'optimized_form', label: 'טופס מותאם', icon: '⚡' }
      )
    }

    // Student-specific components
    if (mode === 'student_view' || selectedStudent) {
      items.push(
        { id: 'student_tab', label: 'פרטי תלמיד', icon: '🎓' },
        { id: 'bagrut_card', label: 'כרטיס בגרות', icon: '📇' }
      )
    }

    return items
  }

  if (compact) {
    // Compact mode - just render the component without navigation
    return (
      <BagrutProvider>
        <div className="bagrut-integration-compact">
          {showHeader && (
            <BagrutHeader
              title={mode === 'dashboard' ? 'לוח בקרה בגרות' : 'מערכת בגרות'}
              subtitle={`תפקיד: ${actualRole}`}
            />
          )}
          {renderComponent()}
        </div>
      </BagrutProvider>
    )
  }

  return (
    <BagrutProvider>
      <div className="min-h-screen bg-gray-50">
        {showHeader && (
          <BagrutHeader
            title="מערכת בגרות משולבת"
            subtitle={`ניהול מקיף לפי תפקיד: ${actualRole}`}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap gap-2 p-4" aria-label="Tabs">
                {getNavigationItems().map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveComponent(item.id)}
                    className={`flex items-center gap-2 py-2 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                      activeComponent === item.id
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Student/Bagrut Selection */}
          {(activeComponent.includes('student') || activeComponent.includes('bagrut') || activeComponent.includes('form')) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    בחר תלמיד
                  </label>
                  <select
                    value={selectedStudent || ''}
                    onChange={(e) => setSelectedStudent(e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- בחר תלמיד --</option>
                    {/* This would be populated with actual student data */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    בחר בגרות
                  </label>
                  <select
                    value={selectedBagrut || ''}
                    onChange={(e) => setSelectedBagrut(e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- בחר בגרות --</option>
                    {/* This would be populated with actual Bagrut data */}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="transition-all duration-300">
            {renderComponent()}
          </div>
        </div>
      </div>
    </BagrutProvider>
  )
}

// Convenience wrapper components for specific use cases

export const TeacherBagrutDashboard = ({ teacherId }: { teacherId?: string }) => (
  <BagrutIntegration mode="dashboard" role="teacher" teacherId={teacherId} />
)

export const AdminBagrutManager = () => (
  <BagrutIntegration mode="manager" role="admin" />
)

export const ConductorBagrutView = ({ conductorId }: { conductorId?: string }) => (
  <BagrutIntegration mode="dashboard" role="conductor" teacherId={conductorId} />
)

export const StudentBagrutView = ({ studentId }: { studentId: string }) => (
  <BagrutIntegration mode="student_view" studentId={studentId} compact />
)

export const BagrutFormEditor = ({ bagrutId }: { bagrutId?: string }) => (
  <BagrutIntegration mode="form" bagrutId={bagrutId} compact />
)

// Export the integration component and its sub-components
export {
  BagrutDashboard,
  BagrutStudentManager,
  BagrutRoleView,
  BagrutExporter,
  MagenBagrutForm,
  OptimizedMagenBagrutForm,
  DetailedMagenBagrutEditor
}

// Export context and hooks for external use
export { BagrutProvider, useBagrutContext } from '../../contexts/BagrutContext'
export { default as useBagrut } from '../../hooks/useBagrut'
export { default as useBagrutActions } from '../../hooks/useBagrutActions'
export { default as useBagrutSelectors } from '../../hooks/useBagrutSelectors'