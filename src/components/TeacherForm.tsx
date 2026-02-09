import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import apiService from '../services/apiService';

const VALID_CLASSES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'אחר'];
const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8];
const VALID_INSTRUMENTS = [
  'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
  'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון', 'שירה',
  'כינור', 'ויולה', "צ'לו", 'קונטרבס', 'פסנתר', 'גיטרה', 'גיטרה בס', 'תופים'
];
const VALID_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const VALID_DURATIONS = [30, 45, 60];
const VALID_ROLES = ['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מורה תאוריה', 'מגמה'];

interface TeacherFormProps {
  teacher?: any;
  onSubmit: (teacherData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TeacherForm({ teacher, onSubmit, onCancel, isLoading = false }: TeacherFormProps) {
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: '',
      phone: '',
      email: '',
      address: ''
    },
    roles: ['מורה'],
    professionalInfo: {
      instrument: '',
      isActive: true
    },
    teaching: {
      studentIds: [],
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
          fullName: teacher.personalInfo?.fullName || '',
          phone: teacher.personalInfo?.phone || '',
          email: teacher.personalInfo?.email || '',
          address: teacher.personalInfo?.address || ''
        },
        roles: teacher.roles || ['מורה'],
        professionalInfo: {
          instrument: teacher.professionalInfo?.instrument || '',
          isActive: teacher.professionalInfo?.isActive !== undefined ? teacher.professionalInfo.isActive : true
        },
        teaching: {
          studentIds: teacher.teaching?.studentIds || [],
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
      case 'personalInfo.fullName':
        if (!value || value.trim().length === 0) {
          return 'שם מלא נדרש';
        }
        if (value.trim().length < 2) {
          return 'שם מלא חייב להיות לפחות 2 תווים';
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
    
    newErrors['personalInfo.fullName'] = validateField('personalInfo.fullName', formData.personalInfo.fullName);
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
          <h2 className="text-2xl font-bold text-gray-900">
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
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">מידע אישי</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם מלא *
              </label>
              <input
                type="text"
                value={formData.personalInfo.fullName}
                onChange={(e) => handleInputChange('personalInfo.fullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
                  getFieldError('personalInfo.fullName') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="הזן שם מלא"
              />
              {getFieldError('personalInfo.fullName') && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getFieldError('personalInfo.fullName')}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                placeholder="הזן כתובת"
              />
            </div>
          </div>
        </section>

        {/* Roles */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">תפקידים *</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {VALID_ROLES.map((role) => (
              <label key={role} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.roles.includes(role)}
                  onChange={(e) => handleRoleChange(role, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
        </section>

        {/* Professional Information */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">מידע מקצועי</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                נושא הוראה {!formData.roles.includes('מורה תאוריה') && '*'}
              </label>
              <select
                value={formData.professionalInfo.instrument}
                onChange={(e) => handleInputChange('professionalInfo.instrument', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
                  getFieldError('professionalInfo.instrument') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={formData.roles.includes('מורה תאוריה')}
              >
                <option value="">בחר נושא הוראה</option>
                {VALID_INSTRUMENTS.map((instrument) => (
                  <option key={instrument} value={instrument}>
                    {instrument}
                  </option>
                ))}
              </select>
              {getFieldError('professionalInfo.instrument') && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getFieldError('professionalInfo.instrument')}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.professionalInfo.isActive}
                  onChange={(e) => handleInputChange('professionalInfo.isActive', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">פעיל מקצועית</span>
              </label>
            </div>
          </div>
        </section>

        {/* Credentials */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי התחברות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אימייל להתחברות *
              </label>
              <input
                type="email"
                value={formData.credentials.email}
                onChange={(e) => handleInputChange('credentials.email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
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
        </section>

        {/* Status */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">סטטוס</h3>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">פעיל במערכת</span>
          </label>
        </section>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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