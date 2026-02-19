import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRightIcon, PencilSimpleIcon, TrashIcon, DownloadIcon, UploadIcon, PlusIcon,
  UserIcon, CalendarIcon, MusicNoteIcon, FileTextIcon, MedalIcon, ClockIcon,
  CheckCircleIcon, XCircleIcon, WarningCircleIcon, StarIcon, BookOpenIcon,
  UsersIcon, FileIcon, CircleNotchIcon, CaretRightIcon, FloppyDiskIcon, XIcon
} from '@phosphor-icons/react'
import { DetailPageHeader } from '../components/domain'
import { Card } from '../components/ui/Card'
import Table from '../components/ui/Table'
import StatsCard from '../components/ui/StatsCard'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import { useBagrut } from '../hooks/useBagrut'
import apiService from '../services/apiService'
import { getDisplayName } from '../utils/nameUtils'
import PerformanceCard from '../components/PerformanceCard'
import PerformanceDetailsModal from '../components/PerformanceDetailsModal'
import PresentationCard from '../components/PresentationCard'
import PresentationDetailsModal from '../components/PresentationDetailsModal'
import MagenBagrutTab from '../components/MagenBagrutTab'
import AddPieceModal from '../components/AddPieceModal'
import AccompanistManager from '../components/bagrut/AccompanistManager'
import type { Bagrut, Presentation, ProgramPiece, Performance } from '../types/bagrut.types'
import {
  createDisplayPresentations,
  isMagenBagrut,
  getBackendIndex,
  isValidPresentationIndex,
  convertToMagenBagrutData,
  calculateCompletedPresentations,
  PRESENTATION_CONSTANTS
} from '../utils/presentationMapping'

interface TabProps {
  label: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  badge?: number
}

const Tab: React.FC<TabProps> = ({ label, icon, isActive, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center px-4 py-3 border-b-2 transition-all
      ${isActive 
        ? 'border-primary text-foreground bg-muted'
        : 'border-transparent text-gray-800 hover:text-gray-900 hover:bg-gray-50'
      }
    `}
  >
    {icon}
    <span className="mr-2 font-medium">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="mr-2 px-2 py-0.5 bg-muted text-foreground rounded-full text-xs font-semibold">
        {badge}
      </span>
    )}
  </button>
)

export default function BagrutDetails() {
  const { bagrutId } = useParams<{ bagrutId: string }>()
  const navigate = useNavigate()
  const { 
    bagrut, 
    loading, 
    error, 
    fetchBagrutById,
    updateBagrut,
    deleteBagrut,
    completeBagrut,
    calculateFinalGrade,
    uploadDocument,
    removeDocument,
    downloadDocument
  } = useBagrut()

  const [activeTab, setActiveTab] = useState('overview')
  const [student, setStudent] = useState<any>(null)
  const [teacher, setTeacher] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [teacherSignature, setTeacherSignature] = useState('')
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [showAddPieceModal, setShowAddPieceModal] = useState(false)
  const [showEditPieceModal, setShowEditPieceModal] = useState(false)
  const [editingPiece, setEditingPiece] = useState<ProgramPiece | null>(null)
  const [showDeletePieceModal, setShowDeletePieceModal] = useState(false)
  const [deletingPieceNumber, setDeletingPieceNumber] = useState<number | null>(null)
  const [selectedPresentation, setSelectedPresentation] = useState<any>(null)
  const [showPresentationModal, setShowPresentationModal] = useState(false)
  const [isEditingOverview, setIsEditingOverview] = useState(false)
  const [overviewFormData, setOverviewFormData] = useState({
    teacherId: '',
    conservatoryName: '',
    testDate: '',
    recitalUnits: 5,
    recitalField: '',
    notes: ''
  })

  // Mock performance data - in real implementation, this would come from the bagrut data
  const mockPerformances: Performance[] = [
    {
      _id: '1',
      performanceNumber: 1,
      title: 'השמעה ראשונה - סולו',
      date: new Date('2024-12-15T14:00:00'),
      location: 'אודיטוריום המוזיקה',
      duration: '20 דקות',
      pieces: bagrut?.program?.slice(0, 2).map(p => p.pieceTitle || p.pieceName || '') || [],
      recordingLinks: [],
      notes: 'השמעה ראשונה במסגרת הבגרות, התמקדות ביצירות הבארוק והקלאסיות',
      evaluation: {
        technique: 85,
        interpretation: 88,
        stage_presence: 82,
        overall_impression: 86,
        comments: 'ביצוע טוב בסך הכל, יש מקום לשיפור בביטחון העצמי על הבמה',
        evaluator: 'פרופ\' יעקב כהן',
        evaluationDate: new Date('2024-12-15')
      },
      isCompleted: true,
      status: 'completed'
    },
    {
      _id: '2', 
      performanceNumber: 2,
      title: 'השמעה שנייה - עם ליווי',
      date: new Date('2024-01-20T15:30:00'),
      location: 'אולם הקונצרטים',
      duration: '25 דקות',
      pieces: bagrut?.program?.slice(2, 4).map(p => p.pieceTitle || p.pieceName || '') || [],
      recordingLinks: [],
      notes: 'השמעה עם פסנתר מלווה, דגש על עבודה עם מלווה והקשבה הדדית',
      evaluation: undefined,
      isCompleted: false,
      status: 'scheduled'
    },
    {
      _id: '3',
      performanceNumber: 3,
      title: 'השמעה שלישית - בחירה חופשית',
      date: new Date('2024-02-25T16:00:00'),
      location: 'סטודיו הקלטות',
      duration: '30 דקות',
      pieces: bagrut?.program?.slice(4, 5).map(p => p.pieceTitle || p.pieceName || '') || [],
      recordingLinks: [],
      notes: 'השמעה אחרונה - יצירה לבחירת התלמיד, הזדמנות להדגים יכולות מתקדמות',
      evaluation: undefined,
      isCompleted: false,
      status: 'scheduled'
    }
  ]

  useEffect(() => {
    console.log('🔍 BagrutDetails useEffect: bagrutId:', bagrutId);
    if (bagrutId) {
      loadBagrutDetails()
    }
  }, [bagrutId])

  // Initialize overview form data when bagrut data is loaded
  useEffect(() => {
    if (bagrut) {
      setOverviewFormData({
        teacherId: bagrut.teacherId || '',
        conservatoryName: bagrut.conservatoryName || '',
        testDate: bagrut.testDate ? new Date(bagrut.testDate).toISOString().split('T')[0] : '',
        recitalUnits: bagrut.recitalUnits || 5,
        recitalField: bagrut.recitalField || '',
        notes: bagrut.notes || ''
      })
    }
  }, [bagrut])

  const loadBagrutDetails = async () => {
    if (!bagrutId) return

    try {
      console.log('🚀 BagrutDetails: Starting to load bagrut details for ID:', bagrutId);
      await fetchBagrutById(bagrutId)
      console.log('✅ BagrutDetails: fetchBagrutById completed');
    } catch (err) {
      console.error('❌ BagrutDetails: Error loading bagrut:', err)
    }
  }

  useEffect(() => {
    console.log('🔍 BagrutDetails bagrut effect: bagrut exists:', !!bagrut);
    if (bagrut) {
      console.log('📊 BagrutDetails: Bagrut data received:', bagrut._id);
      loadAdditionalData()
    }
  }, [bagrut])

  const loadAdditionalData = async () => {
    if (!bagrut) return

    try {
      const [studentData, teacherData] = await Promise.all([
        apiService.students.getStudentById(bagrut.studentId),
        apiService.teachers.getTeacherById(bagrut.teacherId)
      ])
      
      setStudent(studentData)
      setTeacher(teacherData)
    } catch (err) {
      console.error('Error loading additional data:', err)
    }
  }

  const handleDelete = async () => {
    if (!bagrutId) return

    const success = await deleteBagrut(bagrutId)
    if (success) {
      navigate('/bagruts')
    }
    setShowDeleteModal(false)
  }

  const handleComplete = async () => {
    if (!bagrutId || !teacherSignature.trim()) return

    const success = await completeBagrut(bagrutId, teacherSignature)
    if (success) {
      await loadBagrutDetails()
      setShowCompleteModal(false)
      setTeacherSignature('')
    }
  }

  const handleCalculateGrade = async () => {
    if (!bagrutId) return

    const success = await calculateFinalGrade(bagrutId)
    if (success) {
      await loadBagrutDetails()
    }
  }

  const handleAccompanimentUpdate = async (updatedAccompaniment: any) => {
    if (!bagrutId || !bagrut) return

    try {
      console.log('🔍 BagrutDetails: Updating accompaniment:', updatedAccompaniment)
      
      // Prepare update data with all required fields
      const updateData = {
        studentId: bagrut.studentId,
        teacherId: bagrut.teacherId,
        program: bagrut.program || [],
        conservatoryName: bagrut.conservatoryName || '',
        accompaniment: updatedAccompaniment,
        presentations: bagrut.presentations || [],
        isCompleted: bagrut.isCompleted,
        isActive: bagrut.isActive
      }
      
      // Only add optional fields if they exist and are valid
      if (bagrut.testDate) updateData.testDate = bagrut.testDate
      if (bagrut.notes) updateData.notes = bagrut.notes
      if (bagrut.recitalUnits) updateData.recitalUnits = bagrut.recitalUnits
      if (bagrut.recitalField) updateData.recitalField = bagrut.recitalField
      if (bagrut.directorName) updateData.directorName = bagrut.directorName
      if (bagrut.directorEvaluation) updateData.directorEvaluation = bagrut.directorEvaluation

      console.log('🔍 BagrutDetails: Sending accompaniment update:', updateData)
      
      const success = await updateBagrut(bagrutId, updateData)
      if (success) {
        console.log('✅ BagrutDetails: Accompaniment updated successfully')
        await loadBagrutDetails()
      }
    } catch (error) {
      console.error('❌ BagrutDetails: Error updating accompaniment:', error)
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !bagrutId) return

    setUploadingDocument(true)
    try {
      const category = prompt('בחר קטגוריה: תעודה, תכנית, הקלטה, מכתב המלצה, אחר')
      const description = prompt('תיאור המסמך (אופציונלי)')
      
      if (category) {
        const success = await uploadDocument(bagrutId, file, category, description || undefined)
        if (success) {
          await loadBagrutDetails()
        }
      }
    } catch (err) {
      console.error('Error uploading document:', err)
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDocumentDownload = async (documentId: string, fileName: string) => {
    if (!bagrutId) return

    const blob = await downloadDocument(bagrutId, documentId)
    if (blob) {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    if (!bagrutId || !window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) return

    const success = await removeDocument(bagrutId, documentId)
    if (success) {
      await loadBagrutDetails()
    }
  }

  const handlePerformanceView = (performance: Performance) => {
    setSelectedPerformance(performance)
    setShowPerformanceModal(true)
  }

  const handlePerformanceUpdate = (updatedPerformance: Performance) => {
    // In real implementation, this would update the performance via API
    console.log('Updated performance:', updatedPerformance)
    // For now, just close the modal
    setShowPerformanceModal(false)
  }

  const handlePresentationView = (presentation: any) => {
    console.log('View presentation:', presentation)
    setSelectedPresentation(presentation)
    setShowPresentationModal(true)
  }

  const handlePresentationUpdate = async (presentationIndex: number, updatedPresentation: any) => {
    if (!bagrutId) return
    
    try {
      if (isMagenBagrut(updatedPresentation)) {
        // Use separate מגן בגרות endpoint
        const magenData = convertToMagenBagrutData(updatedPresentation)
        const success = await apiService.bagrut.updateMagenBagrut(bagrutId, magenData)
        if (success) {
          await loadBagrutDetails()
        }
      } else {
        // Regular presentation - use the actual backend index (0-2)
        const backendIndex = getBackendIndex(updatedPresentation)
        
        // Validate backend index for regular presentations
        if (!isValidPresentationIndex(backendIndex)) {
          console.error('Invalid presentation index for regular presentation:', backendIndex)
          return
        }
        
        console.log('🔍 Updating presentation:', {
          bagrutId,
          backendIndex,
          updatedPresentation
        })
        
        const success = await apiService.bagrut.updatePresentation(bagrutId, backendIndex, updatedPresentation)
        if (success) {
          console.log('✅ Presentation updated successfully')
          await loadBagrutDetails()
        } else {
          console.error('❌ Presentation update failed')
        }
      }
    } catch (error) {
      console.error('Error updating presentation:', error)
    }
  }

  const handlePresentationDelete = async (presentationIndex: number) => {
    if (!bagrutId) return
    
    try {
      // Delete presentation by setting it to null/empty state
      const emptyPresentation = {
        date: null,
        completed: false,
        grade: null,
        gradeLevel: null,
        recordingLinks: [],
        notes: '',
        reviewedBy: null,
        detailedGrading: null
      }
      
      const success = await apiService.bagrut.updatePresentation(bagrutId, presentationIndex, emptyPresentation)
      if (success) {
        await loadBagrutDetails()
      }
    } catch (error) {
      console.error('Error deleting presentation:', error)
    }
  }

  const closePerformanceModal = () => {
    setShowPerformanceModal(false)
    setSelectedPerformance(null)
  }

  const handleAddPiece = async (pieceData: Omit<ProgramPiece, '_id'>) => {
    if (!bagrutId || !bagrut) return

    try {
      // Add the new piece to the existing program
      const updatedProgram = [...(bagrut.program || []), pieceData]
      
      let success = false
      
      try {
        // Try the targeted program-only update first
        success = await apiService.bagrut.updateBagrutProgram(bagrutId, updatedProgram)
      } catch (programUpdateError) {
        console.warn('Program-specific endpoint not available, falling back to full bagrut update:', programUpdateError)
        
        // Fallback: Clean the presentations data before sending full bagrut update
        console.log('🔍 Original presentations:', bagrut.presentations)
        
        const cleanPresentations = bagrut.presentations?.map((presentation, index) => {
          console.log(`🔍 Processing presentation ${index}:`, presentation)
          
          // Create a clean presentation object with only backend-expected fields
          const cleanPresentation: any = {}
          
          if (presentation.completed !== undefined) cleanPresentation.completed = presentation.completed
          if (presentation.status && ['עבר/ה', 'לא עבר/ה', 'לא נבחן'].includes(presentation.status)) {
            cleanPresentation.status = presentation.status
          }
          if (presentation.date) cleanPresentation.date = presentation.date
          if (presentation.review) cleanPresentation.review = presentation.review
          if (presentation.reviewedBy) cleanPresentation.reviewedBy = presentation.reviewedBy
          if (presentation.notes) cleanPresentation.notes = presentation.notes
          if (presentation.recordingLinks) cleanPresentation.recordingLinks = presentation.recordingLinks
          if (presentation.grade) cleanPresentation.grade = presentation.grade
          if (presentation.gradeLevel) cleanPresentation.gradeLevel = presentation.gradeLevel
          if (presentation.detailedGrading) cleanPresentation.detailedGrading = presentation.detailedGrading
          
          return cleanPresentation
        }).filter(p => p && Object.keys(p).length > 0) // Remove empty presentations
        
        console.log('🔍 Cleaned presentations:', cleanPresentations)
        
        // Create a minimal update object with only essential fields and program
        const updateData = {
          studentId: bagrut.studentId,
          teacherId: bagrut.teacherId,
          program: updatedProgram,
          conservatoryName: bagrut.conservatoryName || '',
          accompaniment: bagrut.accompaniment || { type: 'נגן מלווה', accompanists: [] },
          presentations: cleanPresentations || [],
          isCompleted: bagrut.isCompleted,
          isActive: bagrut.isActive
        }
        
        // Only add optional fields if they exist and are valid
        if (bagrut.testDate) updateData.testDate = bagrut.testDate
        if (bagrut.notes) updateData.notes = bagrut.notes
        if (bagrut.recitalUnits) updateData.recitalUnits = bagrut.recitalUnits
        if (bagrut.recitalField) updateData.recitalField = bagrut.recitalField
        if (bagrut.magenBagrut) updateData.magenBagrut = bagrut.magenBagrut
        
        console.log('🔍 Sending update data:', updateData)
        
        // Use the full bagrut update as fallback
        success = await apiService.bagrut.updateBagrut(bagrutId, updateData)
      }
      
      if (success) {
        // Reload the bagrut data to get the updated program
        await loadBagrutDetails()
        setShowAddPieceModal(false)
      }
    } catch (error) {
      console.error('Error adding piece:', error)
      throw new Error('שגיאה בהוספת היצירה')
    }
  }

  const handleEditPiece = (piece: ProgramPiece) => {
    setEditingPiece(piece)
    setShowEditPieceModal(true)
  }

  const handleUpdatePiece = async (updatedPieceData: Omit<ProgramPiece, '_id'>) => {
    if (!bagrutId || !bagrut || !editingPiece) return
    try {
      // Update the piece in the program array
      const updatedProgram = (bagrut.program || []).map(piece => 
        piece.pieceNumber === editingPiece.pieceNumber 
          ? { ...updatedPieceData, pieceNumber: editingPiece.pieceNumber }
          : piece
      )
      
      let success = false
      
      try {
        // Try the targeted program-only update first
        success = await apiService.bagrut.updateBagrutProgram(bagrutId, updatedProgram)
      } catch (programUpdateError) {
        console.warn('Program-specific endpoint not available, falling back to full bagrut update:', programUpdateError)
        
        // Fallback: Full bagrut update with program changes
        const updateData = {
          studentId: bagrut.studentId,
          teacherId: bagrut.teacherId,
          program: updatedProgram,
          conservatoryName: bagrut.conservatoryName || '',
          accompaniment: bagrut.accompaniment || { type: 'נגן מלווה', accompanists: [] },
          presentations: bagrut.presentations || [],
          isCompleted: bagrut.isCompleted,
          isActive: bagrut.isActive
        }
        
        // Add optional fields if they exist
        if (bagrut.testDate) updateData.testDate = bagrut.testDate
        if (bagrut.notes) updateData.notes = bagrut.notes
        if (bagrut.recitalUnits) updateData.recitalUnits = bagrut.recitalUnits
        if (bagrut.recitalField) updateData.recitalField = bagrut.recitalField
        if (bagrut.magenBagrut) updateData.magenBagrut = bagrut.magenBagrut
        
        success = await apiService.bagrut.updateBagrut(bagrutId, updateData)
      }
      
      if (success) {
        await loadBagrutDetails()
        setShowEditPieceModal(false)
        setEditingPiece(null)
      }
    } catch (error) {
      console.error('Error updating piece:', error)
      throw new Error('שגיאה בעדכון היצירה')
    }
  }

  const handleDeletePiece = (pieceNumber: number) => {
    setDeletingPieceNumber(pieceNumber)
    setShowDeletePieceModal(true)
  }

  const confirmDeletePiece = async () => {
    if (!bagrutId || !bagrut || deletingPieceNumber === null) return
    try {
      // Remove the piece from the program array
      const updatedProgram = (bagrut.program || []).filter(piece => piece.pieceNumber !== deletingPieceNumber)
      
      // Renumber remaining pieces to maintain sequence
      const renumberedProgram = updatedProgram.map((piece, index) => ({
        ...piece,
        pieceNumber: index + 1
      }))
      
      let success = false
      
      try {
        // Try the targeted program-only update first
        success = await apiService.bagrut.updateBagrutProgram(bagrutId, renumberedProgram)
      } catch (programUpdateError) {
        console.warn('Program-specific endpoint not available, falling back to full bagrut update:', programUpdateError)
        
        // Fallback: Full bagrut update with program changes
        const updateData = {
          studentId: bagrut.studentId,
          teacherId: bagrut.teacherId,
          program: renumberedProgram,
          conservatoryName: bagrut.conservatoryName || '',
          accompaniment: bagrut.accompaniment || { type: 'נגן מלווה', accompanists: [] },
          presentations: bagrut.presentations || [],
          isCompleted: bagrut.isCompleted,
          isActive: bagrut.isActive
        }
        
        // Add optional fields if they exist
        if (bagrut.testDate) updateData.testDate = bagrut.testDate
        if (bagrut.notes) updateData.notes = bagrut.notes
        if (bagrut.recitalUnits) updateData.recitalUnits = bagrut.recitalUnits
        if (bagrut.recitalField) updateData.recitalField = bagrut.recitalField
        if (bagrut.magenBagrut) updateData.magenBagrut = bagrut.magenBagrut
        
        success = await apiService.bagrut.updateBagrut(bagrutId, updateData)
      }
      
      if (success) {
        await loadBagrutDetails()
        setShowDeletePieceModal(false)
        setDeletingPieceNumber(null)
      }
    } catch (error) {
      console.error('Error deleting piece:', error)
      throw new Error('שגיאה במחיקת היצירה')
    }
  }

  const handleSaveOverview = async () => {
    if (!bagrutId || !bagrut) return
    
    try {
      const updateData = {
        studentId: bagrut.studentId,
        teacherId: overviewFormData.teacherId,
        conservatoryName: overviewFormData.conservatoryName,
        testDate: overviewFormData.testDate ? new Date(overviewFormData.testDate) : undefined,
        recitalUnits: overviewFormData.recitalUnits,
        recitalField: overviewFormData.recitalField,
        notes: overviewFormData.notes,
        program: bagrut.program || [],
        accompaniment: bagrut.accompaniment || { type: 'נגן מלווה', accompanists: [] },
        presentations: bagrut.presentations || [],
        isCompleted: bagrut.isCompleted,
        isActive: bagrut.isActive
      }
      
      // Add optional fields if they exist
      if (bagrut.magenBagrut) updateData.magenBagrut = bagrut.magenBagrut
      
      const success = await apiService.bagrut.updateBagrut(bagrutId, updateData)
      
      if (success) {
        await loadBagrutDetails()
        setIsEditingOverview(false)
      }
    } catch (error) {
      console.error('Error saving overview data:', error)
      alert('שגיאה בשמירת הנתונים')
    }
  }

  const handleCancelOverviewEdit = () => {
    // Reset form data to original bagrut data
    if (bagrut) {
      setOverviewFormData({
        teacherId: bagrut.teacherId || '',
        conservatoryName: bagrut.conservatoryName || '',
        testDate: bagrut.testDate ? new Date(bagrut.testDate).toISOString().split('T')[0] : '',
        recitalUnits: bagrut.recitalUnits || 5,
        recitalField: bagrut.recitalField || '',
        notes: bagrut.notes || ''
      })
    }
    setIsEditingOverview(false)
  }

  const handleExportPDF = async () => {
    if (!bagrutId) return

    try {
      const response = await fetch(`/api/bagrut/${bagrutId}/export/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bagrut-${getDisplayName(student?.personalInfo) || bagrutId}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting PDF:', err)
    }
  }

  console.log('🔍 BagrutDetails render: loading:', loading, 'bagrut:', !!bagrut, 'error:', error);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircleNotchIcon size={32} weight="regular" className="animate-spin mx-auto mb-4 text-primary" />
          <div className="text-gray-800">טוען פרטי בגרות...</div>
          <div className="text-xs text-gray-500 mt-2">ID: {bagrutId}</div>
        </div>
      </div>
    )
  }

  if (error || !bagrut) {
    console.log('❌ BagrutDetails: Showing error state - error:', error, 'bagrut exists:', !!bagrut);
    return (
      <div className="text-center py-12">
        <WarningCircleIcon size={48} weight="fill" className="text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">שגיאה בטעינת הבגרות</h3>
        <p className="text-gray-800 mb-4">{error || 'בגרות לא נמצאה'}</p>
        <div className="text-xs text-gray-400 mb-4">
          Debug: ID={bagrutId}, Loading={loading}, Error={error}, Bagrut={!!bagrut}
        </div>
        <button
          onClick={() => navigate('/bagruts')}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
        >
          <ArrowRightIcon size={16} weight="fill" className="ml-2" mirrored />
          חזור לרשימת בגרויות
        </button>
      </div>
    )
  }

  // Calculate progress using utility function
  const completedStats = calculateCompletedPresentations(bagrut)
  const totalPresentations = PRESENTATION_CONSTANTS.TOTAL_PRESENTATIONS_WITH_MAGEN
  const programPieces = bagrut.program?.length || 0
  const documentsCount = bagrut.documents?.length || 0

  // Create display presentations using utility function
  const displayPresentations = createDisplayPresentations(bagrut)

  const overallProgress = Math.round(
    (completedStats.total / totalPresentations) * 100
  )

  // Status color
  const getStatusColor = () => {
    if (bagrut.isCompleted) return 'green'
    if (overallProgress >= 50) return 'orange'
    return 'red'
  }

  return (
    <div className="space-y-6">
      {/* Gradient header with breadcrumb */}
      <DetailPageHeader
        firstName={student?.personalInfo?.firstName}
        lastName={student?.personalInfo?.lastName}
        fullName={student?.personalInfo?.fullName || getDisplayName(student?.personalInfo)}
        entityType="בגרות"
        breadcrumbLabel="בגרויות"
        breadcrumbHref="/bagruts"
        updatedAt={bagrut?.updatedAt}
        badges={
          <>
            {bagrut.isCompleted ? (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">הושלם</span>
            ) : (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">בתהליך</span>
            )}
            {teacher && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                מורה: {getDisplayName(teacher?.personalInfo)}
              </span>
            )}
          </>
        }
      />

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {!bagrut.isCompleted && (
          <button
            onClick={() => setShowCompleteModal(true)}
            className="flex items-center px-3 py-2 text-green-700 border border-green-300 rounded hover:bg-green-50"
          >
            <CheckCircleIcon size={16} weight="fill" className="ml-1" />
            השלם בגרות
          </button>
        )}
        <button
          onClick={handleExportPDF}
          className="flex items-center px-3 py-2 text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
        >
          <DownloadIcon size={16} weight="regular" className="ml-1" />
          ייצא PDF
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center px-3 py-2 text-red-700 border border-red-300 rounded hover:bg-red-50"
        >
          <TrashIcon size={16} weight="fill" className="ml-1" />
          מחק
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="התקדמות כללית"
          value={`${overallProgress}%`}
          subtitle="השלמת משימות"
          icon={<ClockIcon />}
          color={getStatusColor()}
        />
        <StatsCard
          title="השמעות"
          value={`${completedStats.regular}/3`}
          subtitle="השמעות רגילות שהושלמו"
          icon={<BookOpenIcon />}
          color={completedStats.regular === 3 ? 'green' : 'orange'}
        />
        <StatsCard
          title="תכנית"
          value={programPieces.toString()}
          subtitle="יצירות בתכנית"
          icon={<MusicNoteIcon />}
          color="blue"
        />
        <StatsCard
          title="מסמכים"
          value={documentsCount.toString()}
          subtitle="מסמכים מצורפים"
          icon={<FileTextIcon />}
          color="purple"
        />
        <StatsCard
          title="ציון סופי"
          value={bagrut.finalGrade?.toString() || '-'}
          subtitle={bagrut.finalGradeLevel || 'טרם חושב'}
          icon={<MedalIcon />}
          color={bagrut.finalGrade && bagrut.finalGrade >= 90 ? 'green' : 'gray'}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <Tab
              label="סקירה כללית"
              icon={<FileTextIcon size={16} weight="regular" />}
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <Tab
              label="תכנית"
              icon={<MusicNoteIcon size={16} weight="regular" />}
              isActive={activeTab === 'program'}
              onClick={() => setActiveTab('program')}
              badge={programPieces}
            />
            <Tab
              label="השמעות"
              icon={<BookOpenIcon size={16} weight="regular" />}
              isActive={activeTab === 'presentations'}
              onClick={() => setActiveTab('presentations')}
              badge={completedStats.regular}
            />
            <Tab
              label="מגן בגרות"
              icon={<StarIcon size={16} weight="regular" />}
              isActive={activeTab === 'magen'}
              onClick={() => setActiveTab('magen')}
            />
            <Tab
              label="ציונים"
              icon={<MedalIcon size={16} weight="regular" />}
              isActive={activeTab === 'grading'}
              onClick={() => setActiveTab('grading')}
            />
            <Tab
              label="מסמכים"
              icon={<FileIcon size={16} weight="regular" />}
              isActive={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
              badge={documentsCount}
            />
            <Tab
              label="מלווים"
              icon={<UsersIcon size={16} weight="regular" />}
              isActive={activeTab === 'accompanists'}
              onClick={() => setActiveTab('accompanists')}
              badge={bagrut.accompaniment?.accompanists?.length || 0}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Edit button for overview */}
              <div className="flex justify-end mb-4">
                {!isEditingOverview ? (
                  <button
                    onClick={() => setIsEditingOverview(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    <PencilSimpleIcon size={16} weight="regular" />
                    ערוך פרטים כלליים
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveOverview}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <FloppyDiskIcon size={16} weight="regular" />
                      שמור
                    </button>
                    <button
                      onClick={handleCancelOverviewEdit}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      <XIcon size={16} weight="regular" />
                      ביטול
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי התלמיד</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="force-black-text">שם:</span>
                    <span className="font-medium text-gray-900">{getDisplayName(student?.personalInfo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="force-black-text">טלפון:</span>
                    <span className="font-medium text-gray-900" dir="ltr">{student?.personalInfo?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="force-black-text">כיתה:</span>
                    <span className="font-medium text-gray-900">{student?.academicInfo?.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="force-black-text">כלי ראשי:</span>
                    <span className="font-medium text-gray-900">
                      {student?.academicInfo?.instrumentProgress?.find((i: any) => i.isPrimary)?.instrumentName}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי בגרות</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="force-black-text">מורה מנחה:</span>
                    {isEditingOverview ? (
                      <span className="text-gray-500">לא ניתן לשנות</span>
                    ) : (
                      <span className="font-medium text-gray-900">{getDisplayName(teacher?.personalInfo)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="force-black-text">קונסרבטוריון:</span>
                    {isEditingOverview ? (
                      <input
                        type="text"
                        value={overviewFormData.conservatoryName}
                        onChange={(e) => setOverviewFormData(prev => ({ ...prev, conservatoryName: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{bagrut.conservatoryName || 'לא צוין'}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="force-black-text">תאריך מבחן:</span>
                    {isEditingOverview ? (
                      <input
                        type="date"
                        value={overviewFormData.testDate}
                        onChange={(e) => setOverviewFormData(prev => ({ ...prev, testDate: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">
                        {bagrut.testDate ? new Date(bagrut.testDate).toLocaleDateString('he-IL') : 'לא נקבע'}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="force-black-text">יחידות רסיטל:</span>
                    {isEditingOverview ? (
                      <select
                        value={overviewFormData.recitalUnits}
                        onChange={(e) => setOverviewFormData(prev => ({ ...prev, recitalUnits: parseInt(e.target.value) }))}
                        className="px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="3">3</option>
                        <option value="5">5</option>
                      </select>
                    ) : (
                      <span className="font-medium text-gray-900">{bagrut.recitalUnits || 'לא צוין'}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="force-black-text">תחום רסיטל:</span>
                    {isEditingOverview ? (
                      <select
                        value={overviewFormData.recitalField}
                        onChange={(e) => setOverviewFormData(prev => ({ ...prev, recitalField: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="">בחר תחום</option>
                        <option value="קלאסי">קלאסי</option>
                        <option value="ג'אז">ג'אז</option>
                        <option value="מוסיקה ערבית">מוסיקה ערבית</option>
                        <option value="אחר">אחר</option>
                      </select>
                    ) : (
                      <span className="font-medium text-gray-900">{bagrut.recitalField || 'לא צוין'}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="force-black-text">סטטוס:</span>
                    <span className={`font-medium ${bagrut.isCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                      {bagrut.isCompleted ? 'הושלם' : 'בתהליך'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">הערות</h3>
                {isEditingOverview ? (
                  <textarea
                    value={overviewFormData.notes}
                    onChange={(e) => setOverviewFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded resize-none"
                    rows={4}
                    placeholder="הוסף הערות..."
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{bagrut.notes || 'אין הערות'}</p>
                )}
              </Card>
            </div>
            </div>
          )}

          {/* Program Tab */}
          {activeTab === 'program' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">תכנית הביצוע</h3>
                <button
                  onClick={() => setShowAddPieceModal(true)}
                  className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
                >
                  <PlusIcon size={16} weight="fill" className="ml-1" />
                  הוסף יצירה
                </button>
              </div>
              
              {bagrut.program && bagrut.program.length > 0 ? (
                <Table
                  data={bagrut.program}
                  columns={[
                    { 
                      key: 'pieceNumber', 
                      header: 'מס׳', 
                      width: '60px',
                      align: 'center'
                    },
                    { 
                      key: 'composer', 
                      header: 'מלחין',
                      render: (row) => row.composer || 'לא צוין'
                    },
                    { 
                      key: 'pieceTitle', 
                      header: 'שם היצירה',
                      render: (row) => row.pieceTitle || 'לא צוין'
                    },
                    { 
                      key: 'movement', 
                      header: 'פרק',
                      render: (row) => row.movement || '-'
                    },
                    { 
                      key: 'duration', 
                      header: 'משך',
                      render: (row) => row.duration || 'לא צוין'
                    },
                    { 
                      key: 'youtubeLink', 
                      header: 'קישור יוטיוב',
                      render: (row) => row.youtubeLink ? (
                        <a 
                          href={row.youtubeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          צפה ביוטיוב
                        </a>
                      ) : (
                        <span className="text-gray-500">אין קישור</span>
                      )
                    },
                    { 
                      key: 'actions', 
                      header: 'פעולות',
                      width: '120px',
                      render: (row) => (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPiece(row)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="ערוך יצירה"
                          >
                            <PencilSimpleIcon size={16} weight="regular" />
                          </button>
                          <button
                            onClick={() => handleDeletePiece(row.pieceNumber)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="מחק יצירה"
                          >
                            <TrashIcon size={16} weight="fill" />
                          </button>
                        </div>
                      )
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8 text-gray-700">
                  <MusicNoteIcon size={48} weight="regular" className="text-gray-400 mx-auto mb-3" />
                  <p>אין יצירות בתכנית</p>
                </div>
              )}
            </div>
          )}

          {/* Presentations Tab (השמעות) */}
          {activeTab === 'presentations' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">השמעות</h3>
                <div className="text-sm text-gray-600">
                  {completedStats.regular} מתוך 3 השמעות הושלמו
                </div>
              </div>
              
              {displayPresentations.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {displayPresentations.map((presentation) => (
                    <PresentationCard
                      key={`presentation-${presentation.presentationNumber}`}
                      presentation={presentation}
                      onUpdate={handlePresentationUpdate}
                      onDelete={handlePresentationDelete}
                      onView={handlePresentationView}
                      programPieces={bagrut.program || []}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-700">
                  <BookOpenIcon size={48} weight="regular" className="text-gray-400 mx-auto mb-3" />
                  <p>אין השמעות</p>
                  <button
                    onClick={() => navigate(`/bagruts/${bagrutId}/edit?tab=presentations`)}
                    className="mt-4 flex items-center mx-auto px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
                  >
                    <PlusIcon size={16} weight="fill" className="ml-1" />
                    הוסף השמעות
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Magen Bagrut Tab */}
          {activeTab === 'magen' && (
            <MagenBagrutTab 
              bagrut={bagrut} 
              onUpdate={async (magenData) => {
                try {
                  console.log('🔄 BagrutDetails: Received magen data for update:', magenData);
                  console.log('🔍 BagrutDetails: Current bagrutId:', bagrutId);
                  console.log('🔍 BagrutDetails: Current bagrut data:', bagrut);
                  
                  // Include pieceGradings in the save data
                  const cleanMagenData = magenData;
                  
                  // Prepare the complete update payload including required fields and preserve existing data
                  const updatePayload = {
                    studentId: bagrut.studentId,
                    teacherId: bagrut.teacherId,
                    program: bagrut.program || [], // Preserve existing program
                    magenBagrut: cleanMagenData
                  };
                  
                  console.log('📡 BagrutDetails: Calling apiService.bagrut.updateBagrut with payload:', updatePayload);
                  const result = await apiService.bagrut.updateBagrut(bagrutId!, updatePayload);
                  console.log('✅ BagrutDetails: API update result:', result);
                  
                  console.log('🔄 BagrutDetails: Refreshing bagrut data...');
                  await fetchBagrutById(bagrutId!);
                  console.log('✅ BagrutDetails: Bagrut data refreshed successfully');
                } catch (error) {
                  console.error('❌ BagrutDetails: Error updating magen bagrut:', error);
                  console.error('❌ BagrutDetails: Error details:', error.message, error.response?.data);
                  alert('שגיאה בשמירה: ' + (error.response?.data?.message || error.message));
                }
              }} 
            />
          )}

          {/* Grading Tab */}
          {activeTab === 'grading' && (
            <div className="space-y-6">
              {/* Final Grade Summary */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ציון סופי</h3>
                <div className="flex justify-between items-center p-4 bg-muted rounded">
                  <span className="text-lg font-semibold force-black-text">ציון מגן בגרות</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-foreground">
                      {bagrut.magenBagrut?.grade || bagrut.finalGrade || '-'}
                    </span>
                    {(bagrut.magenBagrut?.gradeLevel || bagrut.finalGradeLevel) && (
                      <div className="text-sm text-gray-800 mt-1">
                        {bagrut.magenBagrut?.gradeLevel || bagrut.finalGradeLevel}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Detailed Piece-by-Piece Breakdown */}
              {bagrut.magenBagrut?.pieceGradings && bagrut.magenBagrut.pieceGradings.length > 0 ? (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">פירוט ציונים לפי יצירות</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 border border-gray-200">
                            יצירה
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                            מיומנות נגינה/שירה<br />
                            <span className="text-xs text-gray-500">(מקס' 40)</span>
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                            הבנה מוסיקלית<br />
                            <span className="text-xs text-gray-500">(מקס' 30)</span>
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                            ידיעת הטקסט<br />
                            <span className="text-xs text-gray-500">(מקס' 20)</span>
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                            נגינה בע"פ<br />
                            <span className="text-xs text-gray-500">(10)</span>
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                            סה"כ<br />
                            <span className="text-xs text-gray-500">(100)</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bagrut.magenBagrut.pieceGradings.map((piece, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 border border-gray-200">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {piece.pieceTitle} #{piece.pieceNumber}
                                </div>
                                <div className="text-gray-600">{piece.composer}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center border border-gray-200">
                              <div className="font-semibold text-gray-900">{piece.playingSkills}</div>
                            </td>
                            <td className="px-4 py-3 text-center border border-gray-200">
                              <div className="font-semibold text-gray-900">{piece.musicalUnderstanding}</div>
                            </td>
                            <td className="px-4 py-3 text-center border border-gray-200">
                              <div className="font-semibold text-gray-900">{piece.textKnowledge}</div>
                            </td>
                            <td className="px-4 py-3 text-center border border-gray-200">
                              <div className="flex flex-col items-center">
                                <span className="text-sm">{piece.playingByHeart ? '✓' : '✗'}</span>
                                <span className="text-xs text-gray-600">
                                  {piece.playingByHeart ? '10' : '0'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-foreground border border-border">
                              {(piece.playingSkills || 0) + (piece.musicalUnderstanding || 0) + (piece.textKnowledge || 0) + (piece.playingByHeart ? 10 : 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Row */}
                  <div className="mt-6 p-4 bg-blue-50 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">ממוצע מיומנות נגינה:</span>
                        <span className="font-semibold text-gray-900">
                          {Math.round(bagrut.magenBagrut.pieceGradings.reduce((sum, p) => sum + (p.playingSkills || 0), 0) / bagrut.magenBagrut.pieceGradings.length)}/40
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">ממוצע הבנה מוסיקלית:</span>
                        <span className="font-semibold text-gray-900">
                          {Math.round(bagrut.magenBagrut.pieceGradings.reduce((sum, p) => sum + (p.musicalUnderstanding || 0), 0) / bagrut.magenBagrut.pieceGradings.length)}/30
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">ממוצע ידיעת טקסט:</span>
                        <span className="font-semibold text-gray-900">
                          {Math.round(bagrut.magenBagrut.pieceGradings.reduce((sum, p) => sum + (p.textKnowledge || 0), 0) / bagrut.magenBagrut.pieceGradings.length)}/20
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">יצירות בעל פה:</span>
                        <span className="font-semibold text-gray-900">
                          {bagrut.magenBagrut.pieceGradings.filter(p => p.playingByHeart).length}/{bagrut.magenBagrut.pieceGradings.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">ציון כולל:</span>
                        <span className="text-2xl font-bold text-foreground">
                          {Math.round(
                            bagrut.magenBagrut.pieceGradings.reduce((sum, piece) => 
                              sum + (piece.playingSkills || 0) + (piece.musicalUnderstanding || 0) + 
                              (piece.textKnowledge || 0) + (piece.playingByHeart ? 10 : 0), 0
                            ) / bagrut.magenBagrut.pieceGradings.length
                          )}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : bagrut.magenBagrut?.detailedGrading ? (
                /* Fallback to old detailed grading format */
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">פירוט ציונים (סיכום)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="force-black-text">מיומנות נגינה</span>
                      <span className="text-xl font-semibold text-gray-900">
                        {bagrut.magenBagrut.detailedGrading.playingSkills?.points || 0}/40
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="force-black-text">הבנה מוזיקלית</span>
                      <span className="text-xl font-semibold text-gray-900">
                        {bagrut.magenBagrut.detailedGrading.musicalUnderstanding?.points || 0}/30
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="force-black-text">ידיעת הטקסט</span>
                      <span className="text-xl font-semibold text-gray-900">
                        {bagrut.magenBagrut.detailedGrading.textKnowledge?.points || 0}/20
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="force-black-text">נגינה בעל פה</span>
                      <span className="text-xl font-semibold text-gray-900">
                        {bagrut.magenBagrut.detailedGrading.playingByHeart?.points || 0}/10
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-900">
                      ציון מפורט: {(
                        (bagrut.magenBagrut.detailedGrading.playingSkills?.points || 0) +
                        (bagrut.magenBagrut.detailedGrading.musicalUnderstanding?.points || 0) +
                        (bagrut.magenBagrut.detailedGrading.textKnowledge?.points || 0) +
                        (bagrut.magenBagrut.detailedGrading.playingByHeart?.points || 0)
                      )}/100
                    </div>
                  </div>
                </Card>
              ) : (
                /* No grading data available */
                <Card>
                  <div className="text-center text-gray-500 py-12">
                    <WarningCircleIcon size={64} weight="regular" className="mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">טרם הוזנו ציונים</h4>
                    <p className="text-gray-600">הציונים יוצגו כאן לאחר השלמת מגן בגרות</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">מסמכים</h3>
                <label className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 cursor-pointer">
                  <UploadIcon size={16} weight="regular" className="ml-1" />
                  העלה מסמך
                  <input
                    type="file"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={uploadingDocument}
                  />
                </label>
              </div>

              {uploadingDocument && (
                <div className="text-center py-4">
                  <CircleNotchIcon size={24} weight="regular" className="animate-spin mx-auto text-primary" />
                  <p className="text-sm text-gray-800 mt-2">מעלה מסמך...</p>
                </div>
              )}
              
              {bagrut.documents && bagrut.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bagrut.documents.map((doc) => (
                    <Card key={doc._id} className="hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <FileIcon size={32} weight="regular" className="text-gray-400 mb-2" />
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{doc.fileName}</h4>
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs mb-2">
                            {doc.category}
                          </span>
                          {doc.description && (
                            <p className="text-xs text-gray-800">{doc.description}</p>
                          )}
                          <div className="text-xs text-gray-700 mt-2">
                            {new Date(doc.uploadDate).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDocumentDownload(doc._id!, doc.fileName)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="הורד"
                          >
                            <DownloadIcon size={16} weight="regular" />
                          </button>
                          <button
                            onClick={() => handleDocumentDelete(doc._id!)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="מחק"
                          >
                            <TrashIcon size={16} weight="fill" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-700">
                  <FileTextIcon size={48} weight="regular" className="text-gray-400 mx-auto mb-3" />
                  <p>אין מסמכים מצורפים</p>
                </div>
              )}
            </div>
          )}

          {/* Accompanists Tab */}
          {activeTab === 'accompanists' && (
            <AccompanistManager
              accompaniment={bagrut.accompaniment || { type: 'נגן מלווה', accompanists: [] }}
              onUpdate={handleAccompanimentUpdate}
              readonly={bagrut.isCompleted}
            />
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת בגרות"
        message={`האם אתה בטוח שברצונך למחוק את הבגרות של ${getDisplayName(student?.personalInfo)}? פעולה זו לא ניתנת לביטול.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />

      {/* Complete Bagrut Modal */}
      <ConfirmationModal
        isOpen={showCompleteModal}
        title="השלמת בגרות"
        message="האם אתה בטוח שברצונך להשלים את הבגרות? לאחר ההשלמה לא ניתן יהיה לערוך את הנתונים."
        confirmText="השלם בגרות"
        cancelText="ביטול"
        onConfirm={handleComplete}
        onCancel={() => setShowCompleteModal(false)}
        variant="primary"
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            חתימת המורה
          </label>
          <input
            type="text"
            value={teacherSignature}
            onChange={(e) => setTeacherSignature(e.target.value)}
            placeholder="הכנס את שמך המלא כחתימה"
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </ConfirmationModal>

      {/* Performance Details Modal */}
      <PerformanceDetailsModal
        isOpen={showPerformanceModal}
        performance={selectedPerformance}
        programPieces={bagrut?.program || []}
        onClose={closePerformanceModal}
        onUpdate={handlePerformanceUpdate}
      />

      {/* Add Piece Modal */}
      <AddPieceModal
        isOpen={showAddPieceModal}
        onClose={() => setShowAddPieceModal(false)}
        onSubmit={handleAddPiece}
        existingPieces={bagrut?.program || []}
      />

      {/* Edit Piece Modal */}
      <AddPieceModal
        isOpen={showEditPieceModal}
        onClose={() => {
          setShowEditPieceModal(false)
          setEditingPiece(null)
        }}
        onSubmit={handleUpdatePiece}
        existingPieces={(bagrut?.program || []).filter(p => p.pieceNumber !== editingPiece?.pieceNumber)}
        initialData={editingPiece}
        title="ערוך יצירה"
        submitText="עדכן יצירה"
      />

      {/* Delete Piece Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeletePieceModal}
        title="מחיקת יצירה"
        message={`האם אתה בטוח שברצונך למחוק את היצירה מס' ${deletingPieceNumber}? פעולה זו לא ניתנת לביטול.`}
        confirmText="מחק יצירה"
        cancelText="ביטול"
        onConfirm={confirmDeletePiece}
        onCancel={() => {
          setShowDeletePieceModal(false)
          setDeletingPieceNumber(null)
        }}
        variant="danger"
      />

      {/* Presentation Details Modal */}
      <PresentationDetailsModal
        isOpen={showPresentationModal}
        presentation={selectedPresentation}
        programPieces={bagrut?.program || []}
        onClose={() => setShowPresentationModal(false)}
        onUpdate={handlePresentationUpdate}
        onNavigateToTab={(tabName) => setActiveTab('presentations')}
      />
    </div>
  )
}