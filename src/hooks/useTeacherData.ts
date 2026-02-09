import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface TeacherData {
  _id: string;
  personalInfo?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  professionalInfo?: {
    instrument?: string;
    teachingExperience?: number;
  };
}

interface UseTeacherDataResult {
  teacher: TeacherData | null;
  isLoading: boolean;
  error: Error | null;
  teacherName: string;
}

/**
 * Custom hook to fetch teacher data by ID
 * @param teacherId - The teacher's ID
 * @returns Object containing teacher data, loading state, error, and formatted name
 */
export const useTeacherData = (teacherId: string | undefined): UseTeacherDataResult => {
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teacherId || typeof teacherId !== 'string') {
      setTeacher(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchTeacherData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const teacherData = await apiService.teachers.getTeacher(teacherId);
        setTeacher(teacherData);
      } catch (err) {
        console.error('Error fetching teacher data:', err);
        setError(err as Error);
        setTeacher(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, [teacherId]);

  // Format teacher name with fallback
  const teacherName = teacher?.personalInfo?.fullName ||
                      (teacher?.personalInfo?.firstName && teacher?.personalInfo?.lastName
                        ? `${teacher.personalInfo.firstName} ${teacher.personalInfo.lastName}`
                        : '') ||
                      'מורה לא ידוע';

  return {
    teacher,
    isLoading,
    error,
    teacherName
  };
};

/**
 * Helper function to get teacher name from lesson data
 * This function handles various formats of teacher data in lessons
 */
export const getTeacherNameFromLesson = (lesson: any): string => {
  // If teacherName is already provided and is not an ID
  if (lesson.teacherName && !isMongoId(lesson.teacherName)) {
    return lesson.teacherName;
  }

  // If teacher object is populated with personalInfo
  if (typeof lesson.teacherId === 'object' && lesson.teacherId?.personalInfo) {
    const teacher = lesson.teacherId;
    return teacher.personalInfo.fullName ||
           `${teacher.personalInfo.firstName || ''} ${teacher.personalInfo.lastName || ''}`.trim() ||
           'מורה לא ידוע';
  }

  // If only teacherId is available (as a string), return placeholder
  // The component should use useTeacherData hook to fetch the full data
  return null;
};

/**
 * Helper function to check if a string is likely a MongoDB ObjectId
 */
const isMongoId = (str: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(str);
};

export default useTeacherData;