/**
 * Lazy Loading Bagrut Tab Component
 * 
 * Implements lazy loading, code splitting, and progressive loading
 * for optimal performance when loading Bagrut forms
 */

import React, { lazy, Suspense, useState, useEffect, memo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Music, 
  Clock, 
  AlertTriangle, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react'

// Lazy load heavy components
const BagrutHeader = lazy(() => import('@/components/bagrut/BagrutHeader'))
const ProgramBuilder = lazy(() => import('@/components/bagrut/ProgramBuilder'))
const OptimizedMagenBagrutForm = lazy(() => import('./OptimizedMagenBagrutForm'))
const DirectorEvaluation = lazy(() => import('@/components/bagrut/DirectorEvaluation'))
const GradeSummary = lazy(() => import('@/components/bagrut/GradeSummary'))

// Lightweight placeholder components for immediate loading
const BagrutSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-32 bg-gray-200 rounded" />
    <div className="h-24 bg-gray-200 rounded" />
    <div className="h-48 bg-gray-200 rounded" />
  </div>
)

const SectionSkeleton: React.FC<{ height?: string }> = ({ height = "h-32" }) => (
  <Card className="p-6">
    <div className={`${height} bg-gray-200 rounded animate-pulse`} />
  </Card>
)

interface LazyBagrutTabProps {
  student: any
  studentId: string
  onStudentUpdate?: (updatedStudent: any) => void
}

interface LoadingState {
  header: boolean
  program: boolean
  presentations: boolean
  director: boolean
  summary: boolean
}

interface SectionVisibility {
  [key: string]: boolean
}

// Intersection Observer hook for lazy loading sections
const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  const [elements, setElements] = React.useState<Element[]>([])

  React.useEffect(() => {
    if (elements.length === 0) return

    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '100px',
      ...options
    })

    elements.forEach(element => observer.observe(element))

    return () => observer.disconnect()
  }, [elements, callback, options])

  return setElements
}

// Priority loading hook - loads most important sections first
const usePriorityLoading = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    header: false,
    program: false,
    presentations: false,
    director: false,
    summary: false
  })

  const loadSection = React.useCallback((section: keyof LoadingState) => {
    setLoadingState(prev => ({ ...prev, [section]: true }))
  }, [])

  // Load sections in priority order with delays
  React.useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []

    // Immediate: Header and basic info
    timeouts.push(setTimeout(() => loadSection('header'), 0))
    
    // High priority: Program and presentations (user interacts with these most)
    timeouts.push(setTimeout(() => loadSection('program'), 100))
    timeouts.push(setTimeout(() => loadSection('presentations'), 200))
    
    // Lower priority: Director evaluation and summary
    timeouts.push(setTimeout(() => loadSection('director'), 500))
    timeouts.push(setTimeout(() => loadSection('summary'), 800))

    return () => timeouts.forEach(clearTimeout)
  }, [loadSection])

  return { loadingState, loadSection }
}

// Collapsible section wrapper for progressive disclosure
const CollapsibleSection: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  isLoaded?: boolean
  onToggle?: (isOpen: boolean) => void
}> = memo(({ title, icon, children, defaultOpen = false, isLoaded = true, onToggle }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = React.useCallback(() => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }, [isOpen, onToggle])

  return (
    <Card className="overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {!isLoaded && (
            <Badge variant="secondary" className="text-xs">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Loading...
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t">
          {isLoaded ? children : <SectionSkeleton />}
        </div>
      )}
    </Card>
  )
})

CollapsibleSection.displayName = 'CollapsibleSection'

const LazyBagrutTab: React.FC<LazyBagrutTabProps> = ({
  student,
  studentId,
  onStudentUpdate
}) => {
  const { loadingState, loadSection } = usePriorityLoading()
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    header: true,
    program: false,
    presentations: false,
    director: false,
    summary: false
  })

  const [bagrutData, setBagrutData] = useState(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Progressive loading progress calculation
  React.useEffect(() => {
    const loadedCount = Object.values(loadingState).filter(Boolean).length
    const totalSections = Object.keys(loadingState).length
    setLoadingProgress((loadedCount / totalSections) * 100)
  }, [loadingState])

  // Intersection observer for section loading
  const observeElements = useIntersectionObserver(
    React.useCallback((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionName = entry.target.getAttribute('data-section')
          if (sectionName && !loadingState[sectionName as keyof LoadingState]) {
            loadSection(sectionName as keyof LoadingState)
          }
        }
      })
    }, [loadingState, loadSection])
  )

  // Set up intersection observers
  React.useEffect(() => {
    const sectionElements = Array.from(document.querySelectorAll('[data-section]'))
    observeElements(sectionElements)
  }, [observeElements])

  // Initial data loading
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Mock data - replace with actual API call
        setBagrutData({
          studentId,
          // ... other mock data
        })
      } catch (error) {
        console.error('Failed to load Bagrut data:', error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadInitialData()
  }, [studentId])

  const handleSectionToggle = React.useCallback((section: string, isOpen: boolean) => {
    setSectionVisibility(prev => ({ ...prev, [section]: isOpen }))
    
    // Load section when opened if not already loaded
    if (isOpen && !loadingState[section as keyof LoadingState]) {
      loadSection(section as keyof LoadingState)
    }
  }, [loadingState, loadSection])

  // Error boundary fallback
  const SectionErrorFallback: React.FC<{ section: string }> = ({ section }) => (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Failed to load {section} section. 
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          onClick={() => loadSection(section as keyof LoadingState)}
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-xl font-bold">Loading Bagrut Information...</h2>
            </div>
            <Badge variant="secondary">
              <Clock className="w-4 h-4 mr-1" />
              Initializing
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Loading sections...</span>
              <span>{Math.round(loadingProgress)}%</span>
            </div>
            <Progress value={loadingProgress} className="h-2" />
          </div>
        </Card>
        
        <BagrutSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Sections load progressively for optimal performance. 
          Click to expand sections as needed.
        </AlertDescription>
      </Alert>

      {/* Loading Progress */}
      {loadingProgress < 100 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Loading Bagrut Components</span>
            <span className="text-sm text-gray-600">{Math.round(loadingProgress)}%</span>
          </div>
          <Progress value={loadingProgress} className="h-2" />
        </Card>
      )}

      {/* Header Section - Always loaded first */}
      <div data-section="header">
        <CollapsibleSection
          title="Recital Configuration"
          icon={<Music className="w-5 h-5 text-primary" />}
          defaultOpen={true}
          isLoaded={loadingState.header}
          onToggle={(isOpen) => handleSectionToggle('header', isOpen)}
        >
          <Suspense fallback={<SectionSkeleton height="h-24" />}>
            <React.ErrorBoundary fallback={<SectionErrorFallback section="header" />}>
              {loadingState.header && (
                <BagrutHeader
                  conservatoryName="מרכז המוסיקה רעננה"
                  directorName="לימור אקטע"
                  studentName={student?.name}
                  studentId={studentId}
                />
              )}
            </React.ErrorBoundary>
          </Suspense>
        </CollapsibleSection>
      </div>

      {/* Program Section */}
      <div data-section="program">
        <CollapsibleSection
          title="Recital Program"
          icon={<Music className="w-5 h-5 text-purple-600" />}
          isLoaded={loadingState.program}
          onToggle={(isOpen) => handleSectionToggle('program', isOpen)}
        >
          <Suspense fallback={<SectionSkeleton height="h-48" />}>
            <React.ErrorBoundary fallback={<SectionErrorFallback section="program" />}>
              {loadingState.program && sectionVisibility.program && (
                <ProgramBuilder
                  program={bagrutData?.program || []}
                  onChange={() => {}}
                  requiredPieces={3}
                />
              )}
            </React.ErrorBoundary>
          </Suspense>
        </CollapsibleSection>
      </div>

      {/* Presentations Section */}
      <div data-section="presentations">
        <CollapsibleSection
          title="Presentations & Magen Bagrut"
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          isLoaded={loadingState.presentations}
          onToggle={(isOpen) => handleSectionToggle('presentations', isOpen)}
        >
          <Suspense fallback={<SectionSkeleton height="h-64" />}>
            <React.ErrorBoundary fallback={<SectionErrorFallback section="presentations" />}>
              {loadingState.presentations && sectionVisibility.presentations && (
                <div className="space-y-6">
                  {/* Regular presentations would go here */}
                  <OptimizedMagenBagrutForm
                    studentId={studentId}
                    readonly={false}
                  />
                </div>
              )}
            </React.ErrorBoundary>
          </Suspense>
        </CollapsibleSection>
      </div>

      {/* Director Evaluation Section */}
      <div data-section="director">
        <CollapsibleSection
          title="Director Evaluation"
          icon={<Badge className="w-5 h-5 text-indigo-600" />}
          isLoaded={loadingState.director}
          onToggle={(isOpen) => handleSectionToggle('director', isOpen)}
        >
          <Suspense fallback={<SectionSkeleton height="h-32" />}>
            <React.ErrorBoundary fallback={<SectionErrorFallback section="director" />}>
              {loadingState.director && sectionVisibility.director && (
                <DirectorEvaluation
                  evaluation={{ points: undefined, comments: '' }}
                  onUpdate={() => {}}
                  readonly={false}
                />
              )}
            </React.ErrorBoundary>
          </Suspense>
        </CollapsibleSection>
      </div>

      {/* Grade Summary Section */}
      <div data-section="summary">
        <CollapsibleSection
          title="Grade Summary"
          icon={<Badge className="w-5 h-5 text-green-600" />}
          isLoaded={loadingState.summary}
          onToggle={(isOpen) => handleSectionToggle('summary', isOpen)}
        >
          <Suspense fallback={<SectionSkeleton height="h-40" />}>
            <React.ErrorBoundary fallback={<SectionErrorFallback section="summary" />}>
              {loadingState.summary && sectionVisibility.summary && bagrutData && (
                <GradeSummary
                  bagrut={bagrutData}
                  completionStatus={null}
                  validationErrors={[]}
                />
              )}
            </React.ErrorBoundary>
          </Suspense>
        </CollapsibleSection>
      </div>

      {/* Performance Stats (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-gray-50">
          <h4 className="text-sm font-semibold mb-2">Performance Stats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-600">Sections Loaded:</span>
              <div className="font-mono">
                {Object.values(loadingState).filter(Boolean).length}/5
              </div>
            </div>
            <div>
              <span className="text-gray-600">Progress:</span>
              <div className="font-mono">{Math.round(loadingProgress)}%</div>
            </div>
            <div>
              <span className="text-gray-600">Visible Sections:</span>
              <div className="font-mono">
                {Object.values(sectionVisibility).filter(Boolean).length}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Memory Usage:</span>
              <div className="font-mono">
                {performance.memory ? 
                  `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB` : 
                  'N/A'
                }
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default memo(LazyBagrutTab)