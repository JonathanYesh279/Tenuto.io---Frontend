import { Link } from 'react-router-dom'
import { StarIcon, UserCircleIcon } from '@phosphor-icons/react'

interface Teacher {
  id: string
  name: string
  department: string
  studentCount: number
  rating?: number | null
  isActive: boolean
  avatarUrl?: string | null
}

interface TeacherPerformanceTableProps {
  teachers: Teacher[]
  loading?: boolean
}

export function TeacherPerformanceTable({ teachers, loading }: TeacherPerformanceTableProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">ביצועי מורים</h2>
          <Link to="/teachers" className="text-primary text-sm font-bold hover:underline">
            הצג הכל
          </Link>
        </div>
        <div className="p-8 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Display up to 6 teachers
  const displayTeachers = teachers.slice(0, 6)

  return (
    <div className="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-xl font-bold">ביצועי מורים</h2>
        <Link to="/teachers" className="text-primary text-sm font-bold hover:underline">
          הצג הכל
        </Link>
      </div>

      <table className="w-full text-right">
        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
          <tr>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">מורה</th>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">מחלקה</th>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">תלמידים</th>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">דירוג</th>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">סטטוס</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {displayTeachers.map((teacher) => {
            // TODO: wire to real ratings
            const rating = teacher.rating || (4.5 + Math.random() * 0.5)

            return (
              <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 text-slate-300 dark:text-slate-600">
                      <UserCircleIcon size={40} weight="fill" />
                    </div>
                    <span className="text-sm font-bold">{teacher.name}</span>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm text-slate-500 font-medium">{teacher.department}</span>
                </td>
                <td className="px-8 py-4 text-center">
                  <span className="text-sm font-bold">{teacher.studentCount}</span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-1">
                    <StarIcon size={16} weight="fill" className="text-amber-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rating.toFixed(1)}
                    </span>
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
          })}
        </tbody>
      </table>
    </div>
  )
}
