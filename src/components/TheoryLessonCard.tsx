
import {
import { BookOpenIcon, CalendarIcon, ClockIcon, EyeIcon, MapPinIcon, PencilIcon, TrashIcon, UserCircleCheckIcon } from '@phosphor-icons/react'
  formatLessonDate,
  formatLessonTime,
  getLessonStatus,
  type TheoryLesson
} from '../utils/theoryLessonUtils'
import TeacherNameDisplay from './TeacherNameDisplay'

interface TheoryLessonCardProps {
  lesson: TheoryLesson
  onView?: (lesson: TheoryLesson) => void
  onEdit?: (lesson: TheoryLesson) => void
  onDelete?: (lesson: TheoryLesson) => void
  onViewAttendance?: (lesson: TheoryLesson) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (lessonId: string) => void
}

export default function TheoryLessonCard({ lesson, onView, onEdit, onDelete, onViewAttendance, selectable, selected, onSelect }: TheoryLessonCardProps) {
  // Use utility functions for consistent formatting as specified in requirements
  const formattedDate = formatLessonDate(lesson)
  const formattedTime = formatLessonTime(lesson)
  const lessonStatus = getLessonStatus(lesson)

  return (
    <div className={`bg-white rounded border shadow-sm hover:shadow-md transition-all duration-200 ${
      selected ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
    }`}>
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          {selectable && (
            <div className="flex items-center ml-3">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelect?.(lesson._id)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpenIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary bg-primary px-2 py-1 rounded-full">
                {lesson.category}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${lessonStatus.colorClass}`}>
                {lessonStatus.text}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{lesson.title}</h3>
            {/* Teacher name displayed prominently under the title */}
            <TeacherNameDisplay
              lesson={lesson}
              className="text-sm font-medium text-gray-700 mb-1"
              showIcon={true}
            />
            {lesson.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{lesson.description}</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 mr-2">
            {onView && (
              <button
                onClick={() => onView(lesson)}
                className="p-2 text-gray-400 hover:text-primary hover:bg-neutral-800 rounded transition-colors"
                title="צפה בפרטים"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            )}
            {onViewAttendance && (
              <button
                onClick={() => onViewAttendance(lesson)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="צפה בנוכחות"
              >
                <UserCircleCheckIcon className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(lesson)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="ערוך שיעור"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(lesson)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="מחק שיעור"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">תאריך:</span>
            {formattedDate}
          </div>
          <div className="flex items-center text-gray-600">
            <ClockIcon className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">שעה:</span>
            {formattedTime}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="w-4 h-4 ml-2 text-gray-400" />
          <span className="font-medium text-gray-900 ml-1">מיקום:</span>
          {lesson.location || 'לא צוין'}
        </div>
      </div>
    </div>
  )
}