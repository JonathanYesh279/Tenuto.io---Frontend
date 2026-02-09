/**
 * Style Utilities for Conservatory Management System
 * 
 * Consistent styling utilities for Hebrew text, RTL support, and conservatory-specific styling
 */

// Stage Colors (1-8) - Used for instrument progress and student levels
export const STAGE_COLORS = {
  1: {
    bg: 'bg-gray-500',
    bgLight: 'bg-gray-100',
    text: 'text-gray-800',
    ring: 'ring-gray-200',
    border: 'border-gray-300'
  },
  2: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-100',
    text: 'text-blue-800', 
    ring: 'ring-blue-200',
    border: 'border-blue-300'
  },
  3: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-100',
    text: 'text-green-800',
    ring: 'ring-green-200',
    border: 'border-green-300'
  },
  4: {
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-100',
    text: 'text-yellow-800',
    ring: 'ring-yellow-200',
    border: 'border-yellow-300'
  },
  5: {
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-100',
    text: 'text-orange-800',
    ring: 'ring-orange-200',
    border: 'border-orange-300'
  },
  6: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-200',
    border: 'border-red-300'
  },
  7: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-100',
    text: 'text-purple-800',
    ring: 'ring-purple-200',
    border: 'border-purple-300'
  },
  8: {
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-100',
    text: 'text-indigo-800',
    ring: 'ring-indigo-200',
    border: 'border-indigo-300'
  }
} as const

// Teacher Role Colors
export const ROLE_COLORS = {
  'מורה': {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-100',
    text: 'text-blue-800',
    ring: 'ring-blue-200'
  },
  'מנצח': {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-100',
    text: 'text-purple-800',
    ring: 'ring-purple-200'
  },
  'מדריך הרכב': {
    bg: 'bg-green-500',
    bgLight: 'bg-green-100',
    text: 'text-green-800',
    ring: 'ring-green-200'
  },
  'מנהל': {
    bg: 'bg-red-500',
    bgLight: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-200'
  },
  'מורה תאוריה': {
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-100',
    text: 'text-yellow-800',
    ring: 'ring-yellow-200'
  },
  'מגמה': {
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-100',
    text: 'text-indigo-800',
    ring: 'ring-indigo-200'
  }
} as const

// Test Status Colors
export const TEST_STATUS_COLORS = {
  'לא נבחן': {
    bgLight: 'bg-gray-100',
    text: 'text-gray-800',
    ring: 'ring-gray-200'
  },
  'עבר/ה': {
    bgLight: 'bg-green-100',
    text: 'text-green-800',
    ring: 'ring-green-200'
  },
  'לא עבר/ה': {
    bgLight: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-200'
  },
  'עבר/ה בהצטיינות': {
    bgLight: 'bg-blue-100',
    text: 'text-blue-800',
    ring: 'ring-blue-200'
  },
  'עבר/ה בהצטיינות יתרה': {
    bgLight: 'bg-purple-100',
    text: 'text-purple-800',
    ring: 'ring-purple-200'
  }
} as const

// Instrument Category Colors (for grouping)
export const INSTRUMENT_CATEGORY_COLORS = {
  strings: {
    bgLight: 'bg-primary-100',
    text: 'text-primary-800',
    ring: 'ring-primary-200'
  },
  woodwinds: {
    bgLight: 'bg-secondary-100',
    text: 'text-secondary-800',
    ring: 'ring-secondary-200'
  },
  brass: {
    bgLight: 'bg-orange-100',
    text: 'text-orange-800',
    ring: 'ring-orange-200'
  },
  percussion: {
    bgLight: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-200'
  },
  keyboard: {
    bgLight: 'bg-success-100',
    text: 'text-success-800',
    ring: 'ring-success-200'
  },
  vocal: {
    bgLight: 'bg-pink-100',
    text: 'text-pink-800',
    ring: 'ring-pink-200'
  }
} as const

// Status Colors (active/inactive)
export const STATUS_COLORS = {
  active: {
    bgLight: 'bg-success-100',
    text: 'text-success-800',
    dot: 'bg-green-400'
  },
  inactive: {
    bgLight: 'bg-gray-100',
    text: 'text-gray-800',
    dot: 'bg-gray-300'
  },
  graduated: {
    bgLight: 'bg-primary-100',
    text: 'text-primary-800',
    dot: 'bg-primary-400'
  },
  suspended: {
    bgLight: 'bg-red-100',
    text: 'text-red-800',
    dot: 'bg-red-400'
  }
} as const

/**
 * Get stage color classes
 */
export const getStageColor = (stage: number, variant: 'bg' | 'bgLight' | 'text' | 'ring' | 'border' = 'bgLight') => {
  const stageKey = Math.min(Math.max(stage, 1), 8) as keyof typeof STAGE_COLORS
  return STAGE_COLORS[stageKey]?.[variant] || STAGE_COLORS[1][variant]
}

/**
 * Get role color classes
 */
export const getRoleColor = (role: string, variant: 'bg' | 'bgLight' | 'text' | 'ring' = 'bgLight') => {
  const roleKey = role as keyof typeof ROLE_COLORS
  return ROLE_COLORS[roleKey]?.[variant] || ROLE_COLORS['מורה'][variant]
}

/**
 * Get test status color classes
 */
export const getTestStatusColor = (status: string, variant: 'bgLight' | 'text' | 'ring' = 'bgLight') => {
  const statusKey = status as keyof typeof TEST_STATUS_COLORS
  return TEST_STATUS_COLORS[statusKey]?.[variant] || TEST_STATUS_COLORS['לא נבחן'][variant]
}

/**
 * Get status color classes
 */
export const getStatusColor = (status: 'active' | 'inactive' | 'graduated' | 'suspended', variant: 'bgLight' | 'text' | 'dot' = 'bgLight') => {
  return STATUS_COLORS[status][variant]
}

/**
 * Get instrument category color
 */
export const getInstrumentCategoryColor = (instrument: string, variant: 'bgLight' | 'text' | 'ring' = 'bgLight') => {
  // Categorize instruments
  const strings = ['כינור', 'ויולה', 'צ\'לו', 'קונטרבס', 'גיטרה', 'גיטרה בס']
  const woodwinds = ['חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט']
  const brass = ['חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון']
  const percussion = ['תופים']
  const keyboard = ['פסנתר']
  const vocal = ['שירה']
  
  if (strings.includes(instrument)) return INSTRUMENT_CATEGORY_COLORS.strings[variant]
  if (woodwinds.includes(instrument)) return INSTRUMENT_CATEGORY_COLORS.woodwinds[variant]
  if (brass.includes(instrument)) return INSTRUMENT_CATEGORY_COLORS.brass[variant]
  if (percussion.includes(instrument)) return INSTRUMENT_CATEGORY_COLORS.percussion[variant]
  if (keyboard.includes(instrument)) return INSTRUMENT_CATEGORY_COLORS.keyboard[variant]
  if (vocal.includes(instrument)) return INSTRUMENT_CATEGORY_COLORS.vocal[variant]
  
  return INSTRUMENT_CATEGORY_COLORS.strings[variant] // Default
}

/**
 * Generate avatar initials from name
 */
export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

/**
 * Format Hebrew phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Format as 05X-XXX-XXXX
  if (phone.length === 10 && phone.startsWith('05')) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
  }
  return phone
}

/**
 * Hebrew typography classes
 */
export const HEBREW_TYPOGRAPHY = {
  heading: 'font-bold text-hebrew',
  subheading: 'font-semibold text-hebrew',
  body: 'font-normal text-hebrew',
  caption: 'text-sm text-hebrew',
  label: 'text-sm font-medium text-hebrew'
} as const

/**
 * RTL-friendly spacing classes
 */
export const RTL_SPACING = {
  'space-x-1': 'space-x-1 space-x-reverse',
  'space-x-2': 'space-x-2 space-x-reverse',
  'space-x-3': 'space-x-3 space-x-reverse',
  'space-x-4': 'space-x-4 space-x-reverse',
  'space-y-1': 'space-y-1',
  'space-y-2': 'space-y-2',
  'space-y-3': 'space-y-3',
  'space-y-4': 'space-y-4'
} as const

/**
 * Get RTL-friendly spacing class
 */
export const getRTLSpacing = (spacing: keyof typeof RTL_SPACING): string => {
  return RTL_SPACING[spacing]
}

/**
 * Hebrew-optimized button classes
 */
export const BUTTON_STYLES = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-lg transition-colors duration-200',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors duration-200',
  ghost: 'hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors duration-200',
  danger: 'bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200'
} as const

/**
 * Card shadow styles
 */
export const CARD_SHADOWS = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  hover: 'hover:shadow-md transition-shadow duration-200'
} as const

/**
 * Hebrew-friendly form input classes
 */
export const INPUT_STYLES = {
  base: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right',
  error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
  success: 'border-green-300 focus:ring-green-500 focus:border-green-500',
  disabled: 'bg-gray-100 cursor-not-allowed opacity-60'
} as const