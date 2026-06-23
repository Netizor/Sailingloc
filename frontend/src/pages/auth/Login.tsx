import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'
import loginBoat from '../../assets/images/login-boat.png'
import logo from '../../assets/images/logo-sailingloc.png'

interface LoginForm {
  email: string
  password: string
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const { t } = useTranslation()

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/mon-espace'

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

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#071d49]">

      <main className="grid grid-cols-1 lg:grid-cols-2 min-h-[900px]">
        <section className="flex items-center justify-center px-8 py-20">
          <div className="w-full max-w-[430px]">
            <Link to="/" className="text-xs text-gray-600">
              ← Retour D’Accueil
            </Link>

            <h1 className="mt-8 text-5xl font-serif font-bold text-[#071d49]">
              Bienvenue
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              L’excellence maritime à votre portée.
            </p>

            <div className="mt-10 flex gap-8 border-b border-gray-300">
              <button className="pb-3 text-sm font-bold border-b-2 border-[#071d49]">
                Se connecter
              </button>
              <Link to="/inscription" className="pb-3 text-sm text-gray-500">
                Créer un compte
              </Link>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              {globalError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm text-red-700">{globalError}</p>
                </div>
              )}

              <Input
                label="ADRESSE EMAIL"
                type="email"
                autoComplete="email"
                placeholder="nom@exemple.com"
                value={form.email}
                onChange={handleChange('email')}
                error={errors.email}
                required
              />

              <Input
                label="MOT DE PASSE"
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
                <Link to="/mot-de-passe-oublie" className="text-xs text-blue-600">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loginMutation.isPending}>
                Se connecter
              </Button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px bg-gray-300 flex-1" />
              <span className="text-[10px] text-gray-500 uppercase">Ou continuer avec</span>
              <div className="h-px bg-gray-300 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="border border-gray-300 rounded-lg bg-white py-3 text-sm">Google</button>
              <button className="border border-gray-300 rounded-lg bg-white py-3 text-sm">Facebook</button>
            </div>
          </div>
        </section>

        <section
          className="hidden lg:flex items-end px-20 py-24 bg-cover bg-center relative"
          style={{
            backgroundImage: `linear-gradient(rgba(5,20,50,0.25), rgba(5,20,50,0.80)), url(${loginBoat})`,
          }}
        >
          <div className="text-white max-w-md mb-8">
            <p className="text-2xl font-serif font-bold leading-relaxed">
              “La mer est un espace de liberté infinie, nous en sommes les gardiens pour vos plus beaux souvenirs.”
            </p>

            <p className="mt-6 text-xs font-bold tracking-widest">
              CAPITAINE MARC L, SAILINGLOC EXPERT
            </p>

            <p className="mt-6 text-sm">
              <span className="font-bold">+1,200 Propriétaires</span>
              <br />
              Nous font confiance chaque jour
            </p>
          </div>
        </section>
      </main>

      
    </div>
  )
}

export default Login