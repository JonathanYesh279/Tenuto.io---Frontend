/**
 * Teaching Days Tab Component
 *
 * Displays and manages the teacher's weekly time blocks (ימי לימוד).
 * Each block represents a teaching day with start/end times, location,
 * and the lessons assigned within that window.
 *
 * Data source: teacher.teaching.timeBlocks[]
 * CRUD: teacherDetailsApi.addTimeBlock / updateTimeBlock / removeTimeBlock
 */

import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react'
import {
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  PencilSimple as PencilSimpleIcon,
  Plus as PlusIcon,
  Trash as TrashIcon,
  Users as UsersIcon,
  CalendarBlank as CalendarBlankIcon,
  WarningCircle as WarningCircleIcon,
} from '@phosphor-icons/react'
import { teacherDetailsApi } from '../../../../../services/teacherDetailsApi'
import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeBlock {
  _id: string
  day: string
  startTime: string
  endTime: string
  totalDuration?: number
  location?: string
  assignedLessons?: any[]
}

interface TeachingDaysTabProps {
  teacher: any
  teacherId: string
  onTeacherRefresh?: () => void
}

interface FormState {
  day: string
  startTime: string
  endTime: string
  location: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEBREW_DAYS = [
  'ראשון',
  'שני',
  'שלישי',
  'רביעי',
  'חמישי',
  'שישי',
]

const DAY_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/** Soft per-day colour palette — index matches DAY_ORDER */
const DAY_COLORS: Record<
  string,
  {
    gradient: string
    border: string
    chipBg: string
    chipText: string
    headerText: string
    iconColor: string
  }
> = {
  ראשון: {
    gradient: 'linear-gradient(135deg, rgba(219,234,254,0.8), rgba(191,219,254,0.4))',
    border: 'rgba(147,197,253,0.5)',
    chipBg: 'bg-blue-100',
    chipText: 'text-blue-700',
    headerText: 'text-blue-800',
    iconColor: 'text-blue-500',
  },
  שני: {
    gradient: 'linear-gradient(135deg, rgba(224,231,255,0.8), rgba(199,210,254,0.4))',
    border: 'rgba(165,180,252,0.5)',
    chipBg: 'bg-indigo-100',
    chipText: 'text-indigo-700',
    headerText: 'text-indigo-800',
    iconColor: 'text-indigo-500',
  },
  שלישי: {
    gradient: 'linear-gradient(135deg, rgba(237,233,254,0.8), rgba(221,214,254,0.4))',
    border: 'rgba(196,181,253,0.5)',
    chipBg: 'bg-violet-100',
    chipText: 'text-violet-700',
    headerText: 'text-violet-800',
    iconColor: 'text-violet-500',
  },
  רביעי: {
    gradient: 'linear-gradient(135deg, rgba(243,232,255,0.8), rgba(233,213,255,0.4))',
    border: 'rgba(216,180,254,0.5)',
    chipBg: 'bg-purple-100',
    chipText: 'text-purple-700',
    headerText: 'text-purple-800',
    iconColor: 'text-purple-500',
  },
  חמישי: {
    gradient: 'linear-gradient(135deg, rgba(250,232,255,0.8), rgba(245,208,254,0.4))',
    border: 'rgba(240,171,252,0.5)',
    chipBg: 'bg-fuchsia-100',
    chipText: 'text-fuchsia-700',
    headerText: 'text-fuchsia-800',
    iconColor: 'text-fuchsia-500',
  },
  שישי: {
    gradient: 'linear-gradient(135deg, rgba(252,231,243,0.8), rgba(251,207,232,0.4))',
    border: 'rgba(249,168,212,0.5)',
    chipBg: 'bg-pink-100',
    chipText: 'text-pink-700',
    headerText: 'text-pink-800',
    iconColor: 'text-pink-500',
  },
}

const DEFAULT_COLOR = {
  gradient:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,210,230,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  border: 'rgba(200,220,240,0.5)',
  chipBg: 'bg-sky-100',
  chipText: 'text-sky-700',
  headerText: 'text-sky-800',
  iconColor: 'text-sky-500',
}

const CARD_SHADOW =
  '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)'

const EMPTY_FORM: FormState = {
  day: '',
  startTime: '',
  endTime: '',
  location: '',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(time: string): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function durationLabel(block: TimeBlock): string {
  const minutes =
    block.totalDuration ??
    timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
  if (!minutes || minutes <= 0) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} דק'`
  if (mins === 0) return `${hours} שע'`
  return `${hours}:${mins.toString().padStart(2, '0')} שע'`
}

function sortBlocks(blocks: TimeBlock[]): TimeBlock[] {
  return [...blocks].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    if (dayDiff !== 0) return dayDiff
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })
}

function colorFor(day: string) {
  return DAY_COLORS[day] ?? DEFAULT_COLOR
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 rounded-card text-center"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,210,230,0.15) 50%, rgba(255,255,255,0.9) 100%)',
        boxShadow: CARD_SHADOW,
        border: '1px solid rgba(200,220,240,0.5)',
      }}
    >
      <CalendarBlankIcon className="w-12 h-12 text-muted-foreground mb-4" weight="light" />
      <h3 className="text-sm font-semibold text-foreground mb-1">אין ימי לימוד מוגדרים</h3>
      <p className="text-xs text-muted-foreground mb-5 max-w-xs">
        הוסף יום לימוד כדי להגדיר את לוח הזמנים של המורה
      </p>
      <Button color="primary" size="sm" onPress={onAdd} startContent={<PlusIcon size={14} />}>
        הוסף יום לימוד
      </Button>
    </div>
  )
}

interface TimeBlockCardProps {
  block: TimeBlock
  onEdit: (block: TimeBlock) => void
  onDelete: (block: TimeBlock) => void
  isDeleting: boolean
}

function TimeBlockCard({ block, onEdit, onDelete, isDeleting }: TimeBlockCardProps) {
  const color = colorFor(block.day)
  const lessonCount = block.assignedLessons?.length ?? 0
  const duration = durationLabel(block)

  return (
    <Card
      className="rounded-card shadow-1 border-none transition-shadow duration-200 hover:shadow-md"
      style={{ background: color.gradient }}
    >
      <CardBody className="p-4 flex flex-col gap-3">
        {/* Card header — day name + action buttons */}
        <div className="flex items-start justify-between gap-2">
          <span className={`text-sm font-bold ${color.headerText}`}>יום {block.day}</span>
          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="h-6 w-6 min-w-0"
              onPress={() => onEdit(block)}
              aria-label="ערוך"
            >
              <PencilSimpleIcon size={14} className="text-muted-foreground" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="h-6 w-6 min-w-0 text-danger"
              onPress={() => onDelete(block)}
              isLoading={isDeleting}
              aria-label="מחק"
            >
              {!isDeleting && <TrashIcon size={14} />}
            </Button>
          </div>
        </div>

        {/* Time range + duration */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ClockIcon size={13} className={color.iconColor} />
          <span className="font-medium text-foreground">
            {block.startTime} – {block.endTime}
          </span>
          {duration && (
            <span className="text-muted-foreground">({duration})</span>
          )}
        </div>

        {/* Location */}
        {block.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPinIcon size={13} className={color.iconColor} />
            <span>{block.location}</span>
          </div>
        )}

        {/* Assigned lessons chip */}
        <div className="flex items-center gap-1.5">
          <UsersIcon size={13} className={color.iconColor} />
          <Chip
            size="sm"
            variant="flat"
            classNames={{
              base: `${color.chipBg} border-none h-5`,
              content: `${color.chipText} text-xs font-medium px-1`,
            }}
          >
            {lessonCount === 0
              ? 'אין שיעורים'
              : lessonCount === 1
              ? 'שיעור 1'
              : `${lessonCount} שיעורים`}
          </Chip>
        </div>
      </CardBody>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TeachingDaysTab({ teacher, teacherId, onTeacherRefresh }: TeachingDaysTabProps) {
  // Derive initial blocks from prop, sort by day then start-time
  const [blocks, setBlocks] = useState<TimeBlock[]>(() =>
    sortBlocks(teacher?.teaching?.timeBlocks ?? [])
  )
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TimeBlock | null>(null)

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

  // -------------------------------------------------------------------------
  // Form helpers
  // -------------------------------------------------------------------------

  function openAdd() {
    setEditingBlock(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    onFormOpen()
  }

  function openEdit(block: TimeBlock) {
    setEditingBlock(block)
    setForm({
      day: block.day,
      startTime: block.startTime,
      endTime: block.endTime,
      location: block.location ?? '',
    })
    setFormErrors({})
    onFormOpen()
  }

  function handleFormClose() {
    onFormClose()
    setEditingBlock(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function validate(): boolean {
    const errors: Partial<FormState> = {}
    if (!form.day) errors.day = 'יש לבחור יום'
    if (!form.startTime) errors.startTime = 'יש להזין שעת התחלה'
    if (!form.endTime) errors.endTime = 'יש להזין שעת סיום'
    if (
      form.startTime &&
      form.endTime &&
      timeToMinutes(form.startTime) >= timeToMinutes(form.endTime)
    ) {
      errors.endTime = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // -------------------------------------------------------------------------
  // Save (add / update)
  // -------------------------------------------------------------------------

  async function handleSave() {
    if (!validate()) return

    setIsSaving(true)
    try {
      const payload = {
        day: form.day,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location.trim() || undefined,
      }

      if (editingBlock) {
        // Update existing block
        const response: any = await teacherDetailsApi.updateTimeBlock(
          teacherId,
          editingBlock._id,
          payload
        )
        const updatedBlock: TimeBlock =
          response?.timeBlock ?? response?.data?.timeBlock ?? { ...editingBlock, ...payload }
        setBlocks((prev) =>
          sortBlocks(prev.map((b) => (b._id === editingBlock._id ? updatedBlock : b)))
        )
        toast.success('יום הלימוד עודכן בהצלחה')
      } else {
        // Add new block
        const response: any = await teacherDetailsApi.addTimeBlock(teacherId, payload)
        const newBlock: TimeBlock =
          response?.timeBlock ?? response?.data?.timeBlock ?? {
            _id: `tmp-${Date.now()}`,
            assignedLessons: [],
            ...payload,
          }
        setBlocks((prev) => sortBlocks([...prev, newBlock]))
        toast.success('יום הלימוד נוסף בהצלחה')
      }
      handleFormClose()
      onTeacherRefresh?.()
    } catch (err: any) {
      const message = err?.message ?? 'שגיאה בשמירת יום הלימוד'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  function openDelete(block: TimeBlock) {
    setDeleteTarget(block)
    onDeleteOpen()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeletingId(deleteTarget._id)
    try {
      await teacherDetailsApi.removeTimeBlock(teacherId, deleteTarget._id)
      setBlocks((prev) => prev.filter((b) => b._id !== deleteTarget._id))
      toast.success('יום הלימוד נמחק')
      onDeleteClose()
      setDeleteTarget(null)
      onTeacherRefresh?.()
    } catch (err: any) {
      const message = err?.message ?? 'שגיאה במחיקת יום הלימוד'
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-4 space-y-4" dir="rtl">
      {/* Tab header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">ימי לימוד</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {blocks.length === 0
              ? 'לא הוגדרו ימי לימוד'
              : `${blocks.length} ${blocks.length === 1 ? 'יום לימוד' : 'ימי לימוד'}`}
          </p>
        </div>
        <Button
          color="primary"
          size="sm"
          onPress={openAdd}
          startContent={<PlusIcon size={14} />}
        >
          הוסף יום לימוד
        </Button>
      </div>

      {/* Cards grid or empty state */}
      {blocks.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => (
            <TimeBlockCard
              key={block._id}
              block={block}
              onEdit={openEdit}
              onDelete={openDelete}
              isDeleting={deletingId === block._id}
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Modal                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        placement="center"
        size="sm"
        dir="rtl"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-sm font-bold text-foreground pb-1">
                {editingBlock ? 'עריכת יום לימוד' : 'הוספת יום לימוד'}
              </ModalHeader>

              <ModalBody className="gap-3 py-3">
                {/* Day select */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">יום *</label>
                  <Select
                    size="sm"
                    placeholder="בחר יום"
                    selectedKeys={form.day ? new Set([form.day]) : new Set()}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as string
                      updateField('day', val ?? '')
                    }}
                    isInvalid={!!formErrors.day}
                    errorMessage={formErrors.day}
                    aria-label="יום"
                  >
                    {HEBREW_DAYS.map((d) => (
                      <SelectItem key={d} textValue={`יום ${d}`}>
                        יום {d}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Start / End time row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">שעת התחלה *</label>
                    <Input
                      size="sm"
                      type="time"
                      value={form.startTime}
                      onValueChange={(v) => updateField('startTime', v)}
                      isInvalid={!!formErrors.startTime}
                      errorMessage={formErrors.startTime}
                      aria-label="שעת התחלה"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">שעת סיום *</label>
                    <Input
                      size="sm"
                      type="time"
                      value={form.endTime}
                      onValueChange={(v) => updateField('endTime', v)}
                      isInvalid={!!formErrors.endTime}
                      errorMessage={formErrors.endTime}
                      aria-label="שעת סיום"
                    />
                  </div>
                </div>

                {/* Duration preview */}
                {form.startTime && form.endTime && (
                  <p className="text-xs text-muted-foreground">
                    משך:{' '}
                    <span className="font-medium text-foreground">
                      {durationLabel({
                        _id: '',
                        day: form.day,
                        startTime: form.startTime,
                        endTime: form.endTime,
                      })}
                    </span>
                  </p>
                )}

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">מיקום</label>
                  <Input
                    size="sm"
                    placeholder='למשל: חדר 12, אולם הקונצרטים'
                    value={form.location}
                    onValueChange={(v) => updateField('location', v)}
                    startContent={
                      <MapPinIcon size={14} className="text-muted-foreground shrink-0" />
                    }
                    aria-label="מיקום"
                  />
                </div>
              </ModalBody>

              <ModalFooter className="pt-1 gap-2">
                <Button
                  variant="flat"
                  size="sm"
                  onPress={handleFormClose}
                  isDisabled={isSaving}
                >
                  ביטול
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  onPress={handleSave}
                  isLoading={isSaving}
                >
                  {editingBlock ? 'שמור שינויים' : 'הוסף יום'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Delete confirmation Modal                                           */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          onDeleteClose()
          setDeleteTarget(null)
        }}
        placement="center"
        size="sm"
        dir="rtl"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-sm font-bold text-foreground pb-1 flex items-center gap-2">
                <WarningCircleIcon size={18} className="text-danger" />
                מחיקת יום לימוד
              </ModalHeader>

              <ModalBody className="py-3">
                {deleteTarget && (
                  <p className="text-sm text-foreground">
                    האם למחוק את יום{' '}
                    <span className="font-semibold">
                      {deleteTarget.day}
                    </span>{' '}
                    ({deleteTarget.startTime}–{deleteTarget.endTime})? פעולה זו אינה הפיכה.
                  </p>
                )}
                {(deleteTarget?.assignedLessons?.length ?? 0) > 0 && (
                  <p className="text-xs text-warning mt-1">
                    שים לב: ליום זה מוצמדים{' '}
                    {deleteTarget!.assignedLessons!.length} שיעורים.
                  </p>
                )}
              </ModalBody>

              <ModalFooter className="pt-1 gap-2">
                <Button
                  variant="flat"
                  size="sm"
                  onPress={() => {
                    onDeleteClose()
                    setDeleteTarget(null)
                  }}
                  isDisabled={!!deletingId}
                >
                  ביטול
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  onPress={handleDelete}
                  isLoading={!!deletingId}
                >
                  מחק
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
