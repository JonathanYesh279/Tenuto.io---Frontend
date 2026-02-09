/**
 * Bagrut Selectors and Computed Values Hook
 * Provides optimized selectors with memoization and computed values
 */

import { useMemo } from 'react';
import { useBagrutContext, bagrutSelectors } from '../contexts/BagrutContext';
import type { BagrutState } from '../contexts/BagrutContext';

export function useBagrutSelectors() {
  const { state } = useBagrutContext();

  // Basic selectors with memoization
  const currentBagrut = useMemo(() => 
    bagrutSelectors.getCurrentBagrut(state), 
    [state]
  );

  const allBagruts = useMemo(() => {
    const bagruts = bagrutSelectors.getAllBagruts(state);
    console.log('🔍 useBagrutSelectors: allBagruts selector:', bagruts?.length || 0, 'items');
    console.log('🔍 Raw state.bagruts:', state.bagruts?.length || 0, 'items');
    return bagruts;
  }, [state]);

  const loading = useMemo(() => 
    bagrutSelectors.getLoadingState(state), 
    [state]
  );

  const error = useMemo(() => 
    bagrutSelectors.getError(state), 
    [state]
  );

  const validationErrors = useMemo(() => 
    bagrutSelectors.getValidationErrors(state), 
    [state]
  );

  // Enhanced selectors for specific bagrut operations
  const getBagrutById = useMemo(() => 
    (id: string) => bagrutSelectors.getBagrutById(state, id),
    [state]
  );

  const getCompletedPresentations = useMemo(() =>
    (bagrutId: string) => bagrutSelectors.getCompletedPresentations(state, bagrutId),
    [state]
  );

  const getTotalPerformancePoints = useMemo(() =>
    (bagrutId: string) => bagrutSelectors.getTotalPerformancePoints(state, bagrutId),
    [state]
  );

  const getWeightedFinalGrade = useMemo(() =>
    (bagrutId: string) => bagrutSelectors.getWeightedFinalGrade(state, bagrutId),
    [state]
  );

  const getCompletionStatus = useMemo(() =>
    (bagrutId: string) => bagrutSelectors.getCompletionStatus(state, bagrutId),
    [state]
  );

  // Advanced computed selectors
  const bagrutStatistics = useMemo(() => {
    const bagruts = allBagruts;
    const total = bagruts.length;
    const completed = bagruts.filter(b => b.isCompleted).length;
    const inProgress = bagruts.filter(b => !b.isCompleted && b.isActive).length;
    const inactive = bagruts.filter(b => !b.isActive).length;

    const gradeDistribution = bagruts
      .filter(b => b.finalGrade !== undefined)
      .reduce((acc, b) => {
        const grade = b.finalGrade!;
        if (grade >= 95) acc.excellent++;
        else if (grade >= 85) acc.veryGood++;
        else if (grade >= 75) acc.good++;
        else if (grade >= 65) acc.almostGood++;
        else if (grade >= 55) acc.sufficient++;
        else acc.insufficient++;
        return acc;
      }, {
        excellent: 0, // 100-95
        veryGood: 0,  // 94-85
        good: 0,      // 84-75
        almostGood: 0, // 74-65
        sufficient: 0, // 64-55
        insufficient: 0 // 54-0
      });

    return {
      total,
      completed,
      inProgress,
      inactive,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      gradeDistribution,
      averageGrade: bagruts.length > 0 ? 
        Math.round(bagruts
          .filter(b => b.finalGrade !== undefined)
          .reduce((sum, b) => sum + b.finalGrade!, 0) / 
          bagruts.filter(b => b.finalGrade !== undefined).length
        ) || 0 : 0
    };
  }, [allBagruts]);

  // Presentation-specific selectors
  const presentationAnalytics = useMemo(() => {
    const bagruts = allBagruts.filter(b => b.presentations?.length);
    
    const presentationStats = [0, 1, 2, 3].map(index => {
      const completed = bagruts.filter(b => b.presentations?.[index]?.completed).length;
      const total = bagruts.length;
      
      return {
        index,
        name: index < 3 ? `מצגת ${index + 1}` : 'מצגת ביצוע',
        completed,
        total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    const performancePresentations = bagruts
      .filter(b => b.presentations?.[3]?.detailedGrading)
      .map(b => {
        const grading = b.presentations![3].detailedGrading!;
        return {
          bagrutId: b._id,
          studentId: b.studentId,
          playingSkills: grading.playingSkills?.points || 0,
          musicalUnderstanding: grading.musicalUnderstanding?.points || 0,
          textKnowledge: grading.textKnowledge?.points || 0,
          playingByHeart: grading.playingByHeart?.points || 0,
          total: (grading.playingSkills?.points || 0) +
                 (grading.musicalUnderstanding?.points || 0) +
                 (grading.textKnowledge?.points || 0) +
                 (grading.playingByHeart?.points || 0)
        };
      });

    const averagePerformanceScores = performancePresentations.length > 0 ? {
      playingSkills: Math.round(
        performancePresentations.reduce((sum, p) => sum + p.playingSkills, 0) / 
        performancePresentations.length
      ),
      musicalUnderstanding: Math.round(
        performancePresentations.reduce((sum, p) => sum + p.musicalUnderstanding, 0) / 
        performancePresentations.length
      ),
      textKnowledge: Math.round(
        performancePresentations.reduce((sum, p) => sum + p.textKnowledge, 0) / 
        performancePresentations.length
      ),
      playingByHeart: Math.round(
        performancePresentations.reduce((sum, p) => sum + p.playingByHeart, 0) / 
        performancePresentations.length
      ),
      total: Math.round(
        performancePresentations.reduce((sum, p) => sum + p.total, 0) / 
        performancePresentations.length
      )
    } : {
      playingSkills: 0,
      musicalUnderstanding: 0,
      textKnowledge: 0,
      playingByHeart: 0,
      total: 0
    };

    return {
      presentationStats,
      performancePresentations,
      averagePerformanceScores
    };
  }, [allBagruts]);

  // Director evaluation analytics
  const directorEvaluationAnalytics = useMemo(() => {
    const evaluations = allBagruts
      .filter(b => b.directorEvaluation?.points !== undefined)
      .map(b => ({
        bagrutId: b._id,
        studentId: b.studentId,
        points: b.directorEvaluation!.points!,
        hasComments: Boolean(b.directorEvaluation!.comments?.trim())
      }));

    const averageDirectorScore = evaluations.length > 0 ?
      Math.round(evaluations.reduce((sum, e) => sum + e.points, 0) / evaluations.length) : 0;

    const directorScoreDistribution = evaluations.reduce((acc, e) => {
      const score = e.points;
      if (score >= 95) acc.excellent++;
      else if (score >= 85) acc.veryGood++;
      else if (score >= 75) acc.good++;
      else if (score >= 65) acc.almostGood++;
      else if (score >= 55) acc.sufficient++;
      else acc.insufficient++;
      return acc;
    }, {
      excellent: 0,
      veryGood: 0,
      good: 0,
      almostGood: 0,
      sufficient: 0,
      insufficient: 0
    });

    return {
      totalEvaluations: evaluations.length,
      averageScore: averageDirectorScore,
      scoreDistribution: directorScoreDistribution,
      withComments: evaluations.filter(e => e.hasComments).length,
      commentsRate: evaluations.length > 0 ? 
        Math.round((evaluations.filter(e => e.hasComments).length / evaluations.length) * 100) : 0
    };
  }, [allBagruts]);

  // Recital configuration analytics
  const recitalConfigAnalytics = useMemo(() => {
    const configs = allBagruts
      .filter(b => b.recitalConfiguration?.units && b.recitalConfiguration?.field)
      .map(b => ({
        bagrutId: b._id,
        studentId: b.studentId,
        units: b.recitalConfiguration!.units,
        field: b.recitalConfiguration!.field
      }));

    const unitDistribution = configs.reduce((acc, c) => {
      if (c.units === 3) acc.three++;
      else if (c.units === 5) acc.five++;
      return acc;
    }, { three: 0, five: 0 });

    const fieldDistribution = configs.reduce((acc, c) => {
      if (c.field === 'קלאסי') acc.classical++;
      else if (c.field === 'ג\'אז') acc.jazz++;
      else if (c.field === 'שירה') acc.vocal++;
      return acc;
    }, { classical: 0, jazz: 0, vocal: 0 });

    return {
      totalConfigurations: configs.length,
      unitDistribution,
      fieldDistribution,
      configurationRate: allBagruts.length > 0 ? 
        Math.round((configs.length / allBagruts.length) * 100) : 0
    };
  }, [allBagruts]);

  // Grade calculation insights
  const gradeCalculationInsights = useMemo(() => {
    const bagrutsWithGrades = allBagruts.filter(b => 
      b.computedValues?.totalPerformancePoints !== undefined &&
      b.computedValues?.weightedFinalGrade !== undefined &&
      b.directorEvaluation?.points !== undefined
    );

    const insights = bagrutsWithGrades.map(b => {
      const performancePoints = b.computedValues!.totalPerformancePoints;
      const directorPoints = b.directorEvaluation!.points!;
      const finalGrade = b.computedValues!.weightedFinalGrade;
      
      return {
        bagrutId: b._id,
        studentId: b.studentId,
        performancePoints,
        performanceGrade: performancePoints,
        directorPoints,
        directorGrade: directorPoints,
        performanceContribution: finalGrade * 0.9,
        directorContribution: finalGrade * 0.1,
        finalGrade,
        gradeLevel: b.computedValues!.gradeLevel
      };
    });

    const averagePerformanceContribution = insights.length > 0 ?
      Math.round(insights.reduce((sum, i) => sum + i.performanceContribution, 0) / insights.length) : 0;
    
    const averageDirectorContribution = insights.length > 0 ?
      Math.round(insights.reduce((sum, i) => sum + i.directorContribution, 0) / insights.length) : 0;

    return {
      totalCalculatedGrades: insights.length,
      gradeBreakdown: insights,
      averagePerformanceContribution,
      averageDirectorContribution,
      calculationRate: allBagruts.length > 0 ? 
        Math.round((insights.length / allBagruts.length) * 100) : 0
    };
  }, [allBagruts]);

  // Filter helpers
  const filterBagruts = useMemo(() => ({
    byStatus: (status: 'completed' | 'inProgress' | 'inactive') => {
      switch (status) {
        case 'completed': return allBagruts.filter(b => b.isCompleted);
        case 'inProgress': return allBagruts.filter(b => !b.isCompleted && b.isActive);
        case 'inactive': return allBagruts.filter(b => !b.isActive);
        default: return allBagruts;
      }
    },
    
    byGradeRange: (min: number, max: number) =>
      allBagruts.filter(b => 
        b.finalGrade !== undefined && 
        b.finalGrade >= min && 
        b.finalGrade <= max
      ),
    
    byRecitalUnits: (units: 3 | 5) =>
      allBagruts.filter(b => b.recitalConfiguration?.units === units),
    
    byRecitalField: (field: 'קלאסי' | 'ג\'אז' | 'שירה') =>
      allBagruts.filter(b => b.recitalConfiguration?.field === field),
    
    byCompletionPercentage: (minPercentage: number) => {
      return allBagruts.filter(b => {
        if (!b.computedValues?.completionStatus) return false;
        
        const status = b.computedValues.completionStatus;
        const completed = status.presentations.filter(Boolean).length +
                         (status.directorEvaluation ? 1 : 0) +
                         (status.recitalConfig ? 1 : 0) +
                         (status.program ? 1 : 0);
        
        const percentage = (completed / 7) * 100;
        return percentage >= minPercentage;
      });
    },

    needingAttention: () => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      return allBagruts.filter(b => {
        if (b.isCompleted || !b.isActive) return false;
        
        // Check if updated recently
        const lastUpdate = new Date(b.updatedAt);
        const stale = lastUpdate < oneWeekAgo;
        
        // Check completion status
        const status = b.computedValues?.completionStatus;
        const lowCompletion = status ? 
          (status.presentations.filter(Boolean).length +
           (status.directorEvaluation ? 1 : 0) +
           (status.recitalConfig ? 1 : 0) +
           (status.program ? 1 : 0)) < 4 : true;
        
        return stale || lowCompletion;
      });
    }
  }), [allBagruts]);

  return {
    // Basic selectors
    currentBagrut,
    allBagruts,
    loading,
    error,
    validationErrors,
    
    // Functional selectors
    getBagrutById,
    getCompletedPresentations,
    getTotalPerformancePoints,
    getWeightedFinalGrade,
    getCompletionStatus,
    
    // Analytics
    bagrutStatistics,
    presentationAnalytics,
    directorEvaluationAnalytics,
    recitalConfigAnalytics,
    gradeCalculationInsights,
    
    // Filters
    filterBagruts
  };
}