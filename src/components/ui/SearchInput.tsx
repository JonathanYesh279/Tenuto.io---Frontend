import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react'
import { Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  className?: string
  isLoading?: boolean
}

export function SearchInput({ value, onChange, onClear, placeholder, className, isLoading }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {isLoading
          ? <Loader className="w-4 h-4 text-muted-foreground animate-spin" />
          : <MagnifyingGlassIcon className="w-4 h-4 text-muted-foreground" weight="regular" />
        }
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pr-10 pl-8 py-2 border border-input rounded
                   bg-background text-sm text-foreground placeholder:text-muted-foreground
                   focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                   transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded
                     text-muted-foreground hover:text-foreground transition-colors"
          aria-label="נקה חיפוש"
        >
          <XIcon className="w-4 h-4" weight="regular" />
        </button>
      )}
    </div>
  )
}
