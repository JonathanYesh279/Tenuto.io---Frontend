import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

import { superAdminService } from '../../services/apiService'
import {
  BuildingsIcon,
  CaretLeftIcon,
} from '@phosphor-icons/react'

// --- Zod schema ---

const tenantFormSchema = z.object({
  slug: z.string()
    .min(1, 'שדה חובה')
    .regex(/^[a-z0-9-]+$/, 'אותיות קטנות באנגלית, מספרים ומקפים בלבד'),
  name: z.string().min(1, 'שדה חובה'),
  city: z.string().min(1, 'שדה חובה'),
  director: z.object({
    name: z.string().optional().or(z.literal('')),
  }).optional(),
  ministryInfo: z.object({
    institutionCode: z.string().optional().or(z.literal('')),
    districtName: z.string().optional().or(z.literal('')),
  }).optional(),
  settings: z.object({
    lessonDurations: z.string().optional(), // Comma-separated, parsed before submit
    schoolStartMonth: z.coerce.number().min(1).max(12).optional(),
  }).optional(),
  subscription: z.object({
    plan: z.enum(['basic', 'standard', 'premium']).optional(),
    maxTeachers: z.coerce.number().positive().optional().or(z.literal('')),
    maxStudents: z.coerce.number().positive().optional().or(z.literal('')),
  }).optional(),
})

type TenantFormValues = z.infer<typeof tenantFormSchema>

// --- Component ---

export default function TenantFormPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const navigate = useNavigate()
  const isEdit = !!tenantId

  const [loadingTenant, setLoadingTenant] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      slug: '',
      name: '',
      city: '',
      director: { name: '' },
      ministryInfo: { institutionCode: '', districtName: '' },
      settings: { lessonDurations: '', schoolStartMonth: 9 },
      subscription: { plan: 'basic', maxTeachers: '' as any, maxStudents: '' as any },
    },
  })

  // Load existing tenant for edit mode
  useEffect(() => {
    if (!isEdit || !tenantId) return

    const loadTenantData = async () => {
      try {
        setLoadingTenant(true)
        setLoadError(null)
        const res = await superAdminService.getTenant(tenantId)
        const data = res?.data || res || null
        if (data) {
          reset({
            slug: data.slug || '',
            name: data.name || '',
            city: data.city || '',
            director: { name: data.director?.name || '' },
            ministryInfo: {
              institutionCode: data.ministryInfo?.institutionCode || '',
              districtName: data.ministryInfo?.districtName || '',
            },
            settings: {
              lessonDurations: data.settings?.lessonDurations
                ? data.settings.lessonDurations.join(', ')
                : '',
              schoolStartMonth: data.settings?.schoolStartMonth || 9,
            },
            subscription: {
              plan: data.subscription?.plan || 'basic',
              maxTeachers: data.subscription?.maxTeachers || ('' as any),
              maxStudents: data.subscription?.maxStudents || ('' as any),
            },
          })
        }
      } catch (err: any) {
        console.error('Failed to load tenant for edit:', err)
        setLoadError(err.message || 'שגיאה בטעינת פרטי מוסד')
      } finally {
        setLoadingTenant(false)
      }
    }

    loadTenantData()
  }, [isEdit, tenantId, reset])

  // Form submit handler
  const onSubmit = async (values: TenantFormValues) => {
    try {
      // Transform lessonDurations from comma-string to number array
      const payload = {
        ...values,
        settings: values.settings
          ? {
              ...values.settings,
              lessonDurations: values.settings.lessonDurations
                ? values.settings.lessonDurations
                    .split(',')
                    .map((s) => Number(s.trim()))
                    .filter((n) => !isNaN(n))
                : undefined,
            }
          : undefined,
        // Strip empty strings from optional number fields
        subscription: values.subscription
          ? {
              ...values.subscription,
              maxTeachers: values.subscription.maxTeachers
                ? Number(values.subscription.maxTeachers)
                : undefined,
              maxStudents: values.subscription.maxStudents
                ? Number(values.subscription.maxStudents)
                : undefined,
            }
          : undefined,
      }

      if (isEdit) {
        await superAdminService.updateTenant(tenantId, payload)
        toast.success('המוסד עודכן בהצלחה')
      } else {
        await superAdminService.createTenant(payload)
        toast.success('המוסד נוצר בהצלחה')
      }
      navigate('/tenants')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'שגיאה בשמירה'
      toast.error(msg)
    }
  }

  // --- Input component helpers ---

  const inputBaseClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  const inputErrorClass = 'border-red-300'
  const readOnlyClass = 'bg-gray-100 cursor-not-allowed'

  const FieldError = ({ message }: { message?: string }) =>
    message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null

  // --- Render ---

  if (loadingTenant) {
    return (
      <div dir="rtl" className="text-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        טוען פרטי מוסד...
      </div>
    )
  }

  if (loadError) {
    return (
      <div dir="rtl" className="text-center py-12 text-gray-500">
        <BuildingsIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-red-600">{loadError}</p>
        <button
          onClick={() => navigate('/tenants')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          חזרה לרשימת מוסדות
        </button>
      </div>
    )
  }

  return (
    <div dir="rtl" className="max-w-3xl">
      {/* Back link */}
      <button
        onClick={() => navigate('/tenants')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <CaretLeftIcon className="w-4 h-4" />
        חזרה לרשימת מוסדות
      </button>

      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <BuildingsIcon className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'עריכת מוסד' : 'הוספת מוסד חדש'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* Required Fields */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטים נדרשים</h2>
          <div className="space-y-4">
            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                מזהה (slug)
              </label>
              <input
                id="slug"
                type="text"
                dir="ltr"
                readOnly={isEdit}
                {...register('slug')}
                className={`${inputBaseClass} ${errors.slug ? inputErrorClass : ''} ${isEdit ? readOnlyClass : ''}`}
                placeholder="my-school"
              />
              <p className="text-xs text-gray-500 mt-1">אותיות קטנות באנגלית, מספרים ומקפים</p>
              <FieldError message={errors.slug?.message} />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                שם המוסד
              </label>
              <input
                id="name"
                type="text"
                dir="rtl"
                {...register('name')}
                className={`${inputBaseClass} ${errors.name ? inputErrorClass : ''}`}
              />
              <FieldError message={errors.name?.message} />
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                עיר
              </label>
              <input
                id="city"
                type="text"
                dir="rtl"
                {...register('city')}
                className={`${inputBaseClass} ${errors.city ? inputErrorClass : ''}`}
              />
              <FieldError message={errors.city?.message} />
            </div>
          </div>
        </div>

        {/* Director Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מנהל</h2>
          <div>
            <label htmlFor="directorName" className="block text-sm font-medium text-gray-700 mb-1">
              שם המנהל
            </label>
            <input
              id="directorName"
              type="text"
              dir="rtl"
              {...register('director.name')}
              className={inputBaseClass}
            />
          </div>
        </div>

        {/* Ministry Info Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מידע משרד החינוך</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="institutionCode" className="block text-sm font-medium text-gray-700 mb-1">
                קוד מוסד
              </label>
              <input
                id="institutionCode"
                type="text"
                dir="rtl"
                {...register('ministryInfo.institutionCode')}
                className={inputBaseClass}
              />
            </div>
            <div>
              <label htmlFor="districtName" className="block text-sm font-medium text-gray-700 mb-1">
                מחוז
              </label>
              <input
                id="districtName"
                type="text"
                dir="rtl"
                {...register('ministryInfo.districtName')}
                className={inputBaseClass}
              />
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">הגדרות</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="lessonDurations" className="block text-sm font-medium text-gray-700 mb-1">
                משכי שיעור (דקות)
              </label>
              <input
                id="lessonDurations"
                type="text"
                dir="ltr"
                {...register('settings.lessonDurations')}
                className={inputBaseClass}
                placeholder="30, 45, 60"
              />
              <p className="text-xs text-gray-500 mt-1">הפרד בפסיקים</p>
            </div>
            <div>
              <label htmlFor="schoolStartMonth" className="block text-sm font-medium text-gray-700 mb-1">
                חודש תחילת שנה
              </label>
              <input
                id="schoolStartMonth"
                type="number"
                min={1}
                max={12}
                {...register('settings.schoolStartMonth')}
                className={`${inputBaseClass} max-w-[120px]`}
              />
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מנוי</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                תוכנית
              </label>
              <select
                id="plan"
                {...register('subscription.plan')}
                className={`${inputBaseClass} max-w-[200px]`}
              >
                <option value="basic">בסיסי</option>
                <option value="standard">סטנדרטי</option>
                <option value="premium">פרימיום</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxTeachers" className="block text-sm font-medium text-gray-700 mb-1">
                  מקסימום מורים
                </label>
                <input
                  id="maxTeachers"
                  type="number"
                  min={1}
                  {...register('subscription.maxTeachers')}
                  className={inputBaseClass}
                />
              </div>
              <div>
                <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-1">
                  מקסימום תלמידים
                </label>
                <input
                  id="maxStudents"
                  type="number"
                  min={1}
                  {...register('subscription.maxStudents')}
                  className={inputBaseClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/tenants')}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'שומר...' : isEdit ? 'עדכן מוסד' : 'צור מוסד'}
          </button>
        </div>

      </form>
    </div>
  )
}
