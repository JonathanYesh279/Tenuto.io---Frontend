import { useState } from 'react'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Phone,
  Music,
  UserCheck,
  Calendar,
  Clock
} from 'lucide-react'
import { Card } from '../ui/Card'
import EnhancedAccompanistForm from '../EnhancedAccompanistForm'

interface Accompanist {
  name: string
  instrument: string
  phone: string | null
}

interface AccompanimentData {
  type: 'נגן מלווה' | 'הרכב'
  accompanists: Accompanist[]
}

interface AccompanistManagerProps {
  accompaniment: AccompanimentData
  onUpdate: (accompaniment: AccompanimentData) => void
  readonly?: boolean
}

export default function AccompanistManager({ 
  accompaniment, 
  onUpdate, 
  readonly = false 
}: AccompanistManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editData, setEditData] = useState<Accompanist | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const ACCOMPANIMENT_TYPES = ['נגן מלווה', 'הרכב'] as const
  
  const COMMON_INSTRUMENTS = [
    'פסנתר',
    'גיטרה',
    'כינור',
    'ויולה',
    'צ\'לו',
    'קונטרבס',
    'חלילית',
    'קלרינט',
    'סקסופון',
    'חצוצרה',
    'טרומבון',
    'תופים',
    'כלי הקשה',
    'אחר'
  ]

  const updateAccompanimentType = (type: 'נגן מלווה' | 'הרכב') => {
    onUpdate({
      ...accompaniment,
      type
    })
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditData({ ...accompaniment.accompanists[index] })
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditData(null)
  }

  const saveEdit = () => {
    if (editingIndex !== null && editData) {
      const updatedAccompanists = [...accompaniment.accompanists]
      updatedAccompanists[editingIndex] = editData
      onUpdate({
        ...accompaniment,
        accompanists: updatedAccompanists
      })
      setEditingIndex(null)
      setEditData(null)
    }
  }

  const deleteAccompanist = (index: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק נגן זה?')) {
      const updatedAccompanists = accompaniment.accompanists.filter((_, i) => i !== index)
      onUpdate({
        ...accompaniment,
        accompanists: updatedAccompanists
      })
    }
  }

  const addAccompanist = (accompanistData: { name: string; instrument: string; phone: string | null; email?: string }) => {
    if (accompanistData.name && accompanistData.instrument) {
      const updatedAccompanists = [...accompaniment.accompanists, {
        name: accompanistData.name,
        instrument: accompanistData.instrument,
        phone: accompanistData.phone
      }]
      onUpdate({
        ...accompaniment,
        accompanists: updatedAccompanists
      })
      setShowAddForm(false)
    }
  }

  const cancelAdd = () => {
    setShowAddForm(false)
  }

  const validatePhone = (phone: string) => {
    if (!phone) return true
    const phonePattern = /^05\d{8}$/
    return phonePattern.test(phone)
  }

  const renderAccompanistCard = (accompanist: Accompanist, index: number) => {
    const isEditing = editingIndex === index

    return (
      <Card key={index} padding="md" className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      שם הנגן *
                    </label>
                    <input
                      type="text"
                      value={editData?.name || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="שם מלא"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      כלי נגינה *
                    </label>
                    <select
                      value={editData?.instrument || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, instrument: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">בחר כלי נגינה</option>
                      {COMMON_INSTRUMENTS.map(instrument => (
                        <option key={instrument} value={instrument}>{instrument}</option>
                      ))}
                    </select>
                    {editData?.instrument === 'אחר' && (
                      <input
                        type="text"
                        value={editData?.instrument || ''}
                        onChange={(e) => setEditData(prev => prev ? { ...prev, instrument: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                        placeholder="ציין כלי נגינה"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מספר טלפון
                  </label>
                  <input
                    type="tel"
                    value={editData?.phone || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, phone: e.target.value || null } : null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                      editData?.phone && !validatePhone(editData.phone)
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="0501234567"
                  />
                  {editData?.phone && !validatePhone(editData.phone) && (
                    <p className="text-red-500 text-xs mt-1">מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-2">
                  <UserCheck className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {accompanist.name}
                  </h3>
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <Music className="w-4 h-4 mr-2" />
                  <span className="text-sm">{accompanist.instrument}</span>
                </div>
                
                {accompanist.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <a 
                      href={`tel:${accompanist.phone}`}
                      className="text-sm text-primary hover:text-foreground"
                    >
                      {accompanist.phone}
                    </a>
                  </div>
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
                    disabled={!editData?.name || !editData?.instrument}
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
                    onClick={() => deleteAccompanist(index)}
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
          <Users className="w-6 h-6 mr-3 text-primary" />
          ליווי מוזיקלי
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">נגנים:</span> {accompaniment.accompanists.length}
          </div>
          
          {!readonly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              הוסף נגן
            </button>
          )}
        </div>
      </div>

      {/* Accompaniment Type Selection */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">סוג הליווי</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACCOMPANIMENT_TYPES.map(type => (
            <div key={type}>
              <label className="flex items-center p-4 border-2 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="accompanimentType"
                  value={type}
                  checked={accompaniment.type === type}
                  onChange={(e) => !readonly && updateAccompanimentType(e.target.value as 'נגן מלווה' | 'הרכב')}
                  disabled={readonly}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <div className="mr-3">
                  <div className="font-medium text-gray-900">{type}</div>
                  <div className="text-sm text-gray-600">
                    {type === 'נגן מלווה' 
                      ? 'נגן יחיד המלווה את הביצוע'
                      : 'הרכב של מספר נגנים'
                    }
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </Card>


      {/* Enhanced Accompanist Form */}
      {showAddForm && !readonly && (
        <EnhancedAccompanistForm
          onSubmit={addAccompanist}
          onCancel={cancelAdd}
        />
      )}

      {/* Accompanists List */}
      {accompaniment.accompanists.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            נגנים מלווים ({accompaniment.type})
          </h3>
          {accompaniment.accompanists.map((accompanist, index) => 
            renderAccompanistCard(accompanist, index)
          )}
        </div>
      ) : (
        <Card padding="md">
          <div className="text-center py-8">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">אין נגנים מלווים</h3>
            <p className="text-gray-600 mb-4">הוסף נגן מלווה לביצוע הבגרות</p>
            {!readonly && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                הוסף נגן ראשון
              </button>
            )}
          </div>
        </Card>
      )}

    </div>
  )
}