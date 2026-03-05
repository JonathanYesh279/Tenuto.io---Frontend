import React, { useState, useEffect } from 'react'
import { rolesService } from '../../services/apiService'
import { ADMIN_TIER_ROLES, COORDINATOR_ROLES } from '../../constants/enums'
import { getDisplayName } from '../../utils/nameUtils'
import EditRoleModal from './EditRoleModal'
import toast from 'react-hot-toast'
import { PencilSimple as PencilSimpleIcon } from '@phosphor-icons/react'

interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
  }
  roles: string[]
  coordinatorDepartments?: string[]
  isActive?: boolean
}

function getRoleBadgeColor(role: string): string {
  if (ADMIN_TIER_ROLES.includes(role as any)) {
    return 'bg-red-100 text-red-800'
  }
  if (COORDINATOR_ROLES.includes(role as any)) {
    return 'bg-blue-100 text-blue-800'
  }
  if (role === 'צפייה בלבד') {
    return 'bg-gray-100 text-gray-600'
  }
  return 'bg-green-100 text-green-800'
}

export default function StaffRoleTable() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await rolesService.getRoles()
      const teacherList = result?.teachers || []

      // Sort: active first, then by lastName alphabetically
      const sorted = [...teacherList].sort((a: Teacher, b: Teacher) => {
        const aActive = a.isActive !== false ? 0 : 1
        const bActive = b.isActive !== false ? 0 : 1
        if (aActive !== bActive) return aActive - bActive

        const aName = a.personalInfo?.lastName || a.personalInfo?.firstName || ''
        const bName = b.personalInfo?.lastName || b.personalInfo?.firstName || ''
        return aName.localeCompare(bName, 'he')
      })

      setTeachers(sorted)
    } catch (error) {
      console.error('Error loading staff roles:', error)
      toast.error('שגיאה בטעינת רשימת הצוות')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaved = () => {
    loadData()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center justify-center min-h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-gray-600 text-sm">טוען רשימת צוות...</div>
          </div>
        </div>
      </div>
    )
  }

  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="text-center text-gray-400 py-8">
          <p className="text-sm">לא נמצאו אנשי צוות</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800">ניהול תפקידים</h3>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {teachers.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">שם</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">תפקידים</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">סטטוס</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 w-20">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => {
                const name = getDisplayName(teacher.personalInfo) || 'ללא שם'
                const isActive = teacher.isActive !== false
                const roles = teacher.roles || []

                return (
                  <tr
                    key={teacher._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-gray-800">{name}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {roles.length === 0 ? (
                          <span className="text-xs text-gray-400">ללא תפקידים</span>
                        ) : (
                          roles.map(role => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}
                            >
                              {role}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isActive ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setEditingTeacher(teacher)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                        title="ערוך תפקידים"
                      >
                        <PencilSimpleIcon size={16} weight="regular" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditRoleModal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        teacher={editingTeacher}
        onSaved={handleSaved}
      />
    </>
  )
}
