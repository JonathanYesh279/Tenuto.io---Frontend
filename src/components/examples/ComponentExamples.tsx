/**
 * Component Usage Examples
 * 
 * Demonstrates how to use the reusable components in different contexts
 */

import React from 'react'
import { 
  StudentCard, 
  TeacherCard, 
  LessonSlot, 
  InstrumentProgress 
} from '../index'

// Example student data
const exampleStudent = {
  _id: '507f1f77bcf86cd799439011',
  personalInfo: {
    fullName: 'שרה כהן',
    phone: '0501234567',
    parentName: 'דוד כהן',
    parentPhone: '0507654321'
  },
  academicInfo: {
    class: 'ח',
    instrumentProgress: [
      {
        instrumentName: 'כינור',
        isPrimary: true,
        currentStage: 4,
        tests: {
          stageTest: {
            status: 'עבר/ה',
            lastTestDate: '2024-06-15T00:00:00.000Z',
            nextTestDate: '2024-12-15T00:00:00.000Z'
          },
          technicalTest: {
            status: 'לא נבחן'
          }
        }
      },
      {
        instrumentName: 'פסנתר',
        isPrimary: false,
        currentStage: 2,
        tests: {
          stageTest: {
            status: 'לא נבחן'
          },
          technicalTest: {
            status: 'לא נבחן'
          }
        }
      }
    ]
  },
  teacherAssignments: [
    {
      teacherId: '507f1f77bcf86cd799439012',
      day: 'ראשון',
      time: '14:00'
    },
    {
      teacherId: '507f1f77bcf86cd799439013', 
      day: 'רביעי',
      time: '16:00'
    }
  ],
  isActive: true
}

// Example teacher data
const exampleTeacher = {
  _id: '507f1f77bcf86cd799439012',
  personalInfo: {
    fullName: 'מיכל לוי',
    phone: '0501112233',
    email: 'michal.levi@conservatory.com'
  },
  roles: ['מורה', 'מדריך הרכב'],
  professionalInfo: {
    instrument: 'כינור',
    isActive: true
  },
  studentCount: 2,
  teaching: {
    schedule: [
      {
        day: 'ראשון',
        startTime: '14:00',
        endTime: '14:45',
        duration: 45
      },
      {
        day: 'רביעי', 
        startTime: '16:00',
        endTime: '16:45',
        duration: 45
      }
    ]
  },
  isActive: true
}

// Example lesson data
const exampleLesson = {
  _id: '507f1f77bcf86cd799439015',
  time: '14:00',
  duration: 45,
  studentId: '507f1f77bcf86cd799439011',
  studentName: 'שרה כהן',
  instrumentName: 'כינור',
  currentStage: 4,
  location: 'חדר 101',
  day: 'ראשון',
  endTime: '14:45',
  isAvailable: true
}

const ComponentExamples: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">דוגמאות לרכיבים</h1>

      {/* Student Card Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">כרטיס תלמיד</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Full Student Card */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">כרטיס מלא</h3>
            <StudentCard
              student={exampleStudent}
              showInstruments={true}
              showTeacherAssignments={true}
              showParentContact={true}
              onClick={() => console.log('Student clicked')}
            />
          </div>

          {/* Compact Student Card */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">כרטיס קומפקטי</h3>
            <StudentCard
              student={exampleStudent}
              showInstruments={true}
              showTeacherAssignments={false}
              showParentContact={false}
            />
          </div>

          {/* Minimal Student Card */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">כרטיס מינימלי</h3>
            <StudentCard
              student={exampleStudent}
              showInstruments={false}
              showTeacherAssignments={false}
              showParentContact={false}
            />
          </div>
        </div>
      </section>

      {/* Teacher Card Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">כרטיס מורה</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Full Teacher Card */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">כרטיס מלא</h3>
            <TeacherCard
              teacher={exampleTeacher}
              showStudentCount={true}
              showSchedule={true}
              showContact={true}
              onClick={() => console.log('Teacher clicked')}
            />
          </div>

          {/* Basic Teacher Card */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">כרטיס בסיסי</h3>
            <TeacherCard
              teacher={exampleTeacher}
              showStudentCount={true}
              showSchedule={false}
              showContact={false}
            />
          </div>

          {/* Minimal Teacher Card */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">כרטיס מינימלי</h3>
            <TeacherCard
              teacher={exampleTeacher}
              showStudentCount={false}
              showSchedule={false}
              showContact={false}
            />
          </div>
        </div>
      </section>

      {/* Lesson Slot Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">משבצת שיעור</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Full Lesson Slot */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">משבצת מלאה</h3>
            <LessonSlot
              lesson={exampleLesson}
              showStudent={true}
              showTime={true}
              showInstrument={true}
              showLocation={true}
              editable={true}
              onEdit={() => console.log('Edit lesson')}
              onDelete={() => console.log('Delete lesson')}
            />
          </div>

          {/* Compact Lesson Slot */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">משבצת קומפקטית</h3>
            <LessonSlot
              lesson={exampleLesson}
              showStudent={true}
              showTime={true}
              showInstrument={true}
              showLocation={false}
              compact={true}
              editable={true}
              onEdit={() => console.log('Edit lesson')}
            />
          </div>

          {/* Available Slot */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">משבצת זמינה</h3>
            <LessonSlot
              lesson={{
                ...exampleLesson,
                studentName: undefined,
                studentId: undefined,
                instrumentName: undefined,
                currentStage: undefined
              }}
              showStudent={true}
              showTime={true}
              showInstrument={false}
              showLocation={true}
              compact={true}
            />
          </div>
        </div>
      </section>

      {/* Instrument Progress Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">התקדמות בכלי נגינה</h2>
        
        {/* Full Instrument Progress */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">תצוגה מלאה</h3>
          <InstrumentProgress
            instruments={exampleStudent.academicInfo.instrumentProgress}
            showTests={true}
            editable={true}
            onEdit={(index) => console.log('Edit instrument', index)}
            onDelete={(index) => console.log('Delete instrument', index)}
          />
        </div>

        {/* Compact Instrument Progress */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">תצוגה קומפקטית</h3>
          <InstrumentProgress
            instruments={exampleStudent.academicInfo.instrumentProgress}
            showTests={false}
            compact={true}
            editable={false}
          />
        </div>
      </section>

      {/* Usage in Lists */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">שימוש ברשימות</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student List */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">רשימת תלמידים</h3>
            <div className="space-y-3">
              {[exampleStudent, exampleStudent, exampleStudent].map((student, index) => (
                <StudentCard
                  key={index}
                  student={{
                    ...student,
                    personalInfo: {
                      ...student.personalInfo,
                      fullName: `${student.personalInfo.fullName} ${index + 1}`
                    }
                  }}
                  showInstruments={true}
                  showTeacherAssignments={true}
                  showParentContact={false}
                  onClick={() => console.log('Navigate to student', index + 1)}
                />
              ))}
            </div>
          </div>

          {/* Teacher List */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">רשימת מורים</h3>
            <div className="space-y-3">
              {[exampleTeacher, exampleTeacher, exampleTeacher].map((teacher, index) => (
                <TeacherCard
                  key={index}
                  teacher={{
                    ...teacher,
                    personalInfo: {
                      ...teacher.personalInfo,
                      fullName: `${teacher.personalInfo.fullName} ${index + 1}`
                    }
                  }}
                  showStudentCount={true}
                  showSchedule={false}
                  showContact={false}
                  onClick={() => console.log('Navigate to teacher', index + 1)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule View */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">תצוגת לוח זמנים</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">ראשון</h3>
            <div className="space-y-2">
              <LessonSlot
                lesson={exampleLesson}
                compact={true}
                showTime={true}
                showStudent={true}
                showInstrument={true}
                showLocation={false}
              />
              <LessonSlot
                lesson={{
                  ...exampleLesson,
                  time: '15:00',
                  endTime: '15:45',
                  studentName: 'יוסי מזרחי',
                  currentStage: 6
                }}
                compact={true}
                showTime={true}
                showStudent={true}
                showInstrument={true}
                showLocation={false}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">שני</h3>
            <div className="space-y-2">
              <LessonSlot
                lesson={{
                  ...exampleLesson,
                  time: '16:00',
                  endTime: '16:45',
                  studentName: undefined,
                  studentId: undefined,
                  instrumentName: undefined,
                  currentStage: undefined
                }}
                compact={true}
                showTime={true}
                showStudent={true}
                showInstrument={false}
                showLocation={false}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">שלישי</h3>
            <div className="text-center text-gray-500 py-8">
              אין שיעורים
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ComponentExamples