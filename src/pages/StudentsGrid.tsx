import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, Loader, Grid, List, Eye } from 'lucide-react'
import { Card } from '../components/ui/card'
import Table, { StatusBadge } from '../components/ui/Table'
import StudentCard from '../components/StudentCard'
import StudentForm from '../components/StudentForm'
import apiService from '../services/apiService'

export default function StudentsGrid() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filters, setFilters] = useState({
    orchestra: '',
    instrument: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState(null)

  // Fetch students from real API
  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.students.getStudents()
      
      // Transform API response to include both original and processed data
      const transformedStudents = response.map(student => ({
        // Original backend data structure for StudentCard
        original: student,
        // Processed data for Table view (legacy compatibility)
        id: student._id,
        name: student.personalInfo.fullName,
        instrument: student.academicInfo.instrumentProgress
          ?.find(inst => inst.isPrimary)?.instrumentName || 
          student.academicInfo.instrumentProgress?.[0]?.instrumentName || 'ללא כלי',
        orchestra: student.enrollments?.orchestraIds?.length > 0 ? 'תזמורת' : 'ללא תזמורת',
        grade: <StatusBadge status="completed">{student.academicInfo.class}</StatusBadge>,
        status: <StatusBadge status={student.isActive ? "active" : "inactive"}>
          {student.isActive ? 'פעיל' : 'לא פעיל'}
        </StatusBadge>,
        teacherAssignments: student.teacherAssignments?.length || 0,
        rawData: student,
        actions: (
          <div className="flex space-x-2 space-x-reverse">
            <button 
              className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Prevent row click when clicking the button
                handleViewStudent(student._id)
              }}
              title="צפה בפרטי התלמיד"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )
      }))
      
      setStudents(transformedStudents)
    } catch (err) {
      console.error('Error loading students:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewStudent = (studentId) => {
    // Clean the student ID and ensure it's valid
    const cleanStudentId = studentId?.toString().trim()
    
    if (!cleanStudentId) {
      console.error('Invalid student ID:', studentId)
      return
    }
    
    console.log('Navigating to student:', cleanStudentId)
    navigate(`/students/${cleanStudentId}`)
  }

  const handleEditStudent = (studentId) => {
    setEditingStudentId(studentId)
    setShowForm(true)
  }

  const handleAddStudent = () => {
    setEditingStudentId(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingStudentId(null)
  }

  const handleFormSave = () => {
    loadStudents() // Reload the students list
  }

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.instrument?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesOrchestra = !filters.orchestra || student.orchestra === filters.orchestra
    const matchesInstrument = !filters.instrument || student.instrument === filters.instrument
    
    return matchesSearch && matchesOrchestra && matchesInstrument
  })

  // Calculate statistics
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.rawData?.isActive).length
  const inactiveStudents = totalStudents - activeStudents
  const studentsWithLessons = students.filter(s => s.teacherAssignments > 0).length

  const columns = [
    { key: 'name', header: 'שם התלמיד' },
    { key: 'instrument', header: 'כלי נגינה' },
    { key: 'orchestra', header: 'תזמורת' },
    { key: 'grade', header: 'כיתה', align: 'center' as const },
    { key: 'status', header: 'סטטוס', align: 'center' as const },
    { key: 'actions', header: 'פעולות', align: 'center' as const, width: '100px' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <div className="text-lg text-gray-600">טוען תלמידים...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">❌ שגיאה בטעינת הנתונים</div>
        <div className="text-gray-600 mb-6">{error}</div>
        <button 
          onClick={loadStudents}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  return (
    <div>
      {showForm && (
        <StudentForm
          studentId={editingStudentId}
          onClose={handleCloseForm}
          onSave={handleFormSave}
        />
      )}
      
      {/* Filters and Search */}
      <Card className="mb-6" padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש תלמידים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select 
              value={filters.orchestra}
              onChange={(e) => setFilters(prev => ({ ...prev, orchestra: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">כל התזמורות</option>
              <option value="תזמורת">תזמורת</option>
              <option value="ללא תזמורת">ללא תזמורת</option>
            </select>
            <select 
              value={filters.instrument}
              onChange={(e) => setFilters(prev => ({ ...prev, instrument: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">כל הכלים</option>
              <option value="חלילית">חלילית</option>
              <option value="חליל צד">חליל צד</option>
              <option value="אבוב">אבוב</option>
              <option value="בסון">בסון</option>
              <option value="סקסופון">סקסופון</option>
              <option value="קלרינט">קלרינט</option>
              <option value="חצוצרה">חצוצרה</option>
              <option value="קרן יער">קרן יער</option>
              <option value="טרומבון">טרומבון</option>
              <option value="טובה/בריטון">טובה/בריטון</option>
              <option value="שירה">שירה</option>
              <option value="כינור">כינור</option>
              <option value="ויולה">ויולה</option>
              <option value="צ'לו">צ'לו</option>
              <option value="קונטרבס">קונטרבס</option>
              <option value="פסנתר">פסנתר</option>
              <option value="גיטרה">גיטרה</option>
              <option value="גיטרה בס">גיטרה בס</option>
              <option value="תופים">תופים</option>
            </select>
            
            {/* View Mode Toggle - Enhanced */}
            <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-700 shadow-sm border border-gray-200 ring-1 ring-primary-500/20'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
                }`}
                aria-pressed={viewMode === 'grid'}
                aria-label="תצוגת רשת"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">רשת</span>
                {viewMode === 'grid' && (
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/5 to-primary-600/5 pointer-events-none" />
                )}
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 ${
                  viewMode === 'table'
                    ? 'bg-white text-primary-700 shadow-sm border border-gray-200 ring-1 ring-primary-500/20'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
                }`}
                aria-pressed={viewMode === 'table'}
                aria-label="תצוגת טבלה"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">טבלה</span>
                {viewMode === 'table' && (
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/5 to-primary-600/5 pointer-events-none" />
                )}
              </button>
            </div>

            <button 
              onClick={handleAddStudent}
              className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסף תלמיד
            </button>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">{totalStudents}</div>
            <div className="text-sm text-gray-600">סה״כ תלמידים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-1">{activeStudents}</div>
            <div className="text-sm text-gray-600">פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">{inactiveStudents}</div>
            <div className="text-sm text-gray-600">לא פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{studentsWithLessons}</div>
            <div className="text-sm text-gray-600">עם שיעורים</div>
          </div>
        </Card>
      </div>

      {/* Results Info and View Mode Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {searchTerm || filters.orchestra || filters.instrument ? (
            <div className="text-sm text-gray-600">
              מציג {filteredStudents.length} מתוך {totalStudents} תלמידים
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {totalStudents} תלמידים
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>תצוגה:</span>
            <span className="px-2 py-1 bg-gray-100 rounded-full font-medium">
              {viewMode === 'grid' ? 'רשת' : 'טבלה'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid View with StudentCard */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student.original}
              showInstruments={true}
              showTeacherAssignments={true}
              showParentContact={false}
              onClick={() => handleViewStudent(student.id)}
              className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
            />
          ))}
        </div>
      )}

      {/* Table View with clickable rows */}
      {viewMode === 'table' && (
        <Table 
          columns={columns} 
          data={filteredStudents}
          onRowClick={(row) => {
            // Use the raw data's _id to ensure we have the correct ID
            const studentId = row.rawData?._id || row.id
            handleViewStudent(studentId)
          }}
          rowClassName="hover:bg-primary-50 cursor-pointer"
        />
      )}

      {filteredStudents.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          לא נמצאו תלמידים התואמים לחיפוש
        </div>
      )}
    </div>
  )
}