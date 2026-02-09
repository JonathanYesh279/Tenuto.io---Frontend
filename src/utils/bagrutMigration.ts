/**
 * Bagrut Data Migration Utilities
 * 
 * Handles migration from old point structure to new detailed grading system
 * with comparison, validation, and one-click migration features
 */

import { Bagrut, DetailedGrading, MagenBagrut, Presentation } from '@/types/bagrut.types'

// Legacy data structures for backward compatibility
interface LegacyGradingDetails {
  technique?: { grade?: number; maxPoints?: number; comments?: string }
  interpretation?: { grade?: number; maxPoints?: number; comments?: string }
  musicality?: { grade?: number; maxPoints?: number; comments?: string }
  overall?: { grade?: number; maxPoints?: number; comments?: string }
}

interface LegacyMagenBagrut {
  completed?: boolean
  status?: string
  date?: Date
  review?: string
  reviewedBy?: string
  grade?: number
  gradeLevel?: string
  recordingLinks?: string[]
  // Legacy grading fields
  technique?: number
  interpretation?: number
  musicality?: number
  overall?: number
}

interface MigrationResult {
  success: boolean
  originalData: any
  migratedData: Bagrut
  changes: MigrationChange[]
  warnings: string[]
  errors: string[]
}

interface MigrationChange {
  field: string
  oldValue: any
  newValue: any
  type: 'structure' | 'value' | 'calculation' | 'validation'
  description: string
}

interface MigrationStatus {
  needsMigration: boolean
  version: 'legacy' | 'current'
  issues: MigrationIssue[]
  compatibility: number // 0-100 percentage
}

interface MigrationIssue {
  type: 'missing_field' | 'invalid_structure' | 'calculation_mismatch' | 'data_loss_risk'
  severity: 'low' | 'medium' | 'high' | 'critical'
  field: string
  message: string
  autoFixable: boolean
}

// Point structure mapping from old to new system
const POINT_STRUCTURE_MAPPING = {
  // Old system had different max points
  legacy: {
    technique: { max: 35, weight: 0.4 },      // 35 points, 40% weight
    interpretation: { max: 25, weight: 0.3 }, // 25 points, 30% weight
    musicality: { max: 25, weight: 0.2 },     // 25 points, 20% weight
    overall: { max: 15, weight: 0.1 }         // 15 points, 10% weight
  },
  current: {
    playingSkills: { max: 40, weight: 0.4 },      // 40 points
    musicalUnderstanding: { max: 30, weight: 0.3 }, // 30 points
    textKnowledge: { max: 20, weight: 0.2 },       // 20 points
    playingByHeart: { max: 10, weight: 0.1 }       // 10 points
  }
}

/**
 * Detects if Bagrut data needs migration
 */
export function detectMigrationNeeds(bagrutData: any): MigrationStatus {
  const issues: MigrationIssue[] = []
  let needsMigration = false
  let version: 'legacy' | 'current' = 'current'

  // Check for legacy structure indicators
  if (bagrutData.gradingDetails && !bagrutData.presentations?.[3]?.detailedGrading) {
    needsMigration = true
    version = 'legacy'
    
    issues.push({
      type: 'invalid_structure',
      severity: 'high',
      field: 'gradingDetails',
      message: 'נמצא מבנה ציונים ישן - נדרשת המרה למבנה החדש',
      autoFixable: true
    })
  }

  // Check for legacy MagenBagrut structure
  const magenBagrut = bagrutData.magenBagrut || bagrutData.presentations?.[3]
  if (magenBagrut && (magenBagrut.technique !== undefined || magenBagrut.interpretation !== undefined)) {
    needsMigration = true
    version = 'legacy'
    
    issues.push({
      type: 'invalid_structure',
      severity: 'high',
      field: 'magenBagrut',
      message: 'נמצא מבנה מגן בגרות ישן - נדרשת המרה לטבלת ציונים החדשה',
      autoFixable: true
    })
  }

  // Check for missing required fields in new structure
  if (!bagrutData.recitalUnits || !bagrutData.recitalField) {
    issues.push({
      type: 'missing_field',
      severity: 'medium',
      field: 'recitalConfiguration',
      message: 'חסרים נתוני הגדרת רסיטל (יחידות לימוד ותחום)',
      autoFixable: false
    })
  }

  // Check presentation structure
  if (!bagrutData.presentations || bagrutData.presentations.length !== 4) {
    needsMigration = true
    issues.push({
      type: 'invalid_structure',
      severity: 'medium',
      field: 'presentations',
      message: 'מבנה השמעות אינו תקין - נדרשות 4 השמעות',
      autoFixable: true
    })
  }

  // Calculate compatibility score
  const totalIssues = issues.length
  const autoFixableIssues = issues.filter(i => i.autoFixable).length
  const compatibility = totalIssues === 0 ? 100 : Math.max(0, 100 - (totalIssues * 20) + (autoFixableIssues * 10))

  return {
    needsMigration,
    version,
    issues,
    compatibility
  }
}

/**
 * Migrates legacy point structure to new detailed grading system
 */
export function migrateLegacyGrading(legacyGrading: LegacyGradingDetails): DetailedGrading {
  // Map old categories to new ones with point conversion
  const convertPoints = (oldPoints: number | undefined, oldMax: number, newMax: number): number | undefined => {
    if (oldPoints === undefined) return undefined
    return Math.round((oldPoints / oldMax) * newMax)
  }

  return {
    playingSkills: {
      points: convertPoints(
        legacyGrading.technique?.grade, 
        POINT_STRUCTURE_MAPPING.legacy.technique.max,
        POINT_STRUCTURE_MAPPING.current.playingSkills.max
      ),
      maxPoints: 40,
      comments: legacyGrading.technique?.comments || ''
    },
    musicalUnderstanding: {
      points: convertPoints(
        legacyGrading.interpretation?.grade,
        POINT_STRUCTURE_MAPPING.legacy.interpretation.max,
        POINT_STRUCTURE_MAPPING.current.musicalUnderstanding.max
      ),
      maxPoints: 30,
      comments: legacyGrading.interpretation?.comments || ''
    },
    textKnowledge: {
      points: convertPoints(
        legacyGrading.musicality?.grade,
        POINT_STRUCTURE_MAPPING.legacy.musicality.max,
        POINT_STRUCTURE_MAPPING.current.textKnowledge.max
      ),
      maxPoints: 20,
      comments: legacyGrading.musicality?.comments || ''
    },
    playingByHeart: {
      points: convertPoints(
        legacyGrading.overall?.grade,
        POINT_STRUCTURE_MAPPING.legacy.overall.max,
        POINT_STRUCTURE_MAPPING.current.playingByHeart.max
      ),
      maxPoints: 10,
      comments: legacyGrading.overall?.comments || ''
    }
  }
}

/**
 * Migrates legacy MagenBagrut structure
 */
export function migrateLegacyMagenBagrut(legacyMagen: LegacyMagenBagrut): Presentation {
  const detailedGrading: DetailedGrading = {
    playingSkills: {
      points: legacyMagen.technique ? Math.round((legacyMagen.technique / 35) * 40) : undefined,
      maxPoints: 40,
      comments: ''
    },
    musicalUnderstanding: {
      points: legacyMagen.interpretation ? Math.round((legacyMagen.interpretation / 25) * 30) : undefined,
      maxPoints: 30,
      comments: ''
    },
    textKnowledge: {
      points: legacyMagen.musicality ? Math.round((legacyMagen.musicality / 25) * 20) : undefined,
      maxPoints: 20,
      comments: ''
    },
    playingByHeart: {
      points: legacyMagen.overall ? Math.round((legacyMagen.overall / 15) * 10) : undefined,
      maxPoints: 10,
      comments: ''
    }
  }

  const totalPoints = (detailedGrading.playingSkills.points || 0) +
                     (detailedGrading.musicalUnderstanding.points || 0) +
                     (detailedGrading.textKnowledge.points || 0) +
                     (detailedGrading.playingByHeart.points || 0)

  return {
    completed: legacyMagen.completed || false,
    status: legacyMagen.status || 'pending',
    date: legacyMagen.date,
    review: legacyMagen.review || '',
    notes: '', // New field
    recordingLinks: legacyMagen.recordingLinks || [],
    grade: totalPoints,
    gradeLevel: getGradeLevel(totalPoints),
    // Include detailed grading in the presentation
    ...(detailedGrading && { detailedGrading })
  }
}

/**
 * Performs complete Bagrut data migration
 */
export function migrateBagrutData(bagrutData: any): MigrationResult {
  const changes: MigrationChange[] = []
  const warnings: string[] = []
  const errors: string[] = []
  const originalData = JSON.parse(JSON.stringify(bagrutData))

  try {
    // Start with existing data structure
    const migratedData: Bagrut = {
      ...bagrutData,
      presentations: bagrutData.presentations || []
    }

    // Ensure presentations array has 4 elements
    if (migratedData.presentations.length < 4) {
      const missingCount = 4 - migratedData.presentations.length
      for (let i = 0; i < missingCount; i++) {
        migratedData.presentations.push({
          completed: false,
          status: 'pending',
          notes: '',
          recordingLinks: []
        })
      }
      
      changes.push({
        field: 'presentations',
        oldValue: bagrutData.presentations,
        newValue: migratedData.presentations,
        type: 'structure',
        description: `נוספו ${missingCount} השמעות חסרות`
      })
    }

    // Migrate legacy gradingDetails to MagenBagrut
    if (bagrutData.gradingDetails && bagrutData.gradingDetails.detailedGrading) {
      const newDetailedGrading = migrateLegacyGrading(bagrutData.gradingDetails)
      
      // Update the 4th presentation (Magen Bagrut)
      if (!migratedData.presentations[3].detailedGrading) {
        migratedData.presentations[3] = {
          ...migratedData.presentations[3],
          detailedGrading: newDetailedGrading
        }

        changes.push({
          field: 'presentations[3].detailedGrading',
          oldValue: bagrutData.gradingDetails,
          newValue: newDetailedGrading,
          type: 'structure',
          description: 'הועבר מבנה ציונים ישן למגן בגרות'
        })
      }

      // Remove legacy gradingDetails
      delete migratedData.gradingDetails
      
      changes.push({
        field: 'gradingDetails',
        oldValue: bagrutData.gradingDetails,
        newValue: undefined,
        type: 'structure',
        description: 'הוסר מבנה ציונים ישן'
      })
    }

    // Migrate legacy MagenBagrut structure
    if (bagrutData.magenBagrut) {
      const legacyMagen = bagrutData.magenBagrut as LegacyMagenBagrut
      
      if (legacyMagen.technique !== undefined || legacyMagen.interpretation !== undefined) {
        const migratedPresentation = migrateLegacyMagenBagrut(legacyMagen)
        migratedData.presentations[3] = {
          ...migratedData.presentations[3],
          ...migratedPresentation
        }

        changes.push({
          field: 'presentations[3]',
          oldValue: bagrutData.magenBagrut,
          newValue: migratedPresentation,
          type: 'structure',
          description: 'הועבר מבנה מגן בגרות ישן למבנה חדש'
        })

        // Remove legacy magenBagrut
        delete migratedData.magenBagrut
        
        changes.push({
          field: 'magenBagrut',
          oldValue: bagrutData.magenBagrut,
          newValue: undefined,
          type: 'structure',
          description: 'הוסר מבנה מגן בגרות ישן'
        })
      }
    }

    // Set default recital configuration if missing
    if (!migratedData.recitalUnits) {
      migratedData.recitalUnits = 3 // Default to 3 units
      warnings.push('הוגדרו יחידות לימוד ברירת מחדל (3 יחידות)')
      
      changes.push({
        field: 'recitalUnits',
        oldValue: undefined,
        newValue: 3,
        type: 'value',
        description: 'הוגדרו יחידות לימוד ברירת מחדל'
      })
    }

    if (!migratedData.recitalField) {
      migratedData.recitalField = 'קלאסי' // Default field
      warnings.push('הוגדר תחום רסיטל ברירת מחדל (קלאסי)')
      
      changes.push({
        field: 'recitalField',
        oldValue: undefined,
        newValue: 'קלאסי',
        type: 'value',
        description: 'הוגדר תחום רסיטל ברירת מחדל'
      })
    }

    // Update timestamps
    migratedData.updatedAt = new Date()
    
    changes.push({
      field: 'updatedAt',
      oldValue: bagrutData.updatedAt,
      newValue: migratedData.updatedAt,
      type: 'value',
      description: 'עודכן זמן שינוי אחרון'
    })

    return {
      success: true,
      originalData,
      migratedData,
      changes,
      warnings,
      errors
    }

  } catch (error) {
    errors.push(`שגיאה בתהליך ההמרה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`)
    
    return {
      success: false,
      originalData,
      migratedData: bagrutData, // Return original data on error
      changes,
      warnings,
      errors
    }
  }
}

/**
 * Creates comparison data between old and new structures
 */
export function createMigrationComparison(originalData: any, migratedData: Bagrut) {
  const comparison = {
    structure: {
      before: extractStructureInfo(originalData),
      after: extractStructureInfo(migratedData)
    },
    calculations: {
      before: extractCalculations(originalData),
      after: extractCalculations(migratedData)
    },
    dataLoss: checkDataLoss(originalData, migratedData),
    benefits: [
      'מבנה ציונים מפורט יותר',
      'תמיכה בטבלת ציונים חדשה',
      'אימות משופר של נתונים',
      'תואמות למערכת החדשה'
    ],
    risks: [
      'שינוי במבנה הנתונים',
      'צורך בהתאמת קוד קיים',
      'אפשרות לאי התאמות זמניות'
    ]
  }

  return comparison
}

/**
 * Validates migrated data
 */
export function validateMigratedData(bagrutData: Bagrut): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!bagrutData.studentId) errors.push('חסר מזהה תלמיד')
  if (!bagrutData.teacherId) errors.push('חסר מזהה מורה')
  if (!bagrutData.recitalUnits) errors.push('חסרות יחידות לימוד')
  if (!bagrutData.recitalField) errors.push('חסר תחום רסיטל')

  // Check presentations structure
  if (!bagrutData.presentations || bagrutData.presentations.length !== 4) {
    errors.push('מבנה השמעות אינו תקין')
  } else {
    // Check MagenBagrut (4th presentation)
    const magenBagrut = bagrutData.presentations[3]
    if (magenBagrut.detailedGrading) {
      const grading = magenBagrut.detailedGrading
      
      // Check point limits
      if ((grading.playingSkills.points || 0) > 40) {
        errors.push('ניקוד מיומנות נגינה חורג מהמקסימום')
      }
      if ((grading.musicalUnderstanding.points || 0) > 30) {
        errors.push('ניקוד הבנה מוסיקלית חורג מהמקסימום')
      }
      if ((grading.textKnowledge.points || 0) > 20) {
        errors.push('ניקוד ידיעת טקסט חורג מהמקסימום')
      }
      if ((grading.playingByHeart.points || 0) > 10) {
        errors.push('ניקוד נגינה בעל פה חורג מהמקסימום')
      }

      const total = (grading.playingSkills.points || 0) + 
                   (grading.musicalUnderstanding.points || 0) + 
                   (grading.textKnowledge.points || 0) + 
                   (grading.playingByHeart.points || 0)

      if (total > 100) {
        errors.push('סך הנקודות חורג מ-100')
      }

      if (total < 55 && total > 0) {
        warnings.push('ציון נמוך מהמינימום הנדרש')
      }
    }
  }

  // Check program requirements
  const requiredPieces = bagrutData.recitalUnits === 5 ? 5 : 3
  if (bagrutData.program && bagrutData.program.length < requiredPieces) {
    warnings.push(`נדרשות ${requiredPieces} יצירות בתכנית`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Helper functions
function getGradeLevel(score: number): string {
  if (score >= 95) return 'מצוין (95-100)'
  if (score >= 85) return 'טוב מאוד (85-94)'
  if (score >= 75) return 'טוב (75-84)'
  if (score >= 65) return 'כמעט טוב (65-74)'
  if (score >= 55) return 'מספק (55-64)'
  if (score >= 45) return 'כמעט מספק (45-54)'
  if (score >= 35) return 'לא מספק (35-44)'
  return 'גרוע (0-34)'
}

function extractStructureInfo(data: any) {
  return {
    hasGradingDetails: !!data.gradingDetails,
    hasMagenBagrut: !!data.magenBagrut,
    presentationsCount: data.presentations?.length || 0,
    hasRecitalConfig: !!(data.recitalUnits && data.recitalField),
    programPieces: data.program?.length || 0
  }
}

function extractCalculations(data: any) {
  if (data.presentations?.[3]?.detailedGrading) {
    const grading = data.presentations[3].detailedGrading
    return {
      playingSkills: grading.playingSkills.points || 0,
      musicalUnderstanding: grading.musicalUnderstanding.points || 0,
      textKnowledge: grading.textKnowledge.points || 0,
      playingByHeart: grading.playingByHeart.points || 0,
      total: (grading.playingSkills.points || 0) + 
             (grading.musicalUnderstanding.points || 0) + 
             (grading.textKnowledge.points || 0) + 
             (grading.playingByHeart.points || 0)
    }
  }

  // Legacy structure
  if (data.gradingDetails?.detailedGrading) {
    return {
      technique: data.gradingDetails.technique?.grade || 0,
      interpretation: data.gradingDetails.interpretation?.grade || 0,
      musicality: data.gradingDetails.musicality?.grade || 0,
      overall: data.gradingDetails.overall?.grade || 0,
      total: (data.gradingDetails.technique?.grade || 0) + 
             (data.gradingDetails.interpretation?.grade || 0) + 
             (data.gradingDetails.musicality?.grade || 0) + 
             (data.gradingDetails.overall?.grade || 0)
    }
  }

  return null
}

function checkDataLoss(original: any, migrated: any): string[] {
  const dataLoss: string[] = []
  
  // Check for potential data loss during migration
  if (original.gradingDetails?.comments && !migrated.presentations?.[3]?.notes) {
    dataLoss.push('הערות כלליות מהמבנה הישן')
  }

  if (original.magenBagrut?.additionalNotes && !migrated.presentations?.[3]?.notes) {
    dataLoss.push('הערות נוספות ממגן בגרות')
  }

  return dataLoss
}

export { POINT_STRUCTURE_MAPPING }