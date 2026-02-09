/**
 * Class Distribution Chart Component
 * Shows distribution of students across school classes with multiple view options
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../ui/Card';
import { BarChart, DonutChart, ProgressRingChart } from '../../charts/HebrewCharts';
import { enhancedDashboardAnalytics, type ClassDistribution } from '../../../services/enhancedDashboardAnalytics';
import { GraduationCap, BarChart3, PieChart, Grid3X3, Layers } from 'lucide-react';

interface ClassDistributionChartProps {
  schoolYearId?: string;
  className?: string;
  showInactive?: boolean;
}

type ViewType = 'bar' | 'donut' | 'cards' | 'levels';

const ClassDistributionChart: React.FC<ClassDistributionChartProps> = ({
  schoolYearId,
  className = '',
  showInactive = false
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClassDistribution[]>([]);
  const [viewType, setViewType] = useState<ViewType>('bar');

  useEffect(() => {
    loadData();
  }, [schoolYearId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const classes = await enhancedDashboardAnalytics.getClassDistribution(schoolYearId);
      setData(classes);
    } catch (error) {
      console.error('Error loading class distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalActive = data.reduce((sum, c) => sum + c.activeCount, 0);
  const totalInactive = data.reduce((sum, c) => sum + c.inactiveCount, 0);

  // Group by school level
  const levelData = useMemo(() => {
    const primaryClasses = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
    const middleClasses = ['ז', 'ח', 'ט'];
    const highClasses = ['י', 'יא', 'יב'];

    const primary = data.filter(c => primaryClasses.includes(c.className));
    const middle = data.filter(c => middleClasses.includes(c.className));
    const high = data.filter(c => highClasses.includes(c.className));
    const other = data.filter(c => !primaryClasses.includes(c.className) &&
                                   !middleClasses.includes(c.className) &&
                                   !highClasses.includes(c.className));

    return {
      primary: {
        label: 'יסודי (א-ו)',
        count: primary.reduce((sum, c) => sum + c.activeCount, 0),
        classes: primary,
        color: '#3B82F6'
      },
      middle: {
        label: 'חט"ב (ז-ט)',
        count: middle.reduce((sum, c) => sum + c.activeCount, 0),
        classes: middle,
        color: '#10B981'
      },
      high: {
        label: 'תיכון (י-יב)',
        count: high.reduce((sum, c) => sum + c.activeCount, 0),
        classes: high,
        color: '#8B5CF6'
      },
      other: {
        label: 'אחר',
        count: other.reduce((sum, c) => sum + c.activeCount, 0),
        classes: other,
        color: '#6B7280'
      }
    };
  }, [data]);

  // Prepare chart data
  const barChartData = data.map(cls => ({
    label: `כיתה ${cls.className}`,
    value: cls.activeCount,
    color: getClassColor(cls.className)
  }));

  const donutChartData = Object.values(levelData)
    .filter(level => level.count > 0)
    .map(level => ({
      label: level.label,
      value: level.count,
      color: level.color
    }));

  // Get class color based on level
  function getClassColor(className: string): string {
    const primaryClasses = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
    const secondaryClasses = ['ז', 'ח', 'ט'];
    const highSchoolClasses = ['י', 'יא', 'יב'];

    if (primaryClasses.includes(className)) return '#3B82F6';
    if (secondaryClasses.includes(className)) return '#10B981';
    if (highSchoolClasses.includes(className)) return '#8B5CF6';
    return '#6B7280';
  }

  // Find largest class
  const sortedBySize = [...data].sort((a, b) => b.activeCount - a.activeCount);
  const largestClass = sortedBySize[0];

  // Calculate average
  const avgPerClass = data.length > 0 ? Math.round(totalActive / data.length) : 0;

  const viewTabs = [
    { id: 'bar' as const, label: 'עמודות', icon: BarChart3 },
    { id: 'donut' as const, label: 'עוגה', icon: PieChart },
    { id: 'cards' as const, label: 'כרטיסים', icon: Grid3X3 },
    { id: 'levels' as const, label: 'שלבים', icon: Layers },
  ];

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

  return (
    <Card className={`p-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <GraduationCap className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">התפלגות לפי כיתות</h3>
            <p className="text-sm text-gray-600">
              {totalActive} תלמידים פעילים | {data.length} כיתות
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setViewType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewType === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={tab.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalActive}</p>
          <p className="text-xs text-gray-600">תלמידים פעילים</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{avgPerClass}</p>
          <p className="text-xs text-gray-600">ממוצע לכיתה</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-purple-600">
            {largestClass ? `${largestClass.className}` : '-'}
          </p>
          <p className="text-xs text-gray-600">כיתה גדולה ({largestClass?.activeCount || 0})</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-600">{data.length}</p>
          <p className="text-xs text-gray-600">כיתות פעילות</p>
        </div>
      </div>

      {/* Bar Chart View */}
      {viewType === 'bar' && (
        <div>
          {barChartData.length > 0 ? (
            <BarChart
              data={barChartData}
              showValues={true}
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              אין נתונים זמינים
            </div>
          )}
        </div>
      )}

      {/* Donut Chart View */}
      {viewType === 'donut' && (
        <div>
          {donutChartData.length > 0 ? (
            <div className="flex flex-col items-center">
              <DonutChart
                data={donutChartData}
                centerText="שלבים"
                showValues={true}
              />
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              אין נתונים זמינים
            </div>
          )}
        </div>
      )}

      {/* Cards View */}
      {viewType === 'cards' && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {data.map(cls => {
            const percentage = totalActive > 0 ? Math.round((cls.activeCount / totalActive) * 100) : 0;
            return (
              <div
                key={cls.className}
                className="relative p-4 rounded-xl text-center transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
                style={{ backgroundColor: `${getClassColor(cls.className)}15` }}
              >
                <p className="text-lg font-bold text-gray-800">{cls.className}</p>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ color: getClassColor(cls.className) }}
                >
                  {cls.activeCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">{percentage}%</p>

                {/* Mini progress bar */}
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(cls.activeCount / (largestClass?.activeCount || 1)) * 100}%`,
                      backgroundColor: getClassColor(cls.className)
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Levels View */}
      {viewType === 'levels' && (
        <div className="space-y-6">
          {Object.entries(levelData).map(([key, level]) => {
            if (level.count === 0) return null;
            const percentage = totalActive > 0 ? Math.round((level.count / totalActive) * 100) : 0;

            return (
              <div key={key} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="font-semibold text-gray-900">{level.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold" style={{ color: level.color }}>
                      {level.count}
                    </span>
                    <span className="text-sm text-gray-500">({percentage}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: level.color
                    }}
                  />
                </div>

                {/* Class breakdown */}
                <div className="flex flex-wrap gap-2">
                  {level.classes.map(cls => (
                    <div
                      key={cls.className}
                      className="px-3 py-1.5 bg-white rounded-lg shadow-sm flex items-center gap-2"
                    >
                      <span className="font-medium text-gray-700">כיתה {cls.className}</span>
                      <span
                        className="font-bold"
                        style={{ color: level.color }}
                      >
                        {cls.activeCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Visual comparison */}
          <div className="bg-gradient-to-l from-gray-50 to-white rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">השוואה חזותית</h4>
            <div className="flex items-end justify-center gap-4 h-32">
              {Object.entries(levelData).map(([key, level]) => {
                if (level.count === 0) return null;
                const maxCount = Math.max(...Object.values(levelData).map(l => l.count));
                const height = maxCount > 0 ? (level.count / maxCount) * 100 : 0;

                return (
                  <div key={key} className="flex flex-col items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: level.color }}>
                      {level.count}
                    </span>
                    <div
                      className="w-16 rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${height}%`,
                        backgroundColor: level.color,
                        minHeight: '20px'
                      }}
                    />
                    <span className="text-xs text-gray-600 text-center max-w-[64px]">
                      {level.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ClassDistributionChart;
