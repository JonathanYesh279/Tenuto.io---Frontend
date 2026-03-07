interface SummaryItem {
  label: string
  value: any
  type: string
}

interface MinistryReadinessGaugeProps {
  rows: Record<string, any>[]
  summary: { items: SummaryItem[] }
}

function getGaugeColor(percentage: number): string {
  if (percentage >= 80) return '#22c55e' // green
  if (percentage >= 50) return '#f59e0b' // amber
  return '#ef4444' // red
}

function getGaugeBg(percentage: number): string {
  if (percentage >= 80) return 'bg-green-50 border-green-200'
  if (percentage >= 50) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

export default function MinistryReadinessGauge({ rows, summary }: MinistryReadinessGaugeProps) {
  // Try to find completion percentage from summary
  const completionItem = summary?.items?.find(
    (item) =>
      item.label.includes('השלמה') ||
      item.label.includes('מוכנות') ||
      item.type === 'percentage'
  )

  let completionPercentage: number | null = null

  if (completionItem) {
    completionPercentage = Number(completionItem.value)
  }

  // Fallback: compute from rows (percentage of non-missing items)
  if (completionPercentage === null && rows.length > 0) {
    // If rows represent missing items, we can't easily compute a percentage
    // Show as unavailable
    completionPercentage = null
  }

  // SVG gauge parameters
  const size = 180
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = completionPercentage ?? 0
  const offset = circumference - (percentage / 100) * circumference
  const color = getGaugeColor(percentage)

  // Count missing items (rows that represent issues)
  const missingItems = rows.filter(
    (row) => row.severity === 'high' || row.severity === 'critical'
  )
  const warningItems = rows.filter((row) => row.severity === 'medium' || row.severity === 'low')

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        מוכנות לדיווח למשרד
      </h3>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-around">
        {/* Circular Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            {/* Percentage text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {completionPercentage !== null ? (
                <>
                  <span className="text-3xl font-bold" style={{ color }}>
                    {Math.round(completionPercentage)}%
                  </span>
                  <span className="text-xs text-muted-foreground">השלמה</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">לא זמין</span>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {summary?.items && summary.items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 min-w-[250px]">
            {summary.items.map((item, i) => (
              <div
                key={i}
                className="bg-muted/30 rounded-lg p-3 text-center"
              >
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-xl font-semibold text-foreground">
                  {item.type === 'percentage'
                    ? `${Number(item.value).toFixed(1)}%`
                    : item.type === 'number'
                    ? Number(item.value).toLocaleString('he-IL')
                    : String(item.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missing Items Warning */}
      {missingItems.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-red-700 mb-3">
            פריטים חסרים ({missingItems.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {missingItems.slice(0, 20).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm bg-red-50 rounded-md px-3 py-2 border border-red-100"
              >
                <span className="font-medium text-red-800 min-w-[60px]">
                  {item.entityType}
                </span>
                <span className="text-red-700">{item.entityName}</span>
                <span className="text-red-500 mr-auto">{item.missingField}</span>
              </div>
            ))}
            {missingItems.length > 20 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                ועוד {missingItems.length - 20} פריטים נוספים
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warning Items */}
      {warningItems.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-amber-700 mb-3">
            אזהרות ({warningItems.length})
          </h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {warningItems.slice(0, 10).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm bg-amber-50 rounded-md px-3 py-2 border border-amber-100"
              >
                <span className="font-medium text-amber-800 min-w-[60px]">
                  {item.entityType}
                </span>
                <span className="text-amber-700">{item.entityName}</span>
                <span className="text-amber-500 mr-auto">{item.missingField}</span>
              </div>
            ))}
            {warningItems.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                ועוד {warningItems.length - 10} אזהרות נוספות
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
