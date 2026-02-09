# Form Validation Components

Comprehensive form validation system with Hebrew localization and RTL support for the Conservatory Management System.

## Features

- ✅ **Real-time validation** with Hebrew error messages
- ✅ **Visual indicators** (green checkmarks, red X marks)
- ✅ **Backend compliance** with exact field requirements
- ✅ **Accessibility support** with ARIA labels and screen reader compatibility
- ✅ **RTL layout** optimized for Hebrew text
- ✅ **Keyboard navigation** with Hebrew-specific behavior

## Components

### Input Components

#### PhoneInput
Validates Israeli phone numbers with 05XXXXXXXX pattern.

```tsx
<PhoneInput
  value={phone}
  onChange={setPhone}
  label="מספר טלפון"
  required={true}
  placeholder="0501234567"
  onValidationChange={(result) => console.log(result)}
/>
```

#### TimeInput
24-hour time input with automatic formatting.

```tsx
<TimeInput
  value={time}
  onChange={setTime}
  label="שעה"
  required={true}
  min="08:00"
  max="20:00"
  onValidationChange={(result) => console.log(result)}
/>
```

### Dropdown Components

#### ClassSelect
Hebrew class selection (א-יב, אחר).

```tsx
<ClassSelect
  value={studentClass}
  onChange={setStudentClass}
  label="כיתה"
  required={true}
  placeholder="בחר כיתה"
/>
```

#### InstrumentSelect
Musical instrument selection with categorization.

```tsx
<InstrumentSelect
  value={instrument}
  onChange={setInstrument}
  label="כלי נגינה"
  required={true}
  categorized={true}
  placeholder="בחר כלי נגינה"
/>
```

#### DaySelect
Hebrew weekday selection.

```tsx
<DaySelect
  value={day}
  onChange={setDay}
  label="יום"
  required={true}
  excludeDays={['שישי']}
  placeholder="בחר יום"
/>
```

#### DurationSelect
Lesson duration selection with Hebrew labels.

```tsx
<DurationSelect
  value={duration}
  onChange={setDuration}
  label="משך זמן"
  required={true}
  options={[30, 45, 60]}
  labels={["30 דקות", "45 דקות", "60 דקות"]}
/>
```

### Validation Components

#### ValidationIndicator
Visual validation feedback with icons and messages.

```tsx
<ValidationIndicator
  isValid={true}
  isInvalid={false}
  message="שדה תקין"
  showIcon={true}
/>
```

#### ValidationSummary
Form-wide error summary with Hebrew field names.

```tsx
<ValidationSummary
  errors={errors}
  touched={touched}
  showOnlyTouched={true}
  onClose={() => setErrors({})}
/>
```

## Validation Rules

### Phone Number
- **Pattern**: `/^05\d{8}$/`
- **Message**: "מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות"
- **Auto-formatting**: Adds 05 prefix automatically

### Email
- **Pattern**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Message**: "כתובת אימייל לא תקינה"

### Time
- **Pattern**: `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`
- **Message**: "זמן חייב להיות בפורמט HH:MM"
- **Auto-formatting**: Adds colons and leading zeros

### Class Selection
- **Options**: `['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'אחר']`
- **Message**: "בחירת כיתה נדרשת"

### Instrument Selection
- **Options**: All 19 valid instruments from backend
- **Categories**: Strings, Woodwinds, Brass, Percussion, Keyboard, Vocal
- **Message**: "בחירת כלי נגינה נדרשת"

## Usage Examples

### Basic Form with Validation

```tsx
import React, { useState } from 'react'
import {
  PhoneInput,
  ClassSelect,
  InstrumentSelect,
  ValidationSummary,
  validateForm
} from '../components/form'

const StudentForm = () => {
  const [formData, setFormData] = useState({
    phone: '',
    class: '',
    instrument: ''
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validationRules = {
    phone: { required: true, pattern: /^05\d{8}$/ },
    class: { required: true },
    instrument: { required: true }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validation = validateForm(formData, validationRules)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    
    // Submit form
    console.log('Form is valid:', formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <ValidationSummary errors={errors} touched={touched} />
      
      <PhoneInput
        value={formData.phone}
        onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
        label="מספר טלפון"
        required={true}
      />
      
      <ClassSelect
        value={formData.class}
        onChange={(value) => setFormData(prev => ({ ...prev, class: value }))}
        label="כיתה"
        required={true}
      />
      
      <InstrumentSelect
        value={formData.instrument}
        onChange={(value) => setFormData(prev => ({ ...prev, instrument: value }))}
        label="כלי נגינה"
        required={true}
        categorized={true}
      />
      
      <button type="submit">שמור</button>
    </form>
  )
}
```

### Advanced Validation with Custom Rules

```tsx
const advancedRules = {
  studentName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value) => /^[\u0590-\u05FF\s]+$/.test(value), // Hebrew only
    message: 'שם חייב להיות בעברית בלבד'
  },
  age: {
    required: true,
    min: 5,
    max: 18,
    message: 'גיל חייב להיות בין 5 ל-18'
  }
}
```

## Accessibility Features

### ARIA Support
- `aria-label` for screen readers
- `aria-describedby` for error associations
- `aria-invalid` for invalid states
- `aria-required` for required fields

### Keyboard Navigation
- Tab navigation through form fields
- Enter to submit
- Escape to cancel
- Arrow keys for dropdowns (RTL-aware)

### Screen Reader Support
- Hebrew text properly announced
- Error messages read aloud
- Real-time validation feedback
- Form completion status

### Focus Management
- Focus first error on validation failure
- Focus trapping in modals
- Visual focus indicators

## Backend Integration

### Error Mapping
The system automatically maps backend errors to Hebrew:

```tsx
const backendErrors = {
  'personalInfo.phone': 'Invalid phone format'
}

const hebrewErrors = mapBackendErrors(backendErrors)
// Result: { phone: 'מספר טלפון לא תקין' }
```

### Field Name Translation
Backend field names are automatically translated:

```tsx
const fieldLabels = {
  'personalInfo.fullName': 'שם מלא',
  'academicInfo.class': 'כיתה',
  'professionalInfo.instrument': 'כלי נגינה'
}
```

## Styling and Theming

### Color Coding
- **Valid**: Green border and background
- **Invalid**: Red border and background
- **Neutral**: Gray border
- **Focus**: Primary color ring

### RTL Support
- Text alignment: right
- Icon positioning: appropriate for RTL
- Form layout: right-to-left flow
- Error messages: right-aligned

### Responsive Design
- Mobile-first approach
- Touch-friendly inputs
- Proper spacing for different screen sizes

## Testing

### Unit Tests
```bash
npm run test -- components/form
```

### Accessibility Tests
```bash
npm run test:a11y
```

### Visual Tests
```bash
npm run test:visual
```

## Contributing

1. All new form components must include Hebrew validation
2. Add proper TypeScript types
3. Include accessibility features
4. Test with screen readers
5. Verify RTL layout
6. Add usage examples to this README

## Browser Support

- Modern browsers with CSS Grid support
- Screen readers (JAWS, NVDA, VoiceOver)
- Mobile browsers with touch support
- RTL language support required