import { useState } from 'react'
import { 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  Edit, 
  Save, 
  X, 
  Calendar,
  Star,
  FileText,
  ExternalLink,
  Plus,
  Trash2
} from 'lucide-react'
import { Card } from '../ui/card'
import { StatusBadge } from '../ui/Table'

const PRESENTATION_NAMES = [
  'השמעה 1',
  'השמעה 2', 
  'השמעה 3',
  'מגן בגרות'
]

const GRADING_CRITERIA = {
  playingSkills: { label: 'כישורי נגינה', maxPoints: 20 },
  musicalUnderstanding: { label: 'הבנה מוזיקלית', maxPoints: 40 },
  textKnowledge: { label: 'ידיעת הטקסט', maxPoints: 30 },
  playingByHeart: { label: 'נגינה בעל פה', maxPoints: 10 }
}

const GRADE_LEVELS = {
  'מעולה': { min: 95, max: 100, color: 'bg-emerald-500' },
  'טוב מאוד': { min: 90, max: 94, color: 'bg-blue-500' },
  'טוב': { min: 75, max: 89, color: 'bg-green-500' },
  'מספיק': { min: 55, max: 74, color: 'bg-yellow-500' },
  'מספיק בקושי': { min: 45, max: 54, color: 'bg-orange-500' },
  'לא עבר/ה': { min: 0, max: 44, color: 'bg-red-500' }
}

const STATUS_OPTIONS = ['לא נבחן', 'עבר/ה', 'לא עבר/ה']
const DETAIL_GRADE_OPTIONS = ['לא הוערך', 'מעולה', 'טוב מאוד', 'טוב', 'מספיק', 'מספיק בקושי', 'חסר']

interface PresentationTrackerProps {
  presentations: any[]
  onUpdate: (index: number, data: any) => void
  userRole: 'student' | 'teacher'
  readonly?: boolean
}

export default function PresentationTracker({ 
  presentations, 
  onUpdate, 
  userRole, 
  readonly = false 
}: PresentationTrackerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editData, setEditData] = useState<any>(null)

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditData({ ...presentations[index] })
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditData(null)
  }

  const saveEdit = () => {
    if (editingIndex !== null && editData) {
      // Calculate final grade if this is Magen Bagrut (index 3)
      if (editingIndex === 3 && editData.detailedGrading) {
        const finalGrade = calculateFinalGrade(editData.detailedGrading)
        if (finalGrade !== null) {
          editData.grade = finalGrade
          editData.gradeLevel = getGradeLevelFromScore(finalGrade)
        }
      }
      
      onUpdate(editingIndex, editData)
      setEditingIndex(null)
      setEditData(null)
    }
  }

  const calculateFinalGrade = (detailedGrading: any) => {
    const { playingSkills, musicalUnderstanding, textKnowledge, playingByHeart } = detailedGrading
    
    if (!playingSkills.points || !musicalUnderstanding.points || 
        !textKnowledge.points || !playingByHeart.points) {
      return null
    }
    
    const total = playingSkills.points + musicalUnderstanding.points + 
                  textKnowledge.points + playingByHeart.points
    
    return Math.min(total, 100)
  }

  const getGradeLevelFromScore = (score: number): string => {
    for (const [level, range] of Object.entries(GRADE_LEVELS)) {
      if (score >= range.min && score <= range.max) {
        return level
      }
    }
    return 'לא עבר/ה'
  }

  const updateDetailedGrading = (criteriaKey: string, field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      detailedGrading: {
        ...prev.detailedGrading,
        [criteriaKey]: {
          ...prev.detailedGrading[criteriaKey],
          [field]: value
        }
      }
    }))
  }

  const addRecordingLink = (index: number) => {
    const link = prompt('הוסף קישור להקלטה:')
    if (link) {
      const updatedPresentation = {
        ...presentations[index],
        recordingLinks: [...(presentations[index].recordingLinks || []), link]
      }
      onUpdate(index, updatedPresentation)
    }
  }

  const removeRecordingLink = (presentationIndex: number, linkIndex: number) => {
    const updatedPresentation = {
      ...presentations[presentationIndex],
      recordingLinks: presentations[presentationIndex].recordingLinks?.filter((_: any, i: number) => i !== linkIndex) || []
    }
    onUpdate(presentationIndex, updatedPresentation)
  }

  const getPresentationStatusBadge = (presentation: any) => {
    if (!presentation.completed) {
      return <StatusBadge status="inactive">לא נבחן</StatusBadge>
    }
    
    switch (presentation.status) {
      case 'עבר/ה':
        return <StatusBadge status="completed">עבר/ה</StatusBadge>
      case 'לא עבר/ה':
        return <StatusBadge status="inactive">לא עבר/ה</StatusBadge>
      default:
        return <StatusBadge status="active">נבדק</StatusBadge>
    }
  }

  const renderBasicPresentation = (presentation: any, index: number) => {
    const isEditing = editingIndex === index

    return (
      <Card key={index} padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {presentation.completed ? (
              <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            ) : (
              <Clock className="w-6 h-6 text-gray-400 mr-3" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {PRESENTATION_NAMES[index]}
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            {getPresentationStatusBadge(presentation)}
            
            {userRole === 'teacher' && !readonly && (
              <button
                onClick={() => isEditing ? saveEdit() : startEdit(index)}
                className="p-2 text-primary-600 hover:text-primary-800"
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </button>
            )}
            
            {isEditing && (
              <button
                onClick={cancelEdit}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סטטוס
                </label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תאריך השמעה
                </label>
                <input
                  type="date"
                  value={editData.date || ''}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    date: e.target.value,
                    completed: e.target.value ? true : prev.completed
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                הערות ומשוב
              </label>
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הערות על ההשמעה..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {presentation.date && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(presentation.date).toLocaleDateString('he-IL')}
              </div>
            )}

            {presentation.notes && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">{presentation.notes}</p>
              </div>
            )}
            
            {presentation.reviewedBy && (
              <div className="text-xs text-gray-500">
                נבדק על ידי: {presentation.reviewedBy}
              </div>
            )}
          </div>
        )}

        {/* Recording Links */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">קישורים להקלטות</h4>
            {!readonly && (
              <button
                onClick={() => addRecordingLink(index)}
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />
                הוסף קישור
              </button>
            )}
          </div>
          
          {presentation.recordingLinks && presentation.recordingLinks.length > 0 ? (
            <div className="space-y-2">
              {presentation.recordingLinks.map((link: string, linkIndex: number) => (
                <div key={linkIndex} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    הקלטה {linkIndex + 1}
                  </a>
                  {!readonly && (
                    <button
                      onClick={() => removeRecordingLink(index, linkIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">אין קישורים להקלטות</div>
          )}
        </div>
      </Card>
    )
  }

  const renderMagenBagrutPresentation = (presentation: any, index: number) => {
    const isEditing = editingIndex === index

    return (
      <Card key={index} padding="md" className="border-l-4 border-l-yellow-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Star className="w-6 h-6 text-yellow-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">מגן בגרות</h3>
          </div>
          
          <div className="flex items-center gap-3">
            {presentation.grade && (
              <div className="text-2xl font-bold text-primary-600">
                {presentation.grade}
              </div>
            )}
            
            {presentation.gradeLevel && (
              <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                GRADE_LEVELS[presentation.gradeLevel]?.color || 'bg-gray-500'
              }`}>
                {presentation.gradeLevel}
              </div>
            )}
            
            {userRole === 'teacher' && !readonly && (
              <button
                onClick={() => isEditing ? saveEdit() : startEdit(index)}
                className="p-2 text-primary-600 hover:text-primary-800"
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </button>
            )}
            
            {isEditing && (
              <button
                onClick={cancelEdit}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תאריך בחינה
                </label>
                <input
                  type="date"
                  value={editData.date || ''}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    date: e.target.value,
                    completed: e.target.value ? true : prev.completed
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סטטוס כללי
                </label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detailed Grading */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">ציון מפורט</h4>
              
              <div className="space-y-4">
                {Object.entries(GRADING_CRITERIA).map(([key, criteria]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">{criteria.label}</h5>
                      <span className="text-sm text-gray-600">מתוך {criteria.maxPoints} נקודות</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">דירוג</label>
                        <select
                          value={editData.detailedGrading?.[key]?.grade || 'לא הוערך'}
                          onChange={(e) => updateDetailedGrading(key, 'grade', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {DETAIL_GRADE_OPTIONS.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">נקודות</label>
                        <input
                          type="number"
                          min="0"
                          max={criteria.maxPoints}
                          value={editData.detailedGrading?.[key]?.points || ''}
                          onChange={(e) => updateDetailedGrading(key, 'points', parseInt(e.target.value) || null)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">הערות</label>
                        <input
                          type="text"
                          value={editData.detailedGrading?.[key]?.comments || ''}
                          onChange={(e) => updateDetailedGrading(key, 'comments', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="הערות..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculated Grade Display */}
              {editData.detailedGrading && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary-900">ציון מחושב:</span>
                    <div className="text-xl font-bold text-primary-600">
                      {calculateFinalGrade(editData.detailedGrading) || 'לא זמין'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status and Date */}
            <div className="flex items-center justify-between">
              {getPresentationStatusBadge(presentation)}
              
              {presentation.date && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(presentation.date).toLocaleDateString('he-IL')}
                </div>
              )}
            </div>

            {/* Detailed Grading Display */}
            {presentation.detailedGrading && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">פירוט הציון</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(GRADING_CRITERIA).map(([key, criteria]) => {
                    const grading = presentation.detailedGrading[key]
                    return (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{criteria.label}</span>
                          <span className="text-sm font-bold text-primary-600">
                            {grading.points || 0}/{criteria.maxPoints}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          דירוג: {grading.grade}
                        </div>
                        {grading.comments && grading.comments !== 'אין הערות' && (
                          <div className="text-xs text-gray-700">
                            {grading.comments}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {presentation.reviewedBy && (
              <div className="text-xs text-gray-500">
                נבדק על ידי: {presentation.reviewedBy}
              </div>
            )}
          </div>
        )}

        {/* Recording Links for Magen Bagrut */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">הקלטות בחינה</h4>
            {!readonly && (
              <button
                onClick={() => addRecordingLink(index)}
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />
                הוסף הקלטה
              </button>
            )}
          </div>
          
          {presentation.recordingLinks && presentation.recordingLinks.length > 0 ? (
            <div className="space-y-2">
              {presentation.recordingLinks.map((link: string, linkIndex: number) => (
                <div key={linkIndex} className="flex items-center justify-between bg-yellow-50 p-2 rounded">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-700 hover:text-yellow-900 text-sm flex items-center"
                  >
                    <PlayCircle className="w-3 h-3 mr-1" />
                    הקלטת בחינה {linkIndex + 1}
                  </a>
                  {!readonly && (
                    <button
                      onClick={() => removeRecordingLink(index, linkIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">אין הקלטות בחינה</div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <PlayCircle className="w-6 h-6 mr-3 text-primary-600" />
          מעקב השמעות
        </h2>
        
        <div className="text-sm text-gray-600">
          {presentations.filter(p => p.completed).length} מתוך {presentations.length} הושלמו
        </div>
      </div>

      {presentations.map((presentation, index) => 
        index === 3 
          ? renderMagenBagrutPresentation(presentation, index)
          : renderBasicPresentation(presentation, index)
      )}
    </div>
  )
}