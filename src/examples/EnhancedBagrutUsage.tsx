/**
 * Enhanced Bagrut Usage Example
 * Demonstrates the new state management features for Bagrut entities
 */

import React, { useEffect, useState } from 'react';
import { useBagrutActions } from '../hooks/useBagrutActions';
import { useBagrutSelectors } from '../hooks/useBagrutSelectors';
import { BagrutValidationMiddleware } from '../middleware/bagrutValidationMiddleware';
import type { DirectorEvaluationUpdateData, RecitalConfigurationData, DetailedGrading } from '../types/bagrut.types';

export const EnhancedBagrutUsage: React.FC = () => {
  const [selectedBagrutId, setSelectedBagrutId] = useState<string>('');
  
  // Use enhanced actions
  const {
    fetchAllBagruts,
    fetchBagrutById,
    updateDirectorEvaluation,
    setRecitalConfiguration,
    updatePresentation,
    calculateFinalGrade,
    validateBagrutCompletion,
    getValidationSummary,
    clearValidationErrors
  } = useBagrutActions();

  // Use enhanced selectors
  const {
    allBagruts,
    currentBagrut,
    loading,
    error,
    validationErrors,
    bagrutStatistics,
    presentationAnalytics,
    filterBagruts,
    getTotalPerformancePoints,
    getWeightedFinalGrade,
    getCompletionStatus
  } = useBagrutSelectors();

  useEffect(() => {
    // Load all bagruts on component mount
    fetchAllBagruts();
  }, [fetchAllBagruts]);

  // Handle director evaluation update
  const handleDirectorEvaluation = async (points: number, comments?: string) => {
    if (!selectedBagrutId) return;

    const evaluationData: DirectorEvaluationUpdateData = {
      points,
      comments
    };

    // Pre-validate using middleware
    const validation = BagrutValidationMiddleware.validateDirectorEvaluation(evaluationData);
    
    if (!validation.isValid) {
      console.warn('Validation errors:', validation.errors);
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('Validation warnings:', validation.warnings);
    }

    const success = await updateDirectorEvaluation(selectedBagrutId, evaluationData);
    if (success) {
      console.log('Director evaluation updated successfully');
      // Automatically recalculate final grade
      await calculateFinalGrade(selectedBagrutId);
    }
  };

  // Handle recital configuration
  const handleRecitalConfig = async (units: 3 | 5, field: 'קלאסי' | 'ג\'אז' | 'שירה') => {
    if (!selectedBagrutId) return;

    const configData: RecitalConfigurationData = {
      recitalUnits: units,
      recitalField: field
    };

    // Pre-validate using middleware
    const validation = BagrutValidationMiddleware.validateRecitalConfiguration(configData);
    
    if (!validation.isValid) {
      console.warn('Validation errors:', validation.errors);
      return;
    }

    const success = await setRecitalConfiguration(selectedBagrutId, configData);
    if (success) {
      console.log('Recital configuration updated successfully');
    }
  };

  // Handle performance presentation update
  const handlePerformancePresentation = async () => {
    if (!selectedBagrutId) return;

    const detailedGrading: DetailedGrading = {
      playingSkills: { points: 35, maxPoints: 40, comments: 'מעולה' },
      musicalUnderstanding: { points: 28, maxPoints: 30, comments: 'טוב מאוד' },
      textKnowledge: { points: 18, maxPoints: 20, comments: 'טוב' },
      playingByHeart: { points: 9, maxPoints: 10, comments: 'כמעט מושלם' }
    };

    // Pre-validate using middleware
    const validation = BagrutValidationMiddleware.validateDetailedGrading(detailedGrading);
    
    if (!validation.isValid) {
      console.warn('Validation errors:', validation.errors);
      return;
    }

    const presentationData = {
      completed: true,
      status: 'הושלם',
      date: new Date(),
      detailedGrading
    };

    const success = await updatePresentation(selectedBagrutId, 3, presentationData);
    if (success) {
      console.log('Performance presentation updated successfully');
      // Automatically recalculate final grade
      await calculateFinalGrade(selectedBagrutId);
    }
  };

  // Handle validation check
  const handleValidationCheck = () => {
    if (!selectedBagrutId) return;

    const isValid = validateBagrutCompletion(selectedBagrutId);
    const summary = getValidationSummary(selectedBagrutId);
    
    console.log('Bagrut validation result:', isValid);
    console.log('Completion summary:', summary);
  };

  // Get analytics insights
  const analyticsInsights = React.useMemo(() => {
    return {
      totalBagruts: bagrutStatistics.total,
      completionRate: bagrutStatistics.completionRate,
      averageGrade: bagrutStatistics.averageGrade,
      presentationProgress: presentationAnalytics.presentationStats,
      needingAttention: filterBagruts.needingAttention().length
    };
  }, [bagrutStatistics, presentationAnalytics, filterBagruts]);

  if (loading) {
    return <div>טוען...</div>;
  }

  if (error) {
    return <div>שגיאה: {error}</div>;
  }

  return (
    <div className="enhanced-bagrut-usage p-6">
      <h1 className="text-2xl font-bold mb-6">שימוש מתקדם במערכת בגרויות</h1>

      {/* Analytics Dashboard */}
      <div className="analytics-dashboard mb-8">
        <h2 className="text-xl font-semibold mb-4">סטטיסטיקות</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-100 p-4 rounded">
            <h3 className="font-medium">סה"כ בגרויות</h3>
            <p className="text-2xl">{analyticsInsights.totalBagruts}</p>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-medium">אחוז השלמה</h3>
            <p className="text-2xl">{analyticsInsights.completionRate}%</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded">
            <h3 className="font-medium">ממוצע ציונים</h3>
            <p className="text-2xl">{analyticsInsights.averageGrade}</p>
          </div>
          <div className="bg-red-100 p-4 rounded">
            <h3 className="font-medium">דורשות תשומת לב</h3>
            <p className="text-2xl">{analyticsInsights.needingAttention}</p>
          </div>
        </div>
      </div>

      {/* Bagrut Selection */}
      <div className="bagrut-selection mb-6">
        <h2 className="text-xl font-semibold mb-4">בחירת בגרות</h2>
        <select 
          value={selectedBagrutId} 
          onChange={(e) => setSelectedBagrutId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-md"
        >
          <option value="">בחר בגרות...</option>
          {allBagruts.map(bagrut => (
            <option key={bagrut._id} value={bagrut._id}>
              {bagrut.studentId} - {bagrut.isCompleted ? 'הושלם' : 'בתהליך'}
            </option>
          ))}
        </select>

        {selectedBagrutId && (
          <button
            onClick={() => fetchBagrutById(selectedBagrutId)}
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            טען פרטים
          </button>
        )}
      </div>

      {/* Current Bagrut Details */}
      {currentBagrut && (
        <div className="current-bagrut mb-8">
          <h2 className="text-xl font-semibold mb-4">פרטי בגרות נוכחית</h2>
          
          {/* Completion Status */}
          <div className="completion-status mb-4">
            <h3 className="font-medium mb-2">סטטוס השלמה</h3>
            {(() => {
              const status = getCompletionStatus(currentBagrut._id!);
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {status.presentations.map((completed, i) => (
                    <div key={i} className={`p-2 text-center rounded ${completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                      מצגת {i + 1}: {completed ? '✓' : '○'}
                    </div>
                  ))}
                  <div className={`p-2 text-center rounded ${status.directorEvaluation ? 'bg-green-100' : 'bg-gray-100'}`}>
                    הערכת מנהל: {status.directorEvaluation ? '✓' : '○'}
                  </div>
                  <div className={`p-2 text-center rounded ${status.recitalConfig ? 'bg-green-100' : 'bg-gray-100'}`}>
                    תצורת רסיטל: {status.recitalConfig ? '✓' : '○'}
                  </div>
                  <div className={`p-2 text-center rounded ${status.program ? 'bg-green-100' : 'bg-gray-100'}`}>
                    תכנית: {status.program ? '✓' : '○'}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Grade Information */}
          <div className="grade-info mb-4">
            <h3 className="font-medium mb-2">מידע ציונים</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-medium">נקודות ביצוע</h4>
                <p className="text-lg">{getTotalPerformancePoints(currentBagrut._id!)}/100</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <h4 className="font-medium">ציון סופי משוקלל</h4>
                <p className="text-lg">{Math.round(getWeightedFinalGrade(currentBagrut._id!))}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <h4 className="font-medium">רמת ציון</h4>
                <p className="text-sm">{currentBagrut.computedValues?.gradeLevel || 'לא חושב'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons space-x-2 mb-4">
            <button
              onClick={() => handleDirectorEvaluation(95, 'הערכה מעולה')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              הוסף הערכת מנהל (95)
            </button>
            
            <button
              onClick={() => handleRecitalConfig(5, 'קלאסי')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              הגדר רסיטל (5 יחידות קלאסי)
            </button>
            
            <button
              onClick={handlePerformancePresentation}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              עדכן מצגת ביצוע
            </button>
            
            <button
              onClick={handleValidationCheck}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              בדוק תקינות
            </button>
            
            <button
              onClick={clearValidationErrors}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              נקה שגיאות
            </button>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="validation-errors mb-4">
          <h3 className="font-medium text-red-600 mb-2">שגיאות תקינות</h3>
          <div className="bg-red-50 border border-red-200 rounded p-3">
            {Object.entries(validationErrors).map(([field, message]) => (
              <div key={field} className="text-red-700">
                <strong>{field}:</strong> {message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presentation Analytics */}
      <div className="presentation-analytics mb-6">
        <h2 className="text-xl font-semibold mb-4">אנליטיקת מצגות</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {analyticsInsights.presentationProgress.map(stat => (
            <div key={stat.index} className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium">{stat.name}</h3>
              <p className="text-lg">{stat.completed}/{stat.total}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${stat.completionRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{stat.completionRate}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Examples */}
      <div className="filter-examples">
        <h2 className="text-xl font-semibold mb-4">דוגמאות סינון</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-medium">בגרויות מושלמות</h3>
            <p className="text-2xl">{filterBagruts.byStatus('completed').length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-medium">בתהליך</h3>
            <p className="text-2xl">{filterBagruts.byStatus('inProgress').length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <h3 className="font-medium">ציון גבוה (85+)</h3>
            <p className="text-2xl">{filterBagruts.byGradeRange(85, 100).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBagrutUsage;