import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeftIcon } from '@phosphor-icons/react'
import { getDisplayName } from '@/utils/nameUtils'
import { getAvatarColorClasses } from '@/utils/avatarColorHash'
import { AvatarInitials } from '@/components/domain/AvatarInitials'
// Static lookup avoids dynamic Tailwind class generation (tree-shake safety)
// Phase 22: Subdued entity colors — bg-muted/40 base + thin left accent line in entity color
const ENTITY_DETAIL_STYLES = {
  teachers:   { accentColor: 'hsl(var(--color-teachers-fg))',   badgeBg: 'bg-teachers-fg/10', badgeText: 'text-teachers-fg', avatarBg: 'bg-teachers-fg/15 text-teachers-fg' },
  students:   { accentColor: 'hsl(var(--color-students-fg))',   badgeBg: 'bg-students-fg/10', badgeText: 'text-students-fg', avatarBg: 'bg-students-fg/15 text-students-fg' },
  orchestras: { accentColor: 'hsl(var(--color-orchestras-fg))', badgeBg: 'bg-orchestras-fg/10', badgeText: 'text-orchestras-fg', avatarBg: 'bg-orchestras-fg/15 text-orchestras-fg' },
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
        <CaretLeftIcon className="w-4 h-4" weight="regular" />
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>

      {entityStyles ? (
        /* Subdued entity header — flat tonal surface + thin left accent line (no vivid pastel background) */
        <div
          className="bg-muted/40 border border-border rounded p-6"
          style={{ borderRight: `3px solid ${entityStyles.accentColor}` }}
        >
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
                <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
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
        /* Fallback: flat tonal strip (backward compatible — removed gradient) */
        <div className="bg-muted border border-border rounded p-6">
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
                <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
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
      )}

      {/* Optional children slot (e.g., action buttons) */}
      {children}
    </div>
  )
}
