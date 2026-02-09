/**
 * Dashboard Components Index
 * 
 * Comprehensive dashboard system with Hebrew localization, RTL support, and real-time data
 */

// Main dashboard component
export { default as MainDashboard } from './MainDashboard'

// Individual statistics components
export { default as StudentStatistics } from './StudentStatistics'
export { default as TeacherStatistics } from './TeacherStatistics'
export { default as LessonStatistics } from './LessonStatistics'

// Dashboard widgets
export { default as StatCard, CompactStatCard, DetailedStatCard, ProgressStatCard } from './StatCard'
export { default as RecentActivity } from './RecentActivity'

// Dashboard utilities
export { default as DashboardRefresh, useDashboardRefresh } from './DashboardRefresh'

// Charts
export * from '../charts/HebrewCharts'