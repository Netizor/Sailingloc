import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Anchor, AlertCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

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

  // Redirection si aucun token dans l'URL
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
    ) newErrors.password = t('auth.resetPassword.errorPasswordWeak')
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
    <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-800 to-ocean-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-ocean-700 px-8 py-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 justify-center mb-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Anchor size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SailingLoc</span>
            </Link>
            <h1 className="text-xl font-bold text-white">{t('auth.resetPassword.title')}</h1>
            <p className="text-ocean-200 text-sm mt-1">{t('auth.resetPassword.subtitle')}</p>
          </div>

          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Erreur token invalide/expiré */}
              {apiError && (
                <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3" role="alert">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
                    <Link
                      to="/mot-de-passe-oublie"
                      className="text-sm text-red-600 hover:text-red-800 font-medium underline mt-1 inline-block"
                    >
                      {t('auth.resetPassword.requestNewLink')}
                    </Link>
                  </div>
                </div>
              )}

              <Input
                label={t('auth.resetPassword.password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('auth.resetPassword.passwordPlaceholder')}
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
                leftIcon={<Lock size={16} />}
                rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                onRightIconClick={() => setShowPassword((v) => !v)}
                required
              />

              <Input
                label={t('auth.resetPassword.confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
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
                {t('auth.resetPassword.submit')}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-ocean-200/60 text-xs mt-6">
          © {new Date().getFullYear()} SailingLoc
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
