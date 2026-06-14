import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Anchor,
  AlertCircle,
  Check,
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { UserRole } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

// Seuls RENTER et OWNER sont proposés à l'inscription (ADMIN créé en back-office)
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

// Critères de robustesse affichés en temps réel (CNIL 2022 + OWASP)
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
    hasUpper:  /[A-Z]/.test(password),
    hasLower:  /[a-z]/.test(password),
    hasDigit:  /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }
}

function getPasswordStrengthScore(criteria: PasswordCriteria): number {
  const met = Object.values(criteria).filter(Boolean).length
  // 5 critères → score 0–5 ; on favorise un score "Fort" uniquement si tous les critères sont remplis
  return met
}

const STRENGTH_COLORS = ['bg-gray-200', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600']

interface RegisterProps {
  embedded?: boolean
  defaultRole?: RegistrationRole
  hideRoleToggle?: boolean
}

const Register: React.FC<RegisterProps> = ({
  embedded = false,
  defaultRole = UserRole.RENTER,
  hideRoleToggle = false,
}) => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { t } = useTranslation()

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
  const strengthScore = getPasswordStrengthScore(passwordCriteria)
  const strengthLabels = ['', t('auth.register.strengthVeryWeak'), t('auth.register.strengthWeak'), t('auth.register.strengthFair'), t('auth.register.strengthStrong'), t('auth.register.strengthVeryStrong')]
  const strengthColor = STRENGTH_COLORS[strengthScore]
  const strengthLabel = strengthLabels[strengthScore]

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
    else if (form.password.length > 128) e.password = t('auth.register.errorPasswordMax')
    else if (
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password) ||
      !/[^A-Za-z0-9]/.test(form.password)
    )
      e.password = t('auth.register.errorPasswordWeak')
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

  const card = (
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-ocean-700 px-8 py-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 justify-center mb-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Anchor size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SailingLoc</span>
            </Link>
            <h1 className="text-xl font-bold text-white">{t('auth.register.title')}</h1>
            <p className="text-ocean-200 text-sm mt-1">{t('auth.register.subtitle')}</p>
          </div>

          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {globalError && (
                <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3" role="alert">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{globalError}</p>
                </div>
              )}

              {/* Role toggle */}
              {!hideRoleToggle && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('auth.register.iWantTo')}</p>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  {([
                    { value: UserRole.RENTER, label: t('auth.register.rentBoat'), icon: '⚓' },
                    { value: UserRole.OWNER, label: t('auth.register.listBoat'), icon: '🚢' },
                  ] as { value: RegistrationRole; label: string; icon: string }[]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setField('role', opt.value)}
                      className={cn(
                        'py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                        form.role === opt.value
                          ? 'bg-white dark:bg-gray-900 text-ocean-700 dark:text-ocean-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      )}
                    >
                      <span className="mr-1.5">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('auth.register.firstName')}
                  type="text"
                  autoComplete="given-name"
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
                  autoComplete="family-name"
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  error={errors.lastName}
                  required
                />
              </div>

              <Input
                label={t('auth.register.email')}
                type="email"
                autoComplete="email"
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
                autoComplete="tel"
                placeholder={t('auth.register.phonePlaceholder')}
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                leftIcon={<Phone size={16} />}
                helperText={t('auth.register.phoneHint')}
              />

              {/* Password */}
              <div>
                <Input
                  label={t('auth.register.password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('auth.register.passwordPlaceholder')}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  error={errors.password}
                  leftIcon={<Lock size={16} />}
                  rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  onRightIconClick={() => setShowPassword((v) => !v)}
                  required
                />
                {form.password && (
                  <div className="mt-2 space-y-2">
                    {/* Barre de progression de robustesse */}
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-all duration-300',
                            i < strengthScore ? strengthColor : 'bg-gray-200 dark:bg-gray-700'
                          )}
                        />
                      ))}
                    </div>
                    <p className={cn(
                      'text-xs font-medium',
                      strengthScore <= 1 ? 'text-red-500' :
                      strengthScore <= 2 ? 'text-orange-500' :
                      strengthScore <= 3 ? 'text-yellow-600' :
                      strengthScore === 4 ? 'text-green-500' : 'text-green-600'
                    )}>
                      {strengthLabel}
                    </p>
                    {/* Critères affichés en temps réel */}
                    <ul className="grid grid-cols-1 gap-0.5">
                      {([
                        { key: 'minLength', label: t('auth.register.criteriaMinLength') },
                        { key: 'hasUpper',  label: t('auth.register.criteriaUpper') },
                        { key: 'hasLower',  label: t('auth.register.criteriaLower') },
                        { key: 'hasDigit',  label: t('auth.register.criteriaDigit') },
                        { key: 'hasSpecial',label: t('auth.register.criteriaSpecial') },
                      ] as { key: keyof PasswordCriteria; label: string }[]).map(({ key, label }) => (
                        <li key={key} className={cn(
                          'flex items-center gap-1.5 text-xs transition-colors',
                          passwordCriteria[key] ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                        )}>
                          <span className="flex-shrink-0 text-[10px]">
                            {passwordCriteria[key] ? '✓' : '○'}
                          </span>
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Input
                label={t('auth.register.confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                leftIcon={<Lock size={16} />}
                rightIcon={showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                onRightIconClick={() => setShowConfirm((v) => !v)}
                required
              />

              {/* Terms checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      'mt-0.5 h-4.5 w-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      form.acceptTerms
                        ? 'bg-ocean-600 border-ocean-600'
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-ocean-400'
                    )}
                    onClick={() => setField('acceptTerms', !form.acceptTerms)}
                    role="checkbox"
                    aria-checked={form.acceptTerms}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ') setField('acceptTerms', !form.acceptTerms)
                    }}
                  >
                    {form.acceptTerms && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                    {t('auth.register.termsText')}{' '}
                    <Link to="/cgu" className="text-ocean-600 hover:underline" target="_blank">
                      {t('auth.register.termsLink')}
                    </Link>{' '}
                    {t('auth.register.termsAnd')}{' '}
                    <Link to="/rgpd" className="text-ocean-600 hover:underline" target="_blank">
                      {t('auth.register.privacyLink')}
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-xs text-red-600 mt-1 ml-7">{errors.acceptTerms}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={registerMutation.isPending}
              >
                {t('auth.register.submit')}
              </Button>
            </form>

            {!embedded && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                {t('auth.register.alreadyMember')}{' '}
                <Link
                  to="/connexion"
                  className="text-ocean-700 font-semibold hover:text-ocean-900"
                >
                  {t('auth.register.loginLink')}
                </Link>
              </p>
            )}

            {!embedded && (
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-amber-700 font-medium">
                  {t('auth.register.demo')}
                </p>
              </div>
            )}
          </div>
        </div>
  )

  if (embedded) {
    return <div className="w-full">{card}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-800 to-ocean-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {card}
      </div>
    </div>
  )
}

export default Register
