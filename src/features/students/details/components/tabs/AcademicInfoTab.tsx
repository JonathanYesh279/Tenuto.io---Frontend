/**
 * Academic Info Tab Component
 * 
 * Displays student academic information including instrument progress,
 * teacher assignments, academic performance, and educational details.
 */

import { useState, useMemo, useEffect } from 'react'

import { StudentDetails } from '../../types'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import { BookOpenIcon, CalendarIcon, CheckCircleIcon, ClipboardCheckIcon, ClockIcon, FloppyDiskIcon, GraduationCapIcon, MedalIcon, MusicNotesIcon, PencilSimpleIcon, SchoolIcon, StarIcon, TargetIcon, TrendUpIcon, TrophyIcon, UserIcon, WarningIcon, XIcon } from '@phosphor-icons/react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { useAuth } from '../../../../../services/authContext.jsx'
import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'
import StageAdvancementConfirmModal from '../modals/StageAdvancementConfirmModal'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface AcademicInfoTabProps {
  student: StudentDetails
  studentId: string
}

// Hebrew stage definitions
const HEBREW_STAGES = {
  1: { name: "א'", description: 'שלב התחלתי' },
  2: { name: "ב'", description: 'שלב בסיסי' },
  3: { name: "ג'", description: 'שלב בינוני נמוך' },
  4: { name: "ד'", description: 'שלב בינוני' },
  5: { name: "ה'", description: 'שלב בינוני גבוה' },
  6: { name: "ו'", description: 'שלב מתקדם' },
  7: { name: "ז'", description: 'שלב מתקדם גבוה' },
  8: { name: "ח'", description: 'שלב מוכשר' }
}

// Test status options
const TEST_STATUSES = [
  'לא נבחן',
  'נכשל/ה',
  'עבר/ה',
  'עבר/ה בהצטיינות',
  'עבר/ה בהצטיינות יתרה',
  'ממתין/ה',
  'פטור/ה'
]

// Passing test statuses that trigger stage advancement
const PASSING_STATUSES = ['עבר/ה', 'עבר/ה בהצטיינות', 'עבר/ה בהצטיינות יתרה']

// Achievement definitions
const ACHIEVEMENTS = {
  practiceHours: {
    bronze: { threshold: 50, name: 'מתרגל ברונזה', icon: '🥉' },
    silver: { threshold: 100, name: 'מתרגל כסף', icon: '🥈' },
    gold: { threshold: 200, name: 'מתרגל זהב', icon: '🥇' }
  },
  stageProgress: {
    fastLearner: { name: 'לומד מהיר', icon: '⚡' },
    consistent: { name: 'עקבי', icon: '📈' },
    dedicated: { name: 'מסור', icon: '💪' }
  },
  performance: {
    soloist: { name: 'סולן', icon: '🎤' },
    ensemble: { name: 'נגן אנסמבל', icon: '🎼' },
    composer: { name: 'מלחין', icon: '✍️' }
  }
}

// Bagrut requirements
const BAGRUT_REQUIREMENTS = {
  practical: {
    name: 'בחינה מעשית',
    stages: [5, 6], // Must reach stage ה' or ו'
    description: 'ביצוע יצירות ברמה נדרשת'
  },
  theory: {
    name: 'תיאוריית המוזיקה',
    minScore: 70,
    description: 'ציון מינימלי 70 בתיאוריה'
  },
  solfege: {
    name: 'סולפז\'',
    minScore: 70,
    description: 'ציון מינימלי 70 בסולפז\''
  },
  listening: {
    name: 'האזנה מנותחת',
    minScore: 65,
    description: 'ציון מינימלי 65 בהאזנה'
  }
}

const AcademicInfoTab: React.FC<AcademicInfoTabProps> = ({ student, studentId }) => {
  const { academicInfo, teacherAssignments, enrollments } = student
  const { user } = useAuth()

  // Check if user is admin
  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin'

  // State for teachers data
  const [teachersData, setTeachersData] = useState<any[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  // State for test results editing
  const [isEditingTests, setIsEditingTests] = useState(false)
  const [editedTestData, setEditedTestData] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Stage advancement modal state
  const [showStageModal, setShowStageModal] = useState(false)
  const [stageAdvancementData, setStageAdvancementData] = useState<{
    instrumentName: string
    currentStage: number
    newStage: number
  } | null>(null)

  // Load teacher names from teacherAssignments (source of truth)
  useEffect(() => {
    const loadTeachersData = async () => {
      const teacherIds = [...new Set(teacherAssignments?.map((a: any) => a.teacherId) || [])]
      if (teacherIds.length === 0) return

      setLoadingTeachers(true)
      try {
        const teachersPromises = teacherIds.map((teacherId: string) =>
          apiService.teachers.getTeacher(teacherId)
        )
        const teachers = await Promise.all(teachersPromises)
        setTeachersData(teachers)
      } catch (error) {
        console.error('Failed to load teachers:', error)
      } finally {
        setLoadingTeachers(false)
      }
    }

    loadTeachersData()
  }, [teacherAssignments])

  // teachersWithoutLessons is no longer applicable since we derive from assignments
  const teachersWithoutLessons: any[] = []

  const InfoSection: React.FC<{ 
    title: string; 
    icon: React.ComponentType<any>; 
    children: React.ReactNode;
    className?: string;
  }> = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 bg-muted/50 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )

  const InfoRow: React.FC<{ label: string; value: string | React.ReactNode; className?: string }> = ({
    label,
    value,
    className = ''
  }) => (
    <div className={`flex justify-between items-start py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors duration-150 ${className}`}>
      <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0 ml-4">{label}</span>
      <span className="text-sm text-gray-900 text-right min-w-0 flex-1 font-medium">
        {value || <span className="text-gray-400 italic">לא צוין</span>}
      </span>
    </div>
  )

  // Handler functions for test editing
  const handleEditTests = () => {
    console.log('🔧 Entering edit mode for tests')
    // Initialize edit data with current test values
    const initialTestData: Record<string, any> = {}
    academicInfo.instrumentProgress?.forEach((instrument) => {
      initialTestData[instrument.instrumentName] = {
        stageTestStatus: instrument.tests?.stageTest?.status || 'לא נבחן',
        technicalTestStatus: instrument.tests?.technicalTest?.status || 'לא נבחן',
        currentStage: instrument.currentStage
      }
    })
    console.log('📝 Initial test data:', initialTestData)
    setEditedTestData(initialTestData)
    setIsEditingTests(true)
    setSaveError(null)
    setSaveSuccess(false)
  }

  const handleCancelEdit = () => {
    setIsEditingTests(false)
    setEditedTestData({})
    setSaveError(null)
  }

  const handleTestStatusChange = (instrumentName: string, testType: 'stageTest' | 'technicalTest', value: string) => {
    setEditedTestData(prev => ({
      ...prev,
      [instrumentName]: {
        ...prev[instrumentName],
        [`${testType}Status`]: value
      }
    }))
  }

  const handleSaveTests = async () => {
    setSaveError(null)
    setSaveSuccess(false)

    // Check if any stage test changed to passing status
    for (const instrumentName in editedTestData) {
      const instrument = academicInfo.instrumentProgress?.find(i => i.instrumentName === instrumentName)
      if (!instrument) continue

      const oldStageTestStatus = instrument.tests?.stageTest?.status || 'לא נבחן'
      const newStageTestStatus = editedTestData[instrumentName].stageTestStatus

      // If stage test changed to passing and wasn't passing before
      if (PASSING_STATUSES.includes(newStageTestStatus) &&
          !PASSING_STATUSES.includes(oldStageTestStatus) &&
          instrument.currentStage < 8) {
        // Show confirmation modal
        setStageAdvancementData({
          instrumentName,
          currentStage: instrument.currentStage,
          newStage: instrument.currentStage + 1
        })
        setShowStageModal(true)
        return
      }
    }

    // If no stage advancement needed, save directly
    await saveTestUpdates(false)
  }

  const saveTestUpdates = async (autoAdvanceStage: boolean) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      // Update each instrument's test status
      for (const instrumentName in editedTestData) {
        const testData = editedTestData[instrumentName]

        await apiService.students.updateStageTestStatus(studentId, instrumentName, {
          stageTestStatus: testData.stageTestStatus,
          technicalTestStatus: testData.technicalTestStatus,
          autoAdvanceStage
        })
      }

      setSaveSuccess(true)
      setIsEditingTests(false)
      setEditedTestData({})

      // Refresh student data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      console.error('Error saving test updates:', error)
      setSaveError(error.message || 'שגיאה בשמירת נתוני המבחנים')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmStageAdvancement = async () => {
    setShowStageModal(false)
    await saveTestUpdates(true)
  }

  const handleCancelStageAdvancement = () => {
    setShowStageModal(false)
    // FloppyDiskIcon without stage advancement
    saveTestUpdates(false)
  }

  // Progress bar component with enhanced styling
  const ProgressBar: React.FC<{ current: number; target: number; label: string; color?: string }> = ({ 
    current, 
    target, 
    label,
    color = 'primary'
  }) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
    const colorClasses = {
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
      success: 'bg-gradient-to-r from-success-500 to-success-600',
      warning: 'bg-gradient-to-r from-orange-500 to-orange-600',
      info: 'bg-gradient-to-r from-blue-500 to-blue-600'
    }
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{current}</span>
            <span className="text-xs text-gray-500">/ {target}</span>
            <span className="text-xs font-medium text-primary">{Math.round(percentage)}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  // Skills overview chart data
  const skillsChartData = useMemo(() => {
    if (!academicInfo.instrumentProgress?.[0]?.skillAssessments) return null
    
    const primaryInstrument = academicInfo.instrumentProgress.find(i => i.isPrimary) || academicInfo.instrumentProgress[0]
    const skills = primaryInstrument.skillAssessments
    
    return {
      labels: ['טכניקה', 'מוזיקליות', 'קצב', 'צליל', 'ביצוע'],
      datasets: [{
        data: [skills.technique, skills.musicality, skills.rhythm, skills.pitch, skills.performance],
        backgroundColor: [
          '#6366f1', // primary
          '#10b981', // success
          '#f59e0b', // warning
          '#3b82f6', // blue
          '#8b5cf6'  // purple
        ],
        borderWidth: 0,
        cutout: '65%',
      }]
    }
  }, [academicInfo.instrumentProgress])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: 'Inter'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed}/10`
        }
      }
    }
  }

  // Skill assessment component
  const SkillBadge: React.FC<{ skill: string; level: number }> = ({ skill, level }) => {
    const getColor = (level: number) => {
      if (level >= 8) return 'bg-green-100 text-green-800'
      if (level >= 6) return 'bg-yellow-100 text-yellow-800'
      if (level >= 4) return 'bg-orange-100 text-orange-800'
      return 'bg-red-100 text-red-800'
    }

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColor(level)}`}>
        {skill}: {level}/10
      </div>
    )
  }

  // Hebrew Stage Component
  const HebrewStageIndicator: React.FC<{ current: number; target: number; instrumentName: string }> = ({ 
    current, 
    target, 
    instrumentName 
  }) => {
    const currentStage = HEBREW_STAGES[current as keyof typeof HEBREW_STAGES]
    const targetStage = HEBREW_STAGES[target as keyof typeof HEBREW_STAGES]
    
    return (
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">{instrumentName}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">יעד:</span>
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm font-bold">
              {targetStage?.name || target}
            </span>
          </div>
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-indigo-600">{currentStage?.name || current}</span>
            <span className="text-sm text-gray-600">{currentStage?.description}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="h-4 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>שלב {current}</span>
            <span>{Math.round((current / target) * 100)}%</span>
            <span>יעד: שלב {target}</span>
          </div>
        </div>
      </div>
    )
  }

  // Practice Hours Component
  const PracticeHoursTracker: React.FC<{ hours: number; instrumentName: string }> = ({ hours, instrumentName }) => {
    const getAchievement = (hours: number) => {
      if (hours >= ACHIEVEMENTS.practiceHours.gold.threshold) return ACHIEVEMENTS.practiceHours.gold
      if (hours >= ACHIEVEMENTS.practiceHours.silver.threshold) return ACHIEVEMENTS.practiceHours.silver
      if (hours >= ACHIEVEMENTS.practiceHours.bronze.threshold) return ACHIEVEMENTS.practiceHours.bronze
      return null
    }
    
    const achievement = getAchievement(hours)
    const nextThreshold = achievement === ACHIEVEMENTS.practiceHours.gold ? null : 
      achievement === ACHIEVEMENTS.practiceHours.silver ? ACHIEVEMENTS.practiceHours.gold.threshold :
      achievement === ACHIEVEMENTS.practiceHours.bronze ? ACHIEVEMENTS.practiceHours.silver.threshold :
      ACHIEVEMENTS.practiceHours.bronze.threshold
    
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">שעות תרגול - {instrumentName}</h4>
          </div>
          {achievement && (
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-green-200">
              <span className="text-lg">{achievement.icon}</span>
              <span className="text-sm font-medium text-green-800">{achievement.name}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-green-600">{hours}</span>
            <span className="text-sm text-gray-600">שעות השבוע</span>
          </div>
          
          {nextThreshold && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">עד לדרגה הבאה</span>
                <span className="font-medium">{nextThreshold - hours} שעות</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((hours / nextThreshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Achievement Badge Component
  const AchievementBadge: React.FC<{ achievement: any; earned: boolean }> = ({ achievement, earned }) => (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
      earned 
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm' 
        : 'bg-gray-100 text-gray-500 border border-gray-300'
    }`}>
      <span className={`text-lg ${earned ? '' : 'grayscale opacity-50'}`}>{achievement.icon}</span>
      <span>{achievement.name}</span>
    </div>
  )

  // Bagrut Requirements Tracker
  const BagrutRequirementsTracker: React.FC = () => {
    const theoreticalKnowledge = academicInfo.theoreticalKnowledge
    const primaryInstrument = academicInfo.instrumentProgress?.find(i => i.isPrimary)
    
    const requirements = [
      {
        ...BAGRUT_REQUIREMENTS.practical,
        status: primaryInstrument && BAGRUT_REQUIREMENTS.practical.stages.includes(primaryInstrument.currentStage) ? 'completed' : 'pending',
        currentValue: primaryInstrument?.currentStage || 0
      },
      {
        ...BAGRUT_REQUIREMENTS.theory,
        status: theoreticalKnowledge?.musicTheory >= BAGRUT_REQUIREMENTS.theory.minScore ? 'completed' : 'pending',
        currentValue: theoreticalKnowledge?.musicTheory || 0
      },
      {
        ...BAGRUT_REQUIREMENTS.solfege,
        status: theoreticalKnowledge?.solfege >= BAGRUT_REQUIREMENTS.solfege.minScore ? 'completed' : 'pending',
        currentValue: theoreticalKnowledge?.solfege || 0
      },
      {
        ...BAGRUT_REQUIREMENTS.listening,
        status: 'pending', // This would come from a listening test score
        currentValue: 0
      }
    ]
    
    const completedCount = requirements.filter(r => r.status === 'completed').length
    const progressPercentage = (completedCount / requirements.length) * 100
    
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <GraduationCapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">מעקב דרישות בגרות</h3>
              <p className="text-sm text-gray-600">התקדמות לעמידה בדרישות הבגרות במוזיקה</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{completedCount}/4</div>
            <div className="text-xs text-gray-500">דרישות הושלמו</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map((req, index) => (
              <div key={index} className="bg-white/60 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{req.name}</h4>
                  {req.status === 'completed' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <WarningIcon className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                {req.currentValue > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">ציון נוכחי: </span>
                    <span className={req.status === 'completed' ? 'text-green-600' : 'text-orange-600'}>
                      {req.currentValue}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Get primary teacher name from teacher assignments
  const primaryTeacher = useMemo(() => {
    if (teacherAssignments && teacherAssignments.length > 0) {
      const activeTeacher = teacherAssignments.find((ta: any) => ta.isActive)
      return activeTeacher?.teacherName || teacherAssignments[0]?.teacherName || null
    }
    return null
  }, [teacherAssignments])

  // Get primary instrument from progress
  const primaryInstrument = useMemo(() => {
    if (academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0) {
      const primary = academicInfo.instrumentProgress.find(i => i.isPrimary)
      return primary || academicInfo.instrumentProgress[0]
    }
    return null
  }, [academicInfo.instrumentProgress])

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">מידע אקדמי</h2>
        <p className="text-gray-600 mt-1">התקדמות, כישורים והישגים אקדמיים</p>
      </div>

      {/* Academic Summary Card - Shows key info at a glance */}
      <InfoSection title="מידע אקדמי" icon={BookOpenIcon}>
        <div className="space-y-1">
          <InfoRow label="כיתה" value={academicInfo.class} />
          <InfoRow
            label="תאריך התחלה"
            value={primaryInstrument?.startDate ? new Date(primaryInstrument.startDate).toLocaleDateString('he-IL') : 'לא צוין'}
          />
          <InfoRow label="כלי נגינה" value={primaryInstrument?.instrumentName} />
          <InfoRow
            label="שלב"
            value={primaryInstrument ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground-800">
                {HEBREW_STAGES[primaryInstrument.currentStage as keyof typeof HEBREW_STAGES]?.name || primaryInstrument.currentStage}
              </span>
            ) : 'לא צוין'}
          />
          <InfoRow
            label="מורה"
            value={primaryTeacher ? (
              <span className="font-medium text-primary">{primaryTeacher}</span>
            ) : 'לא משויך'}
          />
        </div>
      </InfoSection>

      {/* Hebrew Stage Progress Cards */}
      {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          {academicInfo.instrumentProgress.map((instrument, index) => (
            <HebrewStageIndicator
              key={index}
              current={instrument.currentStage}
              target={instrument.targetStage}
              instrumentName={instrument.instrumentName}
            />
          ))}
        </div>
      )}

      {/* Practice Hours Tracking */}
      {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {academicInfo.instrumentProgress.map((instrument, index) => (
            <PracticeHoursTracker
              key={index}
              hours={Math.floor(Math.random() * 250) + 50} // Mock data - would come from API
              instrumentName={instrument.instrumentName}
            />
          ))}
        </div>
      )}

      {/* Test Results Section */}
      {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 && (
        <InfoSection
          title="תוצאות מבחנים"
          icon={ClipboardCheckIcon}
          className="bg-gradient-to-br from-blue-50 to-cyan-50"
        >
          <div className="space-y-4">
            {/* Edit/Save buttons for admin */}
            {isAdmin && !isEditingTests && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleEditTests}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <PencilSimpleIcon className="w-4 h-4" />
                  <span>ערוך תוצאות מבחנים</span>
                </button>
              </div>
            )}

            {/* FloppyDiskIcon/Cancel buttons when editing */}
            {isAdmin && isEditingTests && (
              <div className="flex gap-3 justify-end mb-4">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  <XIcon className="w-4 h-4" />
                  <span>ביטול</span>
                </button>
                <button
                  onClick={handleSaveTests}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>שומר...</span>
                    </>
                  ) : (
                    <>
                      <FloppyDiskIcon className="w-4 h-4" />
                      <span>שמור שינויים</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Success/Error messages */}
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 mb-4">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800">תוצאות המבחנים עודכנו בהצלחה!</p>
              </div>
            )}

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-4">
                <WarningIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{saveError}</p>
              </div>
            )}

            {/* Test results for each instrument */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {academicInfo.instrumentProgress.map((instrument, index) => {
                const stageTestStatus = isEditingTests
                  ? editedTestData[instrument.instrumentName]?.stageTestStatus || 'לא נבחן'
                  : instrument.tests?.stageTest?.status || 'לא נבחן'

                const technicalTestStatus = isEditingTests
                  ? editedTestData[instrument.instrumentName]?.technicalTestStatus || 'לא נבחן'
                  : instrument.tests?.technicalTest?.status || 'לא נבחן'

                const getStatusColor = (status: string) => {
                  if (PASSING_STATUSES.includes(status)) return 'text-green-700 bg-green-100'
                  if (status === 'נכשל/ה') return 'text-red-700 bg-red-100'
                  if (status === 'ממתין/ה') return 'text-yellow-700 bg-yellow-100'
                  if (status === 'פטור/ה') return 'text-blue-700 bg-blue-100'
                  return 'text-gray-700 bg-gray-100'
                }

                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-5 border border-cyan-200 shadow-sm"
                  >
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                      <MusicNotesIcon className="w-5 h-5 text-cyan-600" />
                      {instrument.instrumentName}
                    </h4>

                    <div className="space-y-4">
                      {/* Debug log */}
                      {console.log('🎨 Rendering test fields, isEditingTests:', isEditingTests, 'instrument:', instrument.instrumentName)}
                      {/* Stage Test */}
                      <div>
                        <label className="block text-base font-semibold text-gray-700 mb-2">
                          מבחן שלב
                        </label>
                        {isEditingTests ? (
                          <select
                            value={stageTestStatus}
                            onChange={(e) => handleTestStatusChange(instrument.instrumentName, 'stageTest', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                          >
                            {TEST_STATUSES.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        ) : (
                          <div className={`px-4 py-3 rounded-lg text-base font-medium ${getStatusColor(stageTestStatus)}`}>
                            {stageTestStatus}
                          </div>
                        )}
                      </div>

                      {/* Technical Test */}
                      <div>
                        <label className="block text-base font-semibold text-gray-700 mb-2">
                          מבחן טכני
                        </label>
                        {isEditingTests ? (
                          <select
                            value={technicalTestStatus}
                            onChange={(e) => handleTestStatusChange(instrument.instrumentName, 'technicalTest', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                          >
                            {TEST_STATUSES.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        ) : (
                          <div className={`px-4 py-3 rounded-lg text-base font-medium ${getStatusColor(technicalTestStatus)}`}>
                            {technicalTestStatus}
                          </div>
                        )}
                      </div>

                      {/* Current Stage indicator */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">שלב נוכחי:</span>
                          <span className="font-bold text-primary text-lg">
                            {HEBREW_STAGES[instrument.currentStage as keyof typeof HEBREW_STAGES]?.name || instrument.currentStage}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </InfoSection>
      )}

      {/* Achievement Badges Display */}
      <InfoSection title="הישגים ואותות הכרה" icon={MedalIcon}>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">תרגול והתמדה</h4>
            <div className="flex flex-wrap gap-2">
              <AchievementBadge achievement={ACHIEVEMENTS.practiceHours.bronze} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.practiceHours.silver} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.practiceHours.gold} earned={false} />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">התקדמות אקדמית</h4>
            <div className="flex flex-wrap gap-2">
              <AchievementBadge achievement={ACHIEVEMENTS.stageProgress.fastLearner} earned={false} />
              <AchievementBadge achievement={ACHIEVEMENTS.stageProgress.consistent} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.stageProgress.dedicated} earned={true} />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">ביצוע ויצירה</h4>
            <div className="flex flex-wrap gap-2">
              <AchievementBadge achievement={ACHIEVEMENTS.performance.soloist} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.performance.ensemble} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.performance.composer} earned={false} />
            </div>
          </div>
        </div>
      </InfoSection>

      {/* Bagrut Requirements Tracker */}
      <BagrutRequirementsTracker />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Skills Overview Chart */}
        {skillsChartData && (
          <InfoSection title="סקירת כישורים" icon={TrendUpIcon}>
            <div className="h-64">
              <Doughnut data={skillsChartData} options={chartOptions} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                הערכת כישורים עבור {academicInfo.instrumentProgress?.find(i => i.isPrimary)?.instrumentName || 'הכלי הראשי'}
              </p>
            </div>
          </InfoSection>
        )}

        {/* Academic Stats Cards */}
        <div className="xl:col-span-2 grid grid-cols-1 gap-6">
          {/* General Academic Info */}
          <InfoSection title="מידע כללי" icon={SchoolIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="כיתה" value={academicInfo.class} />
              <InfoRow label="בית ספר" value={academicInfo.schoolName} />
              <InfoRow 
                label="סגנון למידה" 
                value={academicInfo.learningStyle ? {
                  'visual': 'ויזואלי',
                  'auditory': 'אודיטורי',
                  'kinesthetic': 'קינסתטי',
                  'mixed': 'מעורב'
                }[academicInfo.learningStyle] : 'לא צוין'} 
              />
              {academicInfo.specialNeeds && (
                <InfoRow label="צרכים מיוחדים" value={academicInfo.specialNeeds} />
              )}
            </div>
          </InfoSection>
        </div>
      </div>

      {/* Theoretical Knowledge Section */}
      {academicInfo.theoreticalKnowledge && (
        <InfoSection title="ידע תיאורטי" icon={BookOpenIcon}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProgressBar
              current={academicInfo.theoreticalKnowledge.solfege}
              target={10}
              label="סולפז'"
              color="success"
            />
            <ProgressBar
              current={academicInfo.theoreticalKnowledge.musicTheory}
              target={10}
              label="תיאוריית המוזיקה"
              color="primary"
            />
            <ProgressBar
              current={academicInfo.theoreticalKnowledge.musicHistory}
              target={10}
              label="היסטוריה של המוזיקה"
              color="info"
            />
          </div>
        </InfoSection>
      )}

      {/* Instrument Progress */}
      <InfoSection title="התקדמות בכלי נגינה" icon={MusicNotesIcon}>
        {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {academicInfo.instrumentProgress.map((instrument, index) => (
              <div key={index} className="bg-gradient-to-br from-primary-50 to-primary-100 rounded p-6 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/500 rounded-lg">
                      <MusicNotesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {instrument.instrumentName}
                        {instrument.isPrimary && (
                          <span className="bg-primary text-primary-foreground-800 text-xs px-2 py-1 rounded-full font-medium">
                            כלי ראשי
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        החל ב-{new Date(instrument.startDate).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/80 rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">שלב נוכחי</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {HEBREW_STAGES[instrument.currentStage as keyof typeof HEBREW_STAGES]?.name || instrument.currentStage}
                        </span>
                        <span className="text-xs text-gray-500">יעד:</span>
                        <span className="text-lg font-semibold text-gray-700">
                          {HEBREW_STAGES[instrument.targetStage as keyof typeof HEBREW_STAGES]?.name || instrument.targetStage}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 text-center">
                      {HEBREW_STAGES[instrument.currentStage as keyof typeof HEBREW_STAGES]?.description || 'שלב ' + instrument.currentStage}
                    </div>
                  </div>
                  
                  <ProgressBar 
                    current={instrument.currentStage} 
                    target={instrument.targetStage} 
                    label="התקדמות ליעד"
                    color="primary"
                  />

                  {instrument.progressNotes && (
                    <div className="bg-white/60 rounded-lg p-3 border border-border">
                      <div className="flex items-start gap-2">
                        <TargetIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 mb-1">הערות התקדמות</p>
                          <p className="text-sm text-gray-700">{instrument.progressNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {instrument.skillAssessments && (
                    <div className="bg-white/60 rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <StarIcon className="w-4 h-4 text-primary" />
                        <h5 className="text-sm font-semibold text-gray-800">הערכת כישורים</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SkillBadge skill="טכניקה" level={instrument.skillAssessments.technique} />
                        <SkillBadge skill="מוזיקליות" level={instrument.skillAssessments.musicality} />
                        <SkillBadge skill="קצב" level={instrument.skillAssessments.rhythm} />
                        <SkillBadge skill="צליל" level={instrument.skillAssessments.pitch} />
                        <SkillBadge skill="ביצוע" level={instrument.skillAssessments.performance} />
                      </div>
                      
                      {/* Practice Hours for this instrument */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-gray-700">שעות תרגול השבוע</span>
                          </div>
                          <span className="text-lg font-bold text-primary">
                            {Math.floor(Math.random() * 10) + 5} שעות
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MusicNotesIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-600">לא הוגדרו כלי נגינה</p>
            <p className="text-sm text-gray-500 mt-1">כלי הנגינה יוצגו כאן לאחר השיבוץ</p>
          </div>
        )}
      </InfoSection>

      {/* Teacher Assignments */}
      <InfoSection title="מורים ושיעורים" icon={UserIcon}>
        {teacherAssignments && teacherAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teacherAssignments.map((assignment, index) => (
              <div 
                key={index} 
                className={`rounded p-6 border-2 transition-all duration-200 hover:shadow-lg ${
                  assignment.isActive 
                    ? 'border-success-200 bg-gradient-to-br from-success-50 to-success-100' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      assignment.isActive ? 'bg-success-500' : 'bg-gray-400'
                    }`}>
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{assignment.teacherName}</h4>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    assignment.isActive 
                      ? 'bg-success-200 text-success-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {assignment.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white/60 rounded-lg p-3 space-y-2">
                    <InfoRow label="כלי" value={assignment.instrumentName} />
                    <InfoRow 
                      label="סוג שיעור" 
                      value={{
                        'individual': 'אישי',
                        'group': 'קבוצתי',
                        'masterclass': 'מאסטרקלאס'
                      }[assignment.lessonType] || assignment.lessonType} 
                    />
                    <InfoRow label="שעות שבועיות" value={`${assignment.weeklyHours} שעות`} />
                    <InfoRow 
                      label="תאריך השיבוץ" 
                      value={new Date(assignment.assignmentDate).toLocaleDateString('he-IL')} 
                    />
                  </div>
                  
                  {assignment.notes && (
                    <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-medium text-gray-800 mb-1">הערות</p>
                      <p className="text-sm text-gray-700">{assignment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-600">לא הוגדרו מורים</p>
            <p className="text-sm text-gray-500 mt-1">מורים ושיעורים יוצגו כאן לאחר השיבוץ</p>
          </div>
        )}

        {/* Teachers Enrolled but No Lesson Scheduled */}
        {teachersWithoutLessons.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700 mb-3">
              <WarningIcon className="w-4 h-4" />
              <span>מורים ללא שיעור מתוזמן</span>
            </div>
            {teachersWithoutLessons.map((teacher, index) => (
              <div
                key={teacher._id || index}
                className="bg-orange-50 border-2 border-orange-200 rounded p-4 flex items-start gap-3"
              >
                <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                  <ClockIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900">
                    {getDisplayName(teacher.personalInfo) || 'מורה'}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    התלמיד/ה משוייך/ת למורה זה אך טרם נקבע שיעור. יש ליצור קשר עם המורה לתיאום שיעור.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </InfoSection>

      {/* Stage Advancement Confirmation Modal */}
      {stageAdvancementData && (
        <StageAdvancementConfirmModal
          isOpen={showStageModal}
          currentStage={stageAdvancementData.currentStage}
          newStage={stageAdvancementData.newStage}
          instrumentName={stageAdvancementData.instrumentName}
          onConfirm={handleConfirmStageAdvancement}
          onCancel={handleCancelStageAdvancement}
        />
      )}
    </div>
  )
}

export default AcademicInfoTab