import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { getDisplayName } from '@/utils/nameUtils'
import { getAvatarColorClasses } from '@/utils/avatarColorHash'
import { AvatarInitials } from '@/components/domain/AvatarInitials'
import { cn } from '@/lib/utils'

// Static lookup avoids dynamic Tailwind class generation (tree-shake safety)
const ENTITY_DETAIL_STYLES = {
  teachers:   { headerBg: 'bg-teachers-bg',   nameFg: 'text-teachers-fg',   badgeBg: 'bg-teachers-fg/10', badgeText: 'text-teachers-fg', avatarBg: 'bg-teachers-fg/15 text-teachers-fg', border: 'border-teachers-fg/15' },
  students:   { headerBg: 'bg-students-bg',   nameFg: 'text-students-fg',   badgeBg: 'bg-students-fg/10', badgeText: 'text-students-fg', avatarBg: 'bg-students-fg/15 text-students-fg', border: 'border-students-fg/15' },
  orchestras: { headerBg: 'bg-orchestras-bg', nameFg: 'text-orchestras-fg', badgeBg: 'bg-orchestras-fg/10', badgeText: 'text-orchestras-fg', avatarBg: 'bg-orchestras-fg/15 text-orchestras-fg', border: 'border-orchestras-fg/15' },
} as const

interface DetailPageHeaderProps {
  firstName?: string
  lastName?: string
  fullName?: string
  entityType: string
  entityColor?: 'teachers' | 'students' | 'orchestras'
  breadcrumbLabel: string
  breadcrumbHref: string
  updatedAt?: string | Date
  badges?: React.ReactNode
  children?: React.ReactNode
}

function formatLastUpdated(date: string | Date): string {
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function DetailPageHeader({
  firstName,
  lastName,
  fullName,
  entityType,
  entityColor,
  breadcrumbLabel,
  breadcrumbHref,
  updatedAt,
  badges,
  children,
}: DetailPageHeaderProps) {
  const navigate = useNavigate()
  const displayName = getDisplayName({ firstName, lastName, fullName })
  const avatarColor = getAvatarColorClasses(displayName)
  const entityStyles = entityColor ? ENTITY_DETAIL_STYLES[entityColor] : null

  return (
    <div>
      {/* Breadcrumb nav */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <button
          onClick={() => navigate(breadcrumbHref)}
          className="hover:text-primary transition-colors"
        >
          {breadcrumbLabel}
        </button>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>

      {entityStyles ? (
        /* Entity-colored pastel header zone */
        <div className={cn('rounded-xl p-6 border', entityStyles.headerBg, entityStyles.border)}>
          <div className="flex items-center gap-4">
            <AvatarInitials
              firstName={firstName}
              lastName={lastName}
              fullName={fullName}
              size="xl"
              colorClassName={entityStyles.avatarBg}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className={cn('text-2xl font-bold truncate', entityStyles.nameFg)}>{displayName}</h1>
                {badges}
              </div>
              {updatedAt && (
                <p className="text-muted-foreground text-sm mt-1">
                  עודכן לאחרונה: {formatLastUpdated(updatedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Fallback: gradient strip (backward compatible) */
        <div className="bg-gradient-to-l from-primary to-accent rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <AvatarInitials
              firstName={firstName}
              lastName={lastName}
              fullName={fullName}
              size="xl"
              colorClassName={`${avatarColor.bg} ${avatarColor.text}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold truncate">{displayName}</h1>
                {badges}
              </div>
              {updatedAt && (
                <p className="text-white/80 text-sm mt-1">
                  עודכן לאחרונה: {formatLastUpdated(updatedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Optional children slot (e.g., action buttons) */}
      {children}
    </div>
  )
}
