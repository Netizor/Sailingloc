import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Anchor, AlertCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

interface LoginProps {
  embedded?: boolean
  redirectAfterLogin?: string
}

const Login: React.FC<LoginProps> = ({ embedded = false, redirectAfterLogin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const { t } = useTranslation()

  const from =
    redirectAfterLogin ??
    (location.state as { from?: Location })?.from?.pathname ??
    '/mon-espace'

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [globalError, setGlobalError] = useState('')

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(form.email, form.password),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken, rememberMe)
      toast.success(t('auth.login.welcome', { name: data.user.firstName }))
      navigate(from, { replace: true })

      // Vérification HIBP en arrière-plan - non bloquante, silencieuse en cas d'erreur réseau.
      // Le backend utilise k-anonymity : seuls 5 chars du hash SHA-1 sont envoyés à l'API HIBP.
      authApi.checkPasswordHibp(form.password).then(({ compromised, count }) => {
        if (compromised) {
          toast.error(
            `⚠️ Votre mot de passe a été compromis (${(count ?? 0).toLocaleString('fr-FR')} fuite${(count ?? 0) > 1 ? 's' : ''}). Changez-le dès maintenant dans votre profil.`,
            { duration: 10000, id: 'hibp-warning' },
          )
        }
      }).catch(() => { /* silencieux - ne jamais bloquer la session */ })
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? t('auth.login.errorCredentials')
      setGlobalError(message)
    },
  })

  const validate = (): boolean => {
    const newErrors: Partial<LoginForm> = {}
    if (!form.email) newErrors.email = t('auth.login.errorEmail')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = t('auth.login.errorEmailInvalid')
    if (!form.password) newErrors.password = t('auth.login.errorPassword')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    if (globalError) setGlobalError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    loginMutation.mutate()
  }

  const card = (
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header banner */}
          <div className="bg-ocean-700 px-8 py-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 justify-center mb-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Anchor size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SailingLoc</span>
            </Link>
            <h1 className="text-xl font-bold text-white">{t('auth.login.title')}</h1>
            <p className="text-ocean-200 text-sm mt-1">{t('auth.login.subtitle')}</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Global error */}
              {globalError && (
                <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3" role="alert">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{globalError}</p>
                </div>
              )}

              <Input
                label={t('auth.login.email')}
                type="email"
                autoComplete="email"
                placeholder={t('auth.login.emailPlaceholder')}
                value={form.email}
                onChange={handleChange('email')}
                error={errors.email}
                leftIcon={<Mail size={16} />}
                required
              />

              <Input
                label={t('auth.login.password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('auth.login.passwordPlaceholder')}
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
                leftIcon={<Lock size={16} />}
                rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                onRightIconClick={() => setShowPassword((v) => !v)}
                required
              />

              <div className="flex items-center justify-between -mt-1">
                {/* Case "Se souvenir de moi" */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-ocean-600 focus:ring-ocean-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                    {t('auth.login.rememberMe')}
                  </span>
                </label>

                <Link
                  to="/mot-de-passe-oublie"
                  className="text-sm text-ocean-600 hover:text-ocean-800 font-medium"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loginMutation.isPending}
              >
                {t('auth.login.submit')}
              </Button>
            </form>

            {!embedded && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                {t('auth.login.noAccount')}{' '}
                <Link
                  to="/inscription"
                  className="text-ocean-700 font-semibold hover:text-ocean-900"
                >
                  {t('auth.login.register')}
                </Link>
              </p>
            )}

            {!embedded && (
              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-amber-700 font-medium">
                  {t('auth.login.demo')}
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
      <div className="w-full max-w-md">
        {card}
        <p className="text-center text-ocean-200/60 text-xs mt-6">
          © {new Date().getFullYear()} SailingLoc
        </p>
      </div>
    </div>
  )
}

export default Login
