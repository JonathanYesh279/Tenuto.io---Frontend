/**
 * Bagrut Tab Component for Student Profile
 *
 * Comprehensive Bagrut management interface with the new grading structure
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, Tab, Button as HeroButton } from '@heroui/react';

import { BagrutHeader } from '@/components/bagrut/BagrutHeader';
import ProgramBuilder from '@/components/bagrut/ProgramBuilder';
import { MagenBagrutForm } from '@/components/bagrut/MagenBagrutForm';
import { DirectorEvaluation } from '@/components/bagrut/DirectorEvaluation';
import { GradeSummary } from '@/components/bagrut/GradeSummary';

import { Bagrut, Presentation, DetailedGrading, DirectorEvaluation as DirectorEvaluationType } from '@/types/bagrut.types';
import { useAuth } from '@/services/authContext';
import { CalendarIcon, ChartBarIcon, CheckCircleIcon, ClockIcon, FileTextIcon, LockIcon, LockOpenIcon, MusicNotesIcon, ShieldIcon, StarIcon, WarningIcon } from '@phosphor-icons/react'

interface BagrutTabProps {
  student: any;
  studentId: string;
  onStudentUpdate?: (updatedStudent: any) => void;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

interface CompletionStatus {
  presentations: {
    completed: number;
    total: number;
    percentage: number;
  };
  programPieces: {
    completed: number;
    required: number;
    percentage: number;
  };
  directorEvaluation: {
    completed: boolean;
    percentage: number;
  };
  overall: {
    percentage: number;
    canComplete: boolean;
  };
}

const BagrutTab: React.FC<BagrutTabProps> = ({
  student,
  studentId,
  onStudentUpdate
}) => {
  const { user } = useAuth();
  const [bagrutData, setBagrutData] = useState<Bagrut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null);
  const [bagrutSection, setBagrutSection] = useState('summary');

  // Initialize presentations structure
  const initializePresentations = (): Presentation[] => [
    {
      completed: false,
      status: 'pending',
      notes: '',
      recordingLinks: []
    },
    {
      completed: false,
      status: 'pending',
      notes: '',
      recordingLinks: []
    },
    {
      completed: false,
      status: 'pending',
      notes: '',
      recordingLinks: []
    },
    {
      completed: false,
      status: 'pending',
      notes: '',
      recordingLinks: [],
      grade: 0,
      gradeLevel: ''
    }
  ];

  useEffect(() => {
    loadBagrutData();
  }, [studentId]);

  useEffect(() => {
    if (bagrutData) {
      validateData();
      calculateCompletionStatus();
    }
  }, [bagrutData]);

  const loadBagrutData = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockBagrutData: Bagrut = {
        _id: `bagrut_${studentId}`,
        studentId,
        teacherId: student.teacherId || '',
        conservatoryName: user?.tenantName || '',
        directorName: user?.directorName || '',
        recitalField: undefined,
        recitalUnits: undefined,
        program: [],
        accompaniment: {
          type: 'נגן מלווה',
          accompanists: []
        },
        presentations: initializePresentations(),
        directorEvaluation: {
          points: undefined,
          percentage: undefined,
          comments: ''
        },
        isCompleted: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setBagrutData(mockBagrutData);
    } catch (error) {
      console.error('Failed to load Bagrut data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateData = () => {
    if (!bagrutData) return;

    const errors: ValidationError[] = [];

    // Check recital configuration
    if (!bagrutData.recitalField) {
      errors.push({
        field: 'recitalField',
        message: 'יש לבחור תחום רסיטל',
        type: 'error'
      });
    }

    if (!bagrutData.recitalUnits) {
      errors.push({
        field: 'recitalUnits',
        message: 'יש לבחור מספר יחידות לימוד',
        type: 'error'
      });
    }

    // Check program pieces
    const requiredPieces = bagrutData.recitalUnits === 5 ? 5 : 3;
    if (bagrutData.program.length < requiredPieces) {
      errors.push({
        field: 'program',
        message: `נדרשות ${requiredPieces} יצירות לתכנית`,
        type: 'error'
      });
    }

    // Check sequential presentation completion
    const presentations = bagrutData.presentations || [];
    for (let i = 1; i < presentations.length; i++) {
      if (presentations[i].completed && !presentations[i - 1].completed) {
        errors.push({
          field: `presentation_${i}`,
          message: `לא ניתן להשלים השמעה ${i + 1} לפני השלמת השמעה ${i}`,
          type: 'error'
        });
      }
    }

    // Check Magen Bagrut grading
    const magenPresentation = presentations[3];
    if (magenPresentation?.completed) {
      const detailedGrading = (magenPresentation as any)?.detailedGrading as DetailedGrading;
      if (detailedGrading) {
        const totalPoints = (detailedGrading.playingSkills.points || 0) +
                          (detailedGrading.musicalUnderstanding.points || 0) +
                          (detailedGrading.textKnowledge.points || 0) +
                          (detailedGrading.playingByHeart.points || 0);

        if (totalPoints > 100) {
          errors.push({
            field: 'magenGrading',
            message: 'סך הנקודות חורג מ-100',
            type: 'warning'
          });
        }

        if (totalPoints < 55) {
          errors.push({
            field: 'magenGrading',
            message: 'ציון נמוך מהמינימום הנדרש',
            type: 'warning'
          });
        }

        // Check individual category maximum points
        if ((detailedGrading.playingSkills.points || 0) > detailedGrading.playingSkills.maxPoints) {
          errors.push({
            field: 'playingSkills',
            message: `נקודות מיומנות נגינה חורגות מהמקסימום (${detailedGrading.playingSkills.maxPoints})`,
            type: 'error'
          });
        }

        if ((detailedGrading.musicalUnderstanding.points || 0) > detailedGrading.musicalUnderstanding.maxPoints) {
          errors.push({
            field: 'musicalUnderstanding',
            message: `נקודות הבנה מוסיקלית חורגות מהמקסימום (${detailedGrading.musicalUnderstanding.maxPoints})`,
            type: 'error'
          });
        }

        if ((detailedGrading.textKnowledge.points || 0) > detailedGrading.textKnowledge.maxPoints) {
          errors.push({
            field: 'textKnowledge',
            message: `נקודות ידיעת טקסט חורגות מהמקסימום (${detailedGrading.textKnowledge.maxPoints})`,
            type: 'error'
          });
        }

        if ((detailedGrading.playingByHeart.points || 0) > detailedGrading.playingByHeart.maxPoints) {
          errors.push({
            field: 'playingByHeart',
            message: `נקודות נגינה בע״פ חורגות מהמקסימום (${detailedGrading.playingByHeart.maxPoints})`,
            type: 'error'
          });
        }
      }
    }

    // Check director evaluation requirements
    if (presentations.filter(p => p.completed).length === 4) {
      if (!bagrutData.directorEvaluation?.points) {
        errors.push({
          field: 'directorEvaluation',
          message: 'נדרשת הערכת מנהל לפני סיום התהליך',
          type: 'error'
        });
      }
    }

    // Check program pieces requirements for 5 units
    if (bagrutData.recitalUnits === 5) {
      const hasMemoryPiece = bagrutData.program.some(piece =>
        piece.movement?.toLowerCase().includes('בעל פה') ||
        piece.pieceTitle?.toLowerCase().includes('בעל פה')
      );

      if (!hasMemoryPiece && bagrutData.program.length >= 5) {
        errors.push({
          field: 'program',
          message: 'תלמידי 5 יחידות נדרשים לבצע יצירה אחת לפחות בעל פה',
          type: 'warning'
        });
      }
    }

    setValidationErrors(errors);
  };

  const calculateCompletionStatus = () => {
    if (!bagrutData) return;

    const presentations = bagrutData.presentations || [];
    const completedPresentations = presentations.filter(p => p.completed).length;

    const requiredPieces = bagrutData.recitalUnits === 5 ? 5 : 3;
    const programCompletion = Math.min(bagrutData.program.length / requiredPieces * 100, 100);

    const directorEvalCompleted = !!(bagrutData.directorEvaluation?.points);

    const presentationCompletion = (completedPresentations / 4) * 100;
    const directorCompletion = directorEvalCompleted ? 100 : 0;

    const overallCompletion = (presentationCompletion * 0.6) + (programCompletion * 0.3) + (directorCompletion * 0.1);

    const canComplete = completedPresentations === 4 &&
                       directorEvalCompleted &&
                       bagrutData.program.length >= requiredPieces &&
                       validationErrors.filter(e => e.type === 'error').length === 0;

    setCompletionStatus({
      presentations: {
        completed: completedPresentations,
        total: 4,
        percentage: presentationCompletion
      },
      programPieces: {
        completed: bagrutData.program.length,
        required: requiredPieces,
        percentage: programCompletion
      },
      directorEvaluation: {
        completed: directorEvalCompleted,
        percentage: directorCompletion
      },
      overall: {
        percentage: overallCompletion,
        canComplete
      }
    });
  };

  const updateBagrutData = (updates: Partial<Bagrut>) => {
    if (!bagrutData) return;

    const updated = { ...bagrutData, ...updates, updatedAt: new Date() };
    setBagrutData(updated);
    setIsDirty(true);
  };

  const saveBagrutData = async () => {
    if (!bagrutData) return;
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call when bagrut backend is ready
      // await bagrutService.updateBagrut(studentId, bagrutData);
      console.log('Saving bagrut data:', bagrutData);
      setIsDirty(false);
      onStudentUpdate?.({ ...student, bagrut: bagrutData });
    } catch (error) {
      console.error('Failed to save bagrut data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePresentation = (index: number, presentationData: Partial<Presentation>) => {
    if (!bagrutData) return;

    const updatedPresentations = [...(bagrutData.presentations || [])];
    updatedPresentations[index] = { ...updatedPresentations[index], ...presentationData };

    updateBagrutData({ presentations: updatedPresentations });
  };

  const updateDirectorEvaluation = (evaluation: DirectorEvaluationType) => {
    updateBagrutData({ directorEvaluation: evaluation });
  };

  const canAccessPresentation = (index: number): boolean => {
    if (!bagrutData?.presentations) return false;
    if (index === 0) return true; // First presentation is always accessible

    // Check if previous presentation is completed
    return bagrutData.presentations[index - 1]?.completed || false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <MusicNotesIcon className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <div className="text-lg font-semibold text-muted-foreground mb-2">טוען נתוני בגרות...</div>
        </div>
      </div>
    );
  }

  if (!bagrutData) {
    return (
      <div className="text-center py-12">
        <div className="text-danger text-lg mb-2">⚠️ שגיאה בטעינת נתוני בגרות</div>
        <Button onClick={loadBagrutData} variant="outline">נסה שוב</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        variant="solid"
        size="sm"
        selectedKey={bagrutSection}
        onSelectionChange={(key) => setBagrutSection(key as string)}
        classNames={{ tabList: 'w-auto' }}
      >
        <Tab
          key="summary"
          title={
            <span className="flex items-center gap-1.5">
              <ChartBarIcon className="w-4 h-4" />
              סיכום
            </span>
          }
        />
        <Tab
          key="program"
          title={
            <span className="flex items-center gap-1.5">
              <MusicNotesIcon className="w-4 h-4" />
              תכנית
            </span>
          }
        />
        <Tab
          key="evaluations"
          title={
            <span className="flex items-center gap-1.5">
              <StarIcon className="w-4 h-4" />
              הערכות
            </span>
          }
        />
      </Tabs>

      {/* Summary tab */}
      {bagrutSection === 'summary' && (
            <div className="pt-4">
              <GradeSummary
                bagrut={bagrutData}
                completionStatus={completionStatus}
                validationErrors={validationErrors}
              />
            </div>
          )}

          {/* Program tab */}
          {bagrutSection === 'program' && (
            <div className="space-y-5 pt-4">
              {/* ProgramBuilder (main) + Recital settings (sidebar) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-card border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <FileTextIcon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">תכנית הרסיטל</h3>
                    </div>
                    <ProgramBuilder
                      program={bagrutData.program || []}
                      onChange={(program) => updateBagrutData({ program })}
                      requiredPieces={bagrutData.recitalUnits === 5 ? 5 : 3}
                      readonly={false}
                    />
                  </div>
                </div>

                <div>
                  <div className="bg-white rounded-card border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-5">
                    <BagrutHeader
                      conservatoryName={bagrutData.conservatoryName}
                      directorName={bagrutData.directorName}
                      recitalField={bagrutData.recitalField}
                      recitalUnits={bagrutData.recitalUnits}
                      studentName={`${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim() || student.name || ''}
                      studentIdNumber={(bagrutData as any).studentIdNumber || ''}
                      onRecitalFieldChange={(field) => updateBagrutData({ recitalField: field })}
                      onRecitalUnitsChange={(units) => updateBagrutData({ recitalUnits: units })}
                      onStudentIdNumberChange={(idNumber) => updateBagrutData({ studentIdNumber: idNumber } as any)}
                      onSave={saveBagrutData}
                      isSaving={isSaving}
                      isDirty={isDirty}
                    />
                  </div>
                </div>
              </div>

              {/* Presentations (1–3) in 2-column grid */}
              {bagrutData.presentations && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <MusicNotesIcon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">השמעות</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bagrutData.presentations.slice(0, 3).map((presentation, index) => {
                      const isAccessible = canAccessPresentation(index);

                      return (
                        <div key={index} className={`bg-white rounded-card border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 relative ${!isAccessible ? 'opacity-50' : ''}`}>
                          {!isAccessible && (
                            <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10 rounded-card">
                              <div className="bg-white p-4 rounded-card shadow-1 flex items-center">
                                <LockIcon className="w-5 h-5 ml-2 text-muted-foreground" />
                                <span className="text-muted-foreground">השלם את השמעה {index} תחילה</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <MusicNotesIcon className="w-5 h-5 text-primary" />
                              <h4 className="text-base font-semibold text-gray-900">השמעה {index + 1}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              {presentation.completed ? (
                                <Badge variant="success">
                                  <CheckCircleIcon className="w-4 h-4 ml-1" />
                                  הושלמה
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <ClockIcon className="w-4 h-4 ml-1" />
                                  ממתינה
                                </Badge>
                              )}

                              {isAccessible ? (
                                <LockOpenIcon className="w-4 h-4 text-success" />
                              ) : (
                                <LockIcon className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {isAccessible && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-right">תאריך השמעה</Label>
                                  <Input
                                    type="date"
                                    value={presentation.date ? new Date(presentation.date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => updatePresentation(index, {
                                      date: e.target.value ? new Date(e.target.value) : undefined,
                                      completed: !!e.target.value
                                    })}
                                    className="text-right"
                                  />
                                </div>

                                <div>
                                  <Label className="text-right">סטטוס</Label>
                                  <Select
                                    value={presentation.status || 'pending'}
                                    onValueChange={(value) => updatePresentation(index, { status: value })}
                                  >
                                    <SelectTrigger className="text-right">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">ממתין</SelectItem>
                                      <SelectItem value="completed">הושלם</SelectItem>
                                      <SelectItem value="needs_improvement">זקוק שיפור</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <Label className="text-right">הערות ומשוב</Label>
                                <Input
                                  value={presentation.notes || ''}
                                  onChange={(e) => updatePresentation(index, { notes: e.target.value })}
                                  placeholder="הערות על ההשמעה..."
                                  className="text-right"
                                  dir="rtl"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Evaluations tab */}
          {bagrutSection === 'evaluations' && (
            <div className="space-y-5 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  {bagrutData.presentations?.[3] && (() => {
                    const magenPresentation = bagrutData.presentations[3];
                    const isAccessible = canAccessPresentation(3);

                    return (
                      <div className={`bg-white rounded-card border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 relative ${!isAccessible ? 'opacity-50' : ''}`}>
                        {!isAccessible && (
                          <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10 rounded-card">
                            <div className="bg-white p-4 rounded-card shadow-1 flex items-center">
                              <LockIcon className="w-5 h-5 ml-2 text-muted-foreground" />
                              <span className="text-muted-foreground">השלם את השמעה 3 תחילה</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted/50 rounded-lg">
                              <StarIcon className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900">מגן בגרות</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            {magenPresentation.completed ? (
                              <Badge variant="success">
                                <CheckCircleIcon className="w-4 h-4 ml-1" />
                                הושלמה
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <ClockIcon className="w-4 h-4 ml-1" />
                                ממתינה
                              </Badge>
                            )}

                            {isAccessible ? (
                              <LockOpenIcon className="w-4 h-4 text-success" />
                            ) : (
                              <LockIcon className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {isAccessible && (
                          <MagenBagrutForm
                            magenBagrut={magenPresentation}
                            onUpdate={(data) => updatePresentation(3, data)}
                            readonly={false}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-white rounded-card border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                  <DirectorEvaluation
                    evaluation={bagrutData.directorEvaluation || { points: undefined, comments: '' }}
                    directorName={bagrutData.directorName}
                    onUpdate={updateDirectorEvaluation}
                    readonly={false}
                  />
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default BagrutTab;
