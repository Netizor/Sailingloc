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
import loginBoat from '../../assets/images/login-boat.png'
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

      // Vérification HIBP en arrière-plan — non bloquante, silencieuse en cas d'erreur réseau.
      // Le backend utilise k-anonymity : seuls 5 chars du hash SHA-1 sont envoyés à l'API HIBP.
      authApi.checkPasswordHibp(form.password).then(({ compromised, count }) => {
        if (compromised) {
          toast.error(
            `⚠️ Votre mot de passe a été compromis (${(count ?? 0).toLocaleString('fr-FR')} fuite${(count ?? 0) > 1 ? 's' : ''}). Changez-le dès maintenant dans votre profil.`,
            { duration: 10000, id: 'hibp-warning' },
          )
        }
      }).catch(() => { /* silencieux — ne jamais bloquer la session */ })
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
    
  <div className="min-h-screen bg-[#f8f7ff]">
    <main className="grid grid-cols-1 lg:grid-cols-2 min-h-[720px]">
      <section className="flex items-center justify-center px-10 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="text-sm text-gray-600">
            ← Retour D’Accueil
          </Link>

          <h1 className="mt-8 text-5xl font-serif font-bold text-[#071d49]">
            Bienvenue
          </h1>

          <p className="mt-3 text-gray-500">
            L’excellence maritime à votre portée.
          </p>

          <div className="mt-10 flex gap-8 border-b">
            <button className="pb-3 text-sm font-bold text-[#071d49] border-b-2 border-[#071d49]">
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
              label={t('auth.login.email')}
              type="email"
              autoComplete="email"
              placeholder="nom@exemple.com"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
              required
            />

            <Input
              label={t('auth.login.password')}
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loginMutation.isPending}
            >
              Se connecter
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-xs text-gray-500">OU CONTINUER AVEC</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="border rounded-lg py-3 text-sm font-medium bg-white">
              Google
            </button>
            <button className="border rounded-lg py-3 text-sm font-medium bg-white">
              Facebook
            </button>
          </div>
        </div>
      </section>

      <section className="hidden lg:flex relative items-end px-16 py-20 bg-cover bg-center"
                style={{
                backgroundImage: `linear-gradient(rgba(4,20,50,0.35), rgba(4,20,50,0.75)), url(${loginBoat})`
                          }}
>
        <div className="text-white max-w-md">
          <p className="text-2xl font-serif font-bold leading-relaxed">
            “La mer est un espace de liberté infinie, nous en sommes les gardiens pour vos plus beaux souvenirs.”
          </p>

          <p className="mt-6 text-xs font-bold tracking-widest">
            CAPITAINE MARC L, SAILINGLOC EXPERT
          </p>

          <p className="mt-6 text-sm">
            <span className="font-bold">+1,200 Propriétaires</span><br />
            Nous font confiance chaque jour
          </p>
        </div>
      </section>
    </main>

    <footer className="grid grid-cols-1 md:grid-cols-4 gap-10 px-16 py-14 border-t bg-[#f8f7ff] text-sm text-gray-500">
      <p>© 2024 SailingLoc. L’excellence maritime journalière.</p>

      <div>
        <h4 className="font-bold text-[#071d49] mb-4">PLATEFORME</h4>
        <p>Louer un bateau</p>
        <p>Devenir Propriétaire</p>
        <p>Conciergerie</p>
      </div>

      <div>
        <h4 className="font-bold text-[#071d49] mb-4">LÉGAL</h4>
        <p>Mentions Légales</p>
        <p>Conditions Générales</p>
        <p>Confidentialité</p>
      </div>

      <div>
        <h4 className="font-bold text-[#071d49] mb-4">SUPPORT</h4>
        <p>Aide & Contact</p>
        <p>Presse</p>
        <p>FAQ</p>
      </div>
    </footer>
  </div>

  )
}

export default Login
