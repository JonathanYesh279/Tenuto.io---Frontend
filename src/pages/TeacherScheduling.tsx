import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Smartphone } from 'lucide-react';
import TeacherScheduleDashboard from '../components/schedule/TeacherScheduleDashboard';
import MobileScheduleInterface from '../components/schedule/MobileScheduleInterface';
import { useSchoolYear } from '../services/schoolYearContext';
import apiService from '../services/apiService';

const TeacherScheduling: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { currentSchoolYear } = useSchoolYear();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          <p className="text-gray-600">טוען מערכת לוח הזמנים...</p>
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

  // Use mobile interface on mobile devices
  if (isMobile) {
    return (
      <MobileScheduleInterface
        teacherId={teacherId!}
        schoolYearId={currentSchoolYear?._id}
      />
    );
  }

  // Desktop interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                מערכת לוח זמנים חכמה
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Monitor className="w-4 h-4" />
              <span>תצוגת שולחן עבודה</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherScheduleDashboard
          teacherId={teacherId!}
          schoolYearId={currentSchoolYear?._id}
        />
      </div>
    </div>
  );
};

export default TeacherScheduling;