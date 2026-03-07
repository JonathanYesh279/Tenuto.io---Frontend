import { useSchoolYear } from '../../services/schoolYearContext.jsx'

interface YearComparisonToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  comparisonYearId: string | null
  onComparisonYearChange: (yearId: string) => void
  excludeYearId?: string
}

export default function YearComparisonToggle({
  enabled,
  onToggle,
  comparisonYearId,
  onComparisonYearChange,
  excludeYearId,
}: YearComparisonToggleProps) {
  const { schoolYears } = useSchoolYear()

  // Exclude current year from comparison options
  const comparisonYears = excludeYearId
    ? schoolYears.filter((sy: any) => sy._id !== excludeYearId)
    : schoolYears

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
        enabled ? 'bg-blue-50 border border-blue-200' : 'bg-muted/30'
      }`}
    >
      <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        השוואה לשנה קודמת
      </label>

      <button
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>

      {enabled && (
        <select
          value={comparisonYearId || ''}
          onChange={(e) => onComparisonYearChange(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">בחר שנה</option>
          {comparisonYears.map((sy: any) => (
            <option key={sy._id} value={sy._id}>
              {sy.name || `${sy.startYear}-${sy.endYear}`}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
