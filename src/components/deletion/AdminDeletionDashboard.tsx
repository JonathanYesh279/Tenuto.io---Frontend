/**
 * Admin Deletion Dashboard
 * 
 * Central admin interface for managing deletion operations,
 * data integrity monitoring, and system maintenance
 */

import React, { useState, useEffect } from 'react'

import { ActivityIcon, ArrowsClockwiseIcon, BookOpenIcon, CalendarIcon, CheckCircleIcon, DatabaseIcon, DownloadSimpleIcon, EyeIcon, FileTextIcon, FunnelIcon, GearIcon, MagnifyingGlassIcon, MusicNotesIcon, PlusIcon, ShieldIcon, TrashIcon, UsersIcon, WarningIcon } from '@phosphor-icons/react'
import {
  DataIntegrityStatus, 
  DeletionOperation, 
  AuditLogEntry,
  OrphanedReference,
  BatchOperation
} from './types'
import DataIntegrityDashboard from './DataIntegrityDashboard'
import AuditLogViewer from './AuditLogViewer'
import OrphanedReferenceCleanup from './OrphanedReferenceCleanup'
import DeletionProgressTracker from './DeletionProgressTracker'
import CascadeDeletionWorkflow from './CascadeDeletionWorkflow'
import { Card } from '../ui/Card'
import { CircularProgress } from '../feedback/ProgressIndicators'

interface AdminDeletionDashboardProps {
  className?: string
}

interface QuickStats {
  totalDeletions: number
  pendingOperations: number
  orphanedReferences: number
  integrityScore: number
  recentFailures: number
}

interface EntitySearchResult {
  type: 'student' | 'teacher' | 'lesson' | 'orchestra'
  id: string
  name: string
  details: string
  canDelete: boolean
  warnings?: string[]
}

const AdminDeletionDashboard: React.FC<AdminDeletionDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'integrity' | 'operations' | 'audit' | 'cleanup'>('overview')
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalDeletions: 127,
    pendingOperations: 3,
    orphanedReferences: 45,
    integrityScore: 87,
    recentFailures: 2
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<EntitySearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<EntitySearchResult | null>(null)
  const [showDeletionWorkflow, setShowDeletionWorkflow] = useState(false)
  const [recentOperations, setRecentOperations] = useState<DeletionOperation[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Mock data - in real app, this would come from APIs
  const mockIntegrityStatus: DataIntegrityStatus = {
    orphanedCount: 45,
    lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    pendingOperations: 3,
    healthScore: 87,
    issues: [
      {
        id: '1',
        type: 'orphaned_reference',
        table: 'lesson_assignments',
        field: 'student_id',
        count: 15,
        severity: 'medium',
        canAutoFix: true,
        description: 'מטלות שיעור עם הפניות לתלמידים שנמחקו'
      },
      {
        id: '2',
        type: 'missing_required',
        table: 'attendance_records',
        count: 8,
        severity: 'high',
        canAutoFix: false,
        description: 'רשומות נוכחות ללא שיעורים תואמים'
      }
    ]
  }

  const mockAuditLog: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      action: 'cascade_delete',
      entityType: 'student',
      entityId: 'STD001',
      entityName: 'יונתן כהן',
      userId: 'admin1',
      userName: 'מנהל ראשי',
      details: { deletedRecords: 15, affectedTables: 5 },
      canRollback: true
    }
  ]

  const mockOrphanedReferences: OrphanedReference[] = [
    {
      table: 'lesson_assignments',
      field: 'student_id',
      count: 15,
      canCleanup: true,
      cleanupMethod: 'delete'
    }
  ]

  // MagnifyingGlassIcon functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    
    // Simulate API search
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const mockResults: EntitySearchResult[] = [
      {
        type: 'student',
        id: 'STD123',
        name: 'מיכל לוי',
        details: 'שנה ג׳ • כלי עיקרי: כינור',
        canDelete: true,
        warnings: ['יש לה שיעורים עתידיים']
      },
      {
        type: 'teacher',
        id: 'TCH456',
        name: 'דוד רוזן',
        details: 'מורה לפסנתר • 15 תלמידים פעילים',
        canDelete: false,
        warnings: ['יש לו תלמידים פעילים', 'יש לו שיעורים מתוכננים']
      }
    ]
    
    setSearchResults(mockResults)
    setIsSearching(false)
  }

  const handleDeleteEntity = (entity: EntitySearchResult) => {
    setSelectedEntity(entity)
    setShowDeletionWorkflow(true)
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'student': return <UsersIcon className="w-5 h-5 text-blue-500" />
      case 'teacher': return <UsersIcon className="w-5 h-5 text-green-500" />
      case 'lesson': return <CalendarIcon className="w-5 h-5 text-purple-500" />
      case 'orchestra': return <MusicNotesIcon className="w-5 h-5 text-orange-500" />
      default: return <DatabaseIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getEntityTypeLabel = (type: string) => {
    const labels = {
      student: 'תלמיד',
      teacher: 'מורה', 
      lesson: 'שיעור',
      orchestra: 'תזמורת'
    }
    return labels[type as keyof typeof labels] || type
  }

  // Mobile navigation tabs
  const tabConfig = [
    { id: 'overview', label: 'סקירה', icon: ActivityIcon },
    { id: 'integrity', label: 'שלמות', icon: ShieldIcon },
    { id: 'operations', label: 'פעולות', icon: GearIcon },
    { id: 'audit', label: 'יומן', icon: FileTextIcon },
    { id: 'cleanup', label: 'ניקוי', icon: DatabaseIcon }
  ]

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
              ניהול מחיקות
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <GearIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="flex overflow-x-auto pb-2 -mx-2">
            <div className="flex space-x-1 space-x-reverse px-2">
              {tabConfig.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded text-sm font-medium whitespace-nowrap
                      ${activeTab === tab.id 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-reisinger-yonatan">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-reisinger-yonatan">
                מרכז בקרת מחיקות
              </h1>
              <p className="text-gray-600 font-reisinger-yonatan">
                ניהול מחיקות מתקדם ובקרת שלמות נתונים
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors">
              <DownloadSimpleIcon className="w-4 h-4" />
              <span className="font-reisinger-yonatan">יצוא דוחות</span>
            </button>
            <button className="flex items-center gap-1 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
              <ArrowsClockwiseIcon className="w-4 h-4" />
              <span className="font-reisinger-yonatan">רענון נתונים</span>
            </button>
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="flex border-b border-gray-200 mt-6">
          {tabConfig.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-reisinger-yonatan">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Stats - Mobile Layout */}
      <div className="lg:hidden grid grid-cols-2 gap-3">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{quickStats.integrityScore}</div>
          <div className="text-xs text-gray-600 font-reisinger-yonatan">ציון שלמות</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">{quickStats.orphanedReferences}</div>
          <div className="text-xs text-gray-600 font-reisinger-yonatan">הפניות יתומות</div>
        </Card>
      </div>

      {/* Quick Stats - Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4">
        <Card className="text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrashIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-600">{quickStats.totalDeletions}</span>
          </div>
          <div className="text-sm text-gray-600 font-reisinger-yonatan">סה"כ מחיקות</div>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <ActivityIcon className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-orange-600">{quickStats.pendingOperations}</span>
          </div>
          <div className="text-sm text-gray-600 font-reisinger-yonatan">פעולות בהמתנה</div>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <DatabaseIcon className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-yellow-600">{quickStats.orphanedReferences}</span>
          </div>
          <div className="text-sm text-gray-600 font-reisinger-yonatan">הפניות יתומות</div>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-between mb-2">
            <CircularProgress
              value={quickStats.integrityScore}
              size={32}
              strokeWidth={3}
              color={quickStats.integrityScore >= 80 ? 'green' : 'orange'}
              showValue={false}
            />
            <span className="text-2xl font-bold text-green-600">{quickStats.integrityScore}</span>
          </div>
          <div className="text-sm text-gray-600 font-reisinger-yonatan">ציון שלמות</div>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <WarningIcon className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-red-600">{quickStats.recentFailures}</span>
          </div>
          <div className="text-sm text-gray-600 font-reisinger-yonatan">כשלים אחרונים</div>
        </Card>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Entity MagnifyingGlassIcon */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                    חיפוש ישויות למחיקה
                  </h3>
                  <p className="text-sm text-gray-600 font-reisinger-yonatan">
                    חפש תלמידים, מורים או רשומות אחרות למחיקה
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="חפש לפי שם, מזהה או סוג..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-reisinger-yonatan"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan"
                >
                  {isSearching ? (
                    <ArrowsClockwiseIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    'חפש'
                  )}
                </button>
              </div>

              {/* MagnifyingGlassIcon Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        {getEntityIcon(result.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 font-reisinger-yonatan">
                              {result.name}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-full font-reisinger-yonatan">
                              {getEntityTypeLabel(result.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-reisinger-yonatan">{result.details}</p>
                          {result.warnings && result.warnings.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <WarningIcon className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-yellow-600 font-reisinger-yonatan">
                                {result.warnings[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntity(result)}
                          disabled={!result.canDelete}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Recent Operations */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ActivityIcon className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                  פעולות אחרונות
                </h3>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-reisinger-yonatan">
                צפה בהכל
              </button>
            </div>

            <div className="space-y-3">
              {recentOperations.slice(0, 3).map((operation) => (
                <div key={operation.id} className="p-3 border border-gray-200 rounded">
                  <DeletionProgressTracker 
                    operation={operation}
                    className="border-none shadow-none p-0"
                  />
                </div>
              ))}
            </div>

            {recentOperations.length === 0 && (
              <div className="text-center py-8">
                <ActivityIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-reisinger-yonatan">אין פעולות אחרונות</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'integrity' && (
        <DataIntegrityDashboard
          status={mockIntegrityStatus}
          recentOperations={[]}
        />
      )}

      {activeTab === 'operations' && (
        <div className="space-y-6">
          <Card>
            <div className="text-center py-12">
              <GearIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 font-reisinger-yonatan mb-2">
                פעולות מתקדמות
              </h3>
              <p className="text-gray-500 font-reisinger-yonatan mb-6">
                כלים מתקדמים לניהול מחיקות ותחזוקת המערכת
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <button className="p-4 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <PlusIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="block text-sm font-medium text-gray-600 font-reisinger-yonatan">
                    מחיקה מרובה
                  </span>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <PlusIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="block text-sm font-medium text-gray-600 font-reisinger-yonatan">
                    בדיקת שלמות
                  </span>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <PlusIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="block text-sm font-medium text-gray-600 font-reisinger-yonatan">
                    תחזוקת מערכת
                  </span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'audit' && (
        <AuditLogViewer entries={mockAuditLog} />
      )}

      {activeTab === 'cleanup' && (
        <OrphanedReferenceCleanup orphanedReferences={mockOrphanedReferences} />
      )}

      {/* Deletion Workflow Modal */}
      {selectedEntity && (
        <CascadeDeletionWorkflow
          entityType={selectedEntity.type}
          entityId={selectedEntity.id}
          entityName={selectedEntity.name}
          isOpen={showDeletionWorkflow}
          onClose={() => {
            setShowDeletionWorkflow(false)
            setSelectedEntity(null)
          }}
        />
      )}
    </div>
  )
}

export default AdminDeletionDashboard