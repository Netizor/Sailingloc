import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Ship } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { UserRole } from '../../types'
import { getDefaultDashboardPath } from '../../lib/profilePaths'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const LOGIN_HERO_IMAGE = '/login-boat.jpg'

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

  const from = redirectAfterLogin
    ?? (location.state as { from?: Location })?.from?.pathname
    ?? '/mon-espace'

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
      const target =
        data.user.role === UserRole.ADMIN
          ? '/admin'
          : redirectAfterLogin
            ? redirectAfterLogin
            : from === '/mon-espace'
              ? getDefaultDashboardPath(data.user.role)
              : from
      navigate(target, { replace: true })

      authApi.checkPasswordHibp(form.password).then(({ compromised, count }) => {
        if (compromised) {
          toast.error(
            `⚠️ Your password has been compromised (${(count ?? 0).toLocaleString('en-US')} breach${(count ?? 0) > 1 ? 'es' : ''}). Change it now in your profile.`,
            { duration: 10000, id: 'hibp-warning' },
          )
        }
      }).catch(() => { /* silent */ })
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

  const formContent = (
    <div className={embedded ? 'w-full' : 'w-full max-w-[430px]'}>
      {!embedded && (
        <Link to="/" className="text-xs text-brand-slate dark:text-gray-400 hover:text-brand-navy dark:hover:text-white transition-colors">
          ← Back to home
        </Link>
      )}

      <h1 className={embedded ? 'text-2xl sm:text-3xl font-serif font-bold text-brand-navy dark:text-white' : 'mt-8 text-5xl font-serif font-bold text-brand-navy dark:text-white'}>
        Welcome
      </h1>

      <p className="mt-2 text-sm text-brand-slate dark:text-gray-400">
        {embedded ? 'Sign in to your owner space.' : 'Maritime excellence within your reach.'}
      </p>

      {!embedded && (
        <div className="mt-10 flex gap-8 border-b border-gray-200 dark:border-gray-700">
          <button type="button" className="pb-3 text-sm font-bold border-b-2 border-brand-navy dark:border-brand-blue text-brand-navy dark:text-white">
            Sign in
          </button>
          <Link to="/inscription" className="pb-3 text-sm text-brand-slate dark:text-gray-400 hover:text-brand-blue transition-colors">
            Create an account
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={embedded ? 'mt-6 space-y-5' : 'mt-8 space-y-5'}>
        {globalError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{globalError}</p>
          </div>
        )}

        <Input
          label="EMAIL ADDRESS"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={handleChange('email')}
          error={errors.email}
          required
        />

        <Input
          label="PASSWORD"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange('password')}
          error={errors.password}
          rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          onRightIconClick={() => setShowPassword((v) => !v)}
          required
        />

        <div className="flex justify-end">
          <Link to="/mot-de-passe-oublie" className="text-xs text-brand-blue hover:text-ocean-600 transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loginMutation.isPending}>
          Sign in
        </Button>
      </form>

      {!embedded && (
        <>
          <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
            <span className="text-[10px] text-brand-slate dark:text-gray-500 uppercase">Or continue with</span>
            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 py-3 text-sm text-brand-navy dark:text-gray-200">Google</button>
            <button type="button" className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 py-3 text-sm text-brand-navy dark:text-gray-200">Facebook</button>
          </div>
        </>
      )}
    </div>
  )

  if (embedded) {
    return formContent
  }

  return (
    <div className="-mt-[72px] pt-[72px] min-h-screen bg-white dark:bg-gray-900 text-brand-navy dark:text-gray-100">
      <main className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-72px)]">
        <section className="flex items-center justify-center px-8 py-20 bg-white dark:bg-gray-900">
          {formContent}
        </section>

        <section
          className="hidden lg:flex items-end px-20 py-24 bg-cover bg-center relative"
          style={{
            backgroundImage: `linear-gradient(rgba(0,51,102,0.35), rgba(0,51,102,0.82)), url(${LOGIN_HERO_IMAGE})`,
          }}
        >
          <Ship size={130} className="absolute right-20 top-16 text-white/25" />
          <div className="text-white max-w-md mb-8">
            <p className="text-2xl font-serif font-bold leading-relaxed">
              "The sea is a space of infinite freedom — we are its guardians for your finest memories."
            </p>
            <p className="mt-6 text-xs font-bold tracking-widest text-white/80">
              CAPTAIN MARC L, SAILINGLOC EXPERT
            </p>
            <p className="mt-6 text-sm">
              <span className="font-bold">+1,200 Owners</span>
              <br />
              trust us every day
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Login
