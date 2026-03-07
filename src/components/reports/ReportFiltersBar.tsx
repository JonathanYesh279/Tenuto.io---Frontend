import { useSchoolYear } from '../../services/schoolYearContext.jsx'

interface ParamDef {
  type: string
  label?: string
  required?: boolean
  allowedValues?: string[]
}

interface ReportFiltersBarProps {
  reportParams?: Record<string, ParamDef>
  currentFilters: Record<string, string>
  onFilterChange: (key: string, value: string) => void
  schoolYearId: string
  onSchoolYearChange: (yearId: string) => void
}

export default function ReportFiltersBar({
  reportParams,
  currentFilters,
  onFilterChange,
  schoolYearId,
  onSchoolYearChange,
}: ReportFiltersBarProps) {
  const { schoolYears } = useSchoolYear()

  const paramEntries = reportParams ? Object.entries(reportParams) : []

  return (
    <div className="flex flex-wrap items-center gap-4 bg-muted/30 rounded-lg px-4 py-3">
      {/* School Year Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          שנת לימוד
        </label>
        <select
          value={schoolYearId || ''}
          onChange={(e) => onSchoolYearChange(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {schoolYears.map((sy: any) => (
            <option key={sy._id} value={sy._id}>
              {sy.name || `${sy.startYear}-${sy.endYear}`}
            </option>
          ))}
        </select>
      </div>

      {/* Report-specific params */}
      {paramEntries.map(([key, param]) => (
        <div key={key} className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {param.label || key}
          </label>

          {param.allowedValues ? (
            <select
              value={currentFilters[key] || ''}
              onChange={(e) => onFilterChange(key, e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">הכל</option>
              {param.allowedValues.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          ) : param.type === 'boolean' ? (
            <input
              type="checkbox"
              checked={currentFilters[key] === 'true'}
              onChange={(e) => onFilterChange(key, String(e.target.checked))}
              className="rounded border-border h-4 w-4"
            />
          ) : (
            <input
              type="text"
              value={currentFilters[key] || ''}
              onChange={(e) => onFilterChange(key, e.target.value)}
              placeholder={param.label || key}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-32"
            />
          )}
        </div>
      ))}
    </div>
  )
}
