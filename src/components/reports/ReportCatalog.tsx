import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import {
  UsersIcon,
  GraduationCapIcon,
  BuildingsIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

interface Report {
  id: string
  name: string
  description?: string
  category: string
  icon?: string
}

interface Category {
  id: string
  label: string
  icon: string
  reports: Report[]
}

interface ReportCatalogProps {
  categories: Category[]
}

const ICON_MAP: Record<string, Icon> = {
  Users: UsersIcon,
  GraduationCap: GraduationCapIcon,
  Building: BuildingsIcon,
  Grid: SquaresFourIcon,
}

export default function ReportCatalog({ categories }: ReportCatalogProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const CategoryIcon = ICON_MAP[category.icon] || SquaresFourIcon

        return (
          <div key={category.id}>
            {/* Category Heading */}
            <div className="flex items-center gap-2 mb-4">
              <CategoryIcon size={22} weight="duotone" className="text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">{category.label}</h3>
            </div>

            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.reports.map((report) => (
                <Card
                  key={report.id}
                  hover
                  className="cursor-pointer p-4"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {report.name}
                  </h4>
                  {report.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
