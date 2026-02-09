/**
 * Lazy Import Utilities for Performance Optimization
 * 
 * Provides lazy loading for heavy libraries that aren't needed immediately
 */

import React from 'react'

// Lazy load Chart.js components only when needed
export const loadChartComponents = () => {
  return import('react-chartjs-2').then(module => ({
    Line: module.Line,
    Bar: module.Bar,
    Pie: module.Pie,
    Doughnut: module.Doughnut
  }))
}

// Lazy load PDF generation libraries
export const loadPDFLibraries = () => {
  return Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]).then(([jsPDF, autoTable]) => ({
    jsPDF: jsPDF.default,
    autoTable: autoTable.default
  }))
}

// Lazy load Excel processing
export const loadExcelLibrary = () => {
  return import('xlsx').then(module => module.default)
}

// Lazy load calendar component
export const loadBigCalendar = () => {
  return import('react-big-calendar').then(module => ({
    Calendar: module.Calendar,
    momentLocalizer: module.momentLocalizer,
    dateFnsLocalizer: module.dateFnsLocalizer
  }))
}

// Lazy load heavy form components
export const loadRichTextEditor = () => {
  // Placeholder for future rich text editor
  return Promise.resolve(null)
}

// Create a lazy component wrapper with loading state
export function createLazyComponent<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(loader)
  
  return (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

// Preload utilities for predictive loading
export const preloadUtils = {
  charts: () => {
    loadChartComponents().catch(() => {})
  },
  
  pdf: () => {
    loadPDFLibraries().catch(() => {})
  },
  
  excel: () => {
    loadExcelLibrary().catch(() => {})
  },
  
  calendar: () => {
    loadBigCalendar().catch(() => {})
  }
}

// Usage example:
/*
// In a component that needs charts:
const [chartLib, setChartLib] = useState(null)

useEffect(() => {
  loadChartComponents().then(setChartLib)
}, [])

if (!chartLib) return <div>Loading charts...</div>

const { Line } = chartLib
return <Line data={data} />
*/