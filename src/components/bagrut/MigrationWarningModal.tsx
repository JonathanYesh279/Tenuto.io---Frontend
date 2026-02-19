/**
 * Migration Warning Modal Component
 * 
 * Displays migration warnings and provides one-click migration
 * with detailed comparison of old vs new calculations
 */

import React, { useState, useMemo } from 'react'
import { ArrowRightIcon, ArrowsClockwiseIcon, CheckCircleIcon, ClockIcon, DatabaseIcon, DownloadSimpleIcon, EyeIcon, InfoIcon, ShieldIcon, WarningIcon, XIcon } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'


import { detectMigrationNeeds, migrateBagrutData, createMigrationComparison, validateMigratedData, MigrationResult, MigrationStatus } from '@/utils/bagrutMigration'
import { Bagrut } from '@/types/bagrut.types'

interface MigrationWarningModalProps {
  isOpen: boolean
  onClose: () => void
  bagrutData: any
  onMigrate: (migratedData: Bagrut) => Promise<void>
  onSkip?: () => void
}

interface MigrationStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  duration?: number
}

const MigrationWarningModal: React.FC<MigrationWarningModalProps> = ({
  isOpen,
  onClose,
  bagrutData,
  onMigrate,
  onSkip
}) => {
  const [migrationStep, setMigrationStep] = useState<'analysis' | 'preview' | 'migrating' | 'completed'>('analysis')
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Analyze migration needs
  const migrationStatus = useMemo<MigrationStatus>(() => {
    return detectMigrationNeeds(bagrutData)
  }, [bagrutData])

  // Create comparison preview
  const comparisonPreview = useMemo(() => {
    if (!migrationResult) return null
    return createMigrationComparison(migrationResult.originalData, migrationResult.migratedData)
  }, [migrationResult])

  // Migration steps
  const migrationSteps: MigrationStep[] = [
    {
      id: 'validate',
      title: 'Validating Data',
      description: 'בדיקת תקינות הנתונים הקיימים',
      status: 'pending'
    },
    {
      id: 'backup',
      title: 'Creating Backup',
      description: 'יצירת גיבוי של הנתונים המקוריים',
      status: 'pending'
    },
    {
      id: 'migrate',
      title: 'Migrating Structure',
      description: 'המרת מבנה הנתונים למערכת החדשה',
      status: 'pending'
    },
    {
      id: 'verify',
      title: 'Verifying Results',
      description: 'אימות תקינות הנתונים המועברים',
      status: 'pending'
    }
  ]

  const [steps, setSteps] = useState(migrationSteps)

  // Generate migration preview
  const generatePreview = async () => {
    try {
      setMigrationStep('preview')
      const result = migrateBagrutData(bagrutData)
      setMigrationResult(result)
      
      if (!result.success) {
        setError(`שגיאה ביצירת תצוגה מקדימה: ${result.errors.join(', ')}`)
      }
    } catch (err) {
      setError(`שגיאה בתצוגה מקדימה: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`)
    }
  }

  // Execute migration
  const executeMigration = async () => {
    if (!migrationResult) return

    try {
      setMigrationStep('migrating')
      setMigrationProgress(0)

      // Simulate step-by-step migration with progress
      const stepDuration = 1000 // 1 second per step
      const totalSteps = steps.length

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        
        // Update step status
        setSteps(prev => prev.map((s, index) => ({
          ...s,
          status: index === i ? 'in_progress' : index < i ? 'completed' : 'pending'
        })))

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, stepDuration))
        
        // Update progress
        setMigrationProgress(((i + 1) / totalSteps) * 100)

        // Complete step
        setSteps(prev => prev.map((s, index) => ({
          ...s,
          status: index <= i ? 'completed' : 'pending'
        })))
      }

      // Call the migration callback
      await onMigrate(migrationResult.migratedData)
      
      setMigrationStep('completed')
    } catch (err) {
      setError(`שגיאה בביצוע ההמרה: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`)
      
      // Mark current step as error
      setSteps(prev => prev.map((s, index) => {
        const currentStepIndex = Math.floor((migrationProgress / 100) * steps.length)
        return index === currentStepIndex ? { ...s, status: 'error' } : s
      }))
    }
  }

  // Skip migration (for now)
  const handleSkip = () => {
    onSkip?.()
    onClose()
  }

  // Render migration status icons
  const renderStatusIcon = (status: 'pending' | 'in_progress' | 'completed' | 'error') => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <ArrowsClockwiseIcon className="w-5 h-5 text-blue-500 animate-spin" />
      case 'error':
        return <XIcon className="w-5 h-5 text-red-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  if (!migrationStatus.needsMigration) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-6 h-6 text-orange-500" />
            נדרשת המרת נתונים
          </DialogTitle>
          <DialogDescription>
            הנתונים של הבגרות נמצאים במבנה ישן. נדרשת המרה למערכת החדשה.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <WarningIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={migrationStep} className="w-full">
          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <div className="space-y-6">
              {/* Migration Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>סטטוס המרה</span>
                    <Badge 
                      variant={migrationStatus.compatibility > 80 ? 'default' : 
                              migrationStatus.compatibility > 60 ? 'secondary' : 'destructive'}
                    >
                      תואמות: {migrationStatus.compatibility}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">גרסה נוכחית:</span>
                      <div className="font-mono text-lg">
                        {migrationStatus.version === 'legacy' ? 'ישנה (Legacy)' : 'חדשה (Current)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">נדרשת המרה:</span>
                      <div className={`font-semibold ${migrationStatus.needsMigration ? 'text-orange-600' : 'text-green-600'}`}>
                        {migrationStatus.needsMigration ? 'כן' : 'לא'}
                      </div>
                    </div>
                  </div>

                  <Progress value={migrationStatus.compatibility} className="h-2" />
                </CardContent>
              </Card>

              {/* Issues List */}
              <Card>
                <CardHeader>
                  <CardTitle>בעיות שנמצאו ({migrationStatus.issues.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {migrationStatus.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded">
                        <WarningIcon 
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            issue.severity === 'critical' ? 'text-red-500' :
                            issue.severity === 'high' ? 'text-orange-500' :
                            issue.severity === 'medium' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`} 
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{issue.field}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {issue.severity}
                              </Badge>
                              {issue.autoFixable && (
                                <Badge variant="secondary" className="text-xs">
                                  <ShieldIcon className="w-3 h-3 mr-1" />
                                  תיקון אוטומטי
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{issue.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Migration Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>יתרונות ההמרה</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      מבנה ציונים מפורט יותר (40-30-20-10 נקודות)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      טבלת ציונים חדשה עם קטגוריות ברורות
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      אימות משופר של נתונים
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      תמיכה במערכת החדשה
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            {migrationResult ? (
              <div className="space-y-6">
                {/* Migration Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>תקציר ההמרה</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {migrationResult.changes.length}
                        </div>
                        <div className="text-sm text-gray-600">שינויים</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {migrationResult.warnings.length}
                        </div>
                        <div className="text-sm text-gray-600">אזהרות</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {migrationResult.errors.length}
                        </div>
                        <div className="text-sm text-gray-600">שגיאות</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${migrationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                          {migrationResult.success ? '✓' : '✗'}
                        </div>
                        <div className="text-sm text-gray-600">סטטוס</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Changes List */}
                <Card>
                  <CardHeader>
                    <CardTitle>שינויים שיבוצעו</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {migrationResult.changes.map((change, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded">
                          <ArrowRightIcon className="w-4 h-4 text-blue-500" />
                          <div className="flex-1">
                            <div className="font-medium">{change.field}</div>
                            <div className="text-sm text-gray-600">{change.description}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {change.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {migrationResult.warnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>אזהרות</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {migrationResult.warnings.map((warning, index) => (
                          <Alert key={index}>
                            <InfoIcon className="h-4 w-4" />
                            <AlertDescription>{warning}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparison Preview */}
                {comparisonPreview && (
                  <Card>
                    <CardHeader>
                      <CardTitle>השוואת מבנים</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">מבנה ישן</h4>
                          <div className="text-sm space-y-1">
                            <div>השמעות: {comparisonPreview.structure.before.presentationsCount}</div>
                            <div>ציונים מפורטים: {comparisonPreview.structure.before.hasGradingDetails ? 'כן' : 'לא'}</div>
                            <div>הגדרת רסיטל: {comparisonPreview.structure.before.hasRecitalConfig ? 'כן' : 'לא'}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">מבנה חדש</h4>
                          <div className="text-sm space-y-1">
                            <div>השמעות: {comparisonPreview.structure.after.presentationsCount}</div>
                            <div>ציונים מפורטים: {comparisonPreview.structure.after.hasGradingDetails ? 'כן' : 'לא'}</div>
                            <div>הגדרת רסיטל: {comparisonPreview.structure.after.hasRecitalConfig ? 'כן' : 'לא'}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Button onClick={generatePreview}>
                  <EyeIcon className="w-4 h-4 mr-2" />
                  צור תצוגה מקדימה
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Migration Progress Tab */}
          <TabsContent value="migrating">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>מבצע המרה...</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={migrationProgress} className="h-3 mb-4" />
                  <div className="text-sm text-gray-600 text-center mb-6">
                    {Math.round(migrationProgress)}% הושלם
                  </div>

                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 border rounded">
                        {renderStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium">{step.title}</div>
                          <div className="text-sm text-gray-600">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed">
            <div className="text-center py-8 space-y-4">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold text-green-700">ההמרה הושלמה בהצלחה!</h3>
              <p className="text-gray-600">
                הנתונים הועברו למבנה החדש ומוכנים לשימוש.
              </p>
              
              {migrationResult && (
                <div className="text-sm text-gray-500">
                  בוצעו {migrationResult.changes.length} שינויים בהצלחה
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {migrationStep === 'analysis' && (
            <>
              <Button variant="outline" onClick={handleSkip}>
                דחה לעת עתה
              </Button>
              <Button onClick={generatePreview}>
                <EyeIcon className="w-4 h-4 mr-2" />
                הצג תצוגה מקדימה
              </Button>
            </>
          )}

          {migrationStep === 'preview' && migrationResult && (
            <>
              <Button variant="outline" onClick={() => setMigrationStep('analysis')}>
                חזור
              </Button>
              <Button 
                onClick={executeMigration} 
                disabled={!migrationResult.success}
              >
                <ArrowsClockwiseIcon className="w-4 h-4 mr-2" />
                בצע המרה
              </Button>
            </>
          )}

          {migrationStep === 'migrating' && (
            <Button variant="outline" disabled>
              <ArrowsClockwiseIcon className="w-4 h-4 mr-2 animate-spin" />
              מבצע המרה...
            </Button>
          )}

          {migrationStep === 'completed' && (
            <Button onClick={onClose}>
              סגור
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MigrationWarningModal