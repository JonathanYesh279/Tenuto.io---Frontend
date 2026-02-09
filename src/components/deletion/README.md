# Cascade Deletion System - Design Documentation

## Overview

The cascade deletion system provides a comprehensive solution for managing entity deletions in the conservatory application with Hebrew RTL support, accessibility features, and mobile-responsive design.

## Architecture

### Component Hierarchy
```
AdminDeletionDashboard (Main Dashboard)
├── DataIntegrityDashboard (Health Monitoring)
├── AuditLogViewer (Audit Trail)
├── OrphanedReferenceCleanup (Batch Operations)
├── CascadeDeletionWorkflow (Deletion Process)
│   ├── DeletionImpactPreview (Impact Analysis)
│   └── DeletionProgressTracker (Progress Monitoring)
└── Entity Search & Quick Actions
```

### Core Features

1. **Impact Analysis**: Comprehensive preview of deletion consequences
2. **Progress Tracking**: Real-time progress with cancellation support
3. **Data Integrity**: Health monitoring and automated cleanup
4. **Audit Trail**: Complete logging with rollback capabilities
5. **Batch Operations**: Orphaned reference cleanup
6. **Admin Dashboard**: Central management interface

## User Flows

### Student Deletion Workflow

1. **Search & Select**: Admin searches for student to delete
2. **Impact Analysis**: System analyzes related records and dependencies
3. **Impact Review**: Admin reviews affected lessons, orchestras, documents
4. **Confirmation**: Multi-step confirmation with text verification
5. **Progress Monitoring**: Real-time deletion progress with cancellation
6. **Completion**: Success confirmation with rollback options

### Orphaned Reference Cleanup

1. **Detection**: System identifies orphaned references
2. **Filtering**: Admin filters by table, severity, cleanup method
3. **Batch Selection**: Select multiple references for cleanup
4. **Options Configuration**: Set batch size, backup options
5. **Execution**: Run cleanup with progress monitoring
6. **Results Review**: Summary of successful/failed operations

## Design System Extensions

### Colors
- **Danger Actions**: Red palette for deletion operations
- **Warning States**: Yellow/orange for warnings and confirmations
- **Progress States**: Blue for in-progress operations
- **Success States**: Green for completed operations
- **Info States**: Blue for informational content

### Typography
- **Hebrew Font**: Reisinger Yonatan for Hebrew text
- **Font Weights**: Medium for headings, regular for body text
- **Font Sizes**: Responsive scaling from mobile to desktop

### Spacing
- **Card Padding**: Consistent 24px (p-6) for main content areas
- **Component Gaps**: 16px (gap-4) between related elements
- **Section Spacing**: 24px (space-y-6) between major sections

## Accessibility Implementation

### ARIA Patterns
```tsx
// Progress announcements
<div aria-live="polite" aria-atomic="true">
  Current step: {currentStep}
</div>

// Form validation
<input 
  aria-describedby="field-help field-error"
  aria-required="true"
  aria-invalid={hasError}
/>

// Step navigation
<div 
  role="progressbar"
  aria-valuenow={currentStep}
  aria-valuemax={totalSteps}
  aria-label="Deletion workflow progress"
/>
```

### Keyboard Navigation
- **Tab Order**: Logical flow through interface elements
- **Enter/Space**: Activate buttons and toggles
- **Escape**: Close modals and cancel operations
- **Arrow Keys**: Navigate between related items

### Screen Reader Support
- **Live Regions**: Progress announcements and error messages
- **Descriptive Labels**: Clear context for all interactive elements
- **State Announcements**: Status changes and validation feedback

## Mobile-First Responsive Design

### Breakpoints
- **Mobile**: 0-768px (single column layout)
- **Tablet**: 768-1024px (2-column grid)
- **Desktop**: 1024px+ (full multi-column layout)

### Mobile Adaptations
```tsx
// Tab navigation on mobile
<div className="lg:hidden">
  <div className="flex overflow-x-auto pb-2">
    {tabs.map(tab => (
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap">
        <Icon className="w-4 h-4" />
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
</div>

// Stats grid adaptation
<div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
  {stats.map(stat => (
    <Card className="text-center">
      <div className="text-2xl font-bold">{stat.value}</div>
      <div className="text-sm text-gray-600">{stat.label}</div>
    </Card>
  ))}
</div>
```

### Touch Interactions
- **Minimum Touch Target**: 44px for all interactive elements
- **Swipe Gestures**: Horizontal scrolling for tab navigation
- **Pull-to-Refresh**: Data refresh on mobile devices

## Hebrew RTL Support

### Text Direction
```tsx
// RTL container
<div dir="rtl" className="space-y-4">
  <div className="text-right font-reisinger-yonatan">
    Hebrew content here
  </div>
</div>
```

### Layout Adjustments
- **Icon Positioning**: Mirrored for RTL context
- **Padding/Margins**: Using `pr-*` and `pl-*` classes appropriately
- **Flex Direction**: `space-x-reverse` for RTL spacing

### Font Integration
- **Primary Font**: Reisinger Yonatan for Hebrew content
- **Fallbacks**: Arial Hebrew, Noto Sans Hebrew
- **Weight Mapping**: Proper font weights for Hebrew characters

## Animation Specifications

### Micro-Interactions
```css
/* Progress animations */
.progress-bar {
  transition: width 0.3s ease-out;
}

/* Loading states */
.loading-spinner {
  animation: spin 1s linear infinite;
}

/* State transitions */
.modal-enter {
  animation: slideUp 0.3s ease-out;
}

.card-hover {
  transition: box-shadow 0.2s ease-in-out;
}
```

### Progress Indicators
- **Linear Progress**: Smooth width transitions
- **Circular Progress**: Stroke-dashoffset animations
- **Step Progress**: Color and icon transitions
- **Loading States**: Subtle pulse and spin animations

## Error Handling & Recovery

### Error States
```tsx
// Form validation errors
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <div className="flex items-center gap-2 text-red-700">
    <AlertTriangle className="w-5 h-5" />
    <span className="font-semibold">שגיאה</span>
  </div>
  <p className="text-sm text-red-600 mt-1">{error}</p>
</div>

// Operation failures
<div className="text-center py-8">
  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
  <h3 className="text-xl font-semibold text-red-700 mb-2">
    הפעולה נכשלה
  </h3>
  <p className="text-red-600">{errorMessage}</p>
  <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
    נסה שוב
  </button>
</div>
```

### Recovery Options
- **Retry Mechanisms**: Automatic retry with exponential backoff
- **Rollback Options**: Available for completed deletions
- **Partial Recovery**: Handle partial failures gracefully
- **User Feedback**: Clear error messages and recovery steps

## Performance Optimizations

### Data Loading
- **Lazy Loading**: Load components on demand
- **Pagination**: Handle large datasets efficiently
- **Caching**: Cache frequently accessed data
- **Debouncing**: Debounce search and filter operations

### Rendering Optimizations
```tsx
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

// Memoization for expensive calculations
const memoizedImpactAnalysis = useMemo(() => 
  analyzeImpact(entityData), [entityData]
)

// Component splitting
const LazyAuditViewer = lazy(() => import('./AuditLogViewer'))
```

## Testing Strategy

### Unit Tests
- Component rendering and props handling
- State management and user interactions
- Accessibility features and ARIA attributes
- Hebrew text rendering and RTL layout

### Integration Tests
- Complete deletion workflows
- Data integrity operations
- Error handling and recovery
- Mobile responsive behavior

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast compliance
- Focus management

## API Integration

### Expected Endpoints
```typescript
// Impact analysis
GET /api/deletion/impact/{entityType}/{entityId}
Response: DeletionImpact

// Execute deletion
POST /api/deletion/execute
Body: DeletionFormData
Response: DeletionOperation

// Audit log
GET /api/audit/log?filters={}
Response: AuditLogEntry[]

// Data integrity
GET /api/integrity/status
Response: DataIntegrityStatus

// Orphaned cleanup
POST /api/cleanup/orphaned
Body: OrphanedReference[]
Response: BatchOperation
```

### Error Handling
- **Network Errors**: Retry with exponential backoff
- **Validation Errors**: Display field-specific messages
- **Authorization**: Handle permission errors gracefully
- **Rate Limiting**: Implement request throttling

## Deployment Considerations

### Bundle Optimization
- **Code Splitting**: Separate deletion system into own chunk
- **Tree Shaking**: Remove unused code paths
- **Asset Optimization**: Optimize images and icons
- **Font Loading**: Efficient Hebrew font loading

### Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **RTL Support**: Native RTL rendering support
- **Accessibility**: JAWS, NVDA, VoiceOver compatibility

This comprehensive design system provides a robust foundation for cascade deletion operations while maintaining excellent user experience, accessibility, and mobile responsiveness in both Hebrew and English interfaces.