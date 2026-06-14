import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Anchor, AlertCircle, CheckCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)
  const [apiError, setApiError] = useState('')

  const mutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => setSent(true),
    onError: (err: any) => {
      setApiError(err?.response?.data?.message ?? t('auth.forgotPassword.errorGeneral'))
    },
  })

  const validate = (): boolean => {
    if (!email) { setEmailError(t('auth.forgotPassword.errorEmail')); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError(t('auth.forgotPassword.errorEmailInvalid')); return false }
    setEmailError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setApiError('')
    mutation.mutate()
  }

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
            <h1 className="text-xl font-bold text-white">{t('auth.forgotPassword.title')}</h1>
            <p className="text-ocean-200 text-sm mt-1">{t('auth.forgotPassword.subtitle')}</p>
          </div>

          <div className="px-8 py-8">
            {sent ? (
              /* État succès - message neutre (ne révèle pas l'existence du compte) */
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                    <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('auth.forgotPassword.successTitle')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('auth.forgotPassword.successMessage')}
                </p>
                <Link
                  to="/connexion"
                  className="inline-block mt-2 text-sm text-ocean-600 hover:text-ocean-800 font-medium"
                >
                  {t('auth.forgotPassword.backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Erreur API (email inconnu, échec d'envoi, etc.) */}
                {apiError && (
                  <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3" role="alert">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
                  </div>
                )}

                <Input
                  label={t('auth.forgotPassword.email')}
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                  error={emailError}
                  leftIcon={<Mail size={16} />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={mutation.isPending}
                >
                  {t('auth.forgotPassword.submit')}
                </Button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <Link to="/connexion" className="text-ocean-600 hover:text-ocean-800 font-medium">
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-ocean-200/60 text-xs mt-6">
          © {new Date().getFullYear()} SailingLoc
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
