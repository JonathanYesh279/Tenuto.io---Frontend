import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/utils/nameUtils'
import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

interface AvatarInitialsProps {
  firstName?: string
  lastName?: string
  fullName?: string
  src?: string
  size?: AvatarSize
  className?: string
  colorClassName?: string
}

export function AvatarInitials({
  firstName,
  lastName,
  fullName,
  src,
  size = 'md',
  className,
  colorClassName,
}: AvatarInitialsProps) {
  const initials = getInitials({ firstName, lastName, fullName })

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback className={cn(colorClassName || 'bg-primary/10 text-primary', 'font-semibold')}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
