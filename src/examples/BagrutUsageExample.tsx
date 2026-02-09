/**
 * Example Component: Bagrut Management Usage
 * 
 * This file demonstrates how to use the Bagrut API service and hook
 * in React components. It shows various patterns for CRUD operations,
 * file uploads, and complex data management.
 */

import React, { useEffect, useState } from 'react';
import { useBagrut } from '../hooks/useBagrut';
import { bagrutService } from '../services/bagrutService';
import type { ProgramPiece, Accompanist } from '../types/bagrut.types';

/**
 * Example 1: Basic Bagrut List Component
 */
export const BagrutListExample: React.FC = () => {
  const {
    bagruts,
    loading,
    error,
    pagination,
    fetchAllBagruts
  } = useBagrut();

  useEffect(() => {
    // Fetch bagruts with pagination and filters
    fetchAllBagruts({
      page: 1,
      limit: 10,
      isActive: true,
      sortBy: 'createdAt',
      order: 'desc'
    });
  }, [fetchAllBagruts]);

  if (loading) return <div>טוען...</div>;
  if (error) return <div>שגיאה: {error}</div>;

  return (
    <div>
      <h2>רשימת בגרויות</h2>
      <ul>
        {bagruts.map(bagrut => (
          <li key={bagrut._id}>
            תלמיד: {bagrut.studentId} | 
            מורה: {bagrut.teacherId} |
            סטטוס: {bagrut.isCompleted ? 'הושלם' : 'בתהליך'}
          </li>
        ))}
      </ul>
      {pagination && (
        <div>
          עמוד {pagination.page} מתוך {pagination.pages}
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Bagrut Details with Presentations
 */
export const BagrutDetailsExample: React.FC<{ bagrutId: string }> = ({ bagrutId }) => {
  const {
    bagrut,
    loading,
    error,
    fetchBagrutById,
    updatePresentation
  } = useBagrut();

  useEffect(() => {
    fetchBagrutById(bagrutId);
  }, [bagrutId, fetchBagrutById]);

  const handlePresentationUpdate = async (index: number) => {
    const success = await updatePresentation(bagrutId, index, {
      topic: 'נושא מעודכן',
      grade: 95,
      isCompleted: true,
      presentationDate: new Date()
    });

    if (success) {
      alert('המצגת עודכנה בהצלחה!');
    }
  };

  if (loading) return <div>טוען פרטי בגרות...</div>;
  if (error) return <div>שגיאה: {error}</div>;
  if (!bagrut) return null;

  return (
    <div>
      <h2>פרטי בגרות</h2>
      <h3>מצגות:</h3>
      {bagrut.presentations.map((presentation, index) => (
        <div key={index}>
          <h4>מצגת {presentation.presentationNumber}</h4>
          <p>נושא: {presentation.topic}</p>
          <p>ציון: {presentation.grade || 'טרם נקבע'}</p>
          <button onClick={() => handlePresentationUpdate(index)}>
            עדכן מצגת
          </button>
        </div>
      ))}
    </div>
  );
};

/**
 * Example 3: Document Upload
 */
export const DocumentUploadExample: React.FC<{ bagrutId: string }> = ({ bagrutId }) => {
  const { uploadDocument, loading, error } = useBagrut();
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const success = await uploadDocument(
      bagrutId,
      file,
      'תעודה',
      'תעודת בגרות מוזיקלית'
    );

    if (success) {
      alert('המסמך הועלה בהצלחה!');
      setFile(null);
    }
  };

  return (
    <div>
      <h3>העלאת מסמך</h3>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept=".pdf,.jpg,.png,.doc,.docx"
      />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? 'מעלה...' : 'העלה מסמך'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

/**
 * Example 4: Program Management
 */
export const ProgramManagementExample: React.FC<{ bagrutId: string }> = ({ bagrutId }) => {
  const {
    bagrut,
    addProgramPiece,
    removeProgramPiece,
    loading,
    error
  } = useBagrut();

  const handleAddPiece = async () => {
    const newPiece: Omit<ProgramPiece, '_id'> = {
      pieceNumber: (bagrut?.program.length || 0) + 1,
      composerName: 'באך',
      pieceName: 'פרלוד ופוגה',
      duration: '05:30',
      period: 'בארוק',
      notes: 'יצירת חובה'
    };

    const success = await addProgramPiece(bagrutId, newPiece);
    if (success) {
      alert('היצירה נוספה בהצלחה!');
    }
  };

  const handleRemovePiece = async (pieceId: string) => {
    const success = await removeProgramPiece(bagrutId, pieceId);
    if (success) {
      alert('היצירה הוסרה בהצלחה!');
    }
  };

  return (
    <div>
      <h3>ניהול תכנית</h3>
      <button onClick={handleAddPiece} disabled={loading}>
        הוסף יצירה
      </button>
      
      <ul>
        {bagrut?.program.map(piece => (
          <li key={piece._id}>
            {piece.pieceNumber}. {piece.composerName} - {piece.pieceName}
            <button onClick={() => handleRemovePiece(piece._id!)} disabled={loading}>
              הסר
            </button>
          </li>
        ))}
      </ul>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

/**
 * Example 5: Grading and Completion
 */
export const GradingExample: React.FC<{ bagrutId: string }> = ({ bagrutId }) => {
  const {
    bagrut,
    updateGradingDetails,
    calculateFinalGrade,
    completeBagrut,
    loading,
    error
  } = useBagrut();

  const handleUpdateGrades = async () => {
    const success = await updateGradingDetails(bagrutId, {
      performanceGrade: 92,
      presentationsAverage: 88,
      magenBagrutGrade: 95,
      teacherEvaluation: 90,
      juryGrade: 91,
      notes: 'ביצוע מצוין'
    });

    if (success) {
      // Calculate final grade after updating
      await calculateFinalGrade(bagrutId);
    }
  };

  const handleComplete = async () => {
    const signature = prompt('הכנס חתימה דיגיטלית:');
    if (!signature) return;

    const success = await completeBagrut(bagrutId, signature);
    if (success) {
      alert('הבגרות הושלמה בהצלחה!');
    }
  };

  return (
    <div>
      <h3>ציונים והשלמה</h3>
      
      <div>
        <h4>פרטי ציונים:</h4>
        <p>ביצוע: {bagrut?.gradingDetails.performanceGrade || 'טרם נקבע'}</p>
        <p>מצגות: {bagrut?.gradingDetails.presentationsAverage || 'טרם נקבע'}</p>
        <p>מגן בגרות: {bagrut?.gradingDetails.magenBagrutGrade || 'טרם נקבע'}</p>
        <p>ציון סופי: {bagrut?.finalGrade || 'טרם חושב'}</p>
      </div>

      <button onClick={handleUpdateGrades} disabled={loading}>
        עדכן ציונים
      </button>

      <button 
        onClick={handleComplete} 
        disabled={loading || bagrut?.isCompleted}
      >
        {bagrut?.isCompleted ? 'הושלם' : 'השלם בגרות'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

/**
 * Example 6: Direct Service Usage (without hook)
 */
export const DirectServiceExample: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleDirectServiceCall = async () => {
    setLoading(true);
    try {
      // Direct service call example
      const response = await bagrutService.getAllBagruts({
        page: 1,
        limit: 5,
        isCompleted: false
      });

      if (response.success) {
        console.log('Active bagruts:', response.data);
      }

      // Check admin permissions
      const isAdmin = await bagrutService.checkAdminPermissions();
      console.log('User is admin:', isAdmin);

      // Clear cache when needed
      bagrutService.clearCache();

    } catch (error) {
      console.error('Service error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>שימוש ישיר בשירות</h3>
      <button onClick={handleDirectServiceCall} disabled={loading}>
        {loading ? 'מבצע...' : 'קרא לשירות'}
      </button>
    </div>
  );
};

/**
 * Example 7: Batch Operations
 */
export const BatchOperationsExample: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleBatchUpdate = async () => {
    setLoading(true);
    try {
      const updates = [
        { id: 'bagrut1', data: { notes: 'עודכן באצווה' } },
        { id: 'bagrut2', data: { isActive: false } },
        { id: 'bagrut3', data: { conservatoryName: 'קונסרבטוריון תל אביב' } }
      ];

      const result = await bagrutService.batchUpdateBagruts(updates);
      
      console.log('Batch update results:', result);
      
      const successCount = result.results.filter(r => r.success).length;
      alert(`עודכנו ${successCount} מתוך ${updates.length} בגרויות`);

    } catch (error) {
      console.error('Batch update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>עדכון באצווה</h3>
      <button onClick={handleBatchUpdate} disabled={loading}>
        {loading ? 'מעדכן...' : 'עדכן מספר בגרויות'}
      </button>
    </div>
  );
};