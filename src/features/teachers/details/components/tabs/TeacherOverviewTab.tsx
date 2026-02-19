/**
 * Teacher Overview Tab Component
 * 
 * Displays a comprehensive overview of teacher information
 * including personal details, schedule summary, and key statistics
 */

import React from 'react'

import { TeacherDetails } from '../../types'
import { getDisplayName, formatAddress } from '../../../../../utils/nameUtils'
import { BookOpenIcon, CalendarIcon, CheckCircleIcon, ClockIcon, EnvelopeIcon, MapPinIcon, MedalIcon, PhoneIcon, UserIcon, UsersIcon, WarningCircleIcon } from '@phosphor-icons/react'

interface TeacherOverviewTabProps {
  teacher: TeacherDetails
  teacherId: string
  isEditing?: boolean
  onUpdate?: () => void
}

const TeacherOverviewTab: React.FC<TeacherOverviewTabProps> = ({ 
  teacher, 
  teacherId, 
  isEditing, 
  onUpdate 
}) => {
  
  // Calculate statistics
  const totalStudents = teacher.studentCount || 0
  const totalTimeBlocks = teacher.teaching?.timeBlocks?.length || 0
  const weeklyHours = teacher.teaching?.timeBlocks?.reduce((total, block) => total + (block.totalDuration || 0), 0) / 60 || 0
  const activeTimeBlocks = teacher.teaching?.timeBlocks?.filter(block => block.isActive).length || 0

  return (
    <div className="space-y-8">
      {/* Personal Information Card */}
      <div className="bg-muted/30 rounded p-6 border border-border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-600" />
          פרטים אישיים
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>שם מלא:</p>
                <p className="font-medium text-gray-900">{getDisplayName(teacher.personalInfo) || 'ללא מידע'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <PhoneIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>טלפון:</p>
                <p className="font-medium text-gray-900">{teacher.personalInfo?.phone || 'ללא מידע'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <EnvelopeIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>אימייל:</p>
                <p className="font-medium text-gray-900">{teacher.personalInfo?.email || 'ללא מידע'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 space-x-reverse">
              <MapPinIcon className="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>כתובת:</p>
                <p className="font-medium text-gray-900">{formatAddress(teacher.personalInfo?.address) || 'ללא מידע'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <CheckCircleIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>סטטוס:</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  teacher.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {teacher.isActive ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information Card */}
      <div className="bg-muted/30 rounded p-6 border border-border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MedalIcon className="w-5 h-5 text-green-600" />
          מידע מקצועי
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <BookOpenIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>כלי נגינה:</p>
                <p className="font-medium text-gray-900">{teacher.professionalInfo?.instrument || 'ללא מידע'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <MedalIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>תפקידים:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {teacher.roles && teacher.roles.length > 0 ? (
                    teacher.roles.map((role, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                      >
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">ללא תפקידים</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <UsersIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>מספר תלמידים:</p>
                <p className="font-medium text-gray-900">{totalStudents}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>שעות הוראה שבועיות:</p>
                <p className="font-medium text-gray-900">{weeklyHours.toFixed(1)} שעות</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="bg-muted/30 rounded p-6 border border-border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          סיכום לוח זמנים
        </h3>
        
        {teacher.teaching?.timeBlocks && teacher.teaching.timeBlocks.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background rounded border border-border">
                <div className="text-2xl font-bold text-foreground">{totalTimeBlocks}</div>
                <div className="text-sm text-black font-semibold" style={{color: '#000000'}}>סך בלוקי זמן:</div>
              </div>
              <div className="text-center p-4 bg-background rounded border border-border">
                <div className="text-2xl font-bold text-foreground">{activeTimeBlocks}</div>
                <div className="text-sm text-black font-semibold" style={{color: '#000000'}}>בלוקים פעילים:</div>
              </div>
              <div className="text-center p-4 bg-background rounded border border-border">
                <div className="text-2xl font-bold text-foreground">{weeklyHours.toFixed(1)}</div>
                <div className="text-sm text-black font-semibold" style={{color: '#000000'}}>שעות בשבוע:</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">בלוקי זמן פעילים:</h4>
              {teacher.teaching.timeBlocks
                .filter(block => block.isActive)
                .slice(0, 5)
                .map((block, index) => (
                  <div key={block._id || index} className="flex items-center justify-between p-3 bg-background rounded border border-border">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <CalendarIcon className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{block.day}</span>
                      <span className="text-gray-600">{block.startTime} - {block.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                      <MapPinIcon className="w-3 h-3" />
                      <span>{block.location}</span>
                    </div>
                  </div>
                ))}
              {teacher.teaching.timeBlocks.filter(block => block.isActive).length > 5 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  ועוד {teacher.teaching.timeBlocks.filter(block => block.isActive).length - 5} בלוקים...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>לא הוגדרו בלוקי זמן</p>
          </div>
        )}
      </div>

      {/* Recent Students */}
      {totalStudents > 0 && (
        <div className="bg-muted/30 rounded p-6 border border-border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-orange-600" />
            תלמידים ({totalStudents})
          </h3>

          <div className="text-center py-4 text-gray-600">
            <p>לצפייה ברשימת התלמידים המלאה, עבור ללשונית "ניהול תלמידים"</p>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-muted/30 rounded p-6 border border-border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">מידע מערכת</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>תאריך יצירה:</p>
            <p className="font-medium text-gray-900">
              {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('he-IL') : 'ללא מידע'}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>עדכון אחרון:</p>
            <p className="font-medium text-gray-900">
              {teacher.updatedAt ? new Date(teacher.updatedAt).toLocaleDateString('he-IL') : 'ללא מידע'}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>מזהה מורה:</p>
            <p className="font-medium text-gray-900 font-mono">{teacher._id}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-black font-semibold" style={{color: '#000000'}}>התחברות אחרונה:</p>
            <p className="font-medium text-gray-900">
              {teacher.credentials?.lastLogin 
                ? new Date(teacher.credentials.lastLogin).toLocaleDateString('he-IL')
                : 'אף פעם'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherOverviewTab