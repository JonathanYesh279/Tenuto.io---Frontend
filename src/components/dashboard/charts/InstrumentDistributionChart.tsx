/**
 * Instrument Distribution Chart Component
 * Shows distribution of students across different instruments
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DonutChart, BarChart } from '../../charts/HebrewCharts';
import { enhancedDashboardAnalytics, type InstrumentDistribution } from '../../../services/enhancedDashboardAnalytics';
import { ChartBarIcon, ChartPieIcon, MusicNotesIcon, UsersIcon } from '@phosphor-icons/react'


interface InstrumentDistributionChartProps {
  schoolYearId?: string;
  className?: string;
  maxItems?: number;
  showFamilyGroups?: boolean;
}

const InstrumentDistributionChart: React.FC<InstrumentDistributionChartProps> = ({
  schoolYearId,
  className = '',
  maxItems = 10,
  showFamilyGroups = true
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstrumentDistribution[]>([]);
  const [viewType, setViewType] = useState<'donut' | 'bar'>('donut');
  const [groupByFamily, setGroupByFamily] = useState(false);

  useEffect(() => {
    loadData();
  }, [schoolYearId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const instruments = await enhancedDashboardAnalytics.getInstrumentDistribution(schoolYearId);
      setData(instruments);
    } catch (error) {
      console.error('Error loading instrument distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group by family if enabled
  const displayData = useMemo(() => {
    if (!groupByFamily) {
      return data.slice(0, maxItems);
    }

    const familyGroups: { [family: string]: { count: number; color: string } } = {};

    data.forEach(inst => {
      const family = inst.family || 'אחר';
      if (!familyGroups[family]) {
        familyGroups[family] = { count: 0, color: inst.color };
      }
      familyGroups[family].count += inst.count;
    });

    return Object.entries(familyGroups)
      .map(([family, { count, color }]) => ({
        instrumentName: family,
        count,
        percentage: 0,
        color,
        family
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, groupByFamily, maxItems]);

  // Calculate total
  const total = useMemo(() => {
    return data.reduce((sum, inst) => sum + inst.count, 0);
  }, [data]);

  // Update percentages
  const chartData = useMemo(() => {
    return displayData.map(d => ({
      label: d.instrumentName,
      value: d.count,
      color: d.color
    }));
  }, [displayData]);

  // Get top instrument
  const topInstrument = data[0];

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded">
            <MusicNotesIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">התפלגות כלי נגינה</h3>
            <p className="text-sm text-gray-600">{total} תלמידים | {data.length} כלים</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded p-1">
            <button
              onClick={() => setViewType('donut')}
              className={`p-1.5 rounded-md transition-colors ${
                viewType === 'donut' ? 'bg-white shadow-sm' : ''
              }`}
              title="תצוגת עוגה"
            >
              <ChartPieIcon className={`w-4 h-4 ${viewType === 'donut' ? 'text-gray-900' : 'text-gray-500'}`} />
            </button>
            <button
              onClick={() => setViewType('bar')}
              className={`p-1.5 rounded-md transition-colors ${
                viewType === 'bar' ? 'bg-white shadow-sm' : ''
              }`}
              title="תצוגת עמודות"
            >
              <ChartBarIcon className={`w-4 h-4 ${viewType === 'bar' ? 'text-gray-900' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* Group Toggle */}
          {showFamilyGroups && (
            <button
              onClick={() => setGroupByFamily(!groupByFamily)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                groupByFamily
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {groupByFamily ? 'לפי משפחה' : 'לפי כלי'}
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-600">סה"כ נרשמים</p>
        </div>
        <div className="bg-purple-50 rounded p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{data.length}</p>
          <p className="text-xs text-gray-600">כלי נגינה</p>
        </div>
        <div className="bg-blue-50 rounded p-3 text-center">
          <p className="text-lg font-bold text-blue-600 truncate" title={topInstrument?.instrumentName}>
            {topInstrument?.instrumentName || '-'}
          </p>
          <p className="text-xs text-gray-600">הכי פופולרי</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        viewType === 'donut' ? (
          <DonutChart
            data={chartData}
            centerText={groupByFamily ? 'משפחות' : 'כלים'}
            showValues={true}
          />
        ) : (
          <BarChart
            data={chartData}
            showValues={true}
          />
        )
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MusicNotesIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>אין נתונים זמינים</p>
          </div>
        </div>
      )}

      {/* Family Legend (when not grouped) */}
      {!groupByFamily && data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">לפי משפחת כלים</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(data.map(d => d.family))).map(family => {
              const familyData = data.filter(d => d.family === family);
              const familyTotal = familyData.reduce((sum, d) => sum + d.count, 0);
              const familyColor = familyData[0]?.color || '#6B7280';

              return (
                <div
                  key={family}
                  className="flex items-center gap-2 px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${familyColor}15`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: familyColor }}
                  />
                  <span className="text-gray-700">{family}</span>
                  <span className="font-medium" style={{ color: familyColor }}>
                    {familyTotal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Instruments List (collapsible) */}
      {data.length > maxItems && (
        <details className="mt-4">
          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
            הצג את כל {data.length} הכלים
          </summary>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.map(inst => (
              <div
                key={inst.instrumentName}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: inst.color }}
                  />
                  <span className="text-gray-700 truncate">{inst.instrumentName}</span>
                </div>
                <span className="font-medium text-gray-900">{inst.count}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default InstrumentDistributionChart;
