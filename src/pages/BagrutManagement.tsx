import { useState, useEffect } from 'react'
import { 
  Award, 
  Music, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  Download,
  Upload,
  Star,
  PlayCircle
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { StatusBadge } from '../components/ui/Table'
import PresentationTracker from '../components/bagrut/PresentationTracker'
import ProgramBuilder from '../components/bagrut/ProgramBuilder'
import AccompanistManager from '../components/bagrut/AccompanistManager'
import DocumentManager from '../components/bagrut/DocumentManager'
import apiService from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'

// Grade Level Mappings
const GRADE_LEVELS = {
  'מעולה': { min: 95, max: 100, color: 'bg-emerald-500' },
  'טוב מאוד': { min: 90, max: 94, color: 'bg-blue-500' },
  'טוב': { min: 75, max: 89, color: 'bg-green-500' },
  'מספיק': { min: 55, max: 74, color: 'bg-yellow-500' },
  'מספיק בקושי': { min: 45, max: 54, color: 'bg-orange-500' },
  'לא עבר/ה': { min: 0, max: 44, color: 'bg-red-500' }
}

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

interface BagrutData {
  _id?: string
  studentId: string
  teacherId: string
  program: Array<{
    pieceTitle: string
    composer: string
    duration: string
    movement?: string
    youtubeLink: string | null
  }>
  accompaniment: {
    type: 'נגן מלווה' | 'הרכב'
    accompanists: Array<{
      name: string
      instrument: string
      phone: string | null
    }>
  }
  presentations: Array<{
    completed: boolean
    status: 'לא נבחן' | 'עבר/ה' | 'לא עבר/ה'
    date: string | null
    review: string | null
    reviewedBy: string | null
    notes?: string
    recordingLinks?: string[]
    grade?: number | null
    gradeLevel?: string | null
    detailedGrading?: {
      playingSkills: { grade: string, points: number | null, maxPoints: number, comments: string }
      musicalUnderstanding: { grade: string, points: number | null, maxPoints: number, comments: string }
      textKnowledge: { grade: string, points: number | null, maxPoints: number, comments: string }
      playingByHeart: { grade: string, points: number | null, maxPoints: number, comments: string }
    }
  }>
  documents: Array<{
    title: string
    fileUrl: string
    fileKey: string | null
    uploadDate: string
    uploadedBy: string
  }>
  finalGrade: number | null
  finalGradeLevel: string | null
  isCompleted: boolean
  testDate: string | null
  notes: string
}

export default function BagrutManagement() {
  const { currentSchoolYear } = useSchoolYear()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bagrut, setBagrut] = useState<BagrutData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'presentations' | 'program' | 'accompanist' | 'documents'>('overview')
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')

  // Mock current user role - in real app this would come from auth context
  const currentUserRole = 'teacher' // or 'student'
  const currentUserId = 'current_user_id'

  useEffect(() => {
    if (currentSchoolYear) {
      loadInitialData()
    }
  }, [currentSchoolYear])

  useEffect(() => {
    if (selectedStudent) {
      loadBagrut(selectedStudent)
    }
  }, [selectedStudent])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load students and teachers
      const [studentsData, teachersData] = await Promise.all([
        apiService.students.getStudents({ schoolYearId: currentSchoolYear?._id }),
        apiService.teachers.getTeachers({ schoolYearId: currentSchoolYear?._id })
      ])
      
      setStudents(studentsData)
      setTeachers(teachersData)
      
      // If user is a student, auto-select themselves
      if (currentUserRole === 'student') {
        setSelectedStudent(currentUserId)
      }
      
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const loadBagrut = async (studentId: string) => {
    try {
      setLoading(true)
      
      // Try to get existing bagrut for student
      const bagrutData = await apiService.bagrut.getBagrutByStudent(studentId)
      
      if (bagrutData) {
        setBagrut(bagrutData)
      } else {
        // Create default bagrut structure if none exists
        const defaultBagrut: BagrutData = {
          studentId,
          teacherId: '',
          program: [],
          accompaniment: {
            type: 'נגן מלווה',
            accompanists: []
          },
          presentations: [
            { completed: false, status: 'לא נבחן', date: null, review: null, reviewedBy: null, notes: '', recordingLinks: [] },
            { completed: false, status: 'לא נבחן', date: null, review: null, reviewedBy: null, notes: '', recordingLinks: [] },
            { completed: false, status: 'לא נבחן', date: null, review: null, reviewedBy: null, notes: '', recordingLinks: [] },
            { 
              completed: false, 
              status: 'לא נבחן', 
              date: null, 
              review: null, 
              reviewedBy: null, 
              grade: null,
              gradeLevel: null,
              recordingLinks: [],
              detailedGrading: {
                playingSkills: { grade: 'לא הוערך', points: null, maxPoints: 20, comments: 'אין הערות' },
                musicalUnderstanding: { grade: 'לא הוערך', points: null, maxPoints: 40, comments: 'אין הערות' },
                textKnowledge: { grade: 'לא הוערך', points: null, maxPoints: 30, comments: 'אין הערות' },
                playingByHeart: { grade: 'לא הוערך', points: null, maxPoints: 10, comments: 'אין הערות' }
              }
            }
          ],
          documents: [],
          finalGrade: null,
          finalGradeLevel: null,
          isCompleted: false,
          testDate: null,
          notes: ''
        }
        setBagrut(defaultBagrut)
      }
      
    } catch (err) {
      console.error('Error loading bagrut:', err)
      setError('שגיאה בטעינת נתוני הבגרות')
    } finally {
      setLoading(false)
    }
  }

  const updateBagrut = async (updatedData: Partial<BagrutData>) => {
    if (!bagrut) return
    
    const newBagrut = { ...bagrut, ...updatedData }
    setBagrut(newBagrut)
    
    try {
      if (bagrut._id) {
        await apiService.bagrut.updateBagrut(bagrut._id, newBagrut)
      } else {
        const createdBagrut = await apiService.bagrut.createBagrut(newBagrut)
        setBagrut(createdBagrut)
      }
    } catch (error) {
      console.error('Error updating bagrut:', error)
      setError('שגיאה בשמירת השינויים')
    }
  }

  const updatePresentation = (index: number, presentationData: any) => {
    if (!bagrut) return
    
    const updatedPresentations = [...bagrut.presentations]
    updatedPresentations[index] = presentationData
    
    updateBagrut({ presentations: updatedPresentations })
  }

  const calculateFinalGrade = (detailedGrading: any) => {
    if (!detailedGrading) return null
    
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

  const getProgressPercentage = () => {
    if (!bagrut) return 0
    
    let completed = 0
    
    // Check presentations
    bagrut.presentations.forEach(p => {
      if (p.completed) completed += 1
    })
    
    // Check program (at least 3 pieces)
    if (bagrut.program.length >= 3) completed += 1
    
    // Check accompanist assignment
    if (bagrut.accompaniment.accompanists.length > 0) completed += 1
    
    return Math.round((completed / 6) * 100)
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

  const renderOverviewTab = () => {
    if (!bagrut) return null

    const progressPercentage = getProgressPercentage()
    const magenBagrut = bagrut.presentations[3]
    
    return (
      <div className="space-y-6">
        {/* Progress Overview */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Award className="w-6 h-6 mr-2 text-primary-600" />
              התקדמות בגרות
            </h3>
            <div className="text-2xl font-bold text-primary-600">
              {progressPercentage}%
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {bagrut.presentations.filter(p => p.completed).length}/4
              </div>
              <div className="text-sm text-gray-600">השמעות הושלמו</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {bagrut.program.length}
              </div>
              <div className="text-sm text-gray-600">יצירות בתוכנית</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {bagrut.documents.length}
              </div>
              <div className="text-sm text-gray-600">מסמכים הועלו</div>
            </div>
          </div>
        </Card>

        {/* Presentations Status */}
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PlayCircle className="w-5 h-5 mr-2" />
            סטטוס השמעות
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bagrut.presentations.map((presentation, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{PRESENTATION_NAMES[index]}</span>
                  {presentation.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                {getPresentationStatusBadge(presentation)}
                
                {presentation.completed && presentation.date && (
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(presentation.date).toLocaleDateString('he-IL')}
                  </div>
                )}
                
                {index === 3 && presentation.grade && (
                  <div className="text-sm font-semibold text-primary-600 mt-2">
                    ציון: {presentation.grade}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Final Grade */}
        {bagrut.finalGrade && (
          <Card padding="md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              ציון סופי
            </h3>
            
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {bagrut.finalGrade}
                </div>
                <div className={`inline-block px-4 py-2 rounded-full text-white text-sm font-medium ${
                  GRADE_LEVELS[bagrut.finalGradeLevel || 'לא עבר/ה']?.color || 'bg-gray-500'
                }`}>
                  {bagrut.finalGradeLevel}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">פעולות מהירות</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button 
              onClick={() => setActiveTab('presentations')}
              className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              השמעות
            </button>
            
            <button 
              onClick={() => setActiveTab('program')}
              className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Music className="w-5 h-5 mr-2" />
              תוכנית
            </button>
            
            <button 
              onClick={() => setActiveTab('accompanist')}
              className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              ליווי
            </button>
            
            <button 
              onClick={() => setActiveTab('documents')}
              className="flex items-center justify-center px-4 py-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              מסמכים
            </button>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Award className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary-600" />
          <div className="text-lg text-gray-600">טוען נתוני בגרות...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button 
          onClick={loadInitialData}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Award className="w-8 h-8 mr-3 text-primary-600" />
          מערכת ניהול בגרות
        </h1>
        
        {currentUserRole === 'teacher' && (
          <div className="flex items-center gap-4">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">בחר תלמיד</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.personalInfo?.fullName}
                </option>
              ))}
            </select>
            
            <button className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
              <Download className="w-4 h-4 mr-2" />
              ייצא דוח
            </button>
          </div>
        )}
      </div>

      {!selectedStudent && currentUserRole === 'teacher' && (
        <Card padding="md">
          <div className="text-center py-8">
            <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">בחר תלמיד לניהול בגרות</h2>
            <p className="text-gray-600">בחר תלמיד מהרשימה למעלה כדי להציג את מסלול הבגרות שלו</p>
          </div>
        </Card>
      )}

      {selectedStudent && (
        <>
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 space-x-reverse">
              {[
                { key: 'overview', label: 'סקירה כללית', icon: Award },
                { key: 'presentations', label: 'השמעות', icon: PlayCircle },
                { key: 'program', label: 'תוכנית', icon: Music },
                { key: 'accompanist', label: 'ליווי', icon: Users },
                { key: 'documents', label: 'מסמכים', icon: FileText }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          
          {activeTab === 'presentations' && bagrut && (
            <PresentationTracker
              presentations={bagrut.presentations}
              onUpdate={updatePresentation}
              userRole={currentUserRole as 'student' | 'teacher'}
              readonly={false}
            />
          )}
          
          {activeTab === 'program' && bagrut && (
            <ProgramBuilder
              program={bagrut.program}
              onUpdate={(program) => updateBagrut({ program })}
              readonly={currentUserRole === 'teacher'}
            />
          )}
          
          {activeTab === 'accompanist' && bagrut && (
            <AccompanistManager
              accompaniment={bagrut.accompaniment}
              onUpdate={(accompaniment) => updateBagrut({ accompaniment })}
              readonly={currentUserRole === 'teacher'}
            />
          )}
          
          {activeTab === 'documents' && bagrut && (
            <DocumentManager
              documents={bagrut.documents}
              onUpdate={(documents) => updateBagrut({ documents })}
              readonly={false}
            />
          )}
        </>
      )}
    </div>
  )
}