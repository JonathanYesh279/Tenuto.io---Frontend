import React from 'react'
import { Users, Calendar, Phone, Mail } from 'lucide-react'
import { Card } from './ui/Card'
import { getDisplayName, getInitials as getNameInitials } from '../utils/nameUtils'

interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone?: string
    email?: string
  }
  roles: string[]
  professionalInfo: {
    instrument?: string
    isActive: boolean
  }
  studentCount?: number
  teaching?: {
    timeBlocks?: any[]
    schedule?: Array<{
      day: string
      startTime: string
      endTime: string
      duration: number
    }>
  }
  isActive: boolean
}

interface TeacherCardProps {
  teacher: Teacher
  showStudentCount?: boolean
  showSchedule?: boolean
  showContact?: boolean
  onClick?: () => void
  className?: string
}

const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  showStudentCount = true,
  showSchedule = false,
  showContact = false,
  onClick,
  className = ''
}) => {
  // Generate avatar initials using nameUtils
  const getInitials = () => {
    return getNameInitials(teacher.personalInfo) || 'מ'
  }

  // Get role color
  const getRoleColor = (role: string): string => {
    const colors = {
      'מורה': 'bg-blue-100 text-blue-800',
      'מנצח': 'bg-purple-100 text-purple-800',
      'מדריך הרכב': 'bg-green-100 text-green-800',
      'מנהל': 'bg-red-100 text-red-800',
      'מורה תאוריה': 'bg-yellow-100 text-yellow-800',
      'מגמה': 'bg-indigo-100 text-indigo-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Get primary role for avatar color
  const getPrimaryRole = (): string => {
    const roleOrder = ['מנהל', 'מנצח', 'מדריך הרכב', 'מורה תאוריה', 'מגמה', 'מורה']
    const roles = teacher.roles || []
    return roles.find(role => roleOrder.includes(role)) || roles[0] || 'מורה'
  }

  // Get avatar background color based on primary role
  const getAvatarColor = (role: string): string => {
    const colors = {
      'מורה': 'bg-blue-500',
      'מנצח': 'bg-purple-500',
      'מדריך הרכב': 'bg-green-500',
      'מנהל': 'bg-red-500',
      'מורה תאוריה': 'bg-yellow-500',
      'מגמה': 'bg-indigo-500'
    }
    return colors[role as keyof typeof colors] || 'bg-blue-500'
  }

  // Count total weekly schedule hours from timeBlocks
  const getScheduleInfo = () => {
    const timeBlocks = teacher.teaching?.timeBlocks || []
    const allLessons = timeBlocks.flatMap(block =>
      (block.assignedLessons || []).filter(lesson => lesson.isActive !== false)
    )

    if (allLessons.length === 0) {
      return { lessons: 0, hours: 0 }
    }

    const totalMinutes = allLessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0)
    return {
      lessons: allLessons.length,
      hours: Math.round(totalMinutes / 60 * 10) / 10
    }
  }

  const primaryRole = getPrimaryRole()
  const studentCount = teacher.studentCount || 0
  const scheduleInfo = getScheduleInfo()

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
      padding="md"
    >
      <div className="flex items-start space-x-4 space-x-reverse">
        {/* Avatar with role color */}
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm
          ${getAvatarColor(primaryRole)}
        `}>
          {getInitials()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with name and status */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {getDisplayName(teacher.personalInfo)}
            </h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              {/* Active status indicator */}
              <div className={`w-3 h-3 rounded-full ${teacher.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
              {/* Professional status */}
              {!teacher.professionalInfo?.isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  לא פעיל מקצועית
                </span>
              )}
            </div>
          </div>

          {/* Roles */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {(teacher.roles || []).map((role, index) => (
                <span 
                  key={index}
                  className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${getRoleColor(role)}
                  `}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Instrument specialization */}
          {teacher.professionalInfo?.instrument && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-sm">
                <span className="text-gray-600">התמחות:</span>
                <span className="font-medium text-gray-900">
                  {teacher.professionalInfo.instrument}
                </span>
              </div>
            </div>
          )}

          {/* Student count */}
          {showStudentCount && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>
                  {studentCount} {studentCount === 1 ? 'תלמיד' : 'תלמידים'}
                </span>
              </div>
            </div>
          )}

          {/* Schedule info */}
          {showSchedule && scheduleInfo.lessons > 0 && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {scheduleInfo.lessons} שיעורים ({scheduleInfo.hours} שעות בשבוע)
                </span>
              </div>
            </div>
          )}

          {/* Contact info */}
          {showContact && (
            <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
              {teacher.personalInfo.phone && (
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700 font-mono" dir="ltr">
                    {teacher.personalInfo.phone}
                  </span>
                </div>
              )}
              {teacher.personalInfo.email && (
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700 font-mono" dir="ltr">
                    {teacher.personalInfo.email}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick stats */}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {teacher.isActive ? 'פעיל במערכת' : 'לא פעיל במערכת'}
              </span>
              {teacher.professionalInfo?.isActive && (
                <span className="text-green-600">
                  פעיל מקצועית
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TeacherCard