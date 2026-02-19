import React from 'react';

import { useTeacherData, getTeacherNameFromLesson } from '../hooks/useTeacherData';
import { UserIcon } from '@phosphor-icons/react'

interface TeacherNameDisplayProps {
  lesson: any;
  className?: string;
  showIcon?: boolean;
}

/**
 * Component to display teacher name from lesson data
 * Automatically fetches teacher data if only ID is available
 */
const TeacherNameDisplay: React.FC<TeacherNameDisplayProps> = ({
  lesson,
  className = "text-sm",
  showIcon = true
}) => {
  // First, try to get the teacher name directly from lesson data
  const directName = getTeacherNameFromLesson(lesson);

  // If we don't have a direct name and only have an ID, fetch the teacher data
  const shouldFetchTeacher = !directName && lesson.teacherId && typeof lesson.teacherId === 'string';
  const { teacherName, isLoading } = useTeacherData(shouldFetchTeacher ? lesson.teacherId : undefined);

  // Determine the final name to display
  const displayName = directName || teacherName || 'מורה לא ידוע';

  // Don't show anything if there's no teacher data at all
  if (!lesson.teacherId && !lesson.teacherName) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-gray-600 ${className}`}>
      {showIcon && <UserIcon className="w-4 h-4" />}
      <span className={className}>
        מורה: {isLoading ? (
          <span className="inline-block">
            <span className="inline-block animate-pulse bg-gray-200 rounded h-4 w-24"></span>
          </span>
        ) : (
          displayName
        )}
      </span>
    </div>
  );
};

export default TeacherNameDisplay;