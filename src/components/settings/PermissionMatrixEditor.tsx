import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { rolesService } from '../../services/apiService'
import {
  TEACHER_ROLES,
  ADMIN_TIER_ROLES,
  PERMISSION_DOMAIN_LABELS,
  PERMISSION_ACTIONS_BY_DOMAIN,
  ACTION_LABELS,
  SCOPE_LABELS,
  LOCKED_DOMAINS,
} from '../../constants/enums'
import { Lock as LockIcon, Info as InfoIcon } from '@phosphor-icons/react'
import toast from 'react-hot-toast'

type ScopeValue = 'all' | 'department' | 'own' | ''

interface PermissionMatrixEditorProps {
  rolePermissions: Record<string, Record<string, Record<string, string>>>
  onPermissionsChanged: () => void
}

const SCOPE_CYCLE: ScopeValue[] = ['', 'own', 'department', 'all']

function getScopeBadgeStyle(scope: string): string {
  switch (scope) {
    case 'all':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'department':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'own':
      return 'bg-amber-100 text-amber-800 border border-amber-200'
    default:
      return ''
  }
}

export default function PermissionMatrixEditor({
  rolePermissions,
  onPermissionsChanged,
}: PermissionMatrixEditorProps) {
  // Default to first non-admin role
  const defaultRole = useMemo(
    () => TEACHER_ROLES.find(r => !ADMIN_TIER_ROLES.includes(r as any)) || TEACHER_ROLES[0],
    []
  )

  const [selectedRole, setSelectedRole] = useState<string>(defaultRole)
  const [editedPermissions, setEditedPermissions] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState(false)

  // All unique actions across all domains (for column headers)
  const allActions = useMemo(() => {
    const actionSet = new Set<string>()
    Object.values(PERMISSION_ACTIONS_BY_DOMAIN).forEach(actions => {
      actions.forEach(a => actionSet.add(a))
    })
    return Array.from(actionSet)
  }, [])

  const domains = useMemo(() => Object.keys(PERMISSION_DOMAIN_LABELS), [])

  const isAdminTier = useMemo(
    () => ADMIN_TIER_ROLES.includes(selectedRole as any),
    [selectedRole]
  )

  // Clone permissions from props when role changes
  useEffect(() => {
    const perms = rolePermissions?.[selectedRole]
    if (perms) {
      setEditedPermissions(JSON.parse(JSON.stringify(perms)))
    } else {
      setEditedPermissions({})
    }
  }, [selectedRole, rolePermissions])

  // Track dirty state
  const hasChanges = useMemo(() => {
    const original = rolePermissions?.[selectedRole] || {}
    return JSON.stringify(editedPermissions) !== JSON.stringify(original)
  }, [editedPermissions, rolePermissions, selectedRole])

  const handleCellClick = useCallback(
    (domain: string, action: string) => {
      if (isAdminTier) return
      if ((LOCKED_DOMAINS as readonly string[]).includes(domain)) return

      setEditedPermissions(prev => {
        const next = { ...prev }
        const domainPerms = { ...(next[domain] || {}) }
        const currentScope = (domainPerms[action] || '') as ScopeValue
        const currentIndex = SCOPE_CYCLE.indexOf(currentScope)
        const nextScope = SCOPE_CYCLE[(currentIndex + 1) % SCOPE_CYCLE.length]

        if (nextScope === '') {
          delete domainPerms[action]
        } else {
          domainPerms[action] = nextScope
        }

        // Clean up empty domain objects
        if (Object.keys(domainPerms).length === 0) {
          delete next[domain]
        } else {
          next[domain] = domainPerms
        }

        return next
      })
    },
    [isAdminTier]
  )

  const handleSave = async () => {
    if (isAdminTier || !hasChanges) return
    try {
      setSaving(true)
      await rolesService.updateRolePermissions(selectedRole, editedPermissions)
      toast.success('ההרשאות עודכנו בהצלחה')
      onPermissionsChanged()
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'שגיאה בשמירת ההרשאות'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (isAdminTier) return
    try {
      setSaving(true)
      const result = await rolesService.resetRolePermissions(selectedRole)
      // Update local state with returned defaults
      if (result?.permissions) {
        setEditedPermissions(JSON.parse(JSON.stringify(result.permissions)))
      }
      toast.success('ההרשאות אופסו לברירת מחדל')
      onPermissionsChanged()
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'שגיאה באיפוס ההרשאות'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const getCellScope = (domain: string, action: string): string => {
    return editedPermissions?.[domain]?.[action] || ''
  }

  const isDomainLocked = (domain: string): boolean => {
    return !isAdminTier && (LOCKED_DOMAINS as readonly string[]).includes(domain)
  }

  const domainHasAction = (domain: string, action: string): boolean => {
    return (PERMISSION_ACTIONS_BY_DOMAIN[domain] || []).includes(action)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      {/* Role dropdown */}
      <div className="mb-4">
        <label htmlFor="role-select" className="block text-xs font-medium text-gray-500 mb-1.5">
          בחר תפקיד
        </label>
        <select
          id="role-select"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {TEACHER_ROLES.map(role => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* Admin lockout banner */}
      {isAdminTier && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4 text-sm text-amber-800">
          <InfoIcon size={18} weight="fill" className="shrink-0" />
          <span>הרשאות הנהלה לא ניתנות לשינוי</span>
        </div>
      )}

      {/* Permission grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50 rounded-tr-lg">
                תחום
              </th>
              {allActions.map(action => (
                <th
                  key={action}
                  className="text-center py-2.5 px-2 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50"
                >
                  {ACTION_LABELS[action] || action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domains.map(domain => {
              const locked = isDomainLocked(domain)
              return (
                <tr
                  key={domain}
                  className={`border-b border-gray-100 ${locked ? 'bg-gray-50/70' : 'hover:bg-gray-50/50'} transition-colors`}
                >
                  <td className="py-2.5 px-3 font-medium text-gray-700">
                    <div className="flex items-center gap-1.5">
                      {locked && <LockIcon size={14} weight="fill" className="text-gray-400 shrink-0" />}
                      <span className={locked ? 'text-gray-400' : ''}>
                        {PERMISSION_DOMAIN_LABELS[domain]}
                      </span>
                    </div>
                  </td>
                  {allActions.map(action => {
                    const hasAction = domainHasAction(domain, action)
                    if (!hasAction) {
                      return (
                        <td key={action} className="py-2.5 px-2 text-center">
                          <span className="text-gray-200">—</span>
                        </td>
                      )
                    }

                    const scope = getCellScope(domain, action)
                    const cellDisabled = isAdminTier || locked

                    return (
                      <td key={action} className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleCellClick(domain, action)}
                          disabled={cellDisabled}
                          className={`inline-flex items-center justify-center min-w-[52px] px-2 py-0.5 text-xs rounded-full transition-colors ${
                            cellDisabled
                              ? 'cursor-not-allowed opacity-50'
                              : 'cursor-pointer hover:ring-1 hover:ring-primary/30'
                          } ${scope ? getScopeBadgeStyle(scope) : 'bg-gray-100 text-gray-400'}`}
                          title={
                            cellDisabled
                              ? locked
                                ? 'תחום נעול'
                                : 'הרשאות הנהלה לא ניתנות לשינוי'
                              : scope
                                ? `${SCOPE_LABELS[scope] || scope} — לחץ לשנות`
                                : 'לחץ להוסיף הרשאה'
                          }
                        >
                          {scope ? SCOPE_LABELS[scope] || scope : '—'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Save / Reset buttons */}
      {!isAdminTier && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            איפוס לברירת מחדל
          </button>
        </div>
      )}
    </div>
  )
}
