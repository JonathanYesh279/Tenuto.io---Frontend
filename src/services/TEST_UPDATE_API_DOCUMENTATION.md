# Test Update API Integration Documentation

## Overview

This document describes the API integration for updating student stage tests and technical tests, with automatic stage advancement functionality.

## Backend API Endpoint

**Endpoint:** `PUT /api/student/:id/test`

**Authentication Required:** Yes (Teacher or Admin)

**Request Body:**
```javascript
{
  instrumentName: string,  // e.g., "פסנתר", "כינור"
  testType: "stageTest" | "technicalTest",
  status: string  // One of the valid test statuses
}
```

**Response:** Updated student object with all fields

**Auto-Stage Advancement:** When a stage test status changes from a failing status ("לא נבחן" or "לא עבר/ה") to any passing status, the backend automatically increments the student's stage level (up to max stage 8).

## Frontend API Service Methods

### 1. Update Stage Test (`updateStudentStageTest`)

Updates a student's stage test status. The backend automatically advances the stage level when appropriate.

```javascript
import { studentService } from './services/apiService.js';

// Update stage test - backend auto-advances stage if test passes
const updatedStudent = await studentService.updateStudentStageTest(
  studentId,      // "507f1f77bcf86cd799439011"
  instrumentName, // "פסנתר"
  status         // "עבר/ה"
);
```

**Parameters:**
- `studentId` (string): Student's MongoDB ObjectId
- `instrumentName` (string): Name of the instrument (must match exactly)
- `status` (string): Test status - see Valid Test Statuses below

**Returns:** Promise<Student> - Updated student object

**Throws:** Error with Hebrew error message if:
- Student not found (404)
- Instrument not found (404)
- Unauthorized (403)
- Invalid data (400)
- Network error

**Stage Advancement Logic:**
- If test status changes from failing → passing AND current stage < 8
- Backend automatically increments stage by 1
- No additional API call needed

### 2. Update Technical Test (`updateStudentTechnicalTest`)

Updates a student's technical test status. Does NOT advance stage level.

```javascript
import { studentService } from './services/apiService.js';

const updatedStudent = await studentService.updateStudentTechnicalTest(
  studentId,      // "507f1f77bcf86cd799439011"
  instrumentName, // "פסנתר"
  status         // "עבר/ה בהצטיינות"
);
```

**Parameters:** Same as `updateStudentStageTest`

**Returns:** Promise<Student> - Updated student object

**Throws:** Same error types as stage test

## Valid Test Statuses

```javascript
import { TEST_STATUSES } from '../utils/testStatusUtils';

// All valid test statuses:
TEST_STATUSES.NOT_TESTED                      // "לא נבחן"
TEST_STATUSES.PASSED                          // "עבר/ה"
TEST_STATUSES.FAILED                          // "לא עבר/ה"
TEST_STATUSES.PASSED_WITH_DISTINCTION         // "עבר/ה בהצטיינות"
TEST_STATUSES.PASSED_WITH_HIGH_DISTINCTION    // "עבר/ה בהצטיינות יתרה"
```

## Utility Functions

### Test Status Validation

```javascript
import { isValidTestStatus, isPassingStatus, isFailingStatus } from '../utils/testStatusUtils';

// Check if status is valid
if (isValidTestStatus(status)) {
  // Safe to use
}

// Check if status represents passing
if (isPassingStatus(status)) {
  console.log('Student passed!');
}

// Check if status represents failing
if (isFailingStatus(status)) {
  console.log('Student did not pass');
}
```

### Stage Level Validation

```javascript
import { isValidStageLevel, canAdvanceStage, calculateNextStage } from '../utils/testStatusUtils';

// Validate stage level (1-8)
if (isValidStageLevel(stage)) {
  // Valid
}

// Check if student can advance
if (canAdvanceStage(currentStage, testStatus)) {
  console.log('Student will advance to next stage!');
}

// Calculate next stage
const nextStage = calculateNextStage(currentStage, testStatus);
```

### UI Helpers

```javascript
import {
  getTestStatusColorClass,
  getTestStatusIcon,
  formatTestDate
} from '../utils/testStatusUtils';

// Get Tailwind color classes for badge
const colorClass = getTestStatusColorClass(status);
// Returns: "bg-green-100 text-green-800 border-green-300"

// Get icon for status
const icon = getTestStatusIcon(status);
// Returns: "✓" or "⭐" or "🏆"

// Format date in Hebrew
const formattedDate = formatTestDate(testDate);
// Returns: "15 ביוני 2024"
```

## React Component Usage Examples

### Example 1: Simple Status Update

```tsx
import React, { useState } from 'react';
import { studentService } from '../services/apiService.js';
import { TEST_STATUSES, TEST_SUCCESS_MESSAGES } from '../utils/testStatusUtils';

function StageTestUpdater({ student }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setError(null);

    try {
      const primaryInstrument = student.academicInfo?.instrumentProgress?.find(
        inst => inst.isPrimary
      );

      const updatedStudent = await studentService.updateStudentStageTest(
        student._id,
        primaryInstrument.instrumentName,
        newStatus
      );

      // Show success message
      alert(TEST_SUCCESS_MESSAGES.STAGE_TEST_UPDATED);

      // Update local state or refetch data
      // ...
    } catch (err) {
      setError(err.message);
      console.error('Test update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
      >
        <option value={TEST_STATUSES.NOT_TESTED}>לא נבחן</option>
        <option value={TEST_STATUSES.PASSED}>עבר/ה</option>
        <option value={TEST_STATUSES.FAILED}>לא עבר/ה</option>
        <option value={TEST_STATUSES.PASSED_WITH_DISTINCTION}>
          עבר/ה בהצטיינות
        </option>
        <option value={TEST_STATUSES.PASSED_WITH_HIGH_DISTINCTION}>
          עבר/ה בהצטיינות יתרה
        </option>
      </select>
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
```

### Example 2: With Optimistic Updates

```tsx
import React, { useState } from 'react';
import { studentService } from '../services/apiService.js';
import { canAdvanceStage, TEST_SUCCESS_MESSAGES } from '../utils/testStatusUtils';

function TestStatusCard({ student, onUpdate }) {
  const [optimisticStudent, setOptimisticStudent] = useState(student);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStageTest = async (instrumentName, newStatus) => {
    // Find instrument index
    const instrumentIndex = student.academicInfo.instrumentProgress.findIndex(
      inst => inst.instrumentName === instrumentName
    );

    const instrument = student.academicInfo.instrumentProgress[instrumentIndex];
    const currentStage = instrument.currentStage;
    const previousStatus = instrument.tests?.stageTest?.status || 'לא נבחן';

    // Optimistic update
    const optimisticData = { ...student };
    optimisticData.academicInfo.instrumentProgress[instrumentIndex].tests.stageTest.status = newStatus;

    // Check if stage should advance
    if (canAdvanceStage(currentStage, newStatus)) {
      optimisticData.academicInfo.instrumentProgress[instrumentIndex].currentStage = currentStage + 1;
    }

    setOptimisticStudent(optimisticData);
    setIsUpdating(true);

    try {
      const updatedStudent = await studentService.updateStudentStageTest(
        student._id,
        instrumentName,
        newStatus
      );

      // Update with real data
      setOptimisticStudent(updatedStudent);
      onUpdate?.(updatedStudent);

      // Show appropriate message
      if (canAdvanceStage(currentStage, newStatus)) {
        alert(TEST_SUCCESS_MESSAGES.STAGE_TEST_PASSED_WITH_ADVANCEMENT);
      } else {
        alert(TEST_SUCCESS_MESSAGES.STAGE_TEST_UPDATED);
      }
    } catch (error) {
      // Rollback on error
      setOptimisticStudent(student);
      alert(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      {/* Render optimisticStudent instead of student */}
      {optimisticStudent.academicInfo.instrumentProgress.map(inst => (
        <div key={inst.instrumentName}>
          <h3>{inst.instrumentName} - שלב {inst.currentStage}</h3>
          <p>סטטוס מבחן: {inst.tests?.stageTest?.status || 'לא נבחן'}</p>
          {/* Update controls */}
        </div>
      ))}
    </div>
  );
}
```

### Example 3: With Cache Invalidation

```tsx
import React from 'react';
import { studentService } from '../services/apiService.js';
import { apiCache } from '../services/apiCache.ts';

function TestManager({ studentId, instrumentName }) {
  const updateAndRefresh = async (testType, status) => {
    try {
      // Update test
      if (testType === 'stage') {
        await studentService.updateStudentStageTest(studentId, instrumentName, status);
      } else {
        await studentService.updateStudentTechnicalTest(studentId, instrumentName, status);
      }

      // Cache is automatically invalidated by the service methods
      // Optionally invalidate additional caches
      apiCache.invalidate('teacher_students');

      // Refetch data
      const updatedStudent = await studentService.getStudentById(studentId);
      // Update UI...

    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    // Component JSX
  );
}
```

## Error Handling

### Error Types

```javascript
import { TEST_ERROR_MESSAGES } from '../utils/testStatusUtils';

try {
  await studentService.updateStudentStageTest(studentId, instrumentName, status);
} catch (error) {
  // Check error type
  if (error.message.includes('לא נמצא')) {
    // Not found error
    console.error(TEST_ERROR_MESSAGES.STUDENT_NOT_FOUND);
  } else if (error.message.includes('הרשאה')) {
    // Authorization error
    console.error(TEST_ERROR_MESSAGES.UNAUTHORIZED);
  } else {
    // Generic error
    console.error(TEST_ERROR_MESSAGES.UPDATE_FAILED);
  }
}
```

### Complete Error Handling Example

```tsx
import { studentService } from '../services/apiService.js';
import { TEST_ERROR_MESSAGES } from '../utils/testStatusUtils';

async function safeTestUpdate(studentId, instrumentName, status) {
  try {
    const result = await studentService.updateStudentStageTest(
      studentId,
      instrumentName,
      status
    );
    return { success: true, data: result };
  } catch (error) {
    let message = TEST_ERROR_MESSAGES.UPDATE_FAILED;

    if (error.message.includes('לא נמצא')) {
      message = TEST_ERROR_MESSAGES.STUDENT_NOT_FOUND;
    } else if (error.message.includes('הרשאה')) {
      message = TEST_ERROR_MESSAGES.UNAUTHORIZED;
    } else if (error.message.includes('לא תקין')) {
      message = TEST_ERROR_MESSAGES.INVALID_STATUS;
    }

    return { success: false, error: message };
  }
}
```

## Cache Invalidation

The API service methods automatically invalidate relevant caches:

```javascript
// Automatically invalidated:
- student_{studentId}  // Individual student cache
- students_all         // All students list cache
```

Additional manual cache invalidation if needed:

```javascript
import { apiCache } from '../services/apiCache.ts';

// Invalidate specific caches
apiCache.invalidate('teacher_students');
apiCache.invalidate(`orchestra_${orchestraId}`);

// Clear all caches
apiCache.clear();
```

## Data Model Reference

### Student Object Structure

```typescript
interface Student {
  _id: string;
  personalInfo: {
    fullName: string;
    // ...
  };
  academicInfo: {
    class: string;
    instrumentProgress: InstrumentProgress[];
  };
  // ...
}

interface InstrumentProgress {
  instrumentName: string;
  currentStage: number;  // 1-8
  isPrimary: boolean;
  tests: {
    stageTest: TestInfo;
    technicalTest: TestInfo;
  };
}

interface TestInfo {
  status: string;  // One of TEST_STATUSES
  lastTestDate?: Date | null;
  nextTestDate?: Date | null;
  notes?: string;
}
```

## Testing Considerations

### Test Cases to Cover

1. **Stage Advancement (Levels 1-7)**
   - Update stage test from "לא נבחן" → "עבר/ה"
   - Verify stage increments from N → N+1
   - Verify all test data is preserved

2. **Max Stage (Level 8)**
   - Update stage test for student at stage 8
   - Verify stage stays at 8 (doesn't increment beyond)
   - Verify test status updates correctly

3. **Technical Test (No Stage Change)**
   - Update technical test to any status
   - Verify stage does NOT change
   - Verify only technical test data updates

4. **Status Transitions**
   - "לא נבחן" → "עבר/ה" (should advance)
   - "לא עבר/ה" → "עבר/ה" (should advance)
   - "עבר/ה" → "לא עבר/ה" (should NOT advance)
   - "לא נבחן" → "לא עבר/ה" (should NOT advance)

5. **Error Scenarios**
   - Invalid student ID
   - Invalid instrument name
   - Invalid test status
   - Network failure / timeout
   - Unauthorized access

6. **Cache Invalidation**
   - Verify caches are invalidated after update
   - Verify refetch returns updated data
   - Verify UI reflects changes immediately

### Example Test (Jest/React Testing Library)

```javascript
import { studentService } from './apiService';
import { TEST_STATUSES } from '../utils/testStatusUtils';

describe('updateStudentStageTest', () => {
  it('should update stage test and advance stage when passing', async () => {
    const studentId = '507f1f77bcf86cd799439011';
    const instrumentName = 'פסנתר';
    const status = TEST_STATUSES.PASSED;

    const result = await studentService.updateStudentStageTest(
      studentId,
      instrumentName,
      status
    );

    expect(result.academicInfo.instrumentProgress[0].tests.stageTest.status).toBe(status);
    expect(result.academicInfo.instrumentProgress[0].currentStage).toBeGreaterThan(1);
  });

  it('should not advance beyond stage 8', async () => {
    // Mock student at stage 8
    const result = await studentService.updateStudentStageTest(
      studentId,
      instrumentName,
      TEST_STATUSES.PASSED
    );

    expect(result.academicInfo.instrumentProgress[0].currentStage).toBe(8);
  });
});
```

## Best Practices

1. **Always validate data before API calls**
   ```javascript
   import { validateTestUpdateData } from '../utils/testStatusUtils';

   try {
     validateTestUpdateData(studentId, instrumentName, status);
     await studentService.updateStudentStageTest(...);
   } catch (error) {
     // Handle validation error
   }
   ```

2. **Use optimistic updates for better UX**
   - Update UI immediately
   - Rollback on API failure
   - Show loading states

3. **Handle errors with Hebrew messages**
   - Use predefined error messages from utils
   - Provide clear feedback to users
   - Log errors for debugging

4. **Invalidate caches appropriately**
   - Service methods handle basic invalidation
   - Invalidate additional caches if needed
   - Consider related data (orchestras, teachers, etc.)

5. **Use TypeScript types**
   ```typescript
   import type { TestStatus } from '../utils/testStatusUtils';

   const status: TestStatus = TEST_STATUSES.PASSED;
   ```

## Common Pitfalls

1. **Instrument name mismatch**
   - Ensure exact match with backend data
   - Use `instrumentName` not `instrument`
   - Case-sensitive comparison

2. **Stage level assumptions**
   - Don't manually increment stage
   - Backend handles stage advancement automatically
   - Only for stage tests, not technical tests

3. **Status spelling**
   - Use constants from `testStatusUtils`
   - Don't hardcode status strings
   - Watch for typos in Hebrew text

4. **Error handling**
   - Don't ignore errors silently
   - Provide user feedback
   - Log for debugging

5. **Cache staleness**
   - Don't skip cache invalidation
   - Refetch after updates
   - Consider race conditions

## Support

For issues or questions:
- Check backend logs: `/api/student/:id/test` endpoint
- Verify authentication token is valid
- Check student and instrument exist in database
- Review backend validation rules
