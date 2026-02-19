import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import apiService from '../services/apiService';
import { VALID_INSTRUMENTS, VALID_DAYS, VALID_DURATIONS, VALID_ROLES } from '../utils/validationUtils';
import { CLASSIFICATIONS, DEGREES, TEACHING_SUBJECTS, INSTRUMENT_DEPARTMENTS } from '../constants/enums';
import { formatAddress } from '../utils/nameUtils';

interface TeacherFormProps {
  teacher?: any;
  onSubmit: (teacherData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TeacherForm({ teacher, onSubmit, onCancel, isLoading = false }: TeacherFormProps) {
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      idNumber: '',
      birthYear: null as number | null
    },
    roles: ['מורה'],
    professionalInfo: {
      instrument: '',
      classification: '' as string,
      degree: '' as string,
      hasTeachingCertificate: false,
      teachingExperienceYears: null as number | null,
      isUnionMember: false,
      teachingSubjects: [] as string[],
      isActive: true
    },
    teaching: {
      schedule: []
    },
    conducting: {
      orchestraIds: []
    },
    ensemblesIds: [],
    schoolYears: [],
    credentials: {
      email: '',
      password: '',
      invitationToken: '',
      invitationExpiry: null,
      isInvitationAccepted: false
    },
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (teacher) {
      setFormData({
        personalInfo: {
          firstName: teacher.personalInfo?.firstName || '',
          lastName: teacher.personalInfo?.lastName || '',
          phone: teacher.personalInfo?.phone || '',
          email: teacher.personalInfo?.email || '',
          address: formatAddress(teacher.personalInfo?.address),
          idNumber: teacher.personalInfo?.idNumber || '',
          birthYear: teacher.personalInfo?.birthYear || null
        },
        roles: teacher.roles || ['מורה'],
        professionalInfo: {
          instrument: teacher.professionalInfo?.instrument || '',
          classification: teacher.professionalInfo?.classification || '',
          degree: teacher.professionalInfo?.degree || '',
          hasTeachingCertificate: teacher.professionalInfo?.hasTeachingCertificate || false,
          teachingExperienceYears: teacher.professionalInfo?.teachingExperienceYears ?? null,
          isUnionMember: teacher.professionalInfo?.isUnionMember || false,
          teachingSubjects: teacher.professionalInfo?.teachingSubjects || [],
          isActive: teacher.professionalInfo?.isActive !== undefined ? teacher.professionalInfo.isActive : true
        },
        teaching: {
          timeBlocks: teacher.teaching?.timeBlocks || []
        },
        conducting: {
          orchestraIds: teacher.conducting?.orchestraIds || []
        },
        ensemblesIds: teacher.ensemblesIds || [],
        schoolYears: teacher.schoolYears || [],
        credentials: {
          email: teacher.credentials?.email || teacher.personalInfo?.email || '',
          password: '',
          invitationToken: teacher.credentials?.invitationToken || '',
          invitationExpiry: teacher.credentials?.invitationExpiry || null,
          isInvitationAccepted: teacher.credentials?.isInvitationAccepted || false
        },
        isActive: teacher.isActive !== undefined ? teacher.isActive : true
      });
    }
  }, [teacher]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'personalInfo.firstName':
        if (!value || value.trim().length === 0) {
          return 'שם פרטי נדרש';
        }
        return '';

      case 'personalInfo.lastName':
        if (!value || value.trim().length === 0) {
          return 'שם משפחה נדרש';
        }
        return '';

      case 'personalInfo.phone':
        const phonePattern = /^05\d{8}$/;
        if (!value) {
          return 'מספר טלפון נדרש';
        }
        if (!phonePattern.test(value)) {
          return 'מספר טלפון חייב להיות בפורמט 05XXXXXXXX';
        }
        return '';

      case 'personalInfo.email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          return 'כתובת אימייל נדרשת';
        }
        if (!emailPattern.test(value)) {
          return 'כתובת אימייל לא תקינה';
        }
        return '';

      case 'credentials.email':
        const credEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          return 'כתובת אימייל להתחברות נדרשת';
        }
        if (!credEmailPattern.test(value)) {
          return 'כתובת אימייל לא תקינה';
        }
        if (value !== formData.personalInfo.email) {
          return 'כתובת אימייל להתחברות חייבת להיות זהה לאימייל האישי';
        }
        return '';

      case 'professionalInfo.instrument':
        const hasTeoryRole = formData.roles.includes('מורה תאוריה');
        if (!hasTeoryRole && (!value || value.trim().length === 0)) {
          return 'נושא הוראה נדרש (אלא אם כן התפקיד הוא מורה תאוריה)';
        }
        return '';

      case 'credentials.password':
        if (!teacher && (!value || value.length < 6)) {
          return 'סיסמה חייבת להיות לפחות 6 תווים';
        }
        return '';

      default:
        return '';
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const fieldParts = field.split('.');
    
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < fieldParts.length - 1; i++) {
        if (!current[fieldParts[i]]) {
          current[fieldParts[i]] = {};
        }
        current = current[fieldParts[i]];
      }
      
      current[fieldParts[fieldParts.length - 1]] = value;
      
      if (field === 'personalInfo.email') {
        newData.credentials.email = value;
      }
      
      return newData;
    });

    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    newErrors['personalInfo.firstName'] = validateField('personalInfo.firstName', formData.personalInfo.firstName);
    newErrors['personalInfo.lastName'] = validateField('personalInfo.lastName', formData.personalInfo.lastName);
    newErrors['personalInfo.phone'] = validateField('personalInfo.phone', formData.personalInfo.phone);
    newErrors['personalInfo.email'] = validateField('personalInfo.email', formData.personalInfo.email);
    newErrors['credentials.email'] = validateField('credentials.email', formData.credentials.email);
    newErrors['professionalInfo.instrument'] = validateField('professionalInfo.instrument', formData.professionalInfo.instrument);
    
    if (!teacher) {
      newErrors['credentials.password'] = validateField('credentials.password', formData.credentials.password);
    }

    if (formData.roles.length === 0) {
      newErrors['roles'] = 'חייב לבחור לפחות תפקיד אחד';
    }

    setErrors(newErrors);
    
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (teacher) {
        await apiService.teachers.updateTeacher(teacher._id, formData);
      } else {
        await apiService.teachers.createTeacher(formData);
      }
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting teacher form:', error);
    }
  };

  const getFieldError = (field: string): string => {
    return touched[field] ? errors[field] || '' : '';
  };

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-foreground">
            {teacher ? 'עריכת מורה' : 'הוספת מורה חדש'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-teachers-fg rounded-full" />
            <h3 className="text-base font-semibold text-foreground">מידע אישי</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם פרטי *
              </label>
              <input
                type="text"
                value={formData.personalInfo.firstName}
                onChange={(e) => handleInputChange('personalInfo.firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900 ${
                  getFieldError('personalInfo.firstName') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="הזן שם פרטי"
              />
              {getFieldError('personalInfo.firstName') && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getFieldError('personalInfo.firstName')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם משפחה *
              </label>
              <input
                type="text"
                value={formData.personalInfo.lastName}
                onChange={(e) => handleInputChange('personalInfo.lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900 ${
                  getFieldError('personalInfo.lastName') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="הזן שם משפחה"
              />
              {getFieldError('personalInfo.lastName') && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getFieldError('personalInfo.lastName')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                טלפון *
              </label>
              <input
                type="tel"
                value={formData.personalInfo.phone}
                onChange={(e) => handleInputChange('personalInfo.phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900 ${
                  getFieldError('personalInfo.phone') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="05XXXXXXXX"
              />
              {getFieldError('personalInfo.phone') && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getFieldError('personalInfo.phone')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אימייל *
              </label>
              <input
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => handleInputChange('personalInfo.email', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900 ${
                  getFieldError('personalInfo.email') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
              />
              {getFieldError('personalInfo.email') && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getFieldError('personalInfo.email')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת
              </label>
              <input
                type="text"
                value={formData.personalInfo.address}
                onChange={(e) => handleInputChange('personalInfo.address', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900"
                placeholder="הזן כתובת"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תעודת זהות
              </label>
              <input
                type="text"
                value={formData.personalInfo.idNumber}
                onChange={(e) => handleInputChange('personalInfo.idNumber', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900"
                placeholder="9 ספרות"
                maxLength={9}
              />
            </div>

            {/* Birth Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שנת לידה
              </label>
              <input
                type="number"
                min={1940}
                max={2010}
                value={formData.personalInfo.birthYear ?? ''}
                onChange={(e) => handleInputChange('personalInfo.birthYear', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900"
                placeholder="1940-2010"
              />
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-teachers-fg rounded-full" />
            <h3 className="text-base font-semibold text-foreground">תפקידים *</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {VALID_ROLES.map((role) => (
              <label key={role} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.roles.includes(role)}
                  onChange={(e) => handleRoleChange(role, e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-ring"
                />
                <span className="text-sm text-gray-700">{role}</span>
              </label>
            ))}
          </div>
          {getFieldError('roles') && (
            <div className="flex items-center mt-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {getFieldError('roles')}
            </div>
          )}
        </div>

        {/* Professional Information */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-teachers-fg rounded-full" />
            <h3 className="text-base font-semibold text-foreground">מידע מקצועי</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                נושא הוראה {!formData.roles.includes('מורה תאוריה') && '*'}
              </label>
              <select
                value={formData.professionalInfo.instrument}
                onChange={(e) => handleInputChange('professionalInfo.instrument', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900 ${
                  getFieldError('professionalInfo.instrument') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={formData.roles.includes('מורה תאוריה')}
              >
                <option value="">בחר נושא הוראה</option>
                {Object.entries(INSTRUMENT_DEPARTMENTS).map(([dept, instruments]) => (
                  <optgroup key={dept} label={dept}>
                    {instruments.map(instrument => (
                      <option key={instrument} value={instrument}>{instrument}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {getFieldError('professionalInfo.instrument') && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getFieldError('professionalInfo.instrument')}
                </div>
              )}
            </div>

            {/* Classification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סיווג</label>
              <select
                value={formData.professionalInfo.classification}
                onChange={(e) => handleInputChange('professionalInfo.classification', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900"
              >
                <option value="">בחר סיווג</option>
                {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Degree */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תואר</label>
              <select
                value={formData.professionalInfo.degree}
                onChange={(e) => handleInputChange('professionalInfo.degree', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900"
              >
                <option value="">בחר תואר</option>
                {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Teaching Experience Years */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שנות ניסיון בהוראה</label>
              <input
                type="number"
                min={0}
                max={50}
                value={formData.professionalInfo.teachingExperienceYears ?? ''}
                onChange={(e) => handleInputChange('professionalInfo.teachingExperienceYears', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900"
                placeholder="0-50"
              />
            </div>

            {/* Toggles row */}
            <div className="md:col-span-2 flex flex-wrap gap-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.professionalInfo.hasTeachingCertificate}
                  onChange={(e) => handleInputChange('professionalInfo.hasTeachingCertificate', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-ring"
                />
                <span className="text-sm text-gray-700">תעודת הוראה</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.professionalInfo.isUnionMember}
                  onChange={(e) => handleInputChange('professionalInfo.isUnionMember', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-ring"
                />
                <span className="text-sm text-gray-700">חבר ארגון מורים</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.professionalInfo.isActive}
                  onChange={(e) => handleInputChange('professionalInfo.isActive', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-ring"
                />
                <span className="text-sm text-gray-700">פעיל מקצועית</span>
              </label>
            </div>
          </div>
        </div>

        {/* Teaching Subjects */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-teachers-fg rounded-full" />
            <h3 className="text-base font-semibold text-foreground">מקצועות הוראה</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TEACHING_SUBJECTS.map((subject) => (
              <label key={subject} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.professionalInfo.teachingSubjects.includes(subject)}
                  onChange={(e) => {
                    const newSubjects = e.target.checked
                      ? [...formData.professionalInfo.teachingSubjects, subject]
                      : formData.professionalInfo.teachingSubjects.filter(s => s !== subject);
                    handleInputChange('professionalInfo.teachingSubjects', newSubjects);
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-ring"
                />
                <span className="text-sm text-gray-700">{subject}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Credentials */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-teachers-fg rounded-full" />
            <h3 className="text-base font-semibold text-foreground">פרטי התחברות</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אימייל להתחברות *
              </label>
              <input
                type="email"
                value={formData.credentials.email}
                onChange={(e) => handleInputChange('credentials.email', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900 ${
                  getFieldError('credentials.email') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
              />
              {getFieldError('credentials.email') && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getFieldError('credentials.email')}
                </div>
              )}
            </div>

            {!teacher && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סיסמה *
                </label>
                <input
                  type="password"
                  value={formData.credentials.password}
                  onChange={(e) => handleInputChange('credentials.password', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-ring text-gray-900 ${
                    getFieldError('credentials.password') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="הזן סיסמה"
                />
                {getFieldError('credentials.password') && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('credentials.password')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-teachers-fg rounded-full" />
            <h3 className="text-base font-semibold text-foreground">סטטוס</h3>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-ring"
            />
            <span className="text-sm text-gray-700">פעיל במערכת</span>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-input text-foreground rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {teacher ? 'עדכן מורה' : 'צור מורה'}
              </>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}