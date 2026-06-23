import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Check } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { UserRole } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'
import loginBoat from '../../assets/images/login-boat.png'
import logo from '../../assets/images/logo-sailingloc.png'

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
    { key: 'minLength', label: '12 caractères min.' },
    { key: 'hasUpper', label: 'Une majuscule' },
    { key: 'hasLower', label: 'Une minuscule' },
    { key: 'hasDigit', label: 'Un chiffre' },
    { key: 'hasSpecial', label: 'Un caractère spécial' },
  ] as { key: keyof PasswordCriteria; label: string }[]

  const formContent = (
    <div className="w-full max-w-[620px]">
      <Link to="/" className="inline-block mb-12">
        <img src={logo} alt="SailingLoc" className="h-11 w-auto" />
      </Link>

      <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
        ← Retour d’accueil
      </Link>

      <h1 className="mt-5 text-5xl font-bold tracking-tight text-[#071d49]">
        Créer un compte
      </h1>

      <p className="mt-3 text-lg text-gray-500">
        Rejoignez la communauté SailingLoc.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <button type="button" className="h-12 rounded-lg border border-gray-300 bg-white font-semibold text-[#071d49]">
          Continuer avec Google
        </button>
        <button type="button" className="h-12 rounded-lg border border-gray-300 bg-white font-semibold text-[#071d49]">
          Continuer avec Facebook
        </button>
      </div>

      <div className="my-7 flex items-center gap-5">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-gray-400">OU</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {globalError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <Input
            label="Prénom"
            type="text"
            placeholder="Votre prénom"
            value={form.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            error={errors.firstName}
            leftIcon={<User size={16} />}
            required
          />

          <Input
            label="Nom"
            type="text"
            placeholder="Votre nom"
            value={form.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            error={errors.lastName}
            leftIcon={<User size={16} />}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="Votre email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          error={errors.email}
          leftIcon={<Mail size={16} />}
          required
        />

        <Input
          label="Téléphone (optionnel)"
          type="tel"
          placeholder="Votre numéro de téléphone"
          value={form.phone}
          onChange={(e) => setField('phone', e.target.value)}
          leftIcon={<Phone size={16} />}
        />

        {!hideRoleToggle && (
          <div>
            <p className="mb-2 text-sm font-bold text-[#071d49]">Je suis</p>
            <div className="grid grid-cols-2 rounded-lg border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => setField('role', UserRole.RENTER)}
                className={cn(
                  'h-12 rounded-lg font-semibold transition',
                  form.role === UserRole.RENTER
                    ? 'border-2 border-blue-600 text-blue-600'
                    : 'text-[#071d49]'
                )}
              >
                Locataire
              </button>

              <button
                type="button"
                onClick={() => setField('role', UserRole.OWNER)}
                className={cn(
                  'h-12 rounded-lg font-semibold transition',
                  form.role === UserRole.OWNER
                    ? 'border-2 border-blue-600 text-blue-600'
                    : 'text-[#071d49]'
                )}
              >
                Propriétaire
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <Input
            label="Mot de passe"
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
            label="Confirmer le mot de passe"
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
            Le mot de passe doit contenir :
          </p>

          <div className="flex flex-wrap gap-2">
            {criteriaItems.map(({ key, label }) => (
              <span
                key={key}
                className={cn(
                  'rounded-full px-3 py-2 text-xs font-semibold',
                  passwordCriteria[key]
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {passwordCriteria[key] ? '✓' : '○'} {label}
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
                form.acceptTerms ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
              )}
            >
              {form.acceptTerms && <Check size={13} className="text-white" />}
            </button>

            <span className="text-sm text-gray-500">
              J’accepte les{' '}
              <Link to="/cgu" className="font-semibold text-blue-600">
                Conditions Générales d’Utilisation
              </Link>{' '}
              et la{' '}
              <Link to="/rgpd" className="font-semibold text-blue-600">
                Politique de Confidentialité.
              </Link>
            </span>
          </label>

          {errors.acceptTerms && (
            <p className="mt-1 text-xs text-red-600">{errors.acceptTerms}</p>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={registerMutation.isPending}>
          Créer mon compte
        </Button>
      </form>

      {!embedded && (
        <p className="mt-7 text-center text-sm text-gray-500">
          Vous avez déjà un compte ?{' '}
          <Link to="/connexion" className="font-bold text-blue-600">
            Se connecter
          </Link>
        </p>
      )}
    </div>
  )

  if (embedded) {
    return <div className="w-full">{formContent}</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="flex items-center justify-center px-8 py-12 lg:px-16">
          {formContent}
        </section>

        <section
          className="hidden lg:flex items-end bg-cover bg-center px-16 py-20 text-white"
          style={{
            backgroundImage: `linear-gradient(rgba(3,18,50,0.15), rgba(3,18,50,0.85)), url(${loginBoat})`,
          }}
        >
          <div className="max-w-xl">
            <h2 className="text-4xl font-serif font-bold leading-tight">
              La mer est un espace de liberté infinie,
              <br />
              nous en sommes les gardiens pour vos plus beaux souvenirs.
            </h2>

            <p className="mt-8 text-xs font-bold tracking-[0.35em]">
              CAPITAINE MARC L, SAILINGLOC EXPERT
            </p>

            <div className="my-10 h-px w-16 bg-white/60" />

            <p className="text-3xl font-bold">+1,200 Propriétaires</p>
            <p className="mt-2 text-lg text-white/85">Nous font confiance chaque jour</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Register