import React, { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { rolesService } from '../../services/apiService'
import { ROLE_TIERS, INSTRUMENT_DEPARTMENTS } from '../../constants/enums'
import { getDisplayName } from '../../utils/nameUtils'
import toast from 'react-hot-toast'

interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
  }
  roles: string[]
  coordinatorDepartments?: string[]
}

interface EditRoleModalProps {
  isOpen: boolean
  onClose: () => void
  teacher: Teacher | null
  onSaved: () => void
}

const ERROR_MESSAGES: Record<string, string> = {
  LAST_ADMIN: 'לא ניתן להסיר את המנהל האחרון במערכת',
  INVALID_ROLES: 'תפקידים לא חוקיים',
  INVALID_DEPARTMENTS: 'מחלקות לא חוקיות',
}

export default function EditRoleModal({ isOpen, onClose, teacher, onSaved }: EditRoleModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (teacher && isOpen) {
      setSelectedRoles(teacher.roles || [])
      setSelectedDepartments(teacher.coordinatorDepartments || [])
    }
  }, [teacher, isOpen])

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      const updated = prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]

      // Clear departments when department coordinator is unchecked
      if (role === 'רכז/ת מחלקתי' && !updated.includes('רכז/ת מחלקתי')) {
        setSelectedDepartments([])
      }

      return updated
    })
  }

  const handleDepartmentToggle = (dept: string) => {
    setSelectedDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    )
  }

  const handleSave = async () => {
    if (!teacher || selectedRoles.length === 0) return

    try {
      setSaving(true)
      const data: { roles: string[]; coordinatorDepartments?: string[] } = {
        roles: selectedRoles,
      }

      if (selectedRoles.includes('רכז/ת מחלקתי')) {
        data.coordinatorDepartments = selectedDepartments
      }

      await rolesService.updateTeacherRoles(teacher._id, data)
      toast.success('התפקידים עודכנו בהצלחה')
      onSaved()
      onClose()
    } catch (error: any) {
      const errorCode = error?.response?.data?.code || error?.response?.data?.error
      const message = ERROR_MESSAGES[errorCode] || error?.response?.data?.error || 'שגיאה בעדכון התפקידים'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (!teacher) return null

  const teacherName = getDisplayName(teacher.personalInfo) || 'ללא שם'
  const showDepartments = selectedRoles.includes('רכז/ת מחלקתי')
  const departmentNames = Object.keys(INSTRUMENT_DEPARTMENTS)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`עריכת תפקידים - ${teacherName}`} maxWidth="lg">
      <div className="space-y-5 py-2" dir="rtl">
        {/* Role checkboxes grouped by tier */}
        {ROLE_TIERS.map(tier => (
          <div key={tier.label}>
            <h4 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1">
              {tier.label}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tier.roles.map(role => (
                <label
                  key={role}
                  className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                  />
                  <span className="text-sm text-gray-800">{role}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Department selection for department coordinator */}
        {showDepartments && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-blue-800 mb-2">מחלקות לריכוז</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {departmentNames.map(dept => (
                <label
                  key={dept}
                  className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-blue-100/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(dept)}
                    onChange={() => handleDepartmentToggle(dept)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-blue-900">{dept}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedRoles.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
