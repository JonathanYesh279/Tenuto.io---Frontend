import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TeacherProfile from '../components/teacher/TeacherProfile';
import apiService from '../services/apiService';
import { useSchoolYear } from '../services/schoolYearContext';

const TeacherManagement: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { currentSchoolYear } = useSchoolYear();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacherId) {
      loadTeacher();
    }
  }, [teacherId]);

  const loadTeacher = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!teacherId) {
        throw new Error('מזהה המורה לא נמצא');
      }

      const teacherData = await apiService.teachers.getTeacher(teacherId);
      setTeacher(teacherData);
    } catch (err: any) {
      console.error('Error loading teacher:', err);
      setError(err.message || 'שגיאה בטעינת נתוני המורה');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/teachers');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרופיל המורה...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">❌ {error}</div>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            חזור לרשימת מורים
          </button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-4">מורה לא נמצא</div>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            חזור לרשימת מורים
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherProfile teacher={teacher} onBack={handleBack} />
      </div>
    </div>
  );
};

export default TeacherManagement;