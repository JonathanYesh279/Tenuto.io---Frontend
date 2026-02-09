import React, { useState, useEffect } from 'react'
import { Plus, Search, Users, UserPlus, UserMinus, Eye, Trash2, UserCheck } from 'lucide-react'
import { OrchestraTabProps, OrchestraMember } from '../../types'
import apiService from '../../../../../services/apiService'
import ConfirmationModal from '../../../../../components/ui/ConfirmationModal'
import { useAuth } from '../../../../../services/authContext'
import { getDisplayName } from '@/utils/nameUtils'

const MembersTab: React.FC<OrchestraTabProps> = ({
  orchestraId,
  orchestra,
  isLoading,
  onUpdate,
}) => {
  const { user } = useAuth()
  const [members, setMembers] = useState<OrchestraMember[]>([])
  const [availableStudents, setAvailableStudents] = useState<OrchestraMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showRemoveModal, setShowRemoveModal] = useState<{ isOpen: boolean, studentId?: string, studentName?: string }>({
    isOpen: false
  })
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [isAddingMultiple, setIsAddingMultiple] = useState(false)

  // Check if user can edit this orchestra
  const canEdit = () => {
    if (!user) return false
    
    // Admin can always edit
    if (user.roles?.includes('מנהל')) return true
    
    // Conductor of this specific orchestra can edit
    if (orchestra && user._id === orchestra.conductorId) {
      return user.roles?.includes('מנצח') || user.roles?.includes('מדריך הרכב')
    }
    
    return false
  }

  useEffect(() => {
    if (orchestra) {
      loadMembers()
    }
  }, [orchestra])

  // Clear selection when add member section is closed
  useEffect(() => {
    if (!showAddMember) {
      clearSelection()
    }
  }, [showAddMember])

  const loadMembers = async () => {
    if (!orchestra) return

    try {
      setIsLoadingMembers(true)
      setError(null)
      
      // Load all students
      const allStudents = await apiService.students.getStudents()
      
      // Filter current members
      const currentMembers = allStudents.filter(student => 
        orchestra.memberIds?.includes(student._id)
      )
      
      // Filter available students (not in this orchestra)
      const available = allStudents.filter(student => 
        !orchestra.memberIds?.includes(student._id) && student.isActive
      )
      
      setMembers(currentMembers)
      setAvailableStudents(available)
    } catch (error) {
      console.error('Error loading members:', error)
      setError('שגיאה בטעינת רשימת חברים')
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleAddMember = async (studentId: string) => {
    if (!orchestraId) return

    try {
      setError(null)
      console.log('🔍 Frontend user data:', user)
      console.log('🔍 Orchestra data:', orchestra)
      console.log('🔍 Attempting to add student:', studentId, 'to orchestra:', orchestraId)

      // Step 1: Add to orchestra's memberIds
      await apiService.orchestras.addMember(orchestraId, studentId)

      // Step 2: Update student's orchestraIds (bidirectional sync)
      try {
        const student = await apiService.students.getStudent(studentId)
        const currentOrchestraIds = student?.enrollments?.orchestraIds || []

        // Only add if not already present
        if (!currentOrchestraIds.includes(orchestraId)) {
          await apiService.students.updateStudent(studentId, {
            enrollments: {
              ...student?.enrollments,
              orchestraIds: [...currentOrchestraIds, orchestraId]
            }
          })
          console.log(`✅ Updated student ${studentId} orchestraIds with ${orchestraId}`)
        }
      } catch (syncError) {
        console.error('Error syncing student orchestraIds:', syncError)
        // Don't fail the whole operation if sync fails
      }

      await loadMembers() // Reload members list
      onUpdate?.() // Notify parent to refresh orchestra data
      console.log(`✅ Successfully added member ${studentId} to orchestra`)
    } catch (error) {
      console.error('Error adding member:', error)
      // Show more detailed error message
      const errorMessage = error.message || 'שגיאה לא ידועה'
      setError(`שגיאה בהוספת חבר לתזמורת: ${errorMessage}`)
    }
  }

  const handleRemoveMember = (studentId: string, studentName: string) => {
    setShowRemoveModal({ isOpen: true, studentId, studentName })
  }

  const confirmRemoveMember = async () => {
    const { studentId } = showRemoveModal
    if (!orchestraId || !studentId) return

    try {
      setError(null)

      // Step 1: Remove from orchestra's memberIds
      await apiService.orchestras.removeMember(orchestraId, studentId)

      // Step 2: Update student's orchestraIds (bidirectional sync)
      try {
        const student = await apiService.students.getStudent(studentId)
        const currentOrchestraIds = student?.enrollments?.orchestraIds || []

        // Remove the orchestraId from the student's list
        const updatedOrchestraIds = currentOrchestraIds.filter((id: string) => id !== orchestraId)

        if (updatedOrchestraIds.length !== currentOrchestraIds.length) {
          await apiService.students.updateStudent(studentId, {
            enrollments: {
              ...student?.enrollments,
              orchestraIds: updatedOrchestraIds
            }
          })
          console.log(`✅ Removed orchestraId ${orchestraId} from student ${studentId} enrollments`)
        }
      } catch (syncError) {
        console.error('Error syncing student orchestraIds on remove:', syncError)
        // Don't fail the whole operation if sync fails
      }

      await loadMembers() // Reload members list
      onUpdate?.() // Notify parent to refresh orchestra data
      setShowRemoveModal({ isOpen: false })
    } catch (error) {
      console.error('Error removing member:', error)
      setError('שגיאה בהסרת חבר מהתזמורת')
    }
  }

  const handleViewStudentProfile = (studentId: string) => {
    window.open(`/students/${studentId}`, '_blank')
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudentIds)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudentIds(newSelection)
  }

  const selectAllAvailableStudents = () => {
    const allIds = new Set(filteredAvailableStudents.map(student => student._id))
    setSelectedStudentIds(allIds)
  }

  const clearSelection = () => {
    setSelectedStudentIds(new Set())
  }

  const handleAddMultipleMembers = async () => {
    if (selectedStudentIds.size === 0 || !orchestraId) return

    try {
      setIsAddingMultiple(true)
      setError(null)

      // Add members one by one to get individual error handling
      const selectedIds = Array.from(selectedStudentIds)
      const results = []
      const errors = []

      for (const studentId of selectedIds) {
        try {
          // Step 1: Add to orchestra's memberIds
          await apiService.orchestras.addMember(orchestraId, studentId)

          // Step 2: Update student's orchestraIds (bidirectional sync)
          try {
            const student = await apiService.students.getStudent(studentId)
            const currentOrchestraIds = student?.enrollments?.orchestraIds || []

            // Only add if not already present
            if (!currentOrchestraIds.includes(orchestraId)) {
              await apiService.students.updateStudent(studentId, {
                enrollments: {
                  ...student?.enrollments,
                  orchestraIds: [...currentOrchestraIds, orchestraId]
                }
              })
              console.log(`✅ Updated student ${studentId} orchestraIds with ${orchestraId}`)
            }
          } catch (syncError) {
            console.error(`Error syncing student ${studentId} orchestraIds:`, syncError)
            // Don't fail the whole operation if sync fails
          }

          results.push(studentId)
        } catch (error) {
          console.error(`Error adding student ${studentId}:`, error)
          errors.push({ studentId, error: error.message })
        }
      }

      // Clear selection and reload members
      clearSelection()
      await loadMembers()
      onUpdate?.() // Notify parent to refresh orchestra data

      // Show results
      if (results.length > 0) {
        console.log(`✅ Successfully added ${results.length} members to orchestra`)
      }

      if (errors.length > 0) {
        const errorMessage = `הצליח להוסיף ${results.length} מתוך ${selectedIds.length} חברים. שגיאות: ${errors.length}`
        setError(errorMessage)
      }

    } catch (error) {
      console.error('Error adding multiple members:', error)
      const errorMessage = error.message || 'שגיאה לא ידועה'
      setError(`שגיאה בהוספת חברים לתזמורת: ${errorMessage}`)
    } finally {
      setIsAddingMultiple(false)
    }
  }

  // Filter available students based on search
  const filteredAvailableStudents = availableStudents.filter(student =>
    !searchQuery ||
    getDisplayName(student.personalInfo).toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.academicInfo?.class?.includes(searchQuery) ||
    student.primaryInstrument?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading || isLoadingMembers) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!orchestra) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">לא נמצאו נתוני תזמורת</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          חברי התזמורת ({members.length})
        </h3>
        {canEdit() && (
          <div className="flex gap-2">
            {selectedStudentIds.size > 0 && (
              <>
                <button
                  onClick={handleAddMultipleMembers}
                  disabled={isAddingMultiple}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4 ml-1" />
                  {isAddingMultiple ? 'מוסיף...' : `הוסף ${selectedStudentIds.size} חברים`}
                </button>
                <button
                  onClick={clearSelection}
                  className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ביטול בחירה
                </button>
              </>
            )}
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף חבר
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Add Member Section */}
      {showAddMember && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חיפוש תלמידים לפי שם, כיתה או כלי..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            {filteredAvailableStudents.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={selectAllAvailableStudents}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  בחר הכל
                </button>
                {selectedStudentIds.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    בטל בחירה
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => {
                setShowAddMember(false)
                setSearchQuery('')
                clearSelection()
              }}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              ביטול
            </button>
          </div>
          
          {selectedStudentIds.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  נבחרו {selectedStudentIds.size} תלמידים
                </span>
                <button
                  onClick={handleAddMultipleMembers}
                  disabled={isAddingMultiple}
                  className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4 ml-1" />
                  {isAddingMultiple ? 'מוסיף...' : 'הוסף לתזמורת'}
                </button>
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {filteredAvailableStudents.length > 0 ? (
              <div className="space-y-2">
                {filteredAvailableStudents.map((student) => {
                  const isSelected = selectedStudentIds.has(student._id)
                  return (
                    <div key={student._id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudentSelection(student._id)}
                          className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {getDisplayName(student.personalInfo)}
                          </div>
                          <div className="text-sm text-gray-500">
                            כיתה {student.academicInfo?.class} | {student.primaryInstrument || 'לא צוין כלי'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddMember(student._id)}
                          className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          <UserPlus className="w-4 h-4 ml-1" />
                          הוסף
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>
                  {searchQuery ? 'לא נמצאו תלמידים תואמים' : 'אין תלמידים זמינים להוספה'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Members List */}
      {members.length > 0 ? (
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member._id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center ml-3">
                  <span className="text-sm text-primary-600">
                    {getDisplayName(member.personalInfo).charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {getDisplayName(member.personalInfo)}
                  </div>
                  <div className="text-sm text-gray-500">
                    כיתה {member.academicInfo?.class} | {member.primaryInstrument || 'לא צוין כלי'}
                  </div>
                  {member.personalInfo?.phone && (
                    <div className="text-xs text-gray-400">
                      {member.personalInfo.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewStudentProfile(member._id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="צפה בפרופיל"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canEdit() && (
                  <button
                    onClick={() => handleRemoveMember(member._id, getDisplayName(member.personalInfo))}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="הסר מהתזמורת"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין חברים בתזמורת</h3>
          <p className="text-gray-600 mb-4">
            {canEdit() ? 'התחל על ידי הוספת התלמיד הראשון' : 'אין חברים רשומים בתזמורת זו'}
          </p>
          {canEdit() && (
            <button
              onClick={() => setShowAddMember(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף חבר ראשון
            </button>
          )}
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveModal.isOpen}
        title="הסרת חבר מהתזמורת"
        message={`האם אתה בטוח שברצונך להסיר את ${showRemoveModal.studentName} מהתזמורת?`}
        confirmText="הסר"
        cancelText="ביטול"
        onConfirm={confirmRemoveMember}
        onCancel={() => setShowRemoveModal({ isOpen: false })}
        variant="danger"
      />
    </div>
  )
}

export default MembersTab