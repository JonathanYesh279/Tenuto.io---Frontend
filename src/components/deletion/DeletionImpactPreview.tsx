/**
 * Deletion Impact Preview Component
 * 
 * Shows comprehensive preview of deletion impact with visual hierarchy
 * and Hebrew RTL support
 */

import React, { useState } from 'react'
import { 
  AlertTriangle, 
  FileText, 
  Users, 
  Calendar, 
  Music, 
  BookOpen,
  Database,
  Clock,
  ChevronDown,
  ChevronLeft,
  Info,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { DeletionImpact, RelatedRecord } from './types'
import { Card } from '../ui/Card'

interface DeletionImpactPreviewProps {
  impact: DeletionImpact
  isLoading?: boolean
  className?: string
}

const DeletionImpactPreview: React.FC<DeletionImpactPreviewProps> = ({
  impact,
  isLoading = false,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200'
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default: return 'text-blue-700 bg-blue-50 border-blue-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5" />
      case 'high': return <AlertTriangle className="w-5 h-5" />
      case 'medium': return <AlertCircle className="w-5 h-5" />
      default: return <Info className="w-5 h-5" />
    }
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <Calendar className="w-4 h-4" />
      case 'attendance': return <Users className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      case 'orchestra': return <Music className="w-4 h-4" />
      case 'theory_class': return <BookOpen className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const getRecordTypeLabel = (type: string) => {
    const labels = {
      lesson: 'שיעורים',
      attendance: 'נוכחות',
      document: 'מסמכים',
      orchestra: 'תזמורות',
      theory_class: 'שיעורי תיאוריה',
      enrollment: 'רישומים'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getActionLabel = (action: string) => {
    const labels = {
      delete: 'יימחק',
      orphan: 'יוותר ללא קישור',
      reassign: 'יועבר למורה אחר',
      archive: 'יועבר לארכיון'
    }
    return labels[action as keyof typeof labels] || action
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete': return 'text-red-600 bg-red-50'
      case 'orphan': return 'text-yellow-600 bg-yellow-50'
      case 'reassign': return 'text-blue-600 bg-blue-50'
      case 'archive': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} שניות`
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} דקות`
    return `${Math.ceil(seconds / 3600)} שעות`
  }

  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <div className="space-y-4" dir="rtl">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* Main Impact Summary */}
      <Card className="border-r-4 border-r-primary-500">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getSeverityIcon(impact.severity)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                  השפעת המחיקה - {impact.entityName}
                </h3>
                <p className="text-sm text-gray-600 font-reisinger-yonatan">
                  זמן משוער: {formatTime(impact.estimatedTime)}
                </p>
              </div>
            </div>
            <div className={`
              px-3 py-1 rounded-full text-xs font-medium border
              ${getSeverityColor(impact.severity)}
            `}>
              <div className="flex items-center gap-1">
                {getSeverityIcon(impact.severity)}
                <span className="font-reisinger-yonatan">
                  {impact.severity === 'critical' ? 'קריטי' :
                   impact.severity === 'high' ? 'גבוה' :
                   impact.severity === 'medium' ? 'בינוני' : 'נמוך'}
                </span>
              </div>
            </div>
          </div>

          {/* Deletion Status */}
          {!impact.canDelete && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold font-reisinger-yonatan">
                  לא ניתן למחוק כרגע
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-red-600">
                {impact.warnings.map((warning, index) => (
                  <li key={index} className="font-reisinger-yonatan">• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {impact.warnings.length > 0 && impact.canDelete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <div className="flex items-center gap-2 text-yellow-700 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold font-reisinger-yonatan">אזהרות</span>
              </div>
              <ul className="space-y-1 text-sm text-yellow-700">
                {impact.warnings.map((warning, index) => (
                  <li key={index} className="font-reisinger-yonatan">• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Related Records */}
      {impact.relatedRecords.length > 0 && (
        <Card>
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('related')}
              className="flex items-center justify-between w-full text-right"
            >
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-500" />
                <h4 className="text-md font-semibold text-gray-900 font-reisinger-yonatan">
                  רשומות קשורות ({impact.relatedRecords.length})
                </h4>
              </div>
              {expandedSections.has('related') ? 
                <ChevronDown className="w-5 h-5 text-gray-500" /> :
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              }
            </button>

            {expandedSections.has('related') && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {impact.relatedRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      {getRecordTypeIcon(record.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 font-reisinger-yonatan">
                            {getRecordTypeLabel(record.type)}
                          </span>
                          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full font-reisinger-yonatan">
                            {record.count}
                          </span>
                        </div>
                        {record.name && (
                          <p className="text-sm text-gray-600 font-reisinger-yonatan">{record.name}</p>
                        )}
                      </div>
                    </div>
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${getActionColor(record.action)}
                    `}>
                      <span className="font-reisinger-yonatan">{getActionLabel(record.action)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Orphaned References */}
      {impact.orphanedReferences.length > 0 && (
        <Card>
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('orphaned')}
              className="flex items-center justify-between w-full text-right"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <h4 className="text-md font-semibold text-gray-900 font-reisinger-yonatan">
                  הפניות יתומות ({impact.orphanedReferences.length})
                </h4>
              </div>
              {expandedSections.has('orphaned') ? 
                <ChevronDown className="w-5 h-5 text-gray-500" /> :
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              }
            </button>

            {expandedSections.has('orphaned') && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {impact.orphanedReferences.map((orphan, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 font-reisinger-yonatan">
                          {orphan.table}.{orphan.field}
                        </span>
                        <span className="text-sm text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full font-reisinger-yonatan">
                          {orphan.count}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-reisinger-yonatan">
                        {orphan.canCleanup ? 'ניתן לניקוי אוטומטי' : 'דרוש טיפול ידני'}
                      </p>
                    </div>
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${orphan.canCleanup ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}
                    `}>
                      <span className="font-reisinger-yonatan">
                        {orphan.cleanupMethod === 'delete' ? 'מחיקה' :
                         orphan.cleanupMethod === 'nullify' ? 'איפוס' : 'ערך ברירת מחדל'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Time Estimation */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="text-md font-semibold text-blue-900 font-reisinger-yonatan">
              זמן ביצוע משוער
            </h4>
            <p className="text-sm text-blue-700 font-reisinger-yonatan">
              תהליך המחיקה צפוי להימשך כ-{formatTime(impact.estimatedTime)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DeletionImpactPreview