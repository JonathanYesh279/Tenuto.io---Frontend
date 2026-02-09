# Student Management Feature

A comprehensive student management system for the conservatory application.

## Overview

This feature provides a complete set of components and hooks for managing students, including:

- **Student listing** with search, filtering, and pagination
- **Student profiles** with detailed information and progress tracking
- **Student forms** with multi-step validation and Hebrew language support
- **Assignment management** for teachers, orchestras, and bagrut registration
- **Bulk operations** for efficient management of multiple students

## Components

### Main Components

- **`StudentList`** - Complete student list with search, filtering, pagination, and bulk actions
- **`StudentDetail`** - Comprehensive student profile with tabbed interface
- **`StudentForm`** - Multi-step form for creating/editing students with validation
- **`StudentAssignments`** - Assignment management for teachers, orchestras, and bagrut

### Sub-components

- **`StudentCard`** - Reusable student card component for lists and grids
- **`StudentSearch`** - Advanced search and filtering component
- **`AssignmentCard`** - Cards for displaying teacher/orchestra assignments

## Hooks

### Data Management
- **`useStudents`** - List students with filtering and pagination
- **`useStudent`** - Get single student details
- **`useStudentSearch`** - Search students with debouncing

### CRUD Operations
- **`useCreateStudent`** - Create new students
- **`useUpdateStudent`** - Update student information
- **`useDeleteStudent`** - Delete students
- **`useBulkUpdateStudents`** - Bulk update operations

### Student Details
- **`useStudentDetail`** - Comprehensive student data
- **`useStudentTeachers`** - Student's teacher assignments
- **`useStudentOrchestras`** - Student's orchestra memberships
- **`useStudentBagrut`** - Student's bagrut registration

### Form Management
- **`useStudentForm`** - Multi-step form with validation and auto-save
- **`useInstrumentForm`** - Instrument management within student form

### Assignment Management
- **`useStudentAssignments`** - All assignment-related operations
- **`useAssignTeacherToStudent`** - Teacher assignment operations
- **`useAssignStudentToOrchestra`** - Orchestra assignment operations

## Features

### 🔍 Advanced Search & Filtering
- Real-time search with debouncing
- Filter by class, instrument, status, bagrut registration
- Search suggestions with previews
- Persistent filter state

### 📋 Smart Pagination
- Configurable items per page
- Jump to any page
- Smart page number display
- Loading states and error handling

### 📝 Multi-step Forms
- Progressive disclosure with step validation
- Auto-save functionality (edit mode)
- Hebrew language support
- Comprehensive validation with Zod
- Instrument management with primary/secondary designation

### 👥 Assignment Management
- Teacher assignment with schedule integration
- Orchestra membership management
- Bagrut registration and tracking
- Bulk assignment operations

### 📊 Progress Tracking
- Instrument progress with stage tracking
- Test status monitoring (stage tests, technical tests)
- Academic status and notes
- Performance analytics integration

### 🌐 Hebrew Language Support
- Right-to-left (RTL) text direction
- Hebrew date formatting
- Proper text alignment and layout
- Hebrew validation messages

### 📱 Mobile Responsive
- Optimized for mobile devices
- Touch-friendly interactions
- Responsive grid layouts
- Mobile-specific UI patterns

## Usage Examples

### Basic Student List

```tsx
import { StudentList } from '@/features/students';

function StudentsPage() {
  return (
    <StudentList
      onStudentView={(student) => navigate(`/students/${student._id}`)}
      onStudentEdit={(student) => navigate(`/students/${student._id}/edit`)}
      onStudentCreate={() => navigate('/students/new')}
    />
  );
}
```

### Student Detail View

```tsx
import { StudentDetail } from '@/features/students';

function StudentDetailPage({ studentId }: { studentId: string }) {
  return (
    <StudentDetail
      studentId={studentId}
      onEdit={(student) => navigate(`/students/${student._id}/edit`)}
      onBack={() => navigate('/students')}
    />
  );
}
```

### Student Form

```tsx
import { StudentForm } from '@/features/students';

function StudentFormPage({ studentId }: { studentId?: string }) {
  const student = studentId ? useStudent(studentId).data : undefined;
  
  return (
    <StudentForm
      student={student}
      onSave={(student) => navigate(`/students/${student._id}`)}
      onCancel={() => navigate('/students')}
    />
  );
}
```

### Assignment Management

```tsx
import { StudentAssignments } from '@/features/students';

function AssignmentsPage({ studentId }: { studentId: string }) {
  return (
    <StudentAssignments
      studentId={studentId}
      mode="single"
      onBack={() => navigate(`/students/${studentId}`)}
    />
  );
}
```

### Bulk Operations

```tsx
import { StudentAssignments } from '@/features/students';

function BulkAssignmentsPage({ students }: { students: Student[] }) {
  return (
    <StudentAssignments
      students={students}
      mode="bulk"
      onBack={() => navigate('/students')}
    />
  );
}
```

## API Integration

The feature integrates with the following API endpoints:

- `GET /api/student` - List students with filtering and pagination
- `GET /api/student/:id` - Get student details
- `POST /api/student` - Create new student
- `PUT /api/student/:id` - Update student
- `DELETE /api/student/:id` - Delete student
- `GET/POST/DELETE /api/student/:id/assignments` - Manage assignments

## Data Flow

1. **Components** use **hooks** for data fetching and mutations
2. **Hooks** use **React Query** for caching and synchronization
3. **Services** handle API communication
4. **Types** ensure type safety throughout the application
5. **Validation** is handled with Zod schemas

## Performance Optimizations

- **React Query caching** with smart invalidation
- **Debounced search** to reduce API calls
- **Virtual scrolling** for large student lists
- **Optimistic updates** for immediate UI feedback
- **Code splitting** for reduced bundle size
- **Memoization** of expensive calculations

## Accessibility

- **Keyboard navigation** support
- **Screen reader** compatible
- **High contrast** mode support
- **Focus management** for forms
- **ARIA labels** and descriptions

## Testing

The feature includes comprehensive testing:

- **Unit tests** for individual components
- **Integration tests** for component interactions
- **Hook tests** for data management
- **E2E tests** for user workflows
- **Accessibility tests** for WCAG compliance

## Contributing

When adding new features:

1. Follow the existing patterns and conventions
2. Add proper TypeScript types
3. Include comprehensive error handling
4. Add loading states for async operations
5. Ensure Hebrew/RTL support
6. Write tests for new functionality
7. Update this documentation

## File Structure

```
src/features/students/
├── components/
│   ├── AssignmentCard.tsx      # Assignment display components
│   ├── StudentCard.tsx         # Student card component
│   └── StudentSearch.tsx       # Search and filtering
├── hooks/
│   ├── useStudents.ts          # Student list management
│   ├── useStudentDetail.ts     # Individual student data
│   ├── useStudentForm.ts       # Form state and validation
│   └── useStudentAssignments.ts # Assignment management
├── StudentList.tsx             # Main student list component
├── StudentDetail.tsx           # Student profile component
├── StudentForm.tsx             # Student creation/editing form
├── StudentAssignments.tsx      # Assignment management interface
├── index.ts                    # Feature exports
└── README.md                   # This documentation
```