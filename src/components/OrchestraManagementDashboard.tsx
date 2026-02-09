import { useState, useEffect } from 'react'
import {
  Users,
  Music,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  Clock,
  Edit,
  Eye,
  UserPlus,
  Trash2
} from 'lucide-react'
import { Card } from './ui/Card'
import StatsCard from './ui/StatsCard'
import { orchestraService, studentService, teacherService, rehearsalService } from '../services/apiService'
import { 
  getOrchestraTypeInfo,
  getOrchestraStatus,
  calculateOrchestraStats,
  getOrchestraReadiness,
  getMemberInstrumentsSummary,
  type Orchestra
} from '../utils/orchestraUtils'

interface OrchestraWithDetails extends Orchestra {
  memberDetails?: Array<{
    _id: string
    personalInfo: {
      fullName: string
    }
    academicInfo?: {
      class?: string
      instrumentProgress?: Array<{
        instrumentName: string
        isPrimary: boolean
        currentStage: number
      }>
    }
  }>
  conductorDetails?: {
    _id: string
    personalInfo: {
      fullName: string
      email?: string
    }
    professionalInfo?: {
      instrument?: string
    }
  }
  rehearsalCount?: number
  upcomingRehearsals?: Array<{
    _id: string
    date: string
    startTime: string
    endTime: string
    location: string
  }>
}

interface OrchestraManagementDashboardProps {
  onViewDetails?: (orchestraId: string) => void
  onEditOrchestra?: (orchestra: Orchestra) => void
  onManageMembers?: (orchestraId: string) => void
  onDeleteOrchestra?: (orchestraId: string) => void
}

export default function OrchestraManagementDashboard({
  onViewDetails,
  onEditOrchestra,
  onManageMembers,
  onDeleteOrchestra
}: OrchestraManagementDashboardProps) {
  const [orchestras, setOrchestras] = useState<OrchestraWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'תזמורת' | 'הרכב'>('all')

  useEffect(() => {
    loadOrchestraData()
  }, [])

  const loadOrchestraData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load ALL data in parallel - single batch of API calls
      // This avoids N+1 queries where we would call rehearsal API for each orchestra
      const [orchestrasData, allStudents, allTeachers, allRehearsals] = await Promise.all([
        orchestraService.getOrchestras(),
        studentService.getStudents(),
        teacherService.getTeachers(),
        rehearsalService.getRehearsals().catch(() => []) // Gracefully handle rehearsal loading errors
      ])

      const now = new Date()

      // Enrich orchestras with detailed information - all data is already loaded
      // No additional API calls needed here
      const enrichedOrchestras = orchestrasData.map((orchestra): OrchestraWithDetails => {
        // Get member details (filter from pre-loaded students)
        const memberDetails = allStudents.filter(student =>
          orchestra.memberIds?.includes(student._id)
        )

        // Get conductor details (find from pre-loaded teachers)
        const conductorDetails = allTeachers.find(teacher =>
          teacher._id === orchestra.conductorId
        )

        // Filter rehearsals for this orchestra from pre-loaded data
        const orchestraRehearsals = allRehearsals.filter(
          (r: any) => r.orchestraId === orchestra._id
        )
        const rehearsalCount = orchestraRehearsals.length

        // Filter and sort upcoming rehearsals
        const upcomingRehearsals = orchestraRehearsals
          .filter((r: any) => new Date(r.date) >= now)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3)

        return {
          ...orchestra,
          memberDetails,
          conductorDetails,
          rehearsalCount,
          upcomingRehearsals
        }
      })

      setOrchestras(enrichedOrchestras)
    } catch (error) {
      console.error('Error loading orchestra data:', error)
      setError('שגיאה בטעינת נתוני תזמורות')
    } finally {
      setLoading(false)
    }
  }

  // Filter orchestras based on selected filter
  const filteredOrchestras = orchestras.filter(orchestra => {
    switch (selectedFilter) {
      case 'active':
        return orchestra.isActive
      case 'inactive':
        return !orchestra.isActive
      case 'תזמורת':
      case 'הרכב':
        return orchestra.type === selectedFilter
      default:
        return true
    }
  })

  // Calculate dashboard statistics
  const stats = {
    total: orchestras.length,
    active: orchestras.filter(o => o.isActive).length,
    totalMembers: orchestras.reduce((sum, o) => sum + (o.memberIds?.length || 0), 0),
    withConductor: orchestras.filter(o => o.conductorId).length,
    avgMembersPerOrchestra: orchestras.length > 0 
      ? Math.round(orchestras.reduce((sum, o) => sum + (o.memberIds?.length || 0), 0) / orchestras.length)
      : 0,
    typeDistribution: {
      'תזמורת': orchestras.filter(o => o.type === 'תזמורת').length,
      'הרכב': orchestras.filter(o => o.type === 'הרכב').length
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 ml-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="סה״כ תזמורות"
          value={stats.total.toString()}
          subtitle={`${stats.active} פעילות`}
          icon={<Music />}
          color="blue"
          trend={{ 
            value: stats.typeDistribution['תזמורת'], 
            label: "תזמורות", 
            direction: "up" 
          }}
        />
        <StatsCard
          title="סה״כ מבצעים"
          value={stats.totalMembers.toString()}
          subtitle={`ממוצע ${stats.avgMembersPerOrchestra} לתזמורת`}
          icon={<Users />}
          color="green"
          trend={{ 
            value: stats.typeDistribution['הרכב'], 
            label: "הרכבים", 
            direction: "up" 
          }}
        />
        <StatsCard
          title="מנצחים מוקצים"
          value={`${stats.withConductor}/${stats.total}`}
          subtitle={`${Math.round((stats.withConductor / Math.max(stats.total, 1)) * 100)}% הקצאה`}
          icon={<User />}
          color="purple"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: 'all', label: 'הכל', count: stats.total },
          { key: 'active', label: 'פעילות', count: stats.active },
          { key: 'inactive', label: 'לא פעילות', count: stats.total - stats.active },
          { key: 'תזמורת', label: 'תזמורות', count: stats.typeDistribution['תזמורת'] },
          { key: 'הרכב', label: 'הרכבים', count: stats.typeDistribution['הרכב'] }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setSelectedFilter(filter.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedFilter === filter.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Orchestra Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrchestras.map(orchestra => {
          const typeInfo = getOrchestraTypeInfo(orchestra.type)
          const status = getOrchestraStatus(orchestra)
          const instrumentsSummary = getMemberInstrumentsSummary(orchestra.memberDetails || [])
          const readiness = getOrchestraReadiness(orchestra)

          return (
            <Card
              key={orchestra._id}
              className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary-300 p-5"
              onClick={() => onViewDetails?.(orchestra._id)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{orchestra.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {typeInfo.text}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {status.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Orchestra Info */}
                <div className="space-y-3">
                  {/* Conductor */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    {orchestra.conductorDetails ? (
                      <div>
                        <span className="font-medium text-gray-900">
                          {orchestra.conductorDetails.personalInfo.fullName}
                        </span>
                        {orchestra.conductorDetails.professionalInfo?.instrument && (
                          <span className="text-gray-500 text-xs block">
                            {orchestra.conductorDetails.professionalInfo.instrument}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">לא הוקצה מנצח</span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{orchestra.location}</span>
                  </div>

                  {/* Members Count */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {orchestra.memberDetails?.length || 0} חברים
                      {instrumentsSummary.totalInstruments > 0 && (
                        <span className="text-gray-500 text-xs">
                          {' '}• {instrumentsSummary.totalInstruments} כלי נגינה
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Rehearsals */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {orchestra.rehearsalCount || 0} חזרות
                      {orchestra.upcomingRehearsals && orchestra.upcomingRehearsals.length > 0 && (
                        <span className="text-green-600 text-xs">
                          {' '}• {orchestra.upcomingRehearsals.length} עתידות
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Upcoming Rehearsals Preview */}
                {orchestra.upcomingRehearsals && orchestra.upcomingRehearsals.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">חזרות קרובות:</div>
                    <div className="space-y-1">
                      {orchestra.upcomingRehearsals.slice(0, 2).map(rehearsal => (
                        <div key={rehearsal._id} className="text-xs text-gray-600 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(rehearsal.date).toLocaleDateString('he-IL')} • {rehearsal.startTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onManageMembers?.(orchestra._id)
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    חברים
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditOrchestra?.(orchestra)
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    עריכה
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteOrchestra?.(orchestra._id)
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredOrchestras.length === 0 && !loading && (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedFilter === 'all' ? 'אין תזמורות' : `אין תזמורות ${
              selectedFilter === 'active' ? 'פעילות' :
              selectedFilter === 'inactive' ? 'לא פעילות' :
              selectedFilter === 'תזמורת' ? 'מסוג תזמורת' :
              selectedFilter === 'הרכב' ? 'מסוג הרכב' : ''
            }`}
          </h3>
          <p className="text-gray-600">
            {selectedFilter === 'all' ? 
              'התחל על ידי יצירת התזמורת הראשונה' :
              'שנה את המסנן לראות תזמורות אחרות'
            }
          </p>
        </div>
      )}
    </div>
  )
}