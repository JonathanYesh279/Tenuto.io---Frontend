/**
 * Documents Tab Component
 * 
 * Displays student documents with upload, download, and management capabilities.
 */

import { useState, useCallback, useRef } from 'react'
import { FileText, Download, Upload, Eye, Trash2, Calendar, Filter, Search, Folder, Archive, Scan, FileImage, FileAudio, FileVideo, FilePlus, X, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'
import { StudentDetails, Document } from '../../types'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

interface DocumentsTabProps {
  student: StudentDetails
  studentId: string
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ student, studentId }) => {
  const { documents } = student
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPreview, setShowPreview] = useState<Document | null>(null)
  const [isProcessingOCR, setIsProcessingOCR] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // File upload with drag and drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        // Mock upload functionality - would integrate with actual API
        toast.success(`הקובץ ${file.name} הועלה בהצלחה`)
        
        // If it's an image, offer OCR processing
        if (file.type.startsWith('image/')) {
          const shouldProcessOCR = confirm(`האם להפעיל OCR על הקובץ ${file.name}?`)
          if (shouldProcessOCR) {
            await processOCR(file.name)
          }
        }
      } catch (error) {
        toast.error(`שגיאה בהעלאת הקובץ ${file.name}`)
      }
    }
    setShowUploadModal(false)
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })
  
  // OCR Processing
  const processOCR = async (filename: string) => {
    setIsProcessingOCR(prev => [...prev, filename])
    try {
      // Mock OCR processing - would integrate with actual OCR API
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast.success(`OCR הושלם על ${filename} - טקסט חולץ בהצלחה`)
    } catch (error) {
      toast.error(`שגיאה בעיבוד OCR על ${filename}`)
    } finally {
      setIsProcessingOCR(prev => prev.filter(name => name !== filename))
    }
  }
  
  // Filter and search documents
  const filteredDocuments = documents?.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  }) || []

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      registration: 'רישום',
      medical: 'רפואי',
      performance: 'הופעות',
      assessment: 'הערכות',
      other: 'אחר'
    }
    return labels[category as keyof typeof labels] || category
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      registration: 'bg-blue-100 text-blue-800',
      medical: 'bg-red-100 text-red-800',
      performance: 'bg-purple-100 text-purple-800',
      assessment: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('audio')) return '🎵'
    if (mimeType.includes('video')) return '🎥'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    return '📄'
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">מסמכים</h2>
        <p className="text-gray-600 mt-1">ניהול קבצים ומסמכים של התלמיד</p>
      </div>
      
      {/* Controls */}
      <div className="bg-white rounded p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חפש מסמכים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">כל הקטגוריות</option>
                <option value="registration">רישום</option>
                <option value="medical">רפואי</option>
                <option value="performance">הופעות</option>
                <option value="assessment">הערכות</option>
                <option value="other">אחר</option>
              </select>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                רשימה
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                רשת
              </button>
            </div>
            
            {/* Bulk Actions */}
            {selectedDocuments.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedDocuments.length} נבחרו</span>
                <button className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                  <Trash2 className="w-3 h-3" />
                  מחק
                </button>
                <button className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                  <Archive className="w-3 h-3" />
                  ארכיב
                </button>
              </div>
            )}
            
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              העלה מסמך
            </button>
          </div>
        </div>
        
        {/* Document Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{documents?.length || 0}</div>
            <div className="text-xs text-gray-600">סה"כ מסמכים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{documents?.filter(d => d.mimeType.includes('image')).length || 0}</div>
            <div className="text-xs text-gray-600">תמונות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{documents?.filter(d => d.mimeType.includes('pdf')).length || 0}</div>
            <div className="text-xs text-gray-600">PDF</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{documents?.filter(d => d.mimeType.includes('audio')).length || 0}</div>
            <div className="text-xs text-gray-600">קבצי שמע</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((documents?.reduce((acc, doc) => acc + doc.size, 0) || 0) / 1024 / 1024)}MB
            </div>
            <div className="text-xs text-gray-600">נפח כולל</div>
          </div>
        </div>
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">העלאת מסמכים</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div {...getRootProps()} className={`border-2 border-dashed rounded p-8 text-center transition-colors ${
              isDragActive ? 'border-border bg-muted/50' : 'border-gray-300 hover:border-border'
            }`}>
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'שחרר קבצים כאן' : 'גרור קבצים לכאן או לחץ לבחירה'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                נתמכים: PDF, Word, תמונות, קבצי שמע ווידאו (עד 10MB)
              </p>
              
              {/* Quick Upload Categories */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <FileText className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-600">תעודות רשמיות</div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <FileImage className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-600">תמונות</div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <FileAudio className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-600">הקלטות</div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <FileVideo className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-600">סרטונים</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredDocuments && filteredDocuments.length > 0 ? (
        <div className="space-y-4">
          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>מציג {filteredDocuments.length} מתוך {documents?.length || 0} מסמכים</span>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                <Archive className="w-3 h-3" />
                הורד הכל כ-ZIP
              </button>
            </div>
          </div>
          
          {/* Documents Display */}
          <div className={`grid gap-4 ${
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
          }`}>
            {filteredDocuments.map((document, index) => (
              <div key={index} className={`bg-white rounded border border-gray-200 hover:shadow-md transition-all duration-200 ${
                viewMode === 'grid' ? 'p-4' : 'p-4'
              }`}>
                <div className={`flex items-start ${
                  viewMode === 'grid' ? 'flex-col' : 'justify-between'
                }`}>
                  {/* Selection Checkbox */}
                  <div className={`flex items-start gap-3 flex-1 ${
                    viewMode === 'grid' ? 'w-full' : ''
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments(prev => [...prev, document._id])
                        } else {
                          setSelectedDocuments(prev => prev.filter(id => id !== document._id))
                        }
                      }}
                      className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    
                    {/* File Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {getFileIcon(document.mimeType)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {document.originalName}
                        </h3>
                        
                        {/* OCR Processing Indicator */}
                        {isProcessingOCR.includes(document.originalName) && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Zap className="w-3 h-3 animate-pulse" />
                            <span>OCR בעיבוד...</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex items-center gap-4 mt-1 text-xs text-gray-500 ${
                        viewMode === 'grid' ? 'flex-col items-start gap-1' : ''
                      }`}>
                        <span className="flex items-center gap-1">
                          <span>{formatFileSize(document.size)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(document.uploadDate).toLocaleDateString('he-IL')}
                        </span>
                        <span>הועלה על ידי: {document.uploadedBy}</span>
                      </div>

                      {document.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{document.description}</p>
                      )}

                      {/* Category Badge and Version */}
                      <div className="flex items-center justify-between mt-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                          {getCategoryLabel(document.category)}
                        </span>
                        
                        {document.mimeType.includes('image') && (
                          <button
                            onClick={() => processOCR(document.originalName)}
                            disabled={isProcessingOCR.includes(document.originalName)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 disabled:opacity-50"
                          >
                            <Scan className="w-3 h-3" />
                            OCR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center gap-1 ${
                    viewMode === 'grid' ? 'w-full justify-between mt-3 pt-3 border-t border-gray-100' : 'ml-4'
                  }`}>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setShowPreview(document)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="תצוגה מקדימה"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-primary hover:bg-muted/50 rounded transition-colors"
                        title="הורדה"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="מחיקה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {viewMode === 'grid' && (
                      <div className="text-xs text-gray-400">
                        גרסה 1.0
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">פעילות אחרונה</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">תעודת רפואית הועלתה בהצלחה</div>
                  <div className="text-xs text-gray-600">לפני 2 שעות</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Scan className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">OCR הושלם על תעודת זהות</div>
                  <div className="text-xs text-gray-600">לפני 5 שעות - טקסט חולץ בהצלחה</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">דוח התקדמות ממתין אישור</div>
                  <div className="text-xs text-gray-600">אתמול - נשלח למנהל</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 bg-white rounded shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">אין מסמכים</h3>
          <p className="text-sm text-gray-500 mb-6">העלה מסמכים כדי להתחיל לנהל את תיק התלמיד</p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-neutral-800 transition-colors mx-auto"
          >
            <Upload className="w-5 h-5" />
            העלה מסמך ראשון
          </button>
        </div>
      )}
      
      {/* Document Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{showPreview.originalName}</h3>
              <button onClick={() => setShowPreview(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {showPreview.mimeType.includes('image') ? (
                <img src={showPreview.url} alt={showPreview.originalName} className="max-w-full h-auto mx-auto" />
              ) : showPreview.mimeType.includes('pdf') ? (
                <iframe src={showPreview.url} className="w-full h-96 border border-gray-200 rounded" />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">תצוגה מקדימה אינה זמינה עבור סוג קובץ זה</p>
                  <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-neutral-800 transition-colors mx-auto">
                    <Download className="w-4 h-4" />
                    הורד קובץ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,audio/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            onDrop(Array.from(e.target.files))
          }
        }}
      />
    </div>
  )
}

export default DocumentsTab