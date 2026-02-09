import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Music, Calendar, TrendingUp, Clock, Award } from 'lucide-react';
import apiService from '../../services/apiService';
import { getDisplayName } from '@/utils/nameUtils';

// Utility functions
const isThisWeek = (date: Date) => {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  return date >= weekStart && date <= weekEnd;
};

const getNextWeek = () => {
  const now = new Date();
  return new Date(now.setDate(now.getDate() + 7));
};

const getLastWeek = () => {
  const now = new Date();
  return new Date(now.setDate(now.getDate() - 7));
};

const formatTime = (time: string) => {
  return time.substring(0, 5); // HH:MM format
};

// Dashboard Metrics Component with Real Data
const DashboardMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    studentCount: 0,
    teacherCount: 0,
    activeRehearsals: 0,
    upcomingTheoryLessons: 0,
    activeBagruts: 0,
    currentSchoolYear: '',
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true, error: null }));

        // Get real counts from all APIs
        const [
          students,
          teachers,
          rehearsals,
          theoryLessons,
          bagruts,
          currentYear
        ] = await Promise.allSettled([
          apiService.students.getStudents({ isActive: true }),
          apiService.teachers.getTeachers({ isActive: true }),
          apiService.rehearsals.getRehearsals(),
          apiService.theory.getTheoryLessons(),
          apiService.bagrut.getBagruts(),
          apiService.schoolYears.getCurrentSchoolYear()
        ]);

        const nextWeek = getNextWeek();

        setMetrics({
          studentCount: students.status === 'fulfilled' ? students.value.length : 0,
          teacherCount: teachers.status === 'fulfilled' ? teachers.value.length : 0,
          activeRehearsals: rehearsals.status === 'fulfilled' ? 
            rehearsals.value.filter((r: any) => 
              r.isActive && isThisWeek(new Date(r.date))
            ).length : 0,
          upcomingTheoryLessons: theoryLessons.status === 'fulfilled' ?
            theoryLessons.value.filter((l: any) => 
              new Date(l.date) > new Date() && new Date(l.date) <= nextWeek
            ).length : 0,
          activeBagruts: bagruts.status === 'fulfilled' ?
            bagruts.value.filter((b: any) => !b.isCompleted).length : 0,
          currentSchoolYear: currentYear.status === 'fulfilled' && currentYear.value ?
            currentYear.value.name : 'לא הוגדר',
          loading: false,
          error: null
        });

        console.log('✅ Dashboard metrics loaded from real API data');

      } catch (error: any) {
        console.error('❌ Failed to load dashboard metrics:', error);
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: 'שגיאה בטעינת נתוני לוח הבקרה'
        }));
      }
    };

    loadMetrics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (metrics.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (metrics.error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-8">
        <p className="text-red-700 text-center">{metrics.error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="תלמידים פעילים"
        value={metrics.studentCount.toString()}
        subtitle={`שנת לימודים: ${metrics.currentSchoolYear}`}
        icon={<Users className="w-6 h-6" />}
        color="blue"
      />
      
      <MetricCard
        title="חברי סגל"
        value={metrics.teacherCount.toString()}
        subtitle="מורים ומדריכים פעילים"
        icon={<GraduationCap className="w-6 h-6" />}
        color="green"
      />
      
      <MetricCard
        title="חזרות השבוע"
        value={metrics.activeRehearsals.toString()}
        subtitle="חזרות מתוכננות"
        icon={<Music className="w-6 h-6" />}
        color="purple"
      />
      
      <MetricCard
        title="שיעורי תאוריה"
        value={metrics.upcomingTheoryLessons.toString()}
        subtitle="השבוע הקרוב"
        icon={<Calendar className="w-6 h-6" />}
        color="orange"
      />
    </div>
  );
};

// Recent Activities with Real Data
const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentActivities = async () => {
      try {
        setLoading(true);
        const recent: any[] = [];
        const lastWeek = getLastWeek();

        // Recent student registrations
        const students = await apiService.students.getStudents();
        const recentStudents = students
          .filter((s: any) => new Date(s.createdAt) > lastWeek)
          .slice(0, 3)
          .map((s: any) => ({
            type: 'student_registration',
            message: `תלמיד/ה חדש/ה: ${getDisplayName(s.personalInfo)}`,
            date: s.createdAt,
            icon: '👤',
            time: new Date(s.createdAt).toLocaleDateString('he-IL')
          }));

        // Recent rehearsals
        const rehearsals = await apiService.rehearsals.getRehearsals();
        const recentRehearsals = rehearsals
          .filter((r: any) => new Date(r.date) > lastWeek)
          .slice(0, 3)
          .map((r: any) => ({
            type: 'rehearsal',
            message: `חזרה נקבעה ב${formatTime(r.startTime)}`,
            date: r.date,
            icon: '🎼',
            time: new Date(r.date).toLocaleDateString('he-IL')
          }));

        // Recent theory lessons
        const theoryLessons = await apiService.theory.getTheoryLessons();
        const recentTheory = theoryLessons
          .filter((t: any) => new Date(t.createdAt || t.date) > lastWeek)
          .slice(0, 2)
          .map((t: any) => ({
            type: 'theory_lesson',
            message: `שיעור תאוריה: ${t.category}`,
            date: t.date,
            icon: '📚',
            time: new Date(t.date).toLocaleDateString('he-IL')
          }));

        // Combine and sort by date
        recent.push(...recentStudents, ...recentRehearsals, ...recentTheory);
        recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setActivities(recent.slice(0, 6)); // Latest 6 activities
        setLoading(false);

      } catch (error) {
        console.error('Failed to load recent activities:', error);
        setLoading(false);
      }
    };

    loadRecentActivities();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">פעילות אחרונה</h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">פעילות אחרונה</h3>
        <span className="text-sm text-gray-500">
          {activities.length} פעילויות אחרונות
        </span>
      </div>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">אין פעילויות אחרונות</p>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="flex items-start">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center ml-3">
                <span>{activity.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Upcoming Events with Real Data
const UpcomingEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      try {
        setLoading(true);
        const upcoming: any[] = [];
        const nextWeek = getNextWeek();
        const now = new Date();

        // Upcoming rehearsals
        const rehearsals = await apiService.rehearsals.getRehearsals();
        rehearsals
          .filter((r: any) => {
            const rehearsalDate = new Date(r.date);
            return rehearsalDate > now && rehearsalDate <= nextWeek && r.isActive;
          })
          .forEach((r: any) => {
            upcoming.push({
              type: 'rehearsal',
              title: `חזרה`,
              date: r.date,
              time: `${formatTime(r.startTime)} - ${formatTime(r.endTime)}`,
              location: r.location,
              icon: '🎵'
            });
          });

        // Upcoming theory lessons
        const theoryLessons = await apiService.theory.getTheoryLessons();
        theoryLessons
          .filter((t: any) => {
            const lessonDate = new Date(t.date);
            return lessonDate > now && lessonDate <= nextWeek && t.isActive;
          })
          .forEach((t: any) => {
            upcoming.push({
              type: 'theory',
              title: `תאוריה - ${t.category}`,
              date: t.date,
              time: `${formatTime(t.startTime)} - ${formatTime(t.endTime)}`,
              location: t.location,
              icon: '📚'
            });
          });

        // Upcoming bagrut presentations
        try {
          const bagruts = await apiService.bagrut.getBagruts();
          bagruts
            .filter((b: any) => {
              if (!b.testDate) return false;
              const testDate = new Date(b.testDate);
              return testDate > now && testDate <= nextWeek && !b.isCompleted;
            })
            .forEach((b: any) => {
              upcoming.push({
                type: 'bagrut',
                title: `בגרות`,
                date: b.testDate,
                time: 'יום שלם',
                location: 'אולם ראשי',
                icon: '🎓'
              });
            });
        } catch (error) {
          console.log('Bagrut service not available');
        }

        // Sort by date
        upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(upcoming.slice(0, 6));
        setLoading(false);

      } catch (error) {
        console.error('Failed to load upcoming events:', error);
        setLoading(false);
      }
    };

    loadUpcomingEvents();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">אירועים קרובים</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">אירועים קרובים</h3>
      </div>
      
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">אין אירועים קרובים</p>
        ) : (
          events.map((event, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <span className="ml-2">{event.icon}</span>
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(event.date).toLocaleDateString('he-IL')}
                </span>
              </div>
              <p className="text-sm text-gray-600">{event.time}</p>
              <p className="text-xs text-gray-500">{event.location}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const RealDataDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">לוח בקרה</h1>
          <p className="text-gray-600">נתונים בזמן אמת מכל מערכות הקונסרבטוריון</p>
        </div>

        {/* Metrics */}
        <DashboardMetrics />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities - 2/3 width */}
          <div className="lg:col-span-2">
            <RecentActivities />
          </div>
          
          {/* Upcoming Events - 1/3 width */}
          <div>
            <UpcomingEvents />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealDataDashboard;