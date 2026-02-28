/**
 * Conducting Tab Component
 * 
 * Manages orchestras and ensembles that the teacher conducts
 */

import { useState, useEffect } from 'react'

import { Teacher } from '../../types'
import apiService from '../../../../../services/apiService'
import { CalendarIcon, MedalIcon, MusicNotesIcon, PencilIcon, PlusIcon, TrashIcon, UsersIcon } from '@phosphor-icons/react'

interface ConductingTabProps {
  teacher: Teacher
  teacherId: string
}

interface Orchestra {
  _id: string
  name: string
  description?: string
  memberIds?: string[]
  rehearsalSchedule?: any[]
  isActive?: boolean
}

interface Ensemble {
  _id: string
  name: string
  description?: string
  memberIds?: string[]
  type?: string
  isActive?: boolean
}

const ConductingTab: React.FC<ConductingTabProps> = ({ teacher, teacherId }) => {
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [ensembles, setEnsembles] = useState<Ensemble[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingOrchestra, setIsCreatingOrchestra] = useState(false)
  const [isCreatingEnsemble, setIsCreatingEnsemble] = useState(false)
  const [newOrchestra, setNewOrchestra] = useState({
    name: '',
    description: '',
  })
  const [newEnsemble, setNewEnsemble] = useState({
    name: '',
    description: '',
    type: '',
  })

  // Fetch orchestras and ensembles data
  useEffect(() => {
    const fetchConductingData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch orchestras
        if (teacher.conducting?.orchestraIds?.length > 0) {
          const orchestraPromises = teacher.conducting.orchestraIds.map(orchestraId =>
            apiService.orchestras?.getOrchestra(orchestraId)
          )
          if (orchestraPromises.length > 0) {
            try {
              const orchestraData = await Promise.all(orchestraPromises)
              setOrchestras(orchestraData.filter(Boolean))
            } catch (error) {
              console.warn('Error fetching orchestras:', error)
              setOrchestras([])
            }
          }
        }
        
        // Fetch ensembles
        if (teacher.conducting?.ensemblesIds?.length > 0) {
          const ensemblePromises = teacher.conducting.ensemblesIds.map(ensembleId =>
            apiService.ensembles?.getEnsembleById(ensembleId)
          )
          if (ensemblePromises.length > 0) {
            try {
              const ensembleData = await Promise.all(ensemblePromises)
              setEnsembles(ensembleData.filter(Boolean))
            } catch (error) {
              console.warn('Error fetching ensembles:', error)
              setEnsembles([])
            }
          }
        }
      } catch (error) {
        console.error('Error fetching conducting data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConductingData()
  }, [teacher.conducting])

  const handleCreateOrchestra = async () => {
    if (!newOrchestra.name.trim()) return

    try {
      const orchestraData = {
        ...newOrchestra,
        conductorId: teacherId,
        memberIds: [],
        isActive: true,
        createdAt: new Date(),
      }
      
      // TODO: Implement API call when orchestra API is available
      console.log('Creating orchestra:', orchestraData)
      
      // For now, just add to local state
      const mockOrchestra = {
        _id: `temp-${Date.now()}`,
        ...orchestraData,
      }
      setOrchestras(prev => [...prev, mockOrchestra])
      
      setNewOrchestra({ name: '', description: '' })
      setIsCreatingOrchestra(false)
    } catch (error) {
      console.error('Error creating orchestra:', error)
    }
  }

  const handleCreateEnsemble = async () => {
    if (!newEnsemble.name.trim()) return

    try {
      const ensembleData = {
        ...newEnsemble,
        conductorId: teacherId,
        memberIds: [],
        isActive: true,
        createdAt: new Date(),
      }
      
      // TODO: Implement API call when ensemble API is available
      console.log('Creating ensemble:', ensembleData)
      
      // For now, just add to local state
      const mockEnsemble = {
        _id: `temp-${Date.now()}`,
        ...ensembleData,
      }
      setEnsembles(prev => [...prev, mockEnsemble])
      
      setNewEnsemble({ name: '', description: '', type: '' })
      setIsCreatingEnsemble(false)
    } catch (error) {
      console.error('Error creating ensemble:', error)
    }
  }

  const handleDeleteOrchestra = async (orchestraId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התזמורת?')) return

    try {
      // TODO: Implement API call when orchestra API is available
      console.log('Deleting orchestra:', orchestraId)
      
      setOrchestras(prev => prev.filter(orchestra => orchestra._id !== orchestraId))
    } catch (error) {
      console.error('Error deleting orchestra:', error)
    }
  }

  const handleDeleteEnsemble = async (ensembleId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האנסמבל?')) return

    try {
      // TODO: Implement API call when ensemble API is available
      console.log('Deleting ensemble:', ensembleId)
      
      setEnsembles(prev => prev.filter(ensemble => ensemble._id !== ensembleId))
    } catch (error) {
      console.error('Error deleting ensemble:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  const totalMembers = orchestras.reduce((sum, orch) => sum + (orch.memberIds?.length || 0), 0) +
                     ensembles.reduce((sum, ens) => sum + (ens.memberIds?.length || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {orchestras.length}
            </div>
            <div className="text-gray-600">תזמורות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {ensembles.length}
            </div>
            <div className="text-gray-600">אנסמבלים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalMembers}
            </div>
            <div className="text-gray-600">סך חברים</div>
          </div>
        </div>
      </div>

      {/* Orchestras Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">תזמורות</h3>
          <button
            onClick={() => setIsCreatingOrchestra(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            צור תזמורת
          </button>
        </div>

        {orchestras.length === 0 ? (
          <div className="text-center py-8 bg-purple-50 rounded">
            <MusicNotesIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">אין תזמורות</h4>
            <p className="text-gray-600 mb-4">
              עדיין לא נוצרו תזמורות תחת ניצוחו של המורה
            </p>
            <button
              onClick={() => setIsCreatingOrchestra(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              צור תזמורת ראשונה
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {orchestras.map(orchestra => (
              <div
                key={orchestra._id}
                className="bg-background border border-border rounded p-6 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {orchestra.name}
                    </h4>
                    {orchestra.description && (
                      <p className="text-gray-600 mb-3">{orchestra.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        {orchestra.memberIds?.length || 0} חברים
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {orchestra.rehearsalSchedule?.length || 0} חזרות
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        orchestra.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {orchestra.isActive !== false ? 'פעיל' : 'לא פעיל'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteOrchestra(orchestra._id)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ensembles Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">אנסמבלים</h3>
          <button
            onClick={() => setIsCreatingEnsemble(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            צור אנסמבל
          </button>
        </div>

        {ensembles.length === 0 ? (
          <div className="text-center py-8 bg-blue-50 rounded">
            <MedalIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">אין אנסמבלים</h4>
            <p className="text-gray-600 mb-4">
              עדיין לא נוצרו אנסמבלים תחת ניצוחו של המורה
            </p>
            <button
              onClick={() => setIsCreatingEnsemble(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              צור אנסמבל ראשון
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {ensembles.map(ensemble => (
              <div
                key={ensemble._id}
                className="bg-background border border-border rounded p-6 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {ensemble.name}
                    </h4>
                    {ensemble.description && (
                      <p className="text-gray-600 mb-3">{ensemble.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        {ensemble.memberIds?.length || 0} חברים
                      </div>
                      {ensemble.type && (
                        <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {ensemble.type}
                        </div>
                      )}
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        ensemble.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ensemble.isActive !== false ? 'פעיל' : 'לא פעיל'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEnsemble(ensemble._id)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Orchestra Modal */}
      {isCreatingOrchestra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">צור תזמורת חדשה</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם התזמורת
                </label>
                <input
                  type="text"
                  value={newOrchestra.name}
                  onChange={(e) => setNewOrchestra({ ...newOrchestra, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="הכנס שם תזמורת..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תיאור
                </label>
                <textarea
                  value={newOrchestra.description}
                  onChange={(e) => setNewOrchestra({ ...newOrchestra, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="תיאור התזמורת..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCreateOrchestra}
                  disabled={!newOrchestra.name.trim()}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-300"
                >
                  צור תזמורת
                </button>
                <button
                  onClick={() => {
                    setIsCreatingOrchestra(false)
                    setNewOrchestra({ name: '', description: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                >
                  בטל
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ensemble Modal */}
      {isCreatingEnsemble && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">צור אנסמבל חדש</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם האנסמבל
                </label>
                <input
                  type="text"
                  value={newEnsemble.name}
                  onChange={(e) => setNewEnsemble({ ...newEnsemble, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס שם אנסמבל..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סוג האנסמבל
                </label>
                <select
                  value={newEnsemble.type}
                  onChange={(e) => setNewEnsemble({ ...newEnsemble, type: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר סוג...</option>
                  <option value="קלאסי">קלאסי</option>
                  <option value="ג'אז">ג'אז</option>
                  <option value="כלי נשיפה">כלי נשיפה</option>
                  <option value="כלי מיתר">כלי מיתר</option>
                  <option value="מעורב">מעורב</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תיאור
                </label>
                <textarea
                  value={newEnsemble.description}
                  onChange={(e) => setNewEnsemble({ ...newEnsemble, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="תיאור האנסמבל..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCreateEnsemble}
                  disabled={!newEnsemble.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                >
                  צור אנסמבל
                </button>
                <button
                  onClick={() => {
                    setIsCreatingEnsemble(false)
                    setNewEnsemble({ name: '', description: '', type: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                >
                  בטל
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConductingTab