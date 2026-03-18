/**
 * SummaryCards - 3 stat cards showing key student metrics.
 *
 * Displays total weekly hours, orchestra count, and theory lesson count
 * in a compact 3-column grid below the ActivityChart.
 */

interface SummaryCardsProps {
  totalWeeklyHours: number
  orchestraCount: number
  theoryCount: number
  isLoading: boolean
}

function StatCard({
  value,
  label,
  loading,
}: {
  value: number | string
  label: string
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-card border border-border p-4 text-center animate-pulse">
        <div className="h-7 w-10 bg-gray-200 rounded mx-auto mb-1" />
        <div className="h-4 w-20 bg-gray-100 rounded mx-auto" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card border border-border p-4 text-center">
      <div className="text-2xl font-bold text-foreground">
        {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
      </div>
      <div className="text-caption text-muted-foreground">{label}</div>
    </div>
  )
}

export function SummaryCards({
  totalWeeklyHours,
  orchestraCount,
  theoryCount,
  isLoading,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        value={totalWeeklyHours}
        label="שעות שבועיות"
        loading={isLoading}
      />
      <StatCard
        value={orchestraCount}
        label="תזמורות"
        loading={isLoading}
      />
      <StatCard
        value={theoryCount}
        label="שיעורי תאוריה"
        loading={isLoading}
      />
    </div>
  )
}
