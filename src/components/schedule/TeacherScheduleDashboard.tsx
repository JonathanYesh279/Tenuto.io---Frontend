import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, Users, TrendingUp, Phone, Mail, 
  MapPin, CheckCircle, XCircle, AlertTriangle, BarChart3
} from 'lucide-react';
import { Card } from '../ui/card';
import TeacherScheduleCalendar from './TeacherScheduleCalendar';
import { analyzeTeacherEfficiency, EfficiencyAnalysis } from '../../utils/scheduleConflicts';
import apiService from '../../services/apiService';
import { getDisplayName, getInitials as getNameInitials } from '@/utils/nameUtils';

interface TeacherData {
  _id: string;
  personalInfo: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone: string;
    email: string;
  };
  professionalInfo: {
    instrument: string;
  };
}

interface LessonStats {
  totalLessons: number;
  completedLessons: number;
  cancelledLessons: number;
  upcomingLessons: number;
  totalHours: number;
  totalRevenue: number;
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

interface TeacherScheduleDashboardProps {
  teacherId: string;
  schoolYearId?: string;
}

const TeacherScheduleDashboard: React.FC<TeacherScheduleDashboardProps> = ({
  teacherId,
  schoolYearId
}) => {
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [lessonStats, setLessonStats] = useState<LessonStats | null>(null);
  const [efficiency, setEfficiency] = useState<EfficiencyAnalysis | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'analytics'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [teacherId, schoolYearId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load teacher data
      const teacherData = await apiService.teachers.getTeacher(teacherId);
      setTeacher(teacherData);

      // Load lesson statistics
      const stats = await apiService.teachers.getTeacherLessonStats(teacherId);
      setLessonStats(stats);

      // Load recent lessons for efficiency analysis
      const weeklySchedule = await apiService.teachers.getTeacherWeeklySchedule(teacherId);
      if (weeklySchedule.schedule) {
        const lessons = Object.values(weeklySchedule.schedule).flat();
        const availability = []; // TODO: Get teacher availability
        const efficiencyData = analyzeTeacherEfficiency(lessons as any, availability);
        setEfficiency(efficiencyData);
      }

      // Load upcoming lessons (next 7 days)
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const schedule = await apiService.schedule.getTeacherSchedule(teacherId, startDate, endDate);
      setUpcomingLessons(schedule || []);

      // Load recent attendance
      // TODO: Implement attendance API
      setRecentAttendance([]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      weekday: 'short'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5); // HH:MM format
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתוני לוח המחוונים...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">שגיאה בטעינת נתוני המורה</p>
      </div>
    );
  }

  if (activeTab === 'calendar') {
    return (
      <div>
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'overview', label: 'סקירה כללית' },
              { key: 'calendar', label: 'לוח זמנים' },
              { key: 'analytics', label: 'אנליטיקס' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <TeacherScheduleCalendar
          teacherId={teacherId}
          schoolYearId={schoolYearId}
          onLessonBooked={() => loadDashboardData()}
          onLessonCancelled={() => loadDashboardData()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with teacher info */}
      <Card padding="lg">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-xl">
                {getNameInitials(teacher.personalInfo)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getDisplayName(teacher.personalInfo)}
              </h1>
              <p className="text-gray-600 mb-2">{teacher.professionalInfo.instrument}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {teacher.personalInfo.phone}
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {teacher.personalInfo.email}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'overview', label: 'סקירה כללית' },
              { key: 'calendar', label: 'לוח זמנים' },
              { key: 'analytics', label: 'אנליטיקס' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {activeTab === 'overview' && (
        <>
          {/* Quick Stats */}
          {lessonStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card padding="md">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{lessonStats.totalLessons}</p>
                    <p className="text-sm text-gray-600">סה"כ שיעורים</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg mr-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{lessonStats.completedLessons}</p>
                    <p className="text-sm text-gray-600">שיעורים שהתקיימו</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{lessonStats.upcomingLessons}</p>
                    <p className="text-sm text-gray-600">שיעורים קרובים</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg mr-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(lessonStats.totalHours)}</p>
                    <p className="text-sm text-gray-600">שעות הוראה</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Lessons */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">שיעורים קרובים</h2>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {upcomingLessons.length > 0 ? (
                  upcomingLessons.slice(0, 10).map((lesson, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {lesson.studentName || 'תלמיד לא ידוע'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {lesson.instrument} • {formatTime(lesson.time)} • {lesson.location}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(lesson.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          {lesson.duration} דק'
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    אין שיעורים קרובים
                  </div>
                )}
              </div>
            </Card>

            {/* Efficiency Analysis */}
            {efficiency && (
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">ניתוח יעילות</h2>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-6">
                  {/* Utilization Rate */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">אחוז ניצול זמן</span>
                      <span className="text-sm text-gray-600">{Math.round(efficiency.utilizationRate)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(efficiency.utilizationRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Back-to-back Percentage */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">שיעורים רצופים</span>
                      <span className="text-sm text-gray-600">{Math.round(efficiency.backToBackPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(efficiency.backToBackPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Peak Hours */}
                  {efficiency.peakHours.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 block mb-2">שעות עומס</span>
                      <div className="flex flex-wrap gap-2">
                        {efficiency.peakHours.map(hour => (
                          <span key={hour} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            {hour}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {efficiency.recommendations.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 block mb-2">המלצות</span>
                      <div className="space-y-2">
                        {efficiency.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Recent Attendance (if available) */}
          {recentAttendance.length > 0 && (
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">נוכחות אחרונה</h2>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentAttendance.map((record, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{record.studentName}</span>
                      <div className="flex items-center">
                        {record.status === 'present' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : record.status === 'absent' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(record.date)}
                    </div>
                    {record.notes && (
                      <div className="text-xs text-gray-500 mt-1">
                        {record.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'analytics' && (
        <Card padding="lg">
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אנליטיקס מפורט</h3>
            <p className="text-gray-600">דוחות וגרפים מפורטים יופיעו כאן בקרוב</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TeacherScheduleDashboard;