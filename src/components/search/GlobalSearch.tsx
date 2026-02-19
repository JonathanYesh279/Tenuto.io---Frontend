import React, { useState, useEffect, useRef } from 'react'

import { Link } from 'react-router-dom'
import { BookOpenIcon, CalendarIcon, ClockIcon, FunnelIcon, GraduationCapIcon, MagnifyingGlassIcon, MusicNotesIcon, UsersIcon, XIcon } from '@phosphor-icons/react'

interface SearchResult {
  id: string
  type: 'student' | 'teacher' | 'lesson' | 'orchestra' | 'rehearsal' | 'room'
  title: string
  subtitle?: string
  description?: string
  href: string
  avatar?: string
  status?: string
  metadata?: Record<string, any>
}

interface SearchCategory {
  key: string
  label: string
  icon: React.ComponentType<any>
  placeholder: string
  filters?: string[]
}

interface GlobalSearchProps {
  variant?: 'header' | 'sidebar' | 'modal' | 'page'
  onResultSelect?: (result: SearchResult) => void
  className?: string
  autoFocus?: boolean
}

// MagnifyingGlassIcon categories with Hebrew labels
const searchCategories: SearchCategory[] = [
  {
    key: 'all',
    label: 'הכל',
    icon: MagnifyingGlassIcon,
    placeholder: 'חפש תלמידים, מורים, שיעורים, תזמורות...'
  },
  {
    key: 'students',
    label: 'תלמידים',
    icon: UsersIcon,
    placeholder: 'חפש תלמיד לפי שם, כיתה או כלי נגינה...',
    filters: ['class', 'instrument', 'stage']
  },
  {
    key: 'teachers',
    label: 'מורים',
    icon: GraduationCapIcon,
    placeholder: 'חפש מורה לפי שם או התמחות...',
    filters: ['specialization', 'employment']
  },
  {
    key: 'lessons',
    label: 'שיעורים',
    icon: BookOpenIcon,
    placeholder: 'חפש שיעור לפי נושא, מורה או תלמיד...',
    filters: ['subject', 'day', 'time']
  },
  {
    key: 'orchestras',
    label: 'תזמורות',
    icon: MusicNotesIcon,
    placeholder: 'חפש תזמורת לפי שם או סוג...',
    filters: ['type', 'level']
  },
  {
    key: 'rehearsals',
    label: 'חזרות',
    icon: CalendarIcon,
    placeholder: 'חפש חזרה לפי תאריך או תזמורת...',
    filters: ['date', 'orchestra']
  }
]

// Mock search function - in real app, this would call an API
const performSearch = async (query: string, category: string, filters: Record<string, string> = {}): Promise<SearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Mock results with Hebrew content
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'student',
      title: 'יואב כהן',
      subtitle: 'כיתה ח׳ • פסנתר',
      description: 'שלב 4 • תלמיד מצטיין',
      href: '/students/1',
      status: 'active'
    },
    {
      id: '2',
      type: 'teacher',
      title: 'ד״ר מרים לוי',
      subtitle: 'מורה לפסנתר ותיאוריה',
      description: 'בעלת תואר דוקטור במוזיקה',
      href: '/teachers/2',
      status: 'active'
    },
    {
      id: '3',
      type: 'lesson',
      title: 'תיאוריה בסיסית',
      subtitle: 'יום ב׳ 14:00-15:00',
      description: 'ד״ר מרים לוי • חדר 101',
      href: '/theory-lessons/3',
      status: 'scheduled'
    },
    {
      id: '4',
      type: 'orchestra',
      title: 'תזמורת הנוער',
      subtitle: '15 תלמידים • רמה מתקדמת',
      description: 'מנצח: מוטי רבין',
      href: '/orchestras/4',
      status: 'active'
    },
    {
      id: '5',
      type: 'rehearsal',
      title: 'חזרה כללית',
      subtitle: 'תזמורת הנוער • יום ה׳ 16:00',
      description: 'אולם גדול • הכנה לקונצרט',
      href: '/rehearsals/5',
      status: 'upcoming'
    }
  ]
  
  // FunnelIcon by category and query
  return mockResults.filter(result => {
    if (category !== 'all' && result.type !== category.slice(0, -1)) {
      return false
    }
    
    if (query.trim()) {
      const searchText = `${result.title} ${result.subtitle} ${result.description}`.toLowerCase()
      return searchText.includes(query.toLowerCase())
    }
    
    return true
  }).slice(0, 8) // Limit results
}

// Icons for different result types
const getResultIcon = (type: SearchResult['type']) => {
  const icons = {
    student: UsersIcon,
    teacher: GraduationCapIcon,
    lesson: BookOpenIcon,
    orchestra: MusicNotesIcon,
    rehearsal: CalendarIcon,
    room: MagnifyingGlassIcon
  }
  return icons[type] || MagnifyingGlassIcon
}

// Status colors for different result types
const getStatusColor = (status?: string) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    upcoming: 'bg-orange-100 text-orange-800',
    completed: 'bg-purple-100 text-purple-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  variant = 'header',
  onResultSelect,
  className = '',
  autoFocus = false
}) => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Auto-focus input when autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])
  
  // Handle search with debouncing
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim() || category !== 'all') {
        setIsLoading(true)
        try {
          const searchResults = await performSearch(query, category, filters)
          setResults(searchResults)
          setShowResults(true)
        } catch (error) {
          console.error('MagnifyingGlassIcon error:', error)
          setResults([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)
    
    return () => clearTimeout(searchTimer)
  }, [query, category, filters])
  
  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false)
      inputRef.current?.blur()
    }
  }
  
  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecentSearches)
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches))
    
    // Handle result selection
    onResultSelect?.(result)
    setShowResults(false)
    setQuery('')
  }
  
  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }
  
  const currentCategory = searchCategories.find(cat => cat.key === category) || searchCategories[0]
  
  return (
    <div ref={searchRef} className={`relative ${className}`} dir="rtl">
      {/* MagnifyingGlassIcon Input */}
      <div className="relative">
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 space-x-reverse">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          {variant === 'page' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="מסננים"
            >
              <FunnelIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          placeholder={currentCategory.placeholder}
          className={`w-full pr-12 pl-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-reisinger-yonatan text-right rtl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
            variant === 'page' ? 'py-3' : ''
          }`}
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Category Tabs (for page variant) */}
      {variant === 'page' && (
        <div className="flex items-center space-x-2 space-x-reverse mt-4 overflow-x-auto">
          {searchCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  category === cat.key
                    ? 'bg-muted text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 ml-2" />
                {cat.label}
              </button>
            )
          })}
        </div>
      )}
      
      {/* MagnifyingGlassIcon Results */}
      {showResults && (query || category !== 'all') && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">מחפש...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => {
                const Icon = getResultIcon(result.type)
                return (
                  <Link
                    key={result.id}
                    to={result.href}
                    onClick={() => handleResultClick(result)}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate font-reisinger-yonatan">
                            {result.title}
                          </h4>
                          {result.status && (
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                              {result.status === 'active' && 'פעיל'}
                              {result.status === 'inactive' && 'לא פעיל'}
                              {result.status === 'scheduled' && 'מתוזמן'}
                              {result.status === 'upcoming' && 'קרוב'}
                              {result.status === 'completed' && 'הושלם'}
                            </span>
                          )}
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-sm text-gray-600 truncate">
                            {result.subtitle}
                          </p>
                        )}
                        
                        {result.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : query ? (
            <div className="p-4 text-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">לא נמצאו תוצאות עבור "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">נסה חיפוש עם מילים אחרות</p>
            </div>
          ) : (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">חיפושים אחרונים</h4>
              {recentSearches.length > 0 ? (
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="flex items-center w-full px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors text-right"
                    >
                      <ClockIcon className="w-4 h-4 ml-2 text-gray-400" />
                      {search}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">אין חיפושים אחרונים</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch

// Export search hook for custom implementations
export const useSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const search = async (query: string, category = 'all', filters = {}) => {
    setIsLoading(true)
    try {
      const searchResults = await performSearch(query, category, filters)
      setResults(searchResults)
      return searchResults
    } catch (error) {
      console.error('MagnifyingGlassIcon error:', error)
      setResults([])
      return []
    } finally {
      setIsLoading(false)
    }
  }
  
  return { results, isLoading, search }
}