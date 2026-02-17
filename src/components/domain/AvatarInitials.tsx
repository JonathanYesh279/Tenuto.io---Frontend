import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/utils/nameUtils'
import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

interface AvatarInitialsProps {
  firstName?: string
  lastName?: string
  fullName?: string
  src?: string
  size?: AvatarSize
  className?: string
}

export function AvatarInitials({
  firstName,
  lastName,
  fullName,
  src,
  size = 'md',
  className,
}: AvatarInitialsProps) {
  const initials = getInitials({ firstName, lastName, fullName })

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
