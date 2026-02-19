import React, { useState, useEffect } from 'react';

import { Card } from '../ui/Card';
import TeacherTimeBlocks from './TeacherTimeBlocks';
import apiService from '../../services/apiService';
import { getDisplayName, getInitials as getNameInitials, formatAddress } from '../../utils/nameUtils';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, EnvelopeIcon, GearIcon, MapPinIcon, PhoneIcon, UserIcon, UsersIcon } from '@phosphor-icons/react'

interface Teacher {
  _id: string;
  personalInfo: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone: string;
    email: string;
    address?: string;
  };
  roles: string[];
  professionalInfo: {
    instrument: string;
    isActive: boolean;
  };
  studentCount?: number;
  teaching: {
    timeBlocks: any[];
  };
  conducting: {
    orchestraIds: string[];
  };
  ensemblesIds: string[];
  isActive: boolean;
}

interface TeacherProfileProps {
  teacher: Teacher;
  onBack?: () => void;
}

const TeacherProfile: React.FC<TeacherProfileProps> = ({ teacher, onBack }) => {
  const [timeBlocks, setTimeBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'students'>('overview');

  useEffect(() => {
    loadTimeBlocks();
  }, [teacher._id]);

  const loadTimeBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const blocks = await apiService.teacherSchedule.getTeacherTimeBlocks(teacher._id);
      setTimeBlocks(Array.isArray(blocks) ? blocks : []);
    } catch (error: any) {
      console.error('Error loading time blocks:', error);
      setError('שגיאה בטעינת הזמינות: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setLoading(false);
    }
  };

  const getTeacherStats = () => {
    const activeTimeBlocks = timeBlocks.filter(block => block.isActive);
    const totalHours = activeTimeBlocks.reduce((sum, block) => sum + (block.totalDuration / 60), 0);
    const assignedLessons = activeTimeBlocks.reduce((sum, block) => sum + (block.assignedLessons?.length || 0), 0);
    
    return {
      studentCount: teacher.studentCount || 0,
      orchestraCount: teacher.conducting?.orchestraIds?.length || 0,
      ensembleCount: teacher.ensemblesIds?.length || 0,
      totalTimeBlocks: timeBlocks.length,
      activeTimeBlocks: activeTimeBlocks.length,
      weeklyHours: Math.round(totalHours * 10) / 10,
      assignedLessons
    };
  };

  const stats = getTeacherStats();

  const TeacherBasicInfo = () => (
    <Card padding="lg">
      <div className="flex items-start space-x-6">
        {/* Avatar */}
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold text-2xl">
            {getNameInitials(teacher.personalInfo)}
          </span>
        </div>
        
        {/* Basic Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {getDisplayName(teacher.personalInfo)}
            </h1>
            <div className="flex items-center space-x-2">
              {/* Active Status */}
              <div className={`w-3 h-3 rounded-full ${
                teacher.isActive && teacher.professionalInfo.isActive 
                  ? 'bg-green-400' 
                  : 'bg-gray-300'
              }`} />
              <span className="text-sm text-gray-600">
                {teacher.isActive && teacher.professionalInfo.isActive ? 'פעיל' : 'לא פעיל'}
              </span>
            </div>
          </div>
          
          {/* Professional Info */}
          <div className="space-y-2 mb-4">
            <div className="text-lg text-gray-700">
              <strong>התמחות:</strong> {teacher.professionalInfo.instrument}
            </div>
            <div className="flex flex-wrap gap-2">
              {teacher.roles.map((role, index) => (
                <span 
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    index === 0 
                      ? 'bg-muted text-primary' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <PhoneIcon className="w-4 h-4 mr-2" />
              {teacher.personalInfo.phone}
            </div>
            <div className="flex items-center">
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              {teacher.personalInfo.email}
            </div>
            {teacher.personalInfo.address && (
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {formatAddress(teacher.personalInfo.address)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card padding="md">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.studentCount}</div>
          <div className="text-sm text-gray-600">תלמידים</div>
        </div>
      </Card>
      <Card padding="md">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.weeklyHours}</div>
          <div className="text-sm text-gray-600">שעות בשבוע</div>
        </div>
      </Card>
      <Card padding="md">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.orchestraCount}</div>
          <div className="text-sm text-gray-600">תזמורות</div>
        </div>
      </Card>
      <Card padding="md">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.activeTimeBlocks}</div>
          <div className="text-sm text-gray-600">זמינות פעילה</div>
        </div>
      </Card>
    </div>
  );

  const TabNavigation = () => (
    <Card padding="md">
      <div className="flex space-x-1">
        {[
          { key: 'overview', label: 'סקירה כללית', icon: UserIcon },
          { key: 'schedule', label: 'יום לימוד', icon: CalendarIcon },
          { key: 'students', label: 'תלמידים', icon: UsersIcon }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-muted text-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            חזור
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">פרופיל מורה</h1>
      </div>

      {/* Basic Info */}
      <TeacherBasicInfo />

      {/* Stats */}
      <StatsCards />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">מידע מקצועי</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">תפקידים</h4>
                <div className="space-y-1">
                  {teacher.roles.map((role, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {role}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">פעילות</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>סטטוס כללי: {teacher.isActive ? 'פעיל' : 'לא פעיל'}</div>
                  <div>סטטוס מקצועי: {teacher.professionalInfo.isActive ? 'פעיל' : 'לא פעיל'}</div>
                </div>
              </div>
            </div>
          </Card>

          {stats.weeklyHours > 0 && (
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">סיכום זמינות</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>שעות זמינות בשבוע: <span className="font-medium">{stats.weeklyHours} שעות</span></div>
                <div>בלוקי זמן פעילים: <span className="font-medium">{stats.activeTimeBlocks}</span></div>
                <div>שיעורים מתוכננים: <span className="font-medium">{stats.assignedLessons}</span></div>
                {stats.weeklyHours > 0 && (
                  <div>אחוז ניצול: <span className="font-medium">
                    {Math.round((stats.assignedLessons * 0.75 / stats.weeklyHours) * 100)}%
                  </span></div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div>
          {loading ? (
            <Card padding="lg">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">טוען זמינות...</p>
              </div>
            </Card>
          ) : error ? (
            <Card padding="lg">
              <div className="text-center py-12">
                <div className="text-red-600 text-lg mb-4">❌ {error}</div>
                <button 
                  onClick={loadTimeBlocks}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary"
                >
                  נסה שוב
                </button>
              </div>
            </Card>
          ) : (
            <TeacherTimeBlocks
              teacherId={teacher._id}
              timeBlocks={timeBlocks}
              onUpdate={loadTimeBlocks}
            />
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <Card padding="lg">
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              רשימת תלמידים
            </h3>
            <p className="text-gray-600 mb-4">
              {stats.studentCount > 0 
                ? `המורה מלמד ${stats.studentCount} תלמידים`
                : 'טרם הוקצו תלמידים למורה זה'
              }
            </p>
            {/* TODO: Add student list component */}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TeacherProfile;