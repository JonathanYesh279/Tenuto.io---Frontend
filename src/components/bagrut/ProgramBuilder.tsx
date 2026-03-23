import { useState } from 'react'
import { Button as HeroButton } from '@heroui/react'
import { ClockIcon, FloppyDiskIcon, MusicNotesIcon, PencilSimpleIcon, PlayCircleIcon, PlusIcon, TrashIcon, UserIcon, XIcon } from '@phosphor-icons/react'

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
    pieceTitle: '', composer: '', duration: '', movement: '', youtubeLink: null,
  })

  const startEdit = (index: number) => { setEditingIndex(index); setEditData({ ...program[index] }) }
  const cancelEdit = () => { setEditingIndex(null); setEditData(null) }
  const saveEdit = () => {
    if (editingIndex !== null && editData) {
      const u = [...program]; u[editingIndex] = editData; onChange(u)
      setEditingIndex(null); setEditData(null)
    }
  }
  const deletePiece = (index: number) => {
    if (window.confirm('האם למחוק יצירה זו?')) onChange(program.filter((_, i) => i !== index))
  }
  const addPiece = () => {
    if (newPiece.pieceTitle && newPiece.composer && newPiece.duration) {
      onChange([...program, newPiece])
      setNewPiece({ pieceTitle: '', composer: '', duration: '', movement: '', youtubeLink: null })
      setShowAddForm(false)
    }
  }
  const cancelAdd = () => {
    setNewPiece({ pieceTitle: '', composer: '', duration: '', movement: '', youtubeLink: null })
    setShowAddForm(false)
  }

  const parseDuration = (d: string) => { const p = d.split(':'); return p.length === 2 ? parseInt(p[0]) * 60 + parseInt(p[1]) : 0 }
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const getTotalDuration = () => formatDuration(program.reduce((t, p) => t + parseDuration(p.duration), 0))
  const validateYouTubeUrl = (url: string) => !url || /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/).+/.test(url)

  const inputClass = "w-full px-3 py-2 border border-border rounded-card bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"

  const renderPieceForm = (data: Piece, setData: (fn: (p: Piece) => Piece) => void) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">שם היצירה *</label>
          <input type="text" value={data.pieceTitle} onChange={e => setData(p => ({ ...p, pieceTitle: e.target.value }))} className={inputClass} placeholder="שם היצירה" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">מלחין *</label>
          <input type="text" value={data.composer} onChange={e => setData(p => ({ ...p, composer: e.target.value }))} className={inputClass} placeholder="שם המלחין" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">משך זמן * (דק:שנ)</label>
          <input type="text" value={data.duration} onChange={e => setData(p => ({ ...p, duration: e.target.value }))} className={inputClass} placeholder="5:30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">פרק (אופציונלי)</label>
          <input type="text" value={data.movement || ''} onChange={e => setData(p => ({ ...p, movement: e.target.value }))} className={inputClass} placeholder="פרק ראשון" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">קישור YouTube (אופציונלי)</label>
        <input
          type="url"
          value={data.youtubeLink || ''}
          onChange={e => setData(p => ({ ...p, youtubeLink: e.target.value || null }))}
          className={`${inputClass} ${data.youtubeLink && !validateYouTubeUrl(data.youtubeLink) ? 'border-destructive focus:ring-destructive/30' : ''}`}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>סה"כ זמן: <strong className="text-foreground">{getTotalDuration()}</strong></span>
          <span>יצירות: <strong className="text-foreground">{program.length}</strong></span>
        </div>
        {!readonly && (
          <HeroButton
            color="primary"
            variant="solid"
            size="sm"
            onPress={() => setShowAddForm(true)}
            startContent={<PlusIcon size={14} weight="bold" />}
            className="font-bold"
          >
            הוסף יצירה
          </HeroButton>
        )}
      </div>

      {/* Requirements info — compact */}
      <div className="bg-primary/5 border border-primary/10 rounded-card px-4 py-3">
        <h4 className="text-xs font-bold text-foreground mb-1.5">דרישות התוכנית</h4>
        <ul className="text-xs text-muted-foreground space-y-0.5">
          <li>• לפחות {requiredPieces} יצירות שונות</li>
          <li>• משך זמן מינימלי: 15 דקות</li>
          <li>• לכל יצירה חייב להיות קישור להשמעה (מומלץ YouTube)</li>
          <li>• יש לציין פרק ספציפי אם היצירה מורכבת מכמה פרקים</li>
        </ul>
        <div className="mt-2 flex items-center gap-4 text-xs">
          <span className={program.length >= requiredPieces ? 'text-green-700' : 'text-destructive'}>
            יצירות: {program.length}/{requiredPieces} (מינימום) {program.length >= requiredPieces ? '✓' : '⚠'}
          </span>
          <span className={parseDuration(getTotalDuration()) >= 900 ? 'text-green-700' : 'text-destructive'}>
            זמן כולל: {getTotalDuration()} (מינימום 15:00) {parseDuration(getTotalDuration()) >= 900 ? '✓' : '⚠'}
          </span>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && !readonly && (
        <div className="bg-white rounded-card border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">הוספת יצירה חדשה</h4>
            <button onClick={cancelAdd} className="text-muted-foreground hover:text-foreground p-1">
              <XIcon size={16} />
            </button>
          </div>
          {renderPieceForm(newPiece, (fn) => setNewPiece(prev => fn(prev)))}
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-border">
            <HeroButton variant="flat" size="sm" onPress={cancelAdd} className="font-bold">ביטול</HeroButton>
            <HeroButton
              color="primary"
              variant="solid"
              size="sm"
              onPress={addPiece}
              isDisabled={!newPiece.pieceTitle || !newPiece.composer || !newPiece.duration}
              className="font-bold"
            >
              הוסף יצירה
            </HeroButton>
          </div>
        </div>
      )}

      {/* Piece list */}
      {program.length > 0 ? (
        <div className="space-y-2">
          {program.map((piece, index) => {
            const isEditing = editingIndex === index
            return (
              <div key={index} className="bg-white rounded-card border border-border p-4 hover:shadow-sm transition-shadow">
                {isEditing ? (
                  <>
                    {renderPieceForm(editData!, (fn) => setEditData(prev => prev ? fn(prev) : prev))}
                    <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-border">
                      <HeroButton variant="flat" size="sm" onPress={cancelEdit} className="font-bold">ביטול</HeroButton>
                      <HeroButton
                        color="primary"
                        variant="solid"
                        size="sm"
                        onPress={saveEdit}
                        isDisabled={!editData?.pieceTitle || !editData?.composer || !editData?.duration}
                        className="font-bold"
                      >
                        שמור
                      </HeroButton>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground truncate">{piece.pieceTitle}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <UserIcon size={12} />
                          {piece.composer}
                        </span>
                        {piece.movement && (
                          <span>{piece.movement}</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon size={12} />
                          {piece.duration}
                        </span>
                        {piece.youtubeLink && (
                          <a href={piece.youtubeLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800">
                            <PlayCircleIcon size={12} />
                            YouTube
                          </a>
                        )}
                      </div>
                    </div>
                    {!readonly && (
                      <div className="flex items-center gap-1 flex-shrink-0 mr-3">
                        <button onClick={() => startEdit(index)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                          <PencilSimpleIcon size={14} />
                        </button>
                        <button onClick={() => deletePiece(index)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-card border border-dashed border-border">
          <MusicNotesIcon size={32} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-3">אין יצירות בתוכנית</p>
          {!readonly && (
            <HeroButton
              color="primary"
              variant="solid"
              size="sm"
              onPress={() => setShowAddForm(true)}
              startContent={<PlusIcon size={14} weight="bold" />}
              className="font-bold"
            >
              הוסף יצירה ראשונה
            </HeroButton>
          )}
        </div>
      )}
    </div>
  )
}
