# Student Details API Integration

Comprehensive data fetching and management system for the student details page with full error handling, real-time updates, file management, and performance optimizations.

## 🚀 Features Implemented

### 📡 API Integration
- **Complete service layer** with `studentDetailsApi.ts`
- **TanStack Query integration** with proper caching strategies
- **Request deduplication** to prevent duplicate API calls
- **Retry logic with exponential backoff** for failed requests
- **Batch API calls** where appropriate for performance

### 🔧 Data Fetching Hooks

#### Primary Hooks
- `useStudentDetails(studentId, options)` - Main student data with all nested information
- `useStudentSchedule(studentId, enabled)` - Weekly schedule data
- `useStudentAttendance(studentId, dateRange?)` - Attendance records and statistics
- `useStudentOrchestras(studentId)` - Orchestra enrollments and history
- `useStudentTheoryClasses(studentId)` - Theory class enrollments and progress
- `useStudentDocuments(studentId)` - Document management

#### Mutation Hooks
- `useUpdateStudentPersonalInfo()` - Update personal information with optimistic updates
- `useUpdateStudentAcademicInfo()` - Update academic information
- `useMarkAttendance()` - Real-time attendance marking
- `useUploadStudentDocument()` - File upload with progress tracking
- `useDownloadStudentDocument()` - Secure file downloads
- `useDeleteStudentDocument()` - Document deletion

#### Utility Hooks
- `useStudentDetailsComplete(studentId)` - Single hook with all functionality
- `usePrefetchStudentData()` - Performance optimization for hover states
- `useInvalidateStudentQueries()` - Cache management utilities

### 🧬 Caching Strategy

#### Cache Keys Structure
```typescript
{
  students: {
    details: (studentId) => ['students', 'details', studentId],
    schedule: (studentId) => ['students', 'schedule', studentId],
    attendance: (studentId, dateRange?) => ['students', 'attendance', studentId, dateRange],
    // ... more cache keys
  }
}
```

#### Cache Times
- **Student Details**: 1 minute stale time, 5 minutes cache time
- **Schedule**: 5 minutes stale time, 10 minutes cache time  
- **Attendance**: 1 minute stale time (real-time priority)
- **Documents**: 10 minutes stale time (changes less frequently)

#### Invalidation Strategy
- **Automatic invalidation** on successful mutations
- **Manual invalidation** utilities for complex scenarios
- **Optimistic updates** for immediate UI feedback

### 🌐 Real-time Updates

#### WebSocket Integration
- **Automatic connection management** with reconnection logic
- **Student-specific subscriptions**: `student/:id/updates`
- **Real-time data synchronization** across tabs and users
- **Heartbeat mechanism** for connection health

#### Supported Real-time Events
- `student_update` - Personal/academic info changes
- `attendance_update` - Live attendance marking
- `schedule_update` - Schedule modifications
- `document_update` - File uploads/deletions

### 🛡️ Error Handling

#### Centralized Error Management
- **Hebrew error messages** for user-friendly display
- **Error categorization** (authentication, network, validation, etc.)
- **Automatic retry logic** with exponential backoff
- **Error severity levels** for appropriate UI responses

#### Error Recovery
- **401/403 handling** with automatic redirect to login
- **Network error recovery** with retry mechanisms
- **Component-level error boundaries** for graceful degradation

### 📁 File Handling

#### Comprehensive File Management
- **Multiple file format support** (PDF, images, audio, video, documents)
- **File validation** with size limits and type checking
- **Upload progress tracking** with real-time updates
- **Secure downloads** with authentication
- **Multiple file uploads** with batch processing

#### File Categories
- Registration documents
- Medical records  
- Performance recordings
- Assessment files
- Other documents

### ⚡ Performance Optimizations

#### Loading States
- **Smart loading states** with delay to prevent flashing
- **Skeleton components** specific to content type
- **Suspense boundaries** for code splitting
- **Lazy loading** for tab components

#### Request Optimization
- **Request deduplication** to prevent duplicate calls
- **Prefetching** on hover and tab navigation
- **Batch API calls** where possible
- **Memory optimization** with automatic cleanup

#### Component Optimization
- **Memoization utilities** for expensive computations
- **Virtual scrolling** for large document lists
- **Debounced search** for filtering

## 🛠️ Usage Examples

### Basic Student Details

```typescript
import { useStudentDetails } from '@/features/students/details/hooks'

function StudentProfile({ studentId }: { studentId: string }) {
  const { student, isLoading, error, refetch } = useStudentDetails(studentId)
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <h1>{student.personalInfo.fullName}</h1>
      <p>{student.personalInfo.email}</p>
    </div>
  )
}
```

### Complete Functionality

```typescript
import { useStudentDetailsComplete } from '@/features/students/details/hooks'

function StudentDetailsPage({ studentId }: { studentId: string }) {
  const {
    student,
    schedule,
    attendance,
    documents,
    isLoading,
    errors,
    actions,
    fileHandling
  } = useStudentDetailsComplete(studentId)
  
  const handleUpdateInfo = async (data: any) => {
    try {
      await actions.updatePersonalInfo({ studentId, data })
      // Optimistic update already applied
    } catch (error) {
      // Error handled automatically
    }
  }
  
  const handleFileUpload = async (file: File) => {
    await fileHandling.upload.uploadFile(studentId, file, 'registration')
  }
  
  return (
    <div>
      {/* Student info with real-time updates */}
      {/* File upload with progress */}
      {/* Attendance with live updates */}
    </div>
  )
}
```

### Real-time Updates

```typescript
import { useWebSocketUpdates } from '@/services/websocketService'

function StudentComponent({ studentId }: { studentId: string }) {
  // Automatic real-time updates
  useWebSocketUpdates(studentId)
  
  const { student } = useStudentDetails(studentId)
  
  // Student data automatically updates when changes occur
  return <div>{student?.personalInfo.fullName}</div>
}
```

### File Upload with Progress

```typescript
import { useFileUpload } from '@/services/fileHandlingService'

function DocumentUpload({ studentId }: { studentId: string }) {
  const { uploadFile, uploadState } = useFileUpload()
  
  const handleUpload = async (file: File) => {
    await uploadFile(studentId, file, 'registration', 'Student ID copy')
  }
  
  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploadState.isUploading && (
        <div>
          Upload Progress: {uploadState.progress.percentage}%
          <div>{uploadState.progress.message}</div>
        </div>
      )}
    </div>
  )
}
```

## 🔧 Configuration

### Environment Variables

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### TanStack Query Setup

The main app already includes TanStack Query configuration in `main.tsx`. The student details system extends this with:

- Custom retry logic for different error types
- Optimized cache times for different data types
- Automatic error handling integration

## 📈 Performance Monitoring

The system includes built-in performance monitoring:

```typescript
import { performanceMonitor } from '@/services/performanceOptimizations'

// Get performance stats
const stats = performanceMonitor.getAllStats()
console.log('API call performance:', stats)
```

## 🔄 Migration Guide

To integrate this system into existing components:

1. **Replace existing useStudentDetails calls**:
   ```typescript
   // Old
   const { student, isLoading } = useStudentDetails(studentId)
   
   // New (enhanced)
   const { student, isLoading, prefetchRelated } = useStudentDetails(studentId)
   ```

2. **Use comprehensive hook for full functionality**:
   ```typescript
   const studentData = useStudentDetailsComplete(studentId)
   ```

3. **Add real-time updates**:
   ```typescript
   useWebSocketUpdates(studentId) // Add this line
   ```

4. **Replace loading states with smart components**:
   ```typescript
   <SmartLoadingState isLoading={isLoading} skeleton={<SkeletonComponents.StudentHeader />}>
     <StudentComponent />
   </SmartLoadingState>
   ```

## 🧪 Testing

The system is designed for easy testing with:

- **Mock-friendly hooks** with dependency injection
- **Error boundary testing** utilities
- **WebSocket mock** for real-time update testing
- **File upload mocking** capabilities

## 📚 API Endpoints

The system expects these API endpoints:

```
GET    /api/student/:id                    # Main student details
GET    /api/student/:id/weekly-schedule    # Student schedule  
GET    /api/analytics/student/:id/attendance # Attendance stats
GET    /api/student/:id/attendance         # Attendance records
GET    /api/orchestra?studentId=:id        # Orchestra enrollments
GET    /api/theory?studentId=:id           # Theory classes
GET    /api/file/student/:id               # Student documents

POST   /api/file/student/:id               # Upload document
GET    /api/file/student/:id/:docId        # Download document
DELETE /api/file/student/:id/:docId        # Delete document

PATCH  /api/student/:id                    # Update student info
POST   /api/student/:id/attendance         # Mark attendance
```

## 🚨 Error Handling Patterns

All errors are handled consistently:

```typescript
// Automatic error handling with user-friendly messages
const { handleError } = useErrorHandler()

try {
  await someApiCall()
} catch (error) {
  // Error automatically processed and displayed to user
  handleError(error, 'context-description')
}
```

## 🎯 Next Steps

For further enhancements:

1. **Add offline support** with service workers
2. **Implement data synchronization** conflict resolution
3. **Add audit logging** for all changes
4. **Performance analytics** dashboard
5. **Advanced caching strategies** with background updates

This comprehensive system provides a solid foundation for the student details page with production-ready features for error handling, real-time updates, file management, and performance optimization.