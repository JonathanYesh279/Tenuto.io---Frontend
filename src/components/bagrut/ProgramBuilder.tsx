import { useState } from 'react'
import { 
  Music, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Clock,
  User,
  ExternalLink,
  PlayCircle
} from 'lucide-react'
import { Card } from '../ui/Card'

interface Piece {
  pieceTitle: string
  composer: string
  duration: string
  movement?: string
  youtubeLink: string | null
}

interface ProgramBuilderProps {
  program: Piece[]
  onChange: (program: Piece[]) => void
  requiredPieces: number
  readonly?: boolean
}

export default function ProgramBuilder({ program, onChange, requiredPieces, readonly = false }: ProgramBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editData, setEditData] = useState<Piece | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPiece, setNewPiece] = useState<Piece>({
    pieceTitle: '',
    composer: '',
    duration: '',
    movement: '',
    youtubeLink: null
  })

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditData({ ...program[index] })
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditData(null)
  }

  const saveEdit = () => {
    if (editingIndex !== null && editData) {
      const updatedProgram = [...program]
      updatedProgram[editingIndex] = editData
      onChange(updatedProgram)
      setEditingIndex(null)
      setEditData(null)
    }
  }

  const deletePiece = (index: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק יצירה זו?')) {
      const updatedProgram = program.filter((_, i) => i !== index)
      onChange(updatedProgram)
    }
  }

  const addPiece = () => {
    if (newPiece.pieceTitle && newPiece.composer && newPiece.duration) {
      const updatedProgram = [...program, newPiece]
      onChange(updatedProgram)
      setNewPiece({
        pieceTitle: '',
        composer: '',
        duration: '',
        movement: '',
        youtubeLink: null
      })
      setShowAddForm(false)
    }
  }

  const cancelAdd = () => {
    setNewPiece({
      pieceTitle: '',
      composer: '',
      duration: '',
      movement: '',
      youtubeLink: null
    })
    setShowAddForm(false)
  }

  const parseDuration = (duration: string) => {
    // Parse duration string like "5:30" and return total seconds
    const parts = duration.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    return 0
  }

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTotalDuration = () => {
    const totalSeconds = program.reduce((total, piece) => {
      return total + parseDuration(piece.duration)
    }, 0)
    return formatDuration(totalSeconds)
  }

  const validateYouTubeUrl = (url: string) => {
    if (!url) return true
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/).+/
    return youtubeRegex.test(url)
  }

  const renderPieceCard = (piece: Piece, index: number) => {
    const isEditing = editingIndex === index

    return (
      <Card key={index} padding="md" className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      שם היצירה *
                    </label>
                    <input
                      type="text"
                      value={editData?.pieceTitle || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, pieceTitle: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="שם היצירה"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      מלחין *
                    </label>
                    <input
                      type="text"
                      value={editData?.composer || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, composer: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="שם המלחין"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      משך זמן *
                    </label>
                    <input
                      type="text"
                      value={editData?.duration || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, duration: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="5:30"
                      pattern="[0-9]+:[0-9]{2}"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      פרק (אופציונלי)
                    </label>
                    <input
                      type="text"
                      value={editData?.movement || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, movement: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="פרק ראשון"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קישור YouTube (אופציונלי)
                  </label>
                  <input
                    type="url"
                    value={editData?.youtubeLink || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, youtubeLink: e.target.value || null } : null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                      editData?.youtubeLink && !validateYouTubeUrl(editData.youtubeLink)
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {editData?.youtubeLink && !validateYouTubeUrl(editData.youtubeLink) && (
                    <p className="text-red-500 text-xs mt-1">קישור YouTube לא תקין</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {piece.pieceTitle}
                </h3>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <User className="w-4 h-4 mr-1" />
                  <span className="text-sm">{piece.composer}</span>
                  {piece.movement && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-sm">{piece.movement}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center text-gray-500 text-sm mb-3">
                  <Clock className="w-4 h-4 mr-1" />
                  {piece.duration}
                </div>
                
                {piece.youtubeLink && (
                  <a
                    href={piece.youtubeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-red-600 hover:text-red-800 text-sm"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    צפה ב-YouTube
                    <ExternalLink className="w-3 h-3 mr-1" />
                  </a>
                )}
              </div>
            )}
          </div>

          {!readonly && (
            <div className="flex items-center gap-2 mr-4">
              {isEditing ? (
                <>
                  <button
                    onClick={saveEdit}
                    disabled={!editData?.pieceTitle || !editData?.composer || !editData?.duration}
                    className="p-2 text-green-600 hover:text-green-800 disabled:text-gray-400"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(index)}
                    className="p-2 text-primary hover:text-foreground"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePiece(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Music className="w-6 h-6 mr-3 text-primary" />
          תוכנית הבגרות
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">סה"כ זמן:</span> {getTotalDuration()}
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">יצירות:</span> {program.length}
          </div>
          
          {!readonly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              הוסף יצירה
            </button>
          )}
        </div>
      </div>

      {/* Program Requirements Info */}
      <Card padding="md" className="bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <Music className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">דרישות התוכנית</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• לפחות 3 יצירות שונות</li>
              <li>• משך זמן מינימלי: 15 דקות</li>
              <li>• לכל יצירה חייב להיות קישור להשמעה (מומלץ YouTube)</li>
              <li>• יש לציין פרק ספציפי אם היצירה מורכבת מכמה פרקים</li>
            </ul>
            
            <div className="mt-3 flex items-center gap-6">
              <div className={`flex items-center text-sm ${
                program.length >= 3 ? 'text-green-700' : 'text-red-700'
              }`}>
                <span className="font-medium">יצירות:</span>
                <span className="mr-1">{program.length}/3 (מינימום)</span>
                {program.length >= 3 ? ' ✓' : ' ⚠️'}
              </div>
              
              <div className={`flex items-center text-sm ${
                parseDuration(getTotalDuration()) >= 900 ? 'text-green-700' : 'text-red-700'
              }`}>
                <span className="font-medium">זמן כולל:</span>
                <span className="mr-1">{getTotalDuration()} (מינימום 15:00)</span>
                {parseDuration(getTotalDuration()) >= 900 ? ' ✓' : ' ⚠️'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Add New Piece Form */}
      {showAddForm && !readonly && (
        <Card padding="md" className="border-2 border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">הוספת יצירה חדשה</h3>
            <button
              onClick={cancelAdd}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם היצירה *
                </label>
                <input
                  type="text"
                  value={newPiece.pieceTitle}
                  onChange={(e) => setNewPiece(prev => ({ ...prev, pieceTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="שם היצירה"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מלחין *
                </label>
                <input
                  type="text"
                  value={newPiece.composer}
                  onChange={(e) => setNewPiece(prev => ({ ...prev, composer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="שם המלחין"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  משך זמן * (דק:שנ)
                </label>
                <input
                  type="text"
                  value={newPiece.duration}
                  onChange={(e) => setNewPiece(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="5:30"
                  pattern="[0-9]+:[0-9]{2}"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  פרק (אופציונלי)
                </label>
                <input
                  type="text"
                  value={newPiece.movement || ''}
                  onChange={(e) => setNewPiece(prev => ({ ...prev, movement: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="פרק ראשון"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                קישור YouTube (אופציונלי)
              </label>
              <input
                type="url"
                value={newPiece.youtubeLink || ''}
                onChange={(e) => setNewPiece(prev => ({ ...prev, youtubeLink: e.target.value || null }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  newPiece.youtubeLink && !validateYouTubeUrl(newPiece.youtubeLink)
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {newPiece.youtubeLink && !validateYouTubeUrl(newPiece.youtubeLink) && (
                <p className="text-red-500 text-xs mt-1">קישור YouTube לא תקין</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={cancelAdd}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={addPiece}
                disabled={!newPiece.pieceTitle || !newPiece.composer || !newPiece.duration}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הוסף יצירה
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Program List */}
      {program.length > 0 ? (
        <div className="space-y-4">
          {program.map((piece, index) => renderPieceCard(piece, index))}
        </div>
      ) : (
        <Card padding="md">
          <div className="text-center py-8">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">אין יצירות בתוכנית</h3>
            <p className="text-gray-600 mb-4">הוסף יצירות לתוכנית הבגרות שלך</p>
            {!readonly && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                הוסף יצירה ראשונה
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}