/**
 * Deletion UI Components Demo
 * 
 * Comprehensive demonstration of all deletion-related UI components
 * for testing and showcase purposes
 */

import React, { useState } from 'react'

import { Card } from '../ui/Card'
import StudentDeletionModal from './StudentDeletionModal'
import DataIntegrityDashboard from './DataIntegrityDashboard'
import EnhancedProgressTracker from './EnhancedProgressTracker'
import DeletionTimeline from './DeletionTimeline'
import AuditLogViewer from './AuditLogViewer'
import { 
import { ArrowsDownUpIcon, ChartBarIcon, EyeIcon, GearIcon, TrashIcon } from '@phosphor-icons/react'
  DeletionImpact, 
  DataIntegrityStatus, 
  DeletionOperation,
  AuditLogEntry,
  BatchOperation,
  IntegrityIssue
} from './types'

const DeletionUIDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'dashboard' | 'modal' | 'progress' | 'timeline' | 'audit'>('dashboard')
  const [showStudentModal, setShowStudentModal] = useState(false)

  // Mock data for demonstrations
  const mockDeletionImpact: DeletionImpact = {
    entityType: 'student',
    entityId: '123',
    entityName: 'יוסי כהן',
    relatedRecords: [
      { type: 'lesson', id: '1', name: 'שיעורי פסנתר', count: 12, action: 'delete' },
      { type: 'attendance', id: '2', name: 'רשומות נוכחות', count: 45, action: 'delete' },
      { type: 'document', id: '3', name: 'מסמכי בגרות', count: 3, action: 'archive' },
      { type: 'orchestra', id: '4', name: 'תזמורת הקונסרבטוריון', count: 1, action: 'reassign' }
    ],
    orphanedReferences: [
      { table: 'lesson_assignments', field: 'student_id', count: 5, canCleanup: true, cleanupMethod: 'delete' },
      { table: 'grade_records', field: 'student_id', count: 15, canCleanup: true, cleanupMethod: 'nullify' }
    ],
    severity: 'high',
    canDelete: true,
    warnings: [
      'תלמיד זה רשום לבחינות בגרות הקרובות',
      'יש לו מסמכים שלא גובו עדיין'
    ],
    estimatedTime: 120
  }

  const mockIntegrityStatus: DataIntegrityStatus = {
    orphanedCount: 245,
    lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    pendingOperations: 3,
    healthScore: 76,
    issues: [
      {
        id: '1',
        type: 'orphaned_reference',
        table: 'lesson_assignments',
        field: 'student_id',
        count: 12,
        severity: 'high',
        canAutoFix: true,
        description: 'שיבוצי שיעורים ללא תלמידים מקושרים'
      },
      {
        id: '2',
        type: 'missing_required',
        table: 'teachers',
        count: 3,
        severity: 'medium',
        canAutoFix: false,
        description: 'מורים ללא מספר תעודת זהות'
      }
    ]
  }

  const mockBatchOperations: BatchOperation[] = [
    {
      id: '1',
      type: 'cleanup_orphans',
      status: 'completed',
      progress: 100,
      totalItems: 150,
      processedItems: 150,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      results: { successful: 145, failed: 5, skipped: 0, errors: [] }
    },
    {
      id: '2',
      type: 'bulk_delete',
      status: 'running',
      progress: 65,
      totalItems: 50,
      processedItems: 32,
      startTime: new Date(Date.now() - 30 * 60 * 1000)
    }
  ]

  const mockDeletionOperation: DeletionOperation = {
    id: 'op-123',
    entityType: 'student',
    entityId: '123',
    entityName: 'יוסי כהן',
    status: 'running',
    progress: 45,
    currentStep: 'מחיקת רשומות נוכחות',
    totalSteps: 8,
    startTime: new Date(Date.now() - 5 * 60 * 1000),
    impact: mockDeletionImpact,
    rollbackAvailable: true
  }

  const mockAuditEntries: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      action: 'cascade_delete',
      entityType: 'student',
      entityId: '456',
      entityName: 'שרה לוי',
      userId: 'user1',
      userName: 'אדמין ראשי',
      details: { reason: 'סיום לימודים', backup_created: true },
      canRollback: true
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      action: 'orphan_cleanup',
      entityType: 'system',
      entityId: 'cleanup-job',
      entityName: 'ניקוי הפניות יתומות',
      userId: 'system',
      userName: 'מערכת אוטומטית',
      details: { cleaned_references: 15 },
      canRollback: false
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      action: 'delete',
      entityType: 'teacher',
      entityId: '789',
      entityName: 'משה דוד',
      userId: 'user2',
      userName: 'מנהל בית ספר',
      details: { reason: 'פרישה', final_salary_paid: true },
      canRollback: true
    }
  ]

  const handleStudentDeletion = async (formData: any) => {
    // Mock deletion process
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Student deleted:', formData)
        resolve()
      }, 2000)
    })
  }

  const handleGetDeletionImpact = async (studentId: string) => {
    // Mock impact calculation
    return new Promise<DeletionImpact>((resolve) => {
      setTimeout(() => {
        resolve(mockDeletionImpact)
      }, 1000)
    })
  }

  const renderDemoSection = () => {
    switch (activeDemo) {
      case 'dashboard':
        return (
          <DataIntegrityDashboard
            status={mockIntegrityStatus}
            recentOperations={mockBatchOperations}
            onRunIntegrityCheck={async () => {
              console.log('Running integrity check...')
            }}
            onAutoFixIssues={async (issues: IntegrityIssue[]) => {
              console.log('Auto-fixing issues:', issues)
            }}
            onRefresh={() => {
              console.log('Refreshing dashboard...')
            }}
          />
        )

      case 'modal':
        return (
          <div className="space-y-6">
            <Card>
              <div className="text-center py-8">
                <TrashIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan mb-4">
                  מחיקת תלמיד - דמו
                </h3>
                <button
                  onClick={() => setShowStudentModal(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-reisinger-yonatan"
                >
                  פתח מחיקת תלמיד
                </button>
              </div>
            </Card>

            <StudentDeletionModal
              isOpen={showStudentModal}
              onClose={() => setShowStudentModal(false)}
              studentId="123"
              studentName="יוסי כהן"
              onConfirmDeletion={handleStudentDeletion}
              onGetDeletionImpact={handleGetDeletionImpact}
            />
          </div>
        )

      case 'progress':
        return (
          <EnhancedProgressTracker
            operation={mockDeletionOperation}
            onCancel={() => console.log('Cancelled')}
            onPause={() => console.log('Paused')}
            onResume={() => console.log('Resumed')}
            onRetry={() => console.log('Retried')}
            realTimeUpdates={true}
            showDetailedSteps={true}
          />
        )

      case 'timeline':
        return (
          <DeletionTimeline
            entries={mockAuditEntries}
            operations={[mockDeletionOperation]}
            onEntryClick={(entry) => console.log('Entry clicked:', entry)}
            onOperationClick={(operation) => console.log('Operation clicked:', operation)}
          />
        )

      case 'audit':
        return (
          <AuditLogViewer
            entries={mockAuditEntries}
            onRollback={async (entryId: string) => {
              console.log('Rolling back entry:', entryId)
            }}
            onExport={(filters) => {
              console.log('Exporting with filters:', filters)
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Demo Navigation */}
      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-reisinger-yonatan mb-2">
              רכיבי ממשק משתמש למחיקה
            </h2>
            <p className="text-gray-600 font-reisinger-yonatan">
              דמונסטרציה של כל רכיבי ממשק המשתמש למערכת המחיקה המדורגת
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveDemo('dashboard')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded transition-colors font-reisinger-yonatan
                ${activeDemo === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <ChartBarIcon className="w-4 h-4" />
              לוח מחוונים
            </button>

            <button
              onClick={() => setActiveDemo('modal')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded transition-colors font-reisinger-yonatan
                ${activeDemo === 'modal' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <TrashIcon className="w-4 h-4" />
              מודל מחיקה
            </button>

            <button
              onClick={() => setActiveDemo('progress')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded transition-colors font-reisinger-yonatan
                ${activeDemo === 'progress' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <GearIcon className="w-4 h-4" />
              מעקב התקדמות
            </button>

            <button
              onClick={() => setActiveDemo('timeline')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded transition-colors font-reisinger-yonatan
                ${activeDemo === 'timeline' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <ArrowsDownUpIcon className="w-4 h-4" />
              ציר זמן
            </button>

            <button
              onClick={() => setActiveDemo('audit')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded transition-colors font-reisinger-yonatan
                ${activeDemo === 'audit' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <EyeIcon className="w-4 h-4" />
              יומן ביקורת
            </button>
          </div>
        </div>
      </Card>

      {/* Demo Content */}
      {renderDemoSection()}

      {/* Feature Highlights */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-900 font-reisinger-yonatan">
            תכונות מיושמות
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <ul className="space-y-1 font-reisinger-yonatan">
              <li>• זרימת עבודה מרובת שלבים עם אישור</li>
              <li>• תצוגה מקדימה של השפעת המחיקה</li>
              <li>• מעקב התקדמות בזמן אמת</li>
              <li>• אפשרויות ביטול ושחזור</li>
            </ul>
            
            <ul className="space-y-1 font-reisinger-yonatan">
              <li>• ציר זמן אינטראקטיבי</li>
              <li>• יומן ביקורת מפורט</li>
              <li>• לוח מחוונים לבריאות המערכת</li>
              <li>• תמיכה מלאה בעברית ו-RTL</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DeletionUIDemo