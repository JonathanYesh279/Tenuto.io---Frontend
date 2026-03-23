
import { CalendarBlankIcon, CalendarIcon, ClockIcon, MapPinIcon, PencilIcon, TrashIcon, UserCircleCheckIcon } from '@phosphor-icons/react'
import {
  DAY_OF_WEEK_NAMES,
  formatLessonDate,
  formatLessonTime,
  type TheoryLesson
} from '../utils/theoryLessonUtils'
import TeacherNameDisplay from './TeacherNameDisplay'
import { Button as HeroButton, Chip } from '@heroui/react'
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card'

interface TheoryLessonCardProps {
  lesson: TheoryLesson
  onView?: (lesson: TheoryLesson) => void
  onEdit?: (lesson: TheoryLesson) => void
  onDelete?: (lesson: TheoryLesson) => void
  onViewAttendance?: (lesson: TheoryLesson) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (lessonId: string) => void
  index?: number
}

const categoryStyle: Record<string, string> = {
  'תלמידים חדשים ב-ד': 'bg-blue-100 text-blue-700 border-blue-200',
  'תלמידים חדשים צעירים': 'bg-sky-100 text-sky-700 border-sky-200',
  'תלמידים חדשים בוגרים (ה - ט)': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'מתחילים': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'מתחילים ב': 'bg-green-100 text-green-700 border-green-200',
  'מתחילים ד': 'bg-teal-100 text-teal-700 border-teal-200',
  'מתקדמים א': 'bg-amber-100 text-amber-700 border-amber-200',
  'מתקדמים ב': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'מתקדמים ג': 'bg-orange-100 text-orange-700 border-orange-200',
  'הכנה לרסיטל קלאסי יא': 'bg-rose-100 text-rose-700 border-rose-200',
  'הכנה לרסיטל רוק\\פופ\\ג\'אז יא': 'bg-red-100 text-red-700 border-red-200',
  'הכנה לרסיטל רוק\\פופ\\ג\'אז יב': 'bg-pink-100 text-pink-700 border-pink-200',
  'מגמה': 'bg-violet-100 text-violet-700 border-violet-200',
  'תאוריה כלי': 'bg-cyan-100 text-cyan-700 border-cyan-200',
}

const defaultCategoryStyle = 'bg-neutral-100 text-neutral-700 border-neutral-200'

export default function TheoryLessonCard({ lesson, onView, onEdit, onDelete, onViewAttendance, selected }: TheoryLessonCardProps) {
  const formattedDate = formatLessonDate(lesson)
  const formattedTime = formatLessonTime(lesson)
  const chipStyle = categoryStyle[lesson.category] || defaultCategoryStyle

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking action buttons
    if ((e.target as HTMLElement).closest('button')) return
    onView?.(lesson)
  }

  return (
    <div className="relative h-full pt-3">
      <span className={`absolute top-0 right-4 z-10 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border ${chipStyle}`}>
        {lesson.category}
      </span>
      <Card
        hover
        className={`h-full flex flex-col rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:-translate-y-0.5 ${
          selected ? 'ring-2 ring-primary border-primary' : ''
        }`}
        onClick={handleCardClick}
      >
        {/* Header: Actions */}
        <CardHeader className="flex-row items-center justify-end gap-2 pb-3 shrink-0">
          <div className="flex items-center gap-0.5 shrink-0">
            {onViewAttendance && (
              <HeroButton isIconOnly color="success" variant="light" size="sm" onPress={() => onViewAttendance(lesson)} title="צפה בנוכחות">
                <UserCircleCheckIcon className="w-4 h-4" />
              </HeroButton>
            )}
            {onEdit && (
              <HeroButton isIconOnly color="default" variant="light" size="sm" onPress={() => onEdit(lesson)} title="ערוך שיעור">
                <PencilIcon className="w-4 h-4" />
              </HeroButton>
            )}
            {onDelete && (
              <HeroButton isIconOnly color="danger" variant="light" size="sm" onPress={() => onDelete(lesson)} title="מחק שיעור">
                <TrashIcon className="w-4 h-4" />
              </HeroButton>
            )}
          </div>
        </CardHeader>

        {/* Body: Teacher + Location */}
        <CardContent className="space-y-2 flex-1">
          <TeacherNameDisplay
            lesson={lesson}
            className="text-sm text-muted-foreground"
            showIcon={true}
          />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="w-4 h-4 shrink-0" />
            <span>{lesson.location || 'לא צוין'}</span>
          </div>
          {lesson.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
          )}
        </CardContent>

        {/* Footer: Day + Date + Time */}
        <CardFooter className="flex-col items-stretch gap-2 pt-3 border-t border-border shrink-0 mt-auto">
          {lesson.dayOfWeek != null && DAY_OF_WEEK_NAMES[lesson.dayOfWeek] && (
            <div className="mb-1">
              <Chip
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<CalendarBlankIcon className="w-3.5 h-3.5" />}
              >
                יום {DAY_OF_WEEK_NAMES[lesson.dayOfWeek]}
              </Chip>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <span className="font-medium text-foreground">תאריך:</span>
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 shrink-0" />
              <span className="font-medium text-foreground">שעה:</span>
              {formattedTime}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
