import { useState } from 'react'

import { Card } from '../ui/Card'
import { CalendarIcon, CheckCircleIcon, DownloadSimpleIcon, EyeIcon, FileIcon, FileTextIcon, ImageIcon, MusicNotesIcon, TrashIcon, UploadSimpleIcon, UserIcon, VideoIcon, WarningCircleIcon } from '@phosphor-icons/react'

interface Document {
  title: string
  fileUrl: string
  fileKey: string | null
  uploadDate: string
  uploadedBy: string
}

interface DocumentManagerProps {
  documents: Document[]
  onUpdate: (documents: Document[]) => void
  readonly?: boolean
}

export default function DocumentManager({ 
  documents, 
  onUpdate, 
  readonly = false 
}: DocumentManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [dragOver, setDragOver] = useState(false)

  const DOCUMENT_CATEGORIES = [
    { 
      key: 'sheet_music', 
      label: 'תווים', 
      icon: MusicNotesIcon,
      description: 'קבצי תווים של היצירות בתוכנית',
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    { 
      key: 'recordings', 
      label: 'הקלטות', 
      icon: VideoIcon,
      description: 'הקלטות של הביצועים וחזרות',
      accept: '.mp3,.mp4,.wav,.m4a',
      maxSize: 100 * 1024 * 1024 // 100MB
    },
    { 
      key: 'certificates', 
      label: 'תעודות', 
      icon: FileTextIcon,
      description: 'תעודות השלמה ודיפלומות',
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    { 
      key: 'portfolio', 
      label: 'תיק עבודות', 
      icon: FileIcon,
      description: 'מסמכים נוספים ותיק עבודות',
      accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
      maxSize: 20 * 1024 * 1024 // 20MB
    }
  ]

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return <FileTextIcon className="w-6 h-6 text-red-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="w-6 h-6 text-blue-500" />
      case 'mp3':
      case 'wav':
      case 'm4a':
        return <MusicNotesIcon className="w-6 h-6 text-green-500" />
      case 'mp4':
      case 'mov':
      case 'avi':
        return <VideoIcon className="w-6 h-6 text-purple-500" />
      default:
        return <FileIcon className="w-6 h-6 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileCategory = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['pdf', 'jpg', 'jpeg', 'png'].includes(extension || '')) {
      if (fileName.toLowerCase().includes('תעודה') || fileName.toLowerCase().includes('certificate')) {
        return 'certificates'
      }
      return 'sheet_music'
    }
    
    if (['mp3', 'mp4', 'wav', 'm4a', 'mov', 'avi'].includes(extension || '')) {
      return 'recordings'
    }
    
    return 'portfolio'
  }

  const validateFile = (file: FileIcon): string | null => {
    const category = getFileCategory(file.name)
    const categoryConfig = DOCUMENT_CATEGORIES.find(c => c.key === category)
    
    if (!categoryConfig) {
      return 'סוג קובץ לא נתמך'
    }
    
    if (file.size > categoryConfig.maxSize) {
      return `הקובץ גדול מדי. גודל מקסימלי: ${formatFileSize(categoryConfig.maxSize)}`
    }
    
    const acceptedTypes = categoryConfig.accept.split(',').map(type => type.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!acceptedTypes.includes(fileExtension)) {
      return `סוג קובץ לא נתמך. קבצים נתמכים: ${categoryConfig.accept}`
    }
    
    return null
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || readonly) return

    const validFiles: FileIcon[] = []
    const errors: string[] = []

    Array.from(files).forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      alert('שגיאות באימות קבצים:\n' + errors.join('\n'))
    }

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      for (const file of validFiles) {
        const fileId = Date.now() + Math.random().toString(36).substr(2, 9)
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // In real implementation, upload to server/cloud storage
        const mockDocument: Document = {
          title: file.name,
          fileUrl: URL.createObjectURL(file), // In real app, this would be the server URL
          fileKey: fileId,
          uploadDate: new Date().toISOString(),
          uploadedBy: 'current_user' // In real app, get from auth context
        }

        const updatedDocuments = [...documents, mockDocument]
        onUpdate(updatedDocuments)

        // Clean up progress
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileId]
          return newProgress
        })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('שגיאה בהעלאת הקבצים')
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = (index: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) {
      const updatedDocuments = documents.filter((_, i) => i !== index)
      onUpdate(updatedDocuments)
    }
  }

  const downloadDocument = (doc: Document) => {
    // In real implementation, this would handle secure download
    const link = document.createElement('a')
    link.href = doc.fileUrl
    link.download = doc.title
    link.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const groupDocumentsByCategory = () => {
    const grouped: Record<string, Document[]> = {}
    
    DOCUMENT_CATEGORIES.forEach(category => {
      grouped[category.key] = []
    })

    documents.forEach(doc => {
      const category = getFileCategory(doc.title)
      if (grouped[category]) {
        grouped[category].push(doc)
      }
    })

    return grouped
  }

  const getTotalSize = () => {
    // In real implementation, this would be calculated from actual file sizes
    return documents.length * 2.5 * 1024 * 1024 // Mock: 2.5MB average per document
  }

  const groupedDocuments = groupDocumentsByCategory()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FileTextIcon className="w-6 h-6 mr-3 text-primary" />
          ניהול מסמכים
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">מסמכים:</span> {documents.length}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">גודל:</span> {formatFileSize(getTotalSize())}
          </div>
        </div>
      </div>

      {/* UploadSimpleIcon Area */}
      {!readonly && (
        <Card 
          padding="md"
          className={`border-2 border-dashed transition-colors ${
            dragOver 
              ? 'border-primary bg-muted' 
              : uploading
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center py-8">
            <UploadSimpleIcon className={`w-12 h-12 mx-auto mb-4 ${
              dragOver ? 'text-primary' : uploading ? 'text-blue-600' : 'text-gray-400'
            }`} />
            
            {uploading ? (
              <div>
                <div className="text-lg font-medium text-blue-900 mb-2">מעלה קבצים...</div>
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="w-full bg-blue-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="text-lg font-medium text-gray-900 mb-2">
                  {dragOver ? 'שחרר להעלאה' : 'גרור קבצים לכאן או לחץ להעלאה'}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  תווים, הקלטות, תעודות ומסמכים נוספים
                </div>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="fileInput"
                  accept=".pdf,.jpg,.jpeg,.png,.mp3,.mp4,.wav,.m4a,.doc,.docx"
                />
                <label
                  htmlFor="fileInput"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <UploadSimpleIcon className="w-4 h-4 mr-2" />
                  בחר קבצים
                </label>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOCUMENT_CATEGORIES.map(category => {
          const Icon = category.icon
          const categoryDocs = groupedDocuments[category.key]
          
          return (
            <Card key={category.key} padding="md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Icon className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.label}
                  </h3>
                </div>
                <div className="text-sm text-gray-500">
                  {categoryDocs.length} קבצים
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {category.description}
              </p>
              
              {categoryDocs.length > 0 ? (
                <div className="space-y-3">
                  {categoryDocs.map((doc, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center flex-1">
                        {getFileIcon(doc.title)}
                        <div className="mr-3 flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {doc.title}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {new Date(doc.uploadDate).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="צפה בקובץ"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="הורד קובץ"
                        >
                          <DownloadSimpleIcon className="w-4 h-4" />
                        </button>
                        {!readonly && (
                          <button
                            onClick={() => {
                              const docIndex = documents.findIndex(d => d.fileKey === doc.fileKey)
                              deleteDocument(docIndex)
                            }}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="מחק קובץ"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <div className="text-sm text-gray-500">
                    אין קבצים בקטגוריה זו
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Document Requirements */}
      <Card padding="md" className="bg-green-50 border-green-200">
        <div className="flex items-start">
          <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-green-900 mb-2">דרישות מסמכים לבגרות</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-900 mb-2">מסמכים חובה:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li className="flex items-center">
                    {documents.some(d => getFileCategory(d.title) === 'sheet_music') ? (
                      <CheckCircleIcon className="w-3 h-3 mr-2 text-green-600" />
                    ) : (
                      <WarningCircleIcon className="w-3 h-3 mr-2 text-orange-500" />
                    )}
                    תווים של כל היצירות בתוכנית
                  </li>
                  <li className="flex items-center">
                    {documents.some(d => getFileCategory(d.title) === 'recordings') ? (
                      <CheckCircleIcon className="w-3 h-3 mr-2 text-green-600" />
                    ) : (
                      <WarningCircleIcon className="w-3 h-3 mr-2 text-orange-500" />
                    )}
                    הקלטות של הביצועים
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-green-900 mb-2">מסמכים רצויים:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li className="flex items-center">
                    {documents.some(d => getFileCategory(d.title) === 'certificates') ? (
                      <CheckCircleIcon className="w-3 h-3 mr-2 text-green-600" />
                    ) : (
                      <WarningCircleIcon className="w-3 h-3 mr-2 text-gray-400" />
                    )}
                    תעודות והסמכות רלוונטיות
                  </li>
                  <li className="flex items-center">
                    {documents.some(d => getFileCategory(d.title) === 'portfolio') ? (
                      <CheckCircleIcon className="w-3 h-3 mr-2 text-green-600" />
                    ) : (
                      <WarningCircleIcon className="w-3 h-3 mr-2 text-gray-400" />
                    )}
                    תיק עבודות ומסמכים נוספים
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded border">
              <div className="text-xs text-green-700">
                <strong>הערה:</strong> כל הקבצים נשמרים בצורה מאובטחת ויהיו זמינים למורים ולבוחנים במהלך תהליך הבגרות.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* FileIcon Type Guidelines */}
      <Card padding="md" className="bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <FileTextIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">הנחיות סוגי קבצים</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <div className="font-medium mb-1">תווים:</div>
                <div>PDF, JPG, PNG (עד 10MB)</div>
              </div>
              <div>
                <div className="font-medium mb-1">הקלטות:</div>
                <div>MP3, MP4, WAV (עד 100MB)</div>
              </div>
              <div>
                <div className="font-medium mb-1">תעודות:</div>
                <div>PDF, JPG, PNG (עד 5MB)</div>
              </div>
              <div>
                <div className="font-medium mb-1">מסמכים:</div>
                <div>PDF, DOC, DOCX (עד 20MB)</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {documents.length === 0 && (
        <Card padding="md">
          <div className="text-center py-12">
            <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">אין מסמכים</h3>
            <p className="text-gray-600 mb-4">
              {readonly 
                ? 'לא הועלו מסמכים עדיין'
                : 'התחל להעלות מסמכים לתיק הבגרות שלך'
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}