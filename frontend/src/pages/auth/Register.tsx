import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Check, Ship } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { UserRole } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import BrandLogo from '../../components/ui/BrandLogo'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

const LOGIN_HERO_IMAGE = '/login-boat.jpg'
type RegistrationRole = UserRole.RENTER | UserRole.OWNER

interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: RegistrationRole
  acceptTerms: boolean
}

interface FieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  acceptTerms?: string
}

interface PasswordCriteria {
  minLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasDigit: boolean
  hasSpecial: boolean
}

function getPasswordCriteria(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 12,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }
}

interface RegisterProps {
  embedded?: boolean
  defaultRole?: RegistrationRole
  hideRoleToggle?: boolean
}

const Register: React.FC<RegisterProps> = ({
  embedded = false,
  defaultRole: defaultRoleProp = UserRole.RENTER,
  hideRoleToggle: hideRoleToggleProp = false,
}) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const { t, i18n } = useTranslation()

  const roleFromUrl = searchParams.get('role') === 'owner' ? UserRole.OWNER : UserRole.RENTER
  const defaultRole = embedded ? defaultRoleProp : roleFromUrl
  const hideRoleToggle = embedded ? hideRoleToggleProp : searchParams.get('role') === 'owner'

  const [form, setForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    acceptTerms: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState('')

  const passwordCriteria = getPasswordCriteria(form.password)

  const registerMutation = useMutation({
    mutationFn: () =>
      authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success(t('auth.register.welcome', { name: data.user.firstName }))
      navigate(form.role === UserRole.OWNER ? '/proprietaire' : '/mon-espace', { replace: true })
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? t('auth.register.errorGeneral')
      setGlobalError(message)
    },
  })

  const setField = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key as keyof FieldErrors]) setErrors((e) => ({ ...e, [key]: undefined }))
    if (globalError) setGlobalError('')
  }

  const validate = (): boolean => {
    const e: FieldErrors = {}

    if (!form.firstName.trim()) e.firstName = t('auth.register.errorFirstName')
    if (!form.lastName.trim()) e.lastName = t('auth.register.errorLastName')
    if (!form.email) e.email = t('auth.register.errorEmail')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('auth.register.errorEmailInvalid')

    if (!form.password) e.password = t('auth.register.errorPassword')
    else if (form.password.length < 12) e.password = t('auth.register.errorPasswordMin')
    else if (
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password) ||
      !/[^A-Za-z0-9]/.test(form.password)
    ) {
      e.password = t('auth.register.errorPasswordWeak')
    }

    if (!form.confirmPassword) e.confirmPassword = t('auth.register.errorConfirmPassword')
    else if (form.confirmPassword !== form.password) e.confirmPassword = t('auth.register.errorPasswordMatch')

    if (!form.acceptTerms) e.acceptTerms = t('auth.register.errorTerms')

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    registerMutation.mutate()
  }

  const criteriaItems = [
    { key: 'minLength', labelKey: 'auth.register.criteriaMinLength' },
    { key: 'hasUpper', labelKey: 'auth.register.criteriaUpper' },
    { key: 'hasLower', labelKey: 'auth.register.criteriaLower' },
    { key: 'hasDigit', labelKey: 'auth.register.criteriaDigit' },
    { key: 'hasSpecial', labelKey: 'auth.register.criteriaSpecial' },
  ] as { key: keyof PasswordCriteria; labelKey: string }[]

  const formContent = (
    <div key={i18n.language} className={embedded ? 'w-full' : 'w-full max-w-[620px]'}>
      {!embedded && (
        <>
          <Link to="/" className="inline-block mb-12">
            <BrandLogo className="h-11 w-auto" />
          </Link>
          <Link to="/" className="text-sm font-medium text-brand-slate dark:text-gray-400 hover:text-brand-navy dark:hover:text-white transition-colors">
            ← {t('auth.register.backToHome')}
          </Link>
        </>
      )}

      {embedded && (
        <BrandLogo className="h-9 w-auto mb-6" />
      )}

      <h1 className={cn(
        'font-serif font-bold leading-tight text-brand-navy dark:text-white',
        embedded ? 'text-2xl sm:text-3xl' : 'mt-10 text-5xl',
      )}>
        {t('auth.register.title')}
      </h1>

      <p className="mt-2 text-sm text-brand-slate dark:text-gray-400">
        {embedded ? t('auth.register.subtitleOwner') : t('auth.register.subtitle')}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {globalError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <Input
            label={t('auth.register.firstName')}
            type="text"
            placeholder={t('auth.register.firstNamePlaceholder')}
            value={form.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            error={errors.firstName}
            leftIcon={<User size={16} />}
            required
          />

          <Input
            label={t('auth.register.lastName')}
            type="text"
            placeholder={t('auth.register.lastNamePlaceholder')}
            value={form.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            error={errors.lastName}
            leftIcon={<User size={16} />}
            required
          />
        </div>

        <Input
          label={t('auth.register.email')}
          type="email"
          placeholder={t('auth.register.emailPlaceholder')}
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          error={errors.email}
          leftIcon={<Mail size={16} />}
          required
        />

        <Input
          label={t('auth.register.phone')}
          type="tel"
          placeholder={t('auth.register.phonePlaceholder')}
          value={form.phone}
          onChange={(e) => setField('phone', e.target.value)}
          leftIcon={<Phone size={16} />}
        />

        {!hideRoleToggle && (
          <div>
            <p className="mb-2 text-sm font-bold text-brand-navy dark:text-white">{t('auth.register.iWantTo')}</p>
            <div className="grid grid-cols-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setField('role', UserRole.RENTER)}
                className={cn(
                  'h-12 rounded-lg font-semibold transition',
                  form.role === UserRole.RENTER
                    ? 'border-2 border-brand-blue text-brand-blue'
                    : 'text-brand-slate dark:text-gray-400',
                )}
              >
                {t('auth.register.rentBoat')}
              </button>
              <button
                type="button"
                onClick={() => setField('role', UserRole.OWNER)}
                className={cn(
                  'h-12 rounded-lg font-semibold transition',
                  form.role === UserRole.OWNER
                    ? 'border-2 border-brand-blue text-brand-blue'
                    : 'text-brand-slate dark:text-gray-400',
                )}
              >
                {t('auth.register.listBoat')}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <Input
            label={t('auth.register.password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            error={errors.password}
            leftIcon={<Lock size={16} />}
            rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            onRightIconClick={() => setShowPassword((v) => !v)}
            required
          />

          <Input
            label={t('auth.register.confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={form.confirmPassword}
            onChange={(e) => setField('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            leftIcon={<Lock size={16} />}
            rightIcon={showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            onRightIconClick={() => setShowConfirm((v) => !v)}
            required
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-gray-500">
            {t('auth.register.passwordMustContain')}
          </p>

          <div className="flex flex-wrap gap-2">
            {criteriaItems.map(({ key, labelKey }) => (
              <span
                key={key}
                className={cn(
                  'rounded-full px-3 py-2 text-xs font-semibold',
                  passwordCriteria[key]
                    ? 'bg-ocean-100 dark:bg-ocean-900/40 text-brand-navy dark:text-brand-blue'
                    : 'bg-gray-100 dark:bg-gray-700 text-brand-slate dark:text-gray-400',
                )}
              >
                {passwordCriteria[key] ? '✓' : '○'} {t(labelKey)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setField('acceptTerms', !form.acceptTerms)}
              className={cn(
                'mt-1 flex h-5 w-5 items-center justify-center rounded border',
                form.acceptTerms ? 'border-brand-blue bg-brand-blue' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
              )}
            >
              {form.acceptTerms && <Check size={13} className="text-white" />}
            </button>

            <span className="text-sm text-brand-slate dark:text-gray-400">
              {t('auth.register.termsText')}{' '}
              <Link to="/cgu" className="font-semibold text-brand-blue hover:text-ocean-600">
                {t('auth.register.termsLink')}
              </Link>{' '}
              {t('auth.register.termsAnd')}{' '}
              <Link to="/rgpd" className="font-semibold text-brand-blue hover:text-ocean-600">
                {t('auth.register.privacyLink')}
              </Link>
            </span>
          </label>

          {errors.acceptTerms && (
            <p className="mt-1 text-xs text-red-600">{errors.acceptTerms}</p>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={registerMutation.isPending}>
          {t('auth.register.submit')}
        </Button>
      </form>

      {!embedded && (
        <p className="mt-7 text-center text-sm text-brand-slate dark:text-gray-400">
          {t('auth.register.alreadyMember')}{' '}
          <Link to="/connexion" className="font-bold text-brand-blue hover:text-ocean-600">
            {t('auth.register.loginLink')}
          </Link>
        </p>
      )}
    </div>
  )

  if (embedded) {
    return formContent
  }

  return (
    <div className="-mt-[72px] pt-[72px] min-h-screen bg-white dark:bg-gray-900">
      <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 lg:grid-cols-2">
        <section className="flex items-center justify-center bg-white dark:bg-gray-900 px-8 py-12 lg:px-16">
          {formContent}
        </section>

        <section
          className="hidden lg:flex items-end bg-cover bg-center px-16 py-20 text-white relative"
          style={{
            backgroundImage: `linear-gradient(rgba(0,51,102,0.35), rgba(0,51,102,0.85)), url(${LOGIN_HERO_IMAGE})`,
          }}
        >
          <Ship
            size={130}
            className="absolute right-20 top-16 text-white/25"
          />
          <div className="max-w-xl">
            <h2 className="text-2xl font-serif font-bold leading-tight">
              {t('auth.register.quote')}
              <br />
              {t('auth.register.quoteLine2')}
            </h2>

            <p className="mt-6 text-xs font-bold tracking-widest">
              {t('auth.register.quoteAuthor')}
            </p>

            <div className="my-10 h-px w-16 bg-white/60" />

            <p className="mt-6 text-sm">
              <span className="font-bold">{t('auth.register.ownersTrust')}</span>
              <br />
              {t('auth.register.ownersTrustHint')}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Register
