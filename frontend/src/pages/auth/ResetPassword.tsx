import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, AlertCircle, Ship } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
const loginBoat = '/login-boat.jpg'
const logo = '/logo.jpeg'

interface ResetForm {
  password: string
  confirmPassword: string
}

const ResetPassword: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState<ResetForm>({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Partial<ResetForm>>({})
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/mot-de-passe-oublie', { replace: true })
    }
  }, [token, navigate])

  const mutation = useMutation({
    mutationFn: () => authApi.resetPassword(token!, form.password),
    onSuccess: () => {
      toast.success(t('auth.resetPassword.successMessage'))
      navigate('/connexion')
    },
    onError: () => {
      setApiError(t('auth.resetPassword.errorTokenInvalid'))
    },
  })

  const passwordScore = [
    form.password.length >= 12,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length

  const validate = (): boolean => {
    const newErrors: Partial<ResetForm> = {}

    if (!form.password) newErrors.password = t('auth.resetPassword.errorPassword')
    else if (form.password.length < 12) newErrors.password = t('auth.resetPassword.errorPasswordMin')
    else if (form.password.length > 128) newErrors.password = t('auth.resetPassword.errorPasswordMax')
    else if (
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password) ||
      !/[^A-Za-z0-9]/.test(form.password)
    ) {
      newErrors.password = t('auth.resetPassword.errorPasswordWeak')
    }

    if (!form.confirmPassword) newErrors.confirmPassword = t('auth.resetPassword.errorConfirmPassword')
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('auth.resetPassword.errorPasswordMatch')

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof ResetForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    if (apiError) setApiError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate()
  }

  if (!token) return null

  return (
    <div className="min-h-screen bg-white text-[#071d49]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="flex items-center justify-center px-8 py-12 lg:px-20">
          <div className="w-full max-w-[460px]">
            <Link to="/" className="inline-block mb-20">
              <img src={logo} alt="SailingLoc" className="h-10 w-auto" />
            </Link>

            <h1 className="text-5xl font-serif font-bold leading-tight text-[#071d49]">
              Choisissez un
              <br />
              nouveau mot de
              <br />
              passe
            </h1>

            <p className="mt-5 text-base leading-relaxed text-gray-500">
              Votre nouveau mot de passe doit être différent des précédents pour votre sécurité.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              {apiError && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                  role="alert"
                >
                  <AlertCircle size={16} className="mt-0.5 text-red-500" />
                  <div>
                    <p className="text-sm text-red-700">{apiError}</p>
                    <Link
                      to="/mot-de-passe-oublie"
                      className="mt-1 inline-block text-sm font-medium text-red-600 underline hover:text-red-800"
                    >
                      {t('auth.resetPassword.requestNewLink')}
                    </Link>
                  </div>
                </div>
              )}

              <Input
                label="Nouveau mot de passe"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••••"
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
                leftIcon={<Lock size={16} />}
                rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                onRightIconClick={() => setShowPassword((v) => !v)}
                required
              />

              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  <span>Force du mot de passe</span>
                  <span className="text-teal-600">
                    {passwordScore >= 4 ? 'Fort' : passwordScore >= 3 ? 'Moyen' : 'Faible'}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full ${
                        index < Math.min(passwordScore, 4) ? 'bg-teal-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <Input
                label="Confirmer le mot de passe"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••••"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={errors.confirmPassword}
                leftIcon={<Lock size={16} />}
                rightIcon={showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                onRightIconClick={() => setShowConfirm((v) => !v)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={mutation.isPending}
              >
                Mettre à jour
              </Button>
            </form>

            <p className="mt-24 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} SailingLoc. L’excellence maritime journalière.
            </p>
          </div>
        </section>

        <section
          className="hidden lg:flex relative items-end bg-cover bg-center px-16 py-20 text-white"
          style={{
            backgroundImage: `linear-gradient(rgba(3,18,50,0.12), rgba(3,18,50,0.82)), url(${loginBoat})`,
          }}
        >
          <Ship size={130} className="absolute right-20 top-16 text-white/20" />

          <div className="max-w-lg">
            <span className="inline-block rounded bg-blue-600/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              Conciergerie 24/7
            </span>

            <h2 className="mt-6 text-4xl font-light leading-tight">
              Naviguez vers l’exceptionnel
              <br />
              en toute sérénité.
            </h2>

            <p className="mt-6 text-base leading-relaxed text-white/85">
              Chaque voyage est unique. Nos équipes s’occupent de tout, même de vos accès.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ResetPassword