import { useState, useMemo } from 'react'
import { ArrowsClockwise as ArrowsClockwiseIcon, MagnifyingGlassIcon, XIcon, FunnelIcon } from '@phosphor-icons/react'
import { Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, User, Chip, Button, Input, Select, SelectItem } from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAvatarColorHex } from '../../../utils/avatarColorHash'
import { getRoleChipColor } from '../../../utils/roleColors'
import { BorderBeam } from '../../ui/BorderBeam'

interface Teacher {
  id: string
  name: string
  department: string
  studentCount: number
  weeklyHours?: number
  isActive: boolean
  avatarUrl?: string | null
  roles?: string[]
}

interface TeacherPerformanceTableProps {
  teachers: Teacher[]
  loading?: boolean
  isRecalculating?: boolean
  onRecalculate?: () => void
  error?: string | null
}

interface WorkloadFilters {
  search: string
  department: string
  role: string
  hoursMin: string
  hoursMax: string
}

const DEFAULT_FILTERS: WorkloadFilters = {
  search: '',
  department: '',
  role: '',
  hoursMin: '',
  hoursMax: '',
}

function RoleChips({ roles }: { roles: string[] }) {
  if (!roles || roles.length === 0) {
    return <span className="text-xs text-slate-400">—</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Chip
          key={role}
          variant="bordered"
          size="sm"
          classNames={{
            base: `border-${getRoleChipColor(role)} text-${getRoleChipColor(role)}`,
            content: 'text-[10px] font-bold px-1',
          }}
          style={{
            borderColor: getRoleChipColor(role),
            color: getRoleChipColor(role),
          }}
        >
          {role}
        </Chip>
      ))}
    </div>
  )
}

function TeacherRow({ teacher, index }: { teacher: Teacher; index: number }) {
  return (
    <motion.tr
      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03,
        ease: [0.16, 1, 0.3, 1],
      }}
      layout
    >
      <td className="px-8 py-4">
        <User
          avatarProps={{
            radius: 'full',
            size: 'md',
            showFallback: true,
            name: teacher.name,
            style: { backgroundColor: getAvatarColorHex(teacher.name), color: '#fff' },
          }}
          name={teacher.name}
          description={teacher.department || ''}
          classNames={{ name: 'text-sm font-bold', description: 'text-xs text-slate-400' }}
        />
      </td>
      <td className="px-8 py-4">
        <span className="text-sm text-slate-500 font-medium">{teacher.department}</span>
      </td>
      <td className="px-8 py-4 text-center">
        <span className="text-sm font-bold">{teacher.studentCount}</span>
      </td>
      <td className="px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: '#46ab7d' }}>
            {teacher.weeklyHours || 0}
          </span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 max-w-[120px]">
            <div
              className="h-full rounded-full"
              style={{ backgroundColor: '#46ab7d', width: `${Math.min((teacher.weeklyHours || 0) / 30 * 100, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-8 py-4">
        <RoleChips roles={teacher.roles || []} />
      </td>
    </motion.tr>
  )
}

const TABLE_HEADERS = (
  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
    <tr>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[200px]">מורה</th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">מחלקה</th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">תלמידים</th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[180px]">ש"ש</th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">תפקיד</th>
    </tr>
  </thead>
)

const GLASS_SURFACE = {
  background: 'linear-gradient(135deg, rgba(240,247,255,0.85) 0%, rgba(186,230,253,0.2) 50%, rgba(240,247,255,0.8) 100%)',
  boxShadow: `
    0 4px 16px rgba(0,140,210,0.08),
    0 2px 6px rgba(0,140,210,0.05),
    inset 0 1px 2px rgba(255,255,255,0.95),
    inset 0 -1px 3px rgba(0,140,210,0.04),
    0 0 0 0.5px rgba(255,255,255,0.5)
  `,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(200,220,240,0.5)',
} as const

/** Glass-style filter bar for the workload modal */
function WorkloadFilterBar({
  filters,
  onChange,
  onReset,
  departments,
  roles,
  activeCount,
  filteredCount,
  totalCount,
}: {
  filters: WorkloadFilters
  onChange: (filters: WorkloadFilters) => void
  onReset: () => void
  departments: string[]
  roles: string[]
  activeCount: number
  filteredCount: number
  totalCount: number
}) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl mt-3 px-5 py-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      dir="rtl"
      style={GLASS_SURFACE}
    >
      {/* Top glossy reflection band */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[40%] rounded-t-xl"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
        }}
      />
      {/* Edge highlight */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.95) 50%, transparent 90%)',
        }}
      />

      <div className="relative z-10 space-y-3">
        {/* Top row: label + clear */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500">
            <FunnelIcon className="h-4 w-4" weight="duotone" />
            <span className="text-xs font-bold tracking-wide">סינון</span>
          </div>
          <AnimatePresence>
            {activeCount > 0 && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Chip
                  size="sm"
                  variant="flat"
                  color="primary"
                  classNames={{ content: 'text-[11px] font-bold' }}
                >
                  {filteredCount} / {totalCount}
                </Chip>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  aria-label="נקה מסננים"
                  onPress={onReset}
                  className="h-7 rounded-lg gap-1 px-2"
                  startContent={<XIcon className="h-3 w-3" weight="bold" />}
                >
                  <span className="text-[11px]">נקה</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter inputs grid — 4 columns using full width */}
        <div className="grid grid-cols-4 gap-3">
          {/* Search */}
          <Input
            size="sm"
            variant="bordered"
            label="חיפוש"
            placeholder="שם מורה..."
            value={filters.search}
            onValueChange={(val) => onChange({ ...filters, search: val })}
            startContent={<MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400" />}
            isClearable
            onClear={() => onChange({ ...filters, search: '' })}
            classNames={{
              inputWrapper: 'bg-white/80 dark:bg-white/10 border-slate-200/60 hover:border-primary/40 focus-within:border-primary/50 shadow-sm transition-colors',
              input: 'text-sm placeholder:text-slate-400',
              label: 'text-[11px] font-semibold text-slate-500',
              clearButton: 'text-slate-400',
            }}
          />

          {/* Department */}
          <Select
            size="sm"
            variant="bordered"
            label="מחלקה"
            placeholder="כל המחלקות"
            selectedKeys={filters.department ? [filters.department] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string
              onChange({ ...filters, department: val || '' })
            }}
            classNames={{
              trigger: 'bg-white/80 dark:bg-white/10 border-slate-200/60 hover:border-primary/40 data-[focus=true]:border-primary/50 shadow-sm transition-colors',
              value: 'text-sm',
              label: 'text-[11px] font-semibold text-slate-500',
              popoverContent: 'rounded-xl shadow-lg border border-slate-100',
            }}
            aria-label="סינון לפי מחלקה"
          >
            {departments.map(d => (
              <SelectItem key={d}>{d}</SelectItem>
            ))}
          </Select>

          {/* Role */}
          <Select
            size="sm"
            variant="bordered"
            label="תפקיד"
            placeholder="כל התפקידים"
            selectedKeys={filters.role ? [filters.role] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string
              onChange({ ...filters, role: val || '' })
            }}
            classNames={{
              trigger: 'bg-white/80 dark:bg-white/10 border-slate-200/60 hover:border-primary/40 data-[focus=true]:border-primary/50 shadow-sm transition-colors',
              value: 'text-sm',
              label: 'text-[11px] font-semibold text-slate-500',
              popoverContent: 'rounded-xl shadow-lg border border-slate-100',
            }}
            aria-label="סינון לפי תפקיד"
          >
            {roles.map(r => (
              <SelectItem key={r}>{r}</SelectItem>
            ))}
          </Select>

          {/* Hours range */}
          <div className="flex items-end gap-2">
            <Input
              size="sm"
              variant="bordered"
              type="number"
              label='ש"ש מינימום'
              placeholder="מ"
              value={filters.hoursMin}
              onValueChange={(val) => onChange({ ...filters, hoursMin: val })}
              classNames={{
                inputWrapper: 'bg-white/80 dark:bg-white/10 border-slate-200/60 hover:border-primary/40 shadow-sm transition-colors',
                input: 'text-sm text-center',
                label: 'text-[11px] font-semibold text-slate-500',
              }}
              min={0}
              aria-label="שעות מינימום"
            />
            <span className="text-slate-300 text-sm font-bold pb-2">—</span>
            <Input
              size="sm"
              variant="bordered"
              type="number"
              label="מקסימום"
              placeholder="עד"
              value={filters.hoursMax}
              onValueChange={(val) => onChange({ ...filters, hoursMax: val })}
              classNames={{
                inputWrapper: 'bg-white/80 dark:bg-white/10 border-slate-200/60 hover:border-primary/40 shadow-sm transition-colors',
                input: 'text-sm text-center',
                label: 'text-[11px] font-semibold text-slate-500',
              }}
              min={0}
              aria-label="שעות מקסימום"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function TeacherPerformanceTable({ teachers, loading, isRecalculating, onRecalculate, error }: TeacherPerformanceTableProps) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('preview')
  const [filters, setFilters] = useState<WorkloadFilters>(DEFAULT_FILTERS)

  const sortedTeachers = [...teachers].sort((a, b) => (b.weeklyHours || 0) - (a.weeklyHours || 0))
  const displayTeachers = sortedTeachers.slice(0, 6)

  // Extract unique departments and roles from data
  const { departments, roles } = useMemo(() => {
    const deptSet = new Set<string>()
    const roleSet = new Set<string>()
    teachers.forEach(t => {
      if (t.department) deptSet.add(t.department)
      t.roles?.forEach(r => roleSet.add(r))
    })
    return {
      departments: [...deptSet].sort(),
      roles: [...roleSet].sort(),
    }
  }, [teachers])

  // Apply filters
  const filteredTeachers = useMemo(() => {
    return sortedTeachers.filter(t => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!t.name.toLowerCase().includes(q) && !t.department?.toLowerCase().includes(q)) return false
      }
      if (filters.department && t.department !== filters.department) return false
      if (filters.role && !(t.roles || []).includes(filters.role)) return false
      if (filters.hoursMin && (t.weeklyHours || 0) < Number(filters.hoursMin)) return false
      if (filters.hoursMax && (t.weeklyHours || 0) > Number(filters.hoursMax)) return false
      return true
    })
  }, [sortedTeachers, filters])

  const activeFilterCount = [filters.search, filters.department, filters.role, filters.hoursMin, filters.hoursMax]
    .filter(Boolean).length

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  // Reset filters when modal closes
  const handleModalChange = (open: boolean) => {
    setShowAllModal(open)
    if (!open) resetFilters()
  }

  const handleTabChange = (key: string) => {
    if (key === 'all') {
      setShowAllModal(true)
      setTimeout(() => setActiveTab('preview'), 150)
    } else if (key === 'recalculate') {
      onRecalculate?.()
      setTimeout(() => setActiveTab('preview'), 150)
    } else {
      setActiveTab(key)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">עומס עבודה — סגל הוראה</h2>
        </div>
        <div className="p-8 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (displayTeachers.length === 0) {
    return (
      <div className="bg-white dark:bg-sidebar-dark rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">עומס עבודה — סגל הוראה</h2>
        </div>
        <div className="p-8 text-center text-slate-400 text-sm">אין נתוני מורים להצגה</div>
      </div>
    )
  }

  return (
    <>
      <div className="relative bg-white dark:bg-sidebar-dark rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <BorderBeam duration={12} size={150} />
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">עומס עבודה — סגל הוראה</h2>
          <Tabs
            aria-label="פעולות טבלת מורים"
            selectedKey={activeTab}
            onSelectionChange={(key) => handleTabChange(key as string)}
            variant="solid"
            color="primary"
            size="sm"
            classNames={{
              tabList: 'bg-slate-100 dark:bg-slate-800 rounded-xl p-1',
              cursor: 'bg-white dark:bg-slate-700 shadow-sm',
              tab: 'px-4 h-8 text-xs font-bold',
              tabContent: 'group-data-[selected=true]:text-primary',
            }}
          >
            <Tab key="preview" title="תצוגה מקדימה" />
            <Tab key="all" title="הצג הכל" />
            {onRecalculate && (
              <Tab
                key="recalculate"
                title={
                  <span className="flex items-center gap-1">
                    <ArrowsClockwiseIcon size={12} weight="bold" className={isRecalculating ? 'animate-spin' : ''} />
                    {isRecalculating ? 'מחשב...' : 'חשב מחדש'}
                  </span>
                }
              />
            )}
          </Tabs>
        </div>

        {error && (
          <div className="mx-8 mt-4 px-4 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium text-right">
            {error}
          </div>
        )}

        <table className="w-full text-right">
          {TABLE_HEADERS}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayTeachers.map((teacher) => (
              <TeacherRow key={teacher.id} teacher={teacher} index={0} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Full teacher list modal with filters */}
      <Modal
        isOpen={showAllModal}
        onOpenChange={handleModalChange}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          base: 'rounded-2xl',
          header: 'border-b-0 pb-0 flex-col gap-0',
          body: 'p-0',
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center justify-between w-full pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                עומס עבודה — כל סגל ההוראה
                <Chip size="sm" variant="flat" color="default" classNames={{ content: 'text-xs font-bold' }}>
                  {filteredTeachers.length === sortedTeachers.length
                    ? sortedTeachers.length
                    : `${filteredTeachers.length} / ${sortedTeachers.length}`
                  }
                </Chip>
              </h2>
            </div>
            <WorkloadFilterBar
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
              departments={departments}
              roles={roles}
              activeCount={activeFilterCount}
              filteredCount={filteredTeachers.length}
              totalCount={sortedTeachers.length}
            />
          </ModalHeader>
          <ModalBody>
            <table className="w-full text-right" dir="rtl">
              {TABLE_HEADERS}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <AnimatePresence mode="popLayout">
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher, i) => (
                      <TeacherRow key={teacher.id} teacher={teacher} index={i} />
                    ))
                  ) : (
                    <motion.tr
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={5} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FunnelIcon className="h-8 w-8 text-slate-300" />
                          <p className="text-sm text-slate-400">לא נמצאו מורים התואמים את המסננים</p>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={resetFilters}
                            startContent={<XIcon className="h-3.5 w-3.5" />}
                          >
                            נקה מסננים
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
