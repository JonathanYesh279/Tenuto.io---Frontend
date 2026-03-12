
import { BookOpenIcon, CalendarIcon, ClockIcon, EyeIcon, MapPinIcon, PencilIcon, TrashIcon, UserCircleCheckIcon } from '@phosphor-icons/react'
import {
  formatLessonDate,
  formatLessonTime,
  getLessonStatus,
  type TheoryLesson
} from '../utils/theoryLessonUtils'
import TeacherNameDisplay from './TeacherNameDisplay'
import { Button as HeroButton } from '@heroui/react'

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
    <div className={`bg-white dark:bg-neutral-900 rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 ${
      selected ? 'border-primary ring-2 ring-primary' : 'border-neutral-200 dark:border-neutral-700'
    }`}>
      {/* Card Header */}
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start justify-between">
          {selectable && (
            <div className="flex items-center ml-3">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelect?.(lesson._id)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpenIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {lesson.category}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${lessonStatus.colorClass}`}>
                {lessonStatus.text}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{lesson.title}</h3>
            {/* Teacher name displayed prominently under the title */}
            <TeacherNameDisplay
              lesson={lesson}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1"
              showIcon={true}
            />
            {lesson.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{lesson.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 mr-2">
            {onView && (
              <HeroButton
                isIconOnly
                color="primary"
                variant="light"
                size="sm"
                onPress={() => onView(lesson)}
                title="צפה בפרטים"
              >
                <EyeIcon className="w-4 h-4" />
              </HeroButton>
            )}
            {onViewAttendance && (
              <HeroButton
                isIconOnly
                color="success"
                variant="light"
                size="sm"
                onPress={() => onViewAttendance(lesson)}
                title="צפה בנוכחות"
              >
                <UserCircleCheckIcon className="w-4 h-4" />
              </HeroButton>
            )}
            {onEdit && (
              <HeroButton
                isIconOnly
                color="default"
                variant="light"
                size="sm"
                onPress={() => onEdit(lesson)}
                title="ערוך שיעור"
              >
                <PencilIcon className="w-4 h-4" />
              </HeroButton>
            )}
            {onDelete && (
              <HeroButton
                isIconOnly
                color="danger"
                variant="light"
                size="sm"
                onPress={() => onDelete(lesson)}
                title="מחק שיעור"
              >
                <TrashIcon className="w-4 h-4" />
              </HeroButton>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <CalendarIcon className="w-4 h-4 ml-2 text-slate-400 dark:text-slate-500" />
            <span className="font-medium text-slate-900 dark:text-white ml-1">תאריך:</span>
            {formattedDate}
          </div>
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <ClockIcon className="w-4 h-4 ml-2 text-slate-400 dark:text-slate-500" />
            <span className="font-medium text-slate-900 dark:text-white ml-1">שעה:</span>
            {formattedTime}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
          <MapPinIcon className="w-4 h-4 ml-2 text-slate-400 dark:text-slate-500" />
          <span className="font-medium text-slate-900 dark:text-white ml-1">מיקום:</span>
          {lesson.location || 'לא צוין'}
        </div>
      </div>
    </div>
  )
}
