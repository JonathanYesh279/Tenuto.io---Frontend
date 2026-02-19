import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeftIcon } from '@phosphor-icons/react'
import { getDisplayName } from '@/utils/nameUtils'
import { AvatarInitials } from '@/components/domain/AvatarInitials'
// Static lookup avoids dynamic Tailwind class generation (tree-shake safety)
// Phase 22: Dossier archetype — bg-muted/40 tonal block + thin entity accent border
const ENTITY_DETAIL_STYLES = {
  teachers:   { accentColor: 'hsl(var(--color-teachers-fg))',   avatarBg: 'bg-teachers-fg/15 text-teachers-fg' },
  students:   { accentColor: 'hsl(var(--color-students-fg))',   avatarBg: 'bg-students-fg/15 text-students-fg' },
  orchestras: { accentColor: 'hsl(var(--color-orchestras-fg))', avatarBg: 'bg-orchestras-fg/15 text-orchestras-fg' },
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
  const entityStyles = entityColor ? ENTITY_DETAIL_STYLES[entityColor] : null

  return (
    <div className="bg-muted/40 border-b border-border">
      {/* Breadcrumb — minimal, above identity */}
      <div className="px-6 pt-4 pb-0">
        <button
          onClick={() => navigate(breadcrumbHref)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <CaretLeftIcon size={14} weight="bold" />
          {breadcrumbLabel}
        </button>
      </div>

      {/* Identity block — name at display scale, avatar with entity accent */}
      <div className="px-6 pt-4 pb-4 flex items-center gap-4">
        <AvatarInitials
          firstName={firstName}
          lastName={lastName}
          fullName={fullName}
          size="xl"
          colorClassName={entityStyles?.avatarBg ?? 'bg-muted text-foreground'}
          style={entityStyles ? { borderRight: `3px solid ${entityStyles.accentColor}` } : undefined}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {badges}
            {updatedAt && (
              <span className="text-xs text-muted-foreground">
                עודכן: {formatLastUpdated(updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar attachment zone — children rendered INSIDE the header block */}
      {children && (
        <div className="px-6">
          {children}
        </div>
      )}
    </div>
  )
}
