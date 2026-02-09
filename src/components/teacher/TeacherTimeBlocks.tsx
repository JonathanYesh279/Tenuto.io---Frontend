import React, { useState } from 'react';
import { Plus, Clock, Calendar as CalendarIcon, Users, TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';
import TimeBlockCard from './TimeBlockCard';
import TimeBlockForm from './TimeBlockForm';
import apiService from '../../services/apiService';

interface TimeBlock {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  location: string;
  notes?: string;
  isActive: boolean;
  assignedLessons: any[];
  recurring: {
    isRecurring: boolean;
    excludeDates: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface TeacherTimeBlocksProps {
  teacherId: string;
  timeBlocks: TimeBlock[];
  onUpdate: () => void;
}

const TeacherTimeBlocks: React.FC<TeacherTimeBlocksProps> = ({
  teacherId,
  timeBlocks,
  onUpdate
}) => {
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const daysOfWeek = [
    'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
  ];

  const groupBlocksByDay = (blocks: TimeBlock[]) => {
    return daysOfWeek.reduce((acc, day) => {
      acc[day] = blocks
        .filter(block => block.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {} as Record<string, TimeBlock[]>);
  };

  const calculateStats = (blocks: TimeBlock[]) => {
    const activeBlocks = blocks.filter(block => block.isActive);
    const totalMinutes = activeBlocks.reduce((sum, block) => sum + block.totalDuration, 0);
    const totalHours = totalMinutes / 60;
    const assignedLessons = activeBlocks.reduce((sum, block) => sum + (block.assignedLessons?.length || 0), 0);
    const daysWithAvailability = new Set(activeBlocks.map(block => block.day)).size;

    return {
      totalBlocks: blocks.length,
      activeBlocks: activeBlocks.length,
      totalHours: Math.round(totalHours * 10) / 10,
      assignedLessons,
      daysWithAvailability
    };
  };

  const handleDeleteTimeBlock = async (blockId: string) => {
    try {
      setDeletingId(blockId);
      await apiService.teacherSchedule.deleteTimeBlock(teacherId, blockId);
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting time block:', error);
      alert('שגיאה במחיקת הזמינות: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSave = () => {
    onUpdate();
    setIsCreating(false);
    setEditingBlock(null);
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setEditingBlock(null);
  };

  const blocksByDay = groupBlocksByDay(timeBlocks);
  const stats = calculateStats(timeBlocks);

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card padding="lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              יום לימוד - זמינות שבועית
            </h2>
            <p className="text-gray-600">
              ניהול זמינות המורה לשיעורים פרטיים
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            הוסף זמן זמין
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{stats.totalBlocks}</div>
            <div className="text-sm text-primary-700">סה"כ זמינות</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.activeBlocks}</div>
            <div className="text-sm text-green-700">זמינות פעילה</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalHours}</div>
            <div className="text-sm text-blue-700">שעות בשבוע</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.daysWithAvailability}</div>
            <div className="text-sm text-orange-700">ימים זמינים</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.assignedLessons}</div>
            <div className="text-sm text-purple-700">שיעורים קבועים</div>
          </div>
        </div>
      </Card>

      {/* Weekly Schedule */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          לוח זמנים שבועי
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {daysOfWeek.map(day => (
            <div key={day} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">{day}</h4>
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-primary-600 hover:text-primary-800 text-sm"
                  title="הוסף זמינות ליום זה"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {blocksByDay[day].length > 0 ? (
                <div className="space-y-3">
                  {blocksByDay[day].map(block => (
                    <TimeBlockCard
                      key={block._id}
                      block={block}
                      onEdit={() => setEditingBlock(block)}
                      onDelete={() => handleDeleteTimeBlock(block._id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-gray-500 text-sm mb-2">לא זמין</div>
                  <button 
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    onClick={() => setIsCreating(true)}
                  >
                    הוסף זמינות
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Summary */}
      {timeBlocks.length > 0 && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            סיכום שבועי
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">ימים עם זמינות</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(timeBlocks.filter(b => b.isActive).map(b => b.day))).map(day => (
                  <span key={day} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">מיקומים</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(timeBlocks.filter(b => b.isActive).map(b => b.location))).map(location => (
                  <span key={location} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {location}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">סטטיסטיקות</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>זמינות ממוצעת: {(stats.totalHours / Math.max(stats.daysWithAvailability, 1)).toFixed(1)} שעות ליום</div>
                <div>ניצול: {stats.totalHours > 0 ? Math.round((stats.assignedLessons * 0.75 / stats.totalHours) * 100) : 0}%</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* No Time Blocks Message */}
      {timeBlocks.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              טרם הוגדרה זמינות
            </h3>
            <p className="text-gray-600 mb-6">
              כדי להתחיל לקבוע שיעורים, יש להגדיר את הזמינות השבועית של המורה
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              הוסף זמינות ראשונה
            </button>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || editingBlock) && (
        <TimeBlockForm
          teacherId={teacherId}
          timeBlock={editingBlock}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default TeacherTimeBlocks;