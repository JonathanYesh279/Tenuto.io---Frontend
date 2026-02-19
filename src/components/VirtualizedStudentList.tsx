import React, { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import StudentCard from './StudentCard'
import Table from './ui/Table'

interface VirtualizedStudentListProps {
  students: any[]
  viewMode: 'table' | 'grid'
  onStudentClick: (studentId: string) => void
  onStudentEdit: (studentId: string) => void
  onStudentDelete: (studentId: string, name: string) => void
}

// Memoized row renderer for table view
const TableRow = React.memo(({ index, style, data }: any) => {
  const student = data.students[index]
  const { onRowClick } = data
  
  return (
    <div style={style} className="flex items-center hover:bg-gray-50 px-4">
      <div 
        className="flex-1 flex items-center py-3 cursor-pointer"
        onClick={() => onRowClick(student)}
      >
        <div className="w-1/4 truncate">{student.name}</div>
        <div className="w-1/6">{student.instrument}</div>
        <div className="w-1/12 text-center">{student.stageLevel}</div>
        <div className="w-1/6">{student.orchestra}</div>
        <div className="w-1/12 text-center">{student.grade}</div>
        <div className="w-1/12 text-center">{student.status}</div>
        <div className="w-1/6 flex justify-end">{student.actions}</div>
      </div>
    </div>
  )
})

// Memoized card renderer for grid view
const GridCard = React.memo(({ index, style, data }: any) => {
  const student = data.students[index]
  const { onStudentClick, onStudentDelete } = data
  
  return (
    <div style={style} className="p-2">
      <StudentCard
        student={student.originalStudent}
        showInstruments={true}
        showTeacherAssignments={true}
        showParentContact={false}
        onClick={() => onStudentClick(student.id)}
        onDelete={() => onStudentDelete(student.id, student.name)}
        className="h-full hover:shadow-lg transition-all duration-200"
      />
    </div>
  )
})

export const VirtualizedStudentList: React.FC<VirtualizedStudentListProps> = React.memo(({
  students,
  viewMode,
  onStudentClick,
  onStudentEdit,
  onStudentDelete
}) => {
  // Calculate item size based on view mode
  const itemSize = viewMode === 'table' ? 56 : 280 // Table row height vs Card height
  
  // Prepare data for renderers
  const itemData = useMemo(() => ({
    students,
    onStudentClick,
    onStudentEdit,
    onStudentDelete,
    onRowClick: (student: any) => onStudentClick(student.id)
  }), [students, onStudentClick, onStudentEdit, onStudentDelete])
  
  // Choose renderer based on view mode
  const ItemRenderer = viewMode === 'table' ? TableRow : GridCard
  
  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        לא נמצאו תלמידים התואמים לחיפוש
      </div>
    )
  }
  
  return (
    <div className="h-[600px] border rounded bg-white">
      {viewMode === 'table' && (
        <div className="flex items-center bg-gray-50 px-4 py-2 border-b font-medium text-sm text-gray-700">
          <div className="w-1/4">שם התלמיד</div>
          <div className="w-1/6">כלי נגינה</div>
          <div className="w-1/12 text-center">שלב</div>
          <div className="w-1/6">תזמורת</div>
          <div className="w-1/12 text-center">כיתה</div>
          <div className="w-1/12 text-center">סטטוס</div>
          <div className="w-1/6 text-center">פעולות</div>
        </div>
      )}
      
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={viewMode === 'table' ? height - 40 : height}
            itemCount={students.length}
            itemSize={itemSize}
            width={width}
            itemData={itemData}
            overscanCount={5}
          >
            {ItemRenderer}
          </List>
        )}
      </AutoSizer>
    </div>
  )
})

// Export utilities for performance monitoring
export const useVirtualizationMetrics = () => {
  const [metrics, setMetrics] = React.useState({
    visibleStart: 0,
    visibleStop: 0,
    renderedItems: 0
  })
  
  const onItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }: any) => {
    setMetrics({
      visibleStart: visibleStartIndex,
      visibleStop: visibleStopIndex,
      renderedItems: visibleStopIndex - visibleStartIndex + 1
    })
  }, [])
  
  return { metrics, onItemsRendered }
}