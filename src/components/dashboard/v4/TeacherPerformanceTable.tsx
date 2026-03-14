import { useState } from 'react'
import { ArrowsClockwise as ArrowsClockwiseIcon } from '@phosphor-icons/react'
import { Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, User } from '@heroui/react'
import { getWorkloadColor } from '../../../utils/workloadColors'
import { getAvatarColorHex } from '../../../utils/avatarColorHash'

interface Teacher {
  id: string
  name: string
  department: string
  studentCount: number
  weeklyHours?: number
  isActive: boolean
  avatarUrl?: string | null
}

interface TeacherPerformanceTableProps {
  teachers: Teacher[]
  loading?: boolean
  isRecalculating?: boolean
  onRecalculate?: () => void
  error?: string | null
}

function getWorkloadBarColor(hours: number): string {
  if (hours >= 20) return 'bg-red-400'
  if (hours >= 15) return 'bg-amber-400'
  return 'bg-emerald-400'
}

function TeacherRow({ teacher }: { teacher: Teacher }) {
  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
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
          <span className={`text-sm font-bold ${getWorkloadColor(teacher.weeklyHours || 0).text}`}>
            {teacher.weeklyHours || 0}
          </span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 max-w-[80px]">
            <div
              className={`h-full rounded-full ${getWorkloadBarColor(teacher.weeklyHours || 0)}`}
              style={{ width: `${Math.min((teacher.weeklyHours || 0) / 30 * 100, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-8 py-4">
        {teacher.isActive ? (
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
            פעיל
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-bold">
            לא פעיל
          </span>
        )}
      </td>
    </tr>
  )
}

const TABLE_HEADERS = (
  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
    <tr>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">מורה</th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">מחלקה</th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">תלמידים</th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">ש"ש</th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">סטטוס</th>
    </tr>
  </thead>
)

export function TeacherPerformanceTable({ teachers, loading, isRecalculating, onRecalculate, error }: TeacherPerformanceTableProps) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('preview')

  const sortedTeachers = [...teachers].sort((a, b) => (b.weeklyHours || 0) - (a.weeklyHours || 0))
  const displayTeachers = sortedTeachers.slice(0, 6)

  const handleTabChange = (key: string) => {
    if (key === 'all') {
      setShowAllModal(true)
      // Keep visual on preview so the tab snaps back after modal opens
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
      <div className="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
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
      <div className="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">עומס עבודה — סגל הוראה</h2>
        </div>
        <div className="p-8 text-center text-slate-400 text-sm">אין נתוני מורים להצגה</div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
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
              <TeacherRow key={teacher.id} teacher={teacher} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Full teacher list modal */}
      <Modal
        isOpen={showAllModal}
        onOpenChange={setShowAllModal}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          base: 'rounded-2xl',
          header: 'border-b border-slate-100 dark:border-slate-800',
          body: 'p-0',
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-lg font-bold">עומס עבודה — כל סגל ההוראה ({sortedTeachers.length})</h2>
          </ModalHeader>
          <ModalBody>
            <table className="w-full text-right" dir="rtl">
              {TABLE_HEADERS}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedTeachers.map((teacher) => (
                  <TeacherRow key={teacher.id} teacher={teacher} />
                ))}
              </tbody>
            </table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
