import React from 'react'
import { User, Chip, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react'
import {
  PhoneIcon,
  EnvelopeIcon,
  ChatCircleDotsIcon,
  MusicNoteIcon,
} from '@phosphor-icons/react'
import { getDisplayName } from '../../utils/nameUtils'
import { getAvatarColorHex } from '../../utils/avatarColorHash'

interface ProfileSidebarProps {
  user: any
}

const getWhatsAppLink = (phoneNum: string) => {
  const cleaned = phoneNum.replace(/^0/, '').replace(/[-\s]/g, '')
  return `https://wa.me/972${cleaned}`
}

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'teacher':
    case 'מורה':
      return 'מורה'
    case 'conductor':
    case 'מנצח':
      return 'מנצח'
    case 'תאוריה':
    case 'מורה תיאוריה':
      return 'מורה תיאוריה'
    case 'admin':
    case 'מנהל':
      return 'מנהל'
    default:
      return role
  }
}

export default function ProfileSidebar({ user }: ProfileSidebarProps) {
  const displayName = getDisplayName(user?.personalInfo) || user?.name || 'משתמש'
  const avatarColor = getAvatarColorHex(displayName)
  const phone = user?.personalInfo?.phone || user?.phone || ''
  const email = user?.personalInfo?.email || user?.email || ''
  const roles = user?.roles || []
  const instrument = user?.professionalInfo?.instrument || ''

  return (
    <div className="bg-card rounded-card border border-border overflow-hidden shadow-1 h-full flex flex-col">
      {/* Gradient header band */}
      <div className="relative">
        <div
          className="h-28 w-full"
          style={{ background: 'linear-gradient(135deg, #6ec49d 0%, #4db8a4 50%, #3aa89e 100%)' }}
        />
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: '80px' }}>
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            style={{ height: '80px', display: 'block' }}
          >
            <path
              d="M0,200 C480,40 960,40 1440,200 L1440,200 L0,200 Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Content area — avatar overlaps gradient */}
      <div className="flex flex-col items-center -mt-14 px-4 pb-5 space-y-3 flex-1 relative z-10">
        {/* Avatar */}
        <User
          avatarProps={{
            radius: 'full',
            size: 'lg',
            showFallback: true,
            name: displayName,
            style: { backgroundColor: avatarColor },
            classNames: { base: 'w-14 h-14 text-lg text-white ring-3 ring-card' },
          }}
          name=""
          description=""
          classNames={{ base: 'justify-center' }}
        />

        {/* Name */}
        <h2 className="text-xl font-bold text-foreground">{displayName}</h2>

        {/* Role chips */}
        {roles.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {roles.map((role: string, idx: number) => (
              <Chip key={idx} color="primary" variant="flat" size="sm">
                {getRoleLabel(role)}
              </Chip>
            ))}
          </div>
        )}

        {/* Status chip */}
        {user?.isActive !== undefined && (
          <Chip color={user.isActive ? 'success' : 'default'} variant="flat" size="sm">
            {user.isActive ? 'פעיל' : 'לא פעיל'}
          </Chip>
        )}

        {/* Instrument */}
        {instrument && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MusicNoteIcon className="w-4 h-4" />
            <span>{instrument}</span>
          </div>
        )}

        {/* Quick contact icon row with popovers */}
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border w-full">
          {/* Phone popover */}
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button isIconOnly variant="flat" size="sm" aria-label="טלפון">
                <PhoneIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="p-3 space-y-2 min-w-[200px]">
                <p className="text-xs font-semibold text-foreground">טלפון</p>
                {phone ? (
                  <>
                    <a href={`tel:${phone}`} className="text-sm text-primary hover:underline block">
                      {phone}
                    </a>
                    <a
                      href={getWhatsAppLink(phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ChatCircleDotsIcon className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">לא צוין</span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Email popover */}
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button isIconOnly variant="flat" size="sm" aria-label="אימייל">
                <EnvelopeIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="p-3 min-w-[180px]">
                <p className="text-xs font-semibold text-foreground mb-1">דוא״ל</p>
                {email ? (
                  <a href={`mailto:${email}`} className="text-sm text-primary hover:underline block truncate">
                    {email}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">לא צוין</span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* WhatsApp direct button */}
          {phone && (
            <Button
              as="a"
              href={getWhatsAppLink(phone)}
              target="_blank"
              rel="noopener noreferrer"
              isIconOnly
              variant="flat"
              size="sm"
              aria-label="WhatsApp"
            >
              <ChatCircleDotsIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
