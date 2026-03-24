/**
 * Student Management Tab Component
 *
 * Manages students assigned to the teacher
 */

import { useState, useEffect } from 'react'
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  User,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@heroui/react'
import {
  ArrowUpRight as ArrowUpRightIcon,
  BookOpen as BookOpenIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Plus as PlusIcon,
  Trash as TrashIcon,
  Users as UsersIcon,
  UserMinus as UserMinusIcon,
  MusicNotes as MusicNotesIcon,
  MapPin as MapPinIcon,
} from '@phosphor-icons/react'

import { Teacher } from '../../types'
import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'
import { getAvatarColorHex } from '../../../../../utils/avatarColorHash'

interface StudentManagementTabProps {
  teacher: Teacher
  teacherId: string
}

interface Student {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
  }
  academicInfo?: {
    class?: string
  }
  primaryInstrument?: string
}

const glassStyle = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,210,230,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow:
    '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
}

const DAYS_OF_WEEK = [
  'ראשון',
  'שני',
  'שלישי',
  'רביעי',
  'חמישי',
  'שישי',
  'שבת',
] as const

const DURATION_OPTIONS = [
  { value: '30', label: '30 דקות' },
  { value: '45', label: '45 דקות' },
  { value: '60', label: '60 דקות' },
]

const StudentManagementTab: React.FC<StudentManagementTabProps> = ({
  teacher,
  teacherId,
}) => {
  const [students, setStudents] = useState<Student[]>([])
  const [studentsWithLessons, setStudentsWithLessons] = useState<{
    [key: string]: boolean
  }>({})
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [orchestraMap, setOrchestraMap] = useState<Map<string, { name: string; type: string; location: string; day?: string; time?: string }>>(new Map())
  const [studentOrchestras, setStudentOrchestras] = useState<Map<string, string[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [schedulingStudent, setSchedulingStudent] = useState<Student | null>(
    null
  )
  const [lessonData, setLessonData] = useState({
    day: '',
    startTime: '',
    duration: 30,
  })

  const addStudentModal = useDisclosure()
  const scheduleLessonModal = useDisclosure()

  // Check if student has active lessons with this teacher (using existing student data)
  const checkStudentHasLessons = (student: any): boolean => {
    try {
      const hasActiveAssignment = student.teacherAssignments?.some(
        (assignment: any) =>
          assignment.teacherId === teacherId && assignment.isActive === true
      )
      return hasActiveAssignment || false
    } catch (error) {
      console.error(`Error checking lessons for student ${student._id}:`, error)
      return false
    }
  }

  // Fetch students data via dedicated endpoint
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true)

        console.log(
          '📚 StudentManagementTab - Fetching students for teacher:',
          {
            teacherId,
            teacherName: getDisplayName(teacher.personalInfo),
          }
        )

        // Fetch all students first (needed for add-student dropdown AND class data)
        const allStudentsData = await apiService.students.getStudents()
        setAllStudents(allStudentsData)

        // Build lookup map for full student data (has real class, phone, etc.)
        const studentMap = new Map<string, any>()
        allStudentsData.forEach((s: any) => studentMap.set(s._id, s))

        const validStudents =
          await apiService.teachers.getTeacherStudents(teacherId)
        console.log(
          '✅ StudentManagementTab - Fetched students:',
          validStudents.length
        )

        // Enrich teacher students with full data from allStudents
        const enrichedStudents = validStudents.map((s: any) => {
          const full = studentMap.get(s._id)
          if (full) {
            return {
              ...s,
              personalInfo: full.personalInfo || s.personalInfo,
              academicInfo: full.academicInfo || s.academicInfo,
              primaryInstrument: s.primaryInstrument || full.primaryInstrument || full.academicInfo?.instrumentProgress?.[0]?.instrumentName || '',
            }
          }
          return s
        })
        setStudents(enrichedStudents)

        const lessonStatusMap: { [key: string]: boolean } = {}
        enrichedStudents.forEach((student: any) => {
          lessonStatusMap[student._id] =
            student.lessons?.length > 0 ||
            student.teacherAssignments?.some(
              (a: any) => a.teacherId === teacherId && a.isActive === true
            ) ||
            false
        })
        setStudentsWithLessons(lessonStatusMap)

        // Fetch orchestras to show ensemble enrollments
        try {
          const orchestras = await apiService.orchestras?.getOrchestras?.() || []
          const oMap = new Map<string, { name: string; type: string; location: string }>()
          const sMap = new Map<string, string[]>()
          orchestras.forEach((o: any) => {
            oMap.set(o._id, { name: o.name, type: o.type, location: o.location || '' })
            // Map students to their orchestras via memberIds
            if (o.memberIds?.length) {
              o.memberIds.forEach((memberId: string) => {
                const existing = sMap.get(memberId) || []
                existing.push(o._id)
                sMap.set(memberId, existing)
              })
            }
          })
          setOrchestraMap(oMap)
          setStudentOrchestras(sMap)
        } catch {
          // Orchestras not critical — silently ignore
        }
      } catch (error) {
        console.error('❌ Error fetching students:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [teacherId])

  const handleAddStudent = async () => {
    if (!selectedStudentId) return

    try {
      await apiService.teachers.addStudentToTeacher(
        teacherId,
        selectedStudentId
      )

      const newStudent =
        await apiService.students.getStudentById(selectedStudentId)
      setStudents(prev => [...prev, newStudent])

      addStudentModal.onClose()
      setSelectedStudentId('')
    } catch (error) {
      console.error('Error adding student:', error)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    const student = students.find(s => s._id === studentId)
    const studentName =
      getDisplayName(student?.personalInfo) || 'התלמיד'
    const teacherName =
      getDisplayName(teacher.personalInfo) || 'המורה'

    if (
      !confirm(
        `האם אתה בטוח שברצונך להסיר את ${studentName} מרשימת התלמידים של ${teacherName}?\n\nפעולה זו תנתק את הקשר בין התלמיד למורה אך לא תמחק את פרטי התלמיד מהמערכת.`
      )
    )
      return

    try {
      await apiService.teachers.removeStudentFromTeacher(teacherId, studentId)
      setStudents(prev => prev.filter(student => student._id !== studentId))
    } catch (error) {
      console.error('Error removing student:', error)
    }
  }

  const handleScheduleLesson = (student: Student) => {
    setSchedulingStudent(student)
    setLessonData({ day: '', startTime: '', duration: 30 })
    scheduleLessonModal.onOpen()
  }

  const handleSaveLesson = async () => {
    if (!schedulingStudent || !lessonData.day || !lessonData.startTime) {
      alert('אנא מלא את כל השדות הנדרשים')
      return
    }

    try {
      console.log(
        '🔄 Creating lesson for student:',
        getDisplayName(schedulingStudent.personalInfo)
      )

      const currentStudent = await apiService.students.getStudentById(
        schedulingStudent._id
      )
      console.log(
        '📋 Current student data loaded:',
        getDisplayName(currentStudent.personalInfo)
      )

      const newAssignment = {
        teacherId: teacherId,
        day: lessonData.day,
        time: lessonData.startTime,
        duration: lessonData.duration,
        location: '',
        isActive: true,
      }

      const updatedAssignments = [
        ...(currentStudent.teacherAssignments || []),
        newAssignment,
      ]

      console.log('📤 Adding new teacher assignment:', newAssignment)
      console.log('📝 All assignments to be saved:', updatedAssignments)

      const updateData = { teacherAssignments: updatedAssignments }
      console.log('📤 Sending update data:', updateData)

      await apiService.students.updateStudent(schedulingStudent._id, updateData)
      console.log('✅ Student updated with new lesson assignment')

      setStudentsWithLessons(prev => ({
        ...prev,
        [schedulingStudent._id]: true,
      }))

      scheduleLessonModal.onClose()
      setSchedulingStudent(null)
      setLessonData({ day: '', startTime: '', duration: 30 })
    } catch (error) {
      console.error('❌ Failed to schedule lesson:', error)

      let errorMessage = 'שגיאה בקביעת השיעור. אנא נסה שוב.'

      if (error.message.includes('Authentication failed')) {
        errorMessage = 'פג תוקף הפנייה. אנא התחבר מחדש.'
      } else if (error.message.includes('validation')) {
        errorMessage = 'שגיאה בנתונים שהוזנו. אנא בדוק את פרטי השיעור.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'התלמיד לא נמצא במערכת.'
      } else if (error.message.includes('Network')) {
        errorMessage = 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט.'
      } else if (error.message.includes('שגיאה בשמירת הנתונים')) {
        errorMessage = 'שגיאה בשמירת הנתונים במסד הנתונים. אנא נסה שוב.'
      }

      alert(errorMessage)

      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        studentId: schedulingStudent._id,
        teacherId: teacherId,
        lessonData: lessonData,
      })
    }
  }

  // Get available students (not already assigned to this teacher)
  const assignedStudentIds = students.map(s => s._id)
  const availableStudents = allStudents.filter(
    student => !assignedStudentIds.includes(student._id)
  )

  // Reset selection when modal closes
  useEffect(() => {
    if (!addStudentModal.isOpen) {
      setSelectedStudentId('')
    }
  }, [addStudentModal.isOpen])

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-14 bg-gray-100 rounded-card animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          color="primary"
          size="sm"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={addStudentModal.onOpen}
        >
          הוסף תלמיד
        </Button>
        <div className="flex items-center gap-3">
          {students.length > 0 && (
            <Chip size="sm" variant="flat" color="primary">
              {students.length}
            </Chip>
          )}
          <h2 className="text-lg font-semibold text-foreground">
            ניהול תלמידים
          </h2>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={addStudentModal.isOpen}
        onOpenChange={addStudentModal.onOpenChange}
        placement="center"
        size="md"
      >
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="text-center justify-center">
                הוסף תלמיד חדש
              </ModalHeader>
              <ModalBody>
                <Autocomplete
                  label="חפש ובחר תלמיד"
                  placeholder="הקלד שם תלמיד או כיתה..."
                  variant="bordered"
                  selectedKey={selectedStudentId}
                  onSelectionChange={key => setSelectedStudentId(key as string ?? '')}
                  listboxProps={{
                    emptyContent: 'אין תלמידים זמינים',
                  }}
                  classNames={{
                    listboxWrapper: 'max-h-60',
                  }}
                >
                  {availableStudents.map(student => (
                    <AutocompleteItem
                      key={student._id}
                      textValue={getDisplayName(student.personalInfo)}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium text-sm">
                          {getDisplayName(student.personalInfo)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          כיתה {student.academicInfo?.class || 'לא צוין'}
                        </span>
                      </div>
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => {
                    onClose()
                    setSelectedStudentId('')
                  }}
                >
                  בטל
                </Button>
                <Button
                  color="primary"
                  isDisabled={!selectedStudentId}
                  onPress={handleAddStudent}
                >
                  הוסף
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Schedule Lesson Modal */}
      <Modal
        isOpen={scheduleLessonModal.isOpen}
        onOpenChange={scheduleLessonModal.onOpenChange}
        placement="center"
        size="md"
      >
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="text-center justify-center">
                קביעת שיעור שבועי
              </ModalHeader>
              <ModalBody>
                {schedulingStudent && (
                  <div className="space-y-4">
                    {/* Student info strip */}
                    <div
                      className="rounded-card p-3 flex items-center gap-3"
                      style={glassStyle}
                    >
                      <User
                        name={getDisplayName(schedulingStudent.personalInfo)}
                        description={`כיתה ${schedulingStudent.academicInfo?.class || 'לא צוין'} • ${schedulingStudent.primaryInstrument || 'לא צוין'}`}
                        avatarProps={{
                          style: {
                            backgroundColor: getAvatarColorHex(
                              getDisplayName(schedulingStudent.personalInfo)
                            ),
                          },
                          classNames: { base: 'text-white' },
                        }}
                      />
                    </div>

                    {/* Day selection */}
                    <Select
                      label="יום השבוע"
                      placeholder="בחר יום"
                      selectedKeys={lessonData.day ? [lessonData.day] : []}
                      onSelectionChange={keys => {
                        const val = Array.from(keys)[0] as string
                        setLessonData(prev => ({ ...prev, day: val || '' }))
                      }}
                      isRequired
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day}>{day}</SelectItem>
                      ))}
                    </Select>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Start time */}
                      <Input
                        type="time"
                        label="זמן התחלה"
                        value={lessonData.startTime}
                        onChange={e =>
                          setLessonData(prev => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                        isRequired
                      />

                      {/* Duration */}
                      <Select
                        label="משך (דקות)"
                        selectedKeys={[String(lessonData.duration)]}
                        onSelectionChange={keys => {
                          const val = Array.from(keys)[0] as string
                          setLessonData(prev => ({
                            ...prev,
                            duration: Number(val) || 30,
                          }))
                        }}
                      >
                        {DURATION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => {
                    onClose()
                    setSchedulingStudent(null)
                    setLessonData({ day: '', startTime: '', duration: 30 })
                  }}
                >
                  ביטול
                </Button>
                <Button color="success" onPress={handleSaveLesson}>
                  קבע שיעור
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Students Table / Empty State */}
      {students.length === 0 ? (
        <div
          className="rounded-card p-12 flex flex-col items-center gap-4 text-center"
          style={glassStyle}
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <UsersIcon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              אין תלמידים משויכים
            </h3>
            <p className="text-sm text-muted-foreground">
              עדיין לא שויכו תלמידים למורה זה
            </p>
          </div>
          <Button
            color="primary"
            size="sm"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={addStudentModal.onOpen}
          >
            הוסף תלמיד ראשון
          </Button>
        </div>
      ) : (
        <Table
          aria-label="רשימת תלמידים"
          isHeaderSticky
          classNames={{
            base: 'flex-1 min-h-0',
            wrapper: 'bg-white/70 shadow-none backdrop-blur-sm rounded-card',
            th: 'bg-default-100 text-default-600',
            thead: '[&>tr]:border-b-0',
            tr: 'transition-colors duration-150 hover:bg-primary/5 cursor-pointer',
            td: 'py-3',
          }}
        >
          <TableHeader>
            <TableColumn>תלמיד</TableColumn>
            <TableColumn>כלי נגינה</TableColumn>
            <TableColumn>כיתה</TableColumn>
            <TableColumn>הרכבים</TableColumn>
            <TableColumn>סטטוס</TableColumn>
            <TableColumn>פעולות</TableColumn>
          </TableHeader>
          <TableBody emptyContent="אין תלמידים להצגה">
            {students.map(student => {
              const name = getDisplayName(student.personalInfo) || 'ללא שם'
              const avatarColor = getAvatarColorHex(name)
              const hasLesson = studentsWithLessons[student._id]
              const phone = student.personalInfo?.phone || ''
              const instrument = student.primaryInstrument || ''
              const className = student.academicInfo?.class ? `כיתה ${student.academicInfo.class}` : ''
              const descParts = [instrument, className, phone].filter(Boolean)
              const description = descParts.join(' · ') || undefined

              return (
                <TableRow
                  key={student._id}
                  onClick={() => window.location.href = `/students/${student._id}`}
                >
                  <TableCell>
                    <User
                      avatarProps={{
                        radius: 'full',
                        size: 'md',
                        showFallback: true,
                        name: name,
                        style: { backgroundColor: avatarColor, color: '#fff' },
                      }}
                      description={description}
                      name={name}
                    />
                  </TableCell>

                  <TableCell>
                    {student.primaryInstrument ? (
                      <Chip size="sm" variant="flat" color="secondary">
                        {student.primaryInstrument}
                      </Chip>
                    ) : (
                      <span className="text-default-400">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-foreground">
                      {student.academicInfo?.class
                        ? `כיתה ${student.academicInfo.class}`
                        : '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    {(() => {
                      const orchIds = studentOrchestras.get(student._id) || []
                      if (orchIds.length === 0) return <span className="text-default-400">—</span>
                      return (
                        <div className="flex flex-wrap gap-1">
                          {orchIds.map((orchId) => {
                            const orch = orchestraMap.get(orchId)
                            if (!orch) return null
                            return (
                              <Popover key={orchId} placement="bottom">
                                <PopoverTrigger>
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color={orch.type === 'תזמורת' ? 'primary' : 'secondary'}
                                    className="cursor-pointer"
                                    startContent={<MusicNotesIcon className="w-3 h-3" />}
                                  >
                                    {orch.name}
                                  </Chip>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <div className="p-3 min-w-[180px] space-y-2">
                                    <p className="text-sm font-bold text-foreground">{orch.name}</p>
                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1.5">
                                        <MusicNotesIcon className="w-3.5 h-3.5 text-primary" />
                                        <span>{orch.type}</span>
                                      </div>
                                      {orch.location && (
                                        <div className="flex items-center gap-1.5">
                                          <MapPinIcon className="w-3.5 h-3.5 text-primary" />
                                          <span>{orch.location}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={hasLesson ? 'success' : 'warning'}
                    >
                      {hasLesson ? 'יש שיעור' : 'אין שיעור'}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        onClick={() => window.location.href = `/students/${student._id}`}
                        title="צפה בפרטי התלמיד"
                      >
                        <ArrowUpRightIcon size={15} weight="regular" />
                      </button>
                      {!hasLesson && (
                        <button
                          className="p-1.5 rounded-md text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                          onClick={() => handleScheduleLesson(student)}
                          title="קבע שיעור"
                        >
                          <BookOpenIcon size={15} weight="regular" />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => handleRemoveStudent(student._id)}
                        title="הסר תלמיד"
                      >
                        <UserMinusIcon size={15} weight="regular" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Schedule Overview */}
      {students.length > 0 && (
        <div className="rounded-card p-5" style={glassStyle}>
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            סקירת לוח זמנים
          </h3>

          {teacher.teaching?.timeBlocks &&
          teacher.teaching.timeBlocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teacher.teaching.timeBlocks.map((timeBlock, index) => (
                <div
                  key={timeBlock._id || index}
                  className="rounded-card p-3 bg-white/60 border border-border/40"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {timeBlock.day}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {Math.round(timeBlock.totalDuration / 60)} שעות
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {timeBlock.startTime} - {timeBlock.endTime}
                  </div>
                  {timeBlock.location && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {timeBlock.location}
                    </div>
                  )}
                  <div className="text-xs text-primary mt-1.5">
                    {timeBlock.assignedLessons?.length || 0} שיעורים מתוכננים
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              אין בלוקי זמן מוגדרים עדיין
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentManagementTab
