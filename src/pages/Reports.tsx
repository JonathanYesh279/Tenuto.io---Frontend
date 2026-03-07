import { useState, useEffect } from 'react'
import { useSchoolYear } from '../services/schoolYearContext.jsx'
import { reportsService } from '../services/apiService'
import KpiDashboard from '../components/reports/KpiDashboard'
import ReportCatalog from '../components/reports/ReportCatalog'
import toast from 'react-hot-toast'

export default function Reports() {
  const { currentSchoolYear } = useSchoolYear()
  const [dashboard, setDashboard] = useState<any>(null)
  const [registry, setRegistry] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [dashRes, regRes] = await Promise.all([
          reportsService.getDashboard(currentSchoolYear?._id),
          reportsService.getRegistry(),
        ])
        setDashboard(dashRes)
        setRegistry(regRes)
      } catch (error) {
        console.error('Error loading reports page:', error)
        toast.error('שגיאה בטעינת הדוחות')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentSchoolYear?._id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">טוען דוחות...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">דוחות</h1>
        <p className="text-sm text-muted-foreground mt-1">סקירת מדדים ודוחות</p>
      </div>

      {/* KPI Dashboard */}
      {dashboard && (
        <KpiDashboard
          kpis={dashboard.kpis || []}
          alerts={dashboard.alerts || []}
        />
      )}

      {/* Report Catalog */}
      {registry && (
        <ReportCatalog categories={registry.categories || []} />
      )}
    </div>
  )
}
