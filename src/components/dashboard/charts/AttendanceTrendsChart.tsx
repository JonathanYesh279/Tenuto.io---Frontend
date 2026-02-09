/**
 * Attendance Trends Chart Component
 * Shows attendance trends over time with multiple activity type breakdowns
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { LineChart } from '../../charts/HebrewCharts';
import { enhancedDashboardAnalytics, type AttendanceTrendData } from '../../../services/enhancedDashboardAnalytics';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AttendanceTrendsChartProps {
  schoolYearId?: string;
  weeks?: number;
  className?: string;
  compact?: boolean;
}

const AttendanceTrendsChart: React.FC<AttendanceTrendsChartProps> = ({
  schoolYearId,
  weeks = 12,
  className = '',
  compact = false
}) => {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<AttendanceTrendData[]>([]);
  const [selectedType, setSelectedType] = useState<'overall' | 'orchestraRehearsals' | 'theoryLessons'>('overall');

  useEffect(() => {
    loadData();
  }, [schoolYearId, weeks]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await enhancedDashboardAnalytics.getAttendanceTrends(weeks, schoolYearId);
      setTrends(data);
    } catch (error) {
      console.error('Error loading attendance trends:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate trend statistics
  const getTrendStats = () => {
    if (trends.length < 2) return { direction: 'neutral' as const, change: 0, average: 0 };

    const values = trends.map(t => t[selectedType] || 0);
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const earlierAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const change = Math.round(recentAvg - earlierAvg);

    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    if (change > 3) direction = 'up';
    else if (change < -3) direction = 'down';

    return { direction, change, average };
  };

  const stats = getTrendStats();

  // Prepare chart data
  const chartData = trends.map(t => ({
    label: t.weekLabel.split(' - ')[0],
    value: t[selectedType] || 0
  }));

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'overall': return 'נוכחות כללית';
      case 'orchestraRehearsals': return 'חזרות תזמורת';
      case 'theoryLessons': return 'שיעורי תאוריה';
      case 'privateLessons': return 'שיעורים פרטיים';
      default: return type;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'overall': return '#3B82F6';
      case 'orchestraRehearsals': return '#10B981';
      case 'theoryLessons': return '#8B5CF6';
      case 'privateLessons': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={`p-4 ${className}`} dir="rtl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">מגמת נוכחות</h4>
          <div className="flex items-center gap-1">
            {stats.direction === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {stats.direction === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
            {stats.direction === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
            <span className={`text-sm font-medium ${
              stats.direction === 'up' ? 'text-green-600' :
              stats.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stats.change > 0 ? '+' : ''}{stats.change}%
            </span>
          </div>
        </div>

        <div className="h-24">
          <LineChart
            data={chartData.slice(-6)}
            color={getTypeColor(selectedType)}
            showDots={false}
          />
        </div>

        <div className="mt-2 text-center">
          <span className="text-2xl font-bold text-gray-900">{stats.average}%</span>
          <span className="text-sm text-gray-600 mr-2">ממוצע</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">מגמות נוכחות</h3>
            <p className="text-sm text-gray-600">{weeks} שבועות אחרונים</p>
          </div>
        </div>

        {/* Type Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['overall', 'orchestraRehearsals', 'theoryLessons'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedType === type
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.average}%</p>
          <p className="text-xs text-gray-600">ממוצע התקופה</p>
        </div>

        <div className={`rounded-lg p-3 text-center ${
          stats.direction === 'up' ? 'bg-green-50' :
          stats.direction === 'down' ? 'bg-red-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-center gap-1">
            {stats.direction === 'up' && <ArrowUpRight className="w-5 h-5 text-green-600" />}
            {stats.direction === 'down' && <ArrowDownRight className="w-5 h-5 text-red-600" />}
            <span className={`text-2xl font-bold ${
              stats.direction === 'up' ? 'text-green-600' :
              stats.direction === 'down' ? 'text-red-600' : 'text-gray-900'
            }`}>
              {stats.change > 0 ? '+' : ''}{stats.change}%
            </span>
          </div>
          <p className="text-xs text-gray-600">שינוי מתחילת התקופה</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {chartData.length > 0 ? chartData[chartData.length - 1].value : 0}%
          </p>
          <p className="text-xs text-gray-600">השבוע האחרון</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="mb-6">
        {chartData.length > 0 ? (
          <LineChart
            data={chartData}
            color={getTypeColor(selectedType)}
            showDots={true}
            trend={stats.direction}
          />
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            אין נתונים זמינים
          </div>
        )}
      </div>

      {/* Weekly Breakdown */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">פירוט שבועי</h4>
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {trends.slice(-8).map((week, index) => {
              const value = week[selectedType] || 0;
              const prevValue = index > 0 ? (trends.slice(-8)[index - 1]?.[selectedType] || 0) : value;
              const isUp = value > prevValue;
              const isDown = value < prevValue;

              return (
                <div
                  key={week.weekStartDate}
                  className="flex-shrink-0 w-24 p-2 bg-gray-50 rounded-lg text-center"
                >
                  <p className="text-xs text-gray-600 truncate">{week.weekLabel.split(' - ')[0]}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className={`text-lg font-semibold ${
                      value >= 80 ? 'text-green-600' :
                      value >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {value}%
                    </span>
                    {isUp && <TrendingUp className="w-3 h-3 text-green-500" />}
                    {isDown && <TrendingDown className="w-3 h-3 text-red-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Type Comparison */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">השוואת סוגי פעילות</h4>
        <div className="space-y-2">
          {(['orchestraRehearsals', 'theoryLessons'] as const).map(type => {
            const typeAvg = trends.length > 0
              ? Math.round(trends.reduce((sum, t) => sum + (t[type] || 0), 0) / trends.length)
              : 0;

            return (
              <div key={type} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getTypeColor(type) }}
                />
                <span className="text-sm text-gray-600 flex-1">{getTypeLabel(type)}</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${typeAvg}%`,
                      backgroundColor: getTypeColor(type)
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-10 text-left">{typeAvg}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default AttendanceTrendsChart;
