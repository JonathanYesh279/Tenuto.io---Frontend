/**
 * Bagrut Progress Dashboard Component
 * Shows comprehensive bagrut (graduation exam) progress statistics
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { DonutChart, BarChart, ProgressRingChart } from '../../charts/HebrewCharts';
import { enhancedDashboardAnalytics, type BagrutProgressData } from '../../../services/enhancedDashboardAnalytics';
import { Award, CheckCircle, Clock, AlertCircle, Calendar, User, TrendingUp } from 'lucide-react';

interface BagrutProgressDashboardProps {
  schoolYearId?: string;
  className?: string;
}

const BagrutProgressDashboard: React.FC<BagrutProgressDashboardProps> = ({
  schoolYearId,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BagrutProgressData | null>(null);

  useEffect(() => {
    loadData();
  }, [schoolYearId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const bagrutData = await enhancedDashboardAnalytics.getBagrutProgress(schoolYearId);
      setData(bagrutData);
    } catch (error) {
      console.error('Error loading bagrut progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={`p-6 ${className}`} dir="rtl">
        <div className="text-center py-8 text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>אין נתוני בגרויות זמינים</p>
        </div>
      </Card>
    );
  }

  // Prepare status chart data
  const statusChartData = [
    { label: 'הושלם', value: data.completedCount, color: '#10B981' },
    { label: 'בתהליך', value: data.inProgressCount, color: '#F59E0B' },
    { label: 'טרם התחיל', value: data.notStartedCount, color: '#6B7280' }
  ].filter(d => d.value > 0);

  // Prepare presentation progress data
  const presentationData = [
    {
      key: 'presentation1',
      label: 'הצגה 1',
      completed: data.presentations.presentation1.completed,
      passed: data.presentations.presentation1.passed,
      total: data.presentations.presentation1.total
    },
    {
      key: 'presentation2',
      label: 'הצגה 2',
      completed: data.presentations.presentation2.completed,
      passed: data.presentations.presentation2.passed,
      total: data.presentations.presentation2.total
    },
    {
      key: 'presentation3',
      label: 'הצגה 3',
      completed: data.presentations.presentation3.completed,
      passed: data.presentations.presentation3.passed,
      total: data.presentations.presentation3.total
    },
    {
      key: 'presentation4',
      label: 'מגן בגרות',
      completed: data.presentations.presentation4.completed,
      passed: data.presentations.presentation4.passed,
      total: data.presentations.presentation4.total
    }
  ];

  // Grade distribution chart data
  const gradeChartData = data.gradeDistribution.map(g => ({
    label: g.range,
    value: g.count,
    color: g.color
  }));

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Award className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">מעקב בגרויות</h3>
              <p className="text-sm text-gray-600">{data.totalStudents} תלמידים רשומים</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-1 justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{data.completedCount}</span>
              </div>
              <p className="text-xs text-gray-600">הושלמו</p>
            </div>
            <div className="text-center px-4 py-2 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-1 justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-2xl font-bold text-amber-600">{data.inProgressCount}</span>
              </div>
              <p className="text-xs text-gray-600">בתהליך</p>
            </div>
            <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1 justify-center">
                <AlertCircle className="w-4 h-4 text-gray-500" />
                <span className="text-2xl font-bold text-gray-600">{data.notStartedCount}</span>
              </div>
              <p className="text-xs text-gray-600">טרם התחילו</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate Ring */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">שיעור השלמה כולל</h4>

          <div className="flex items-center justify-center">
            <ProgressRingChart
              value={data.completionRate}
              max={100}
              size={200}
              strokeWidth={16}
              color={
                data.completionRate >= 70 ? '#10B981' :
                data.completionRate >= 40 ? '#F59E0B' : '#EF4444'
              }
              label="השלמת בגרויות"
              subtitle={`${data.completedCount} מתוך ${data.totalStudents}`}
            />
          </div>

          {/* Status Breakdown */}
          <div className="mt-6">
            {statusChartData.length > 0 && (
              <DonutChart
                data={statusChartData}
                centerText="סטטוס"
                showValues={true}
              />
            )}
          </div>
        </Card>

        {/* Presentation Progress */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">התקדמות לפי הצגות</h4>

          <div className="space-y-4">
            {presentationData.map((pres, index) => {
              const completionRate = pres.total > 0
                ? Math.round((pres.completed / pres.total) * 100)
                : 0;
              const passRate = pres.completed > 0
                ? Math.round((pres.passed / pres.completed) * 100)
                : 0;

              return (
                <div key={pres.key} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        completionRate === 100 ? 'bg-green-500' :
                        completionRate > 0 ? 'bg-amber-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{pres.label}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {pres.completed}/{pres.total} הושלמו
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-green-500 to-green-400 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-600">
                      {completionRate}% הושלמו
                    </span>
                    {pres.completed > 0 && (
                      <span className={passRate >= 80 ? 'text-green-600' : 'text-amber-600'}>
                        {passRate}% עברו
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Grade Distribution */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">התפלגות ציונים</h4>

          {gradeChartData.some(d => d.value > 0) ? (
            <>
              <BarChart
                data={gradeChartData}
                showValues={true}
              />

              {/* Average Grade */}
              <div className="mt-6 p-4 bg-gradient-to-l from-amber-50 to-amber-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    <span className="text-gray-700">ציון ממוצע</span>
                  </div>
                  <span className="text-3xl font-bold text-amber-600">
                    {data.averageGrade || '-'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>אין ציונים זמינים</p>
              </div>
            </div>
          )}
        </Card>

        {/* Upcoming Exams */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">בחינות קרובות</h4>
            <span className="text-sm text-gray-600">
              {data.upcomingExams.length} בחינות
            </span>
          </div>

          {data.upcomingExams.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingExams.map((exam, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{exam.studentName}</p>
                    <p className="text-sm text-gray-600">{exam.teacherName}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-600">{exam.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>אין בחינות מתוכננות</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                צפה בכל הבגרויות
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                ייצא דוח
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Footer */}
      <Card className="p-4 bg-gradient-to-l from-amber-50 to-white">
        <div className="flex flex-wrap items-center justify-center gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-amber-600">{data.totalStudents}</p>
            <p className="text-sm text-gray-600">סה"כ תלמידים</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div>
            <p className="text-3xl font-bold text-green-600">{data.completionRate}%</p>
            <p className="text-sm text-gray-600">שיעור השלמה</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div>
            <p className="text-3xl font-bold text-blue-600">{data.averageGrade || '-'}</p>
            <p className="text-sm text-gray-600">ציון ממוצע</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div>
            <p className="text-3xl font-bold text-purple-600">{data.upcomingExams.length}</p>
            <p className="text-sm text-gray-600">בחינות קרובות</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BagrutProgressDashboard;
