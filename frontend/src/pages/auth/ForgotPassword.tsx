import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle, Ship } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import BrandLogo from '../../components/ui/BrandLogo'
const loginBoat = '/login-boat.jpg'

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)
  const [apiError, setApiError] = useState('')

  const mutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => {
      setApiError('')
      setSent(true)
    },
    onError: (err: any) => {
      const status = err?.response?.status
      const message = err?.response?.data?.message
      if (status === 404) {
        setApiError(message ?? t('auth.forgotPassword.noAccountMessage'))
        setSent(false)
        return
      }
      setApiError(message ?? t('auth.forgotPassword.errorGeneral'))
    },
  })

  const validate = (): boolean => {
    if (!email) {
      setEmailError(t('auth.forgotPassword.errorEmail'))
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('auth.forgotPassword.errorEmailInvalid'))
      return false
    }

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
    <div className="min-h-screen bg-[#f8f7ff] text-[#071d49]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="flex items-center justify-center bg-[#f8f7ff] px-8 py-12 lg:px-20">
          <div className="w-full max-w-[520px]">
            <Link to="/" className="inline-block mb-20">
              <BrandLogo className="h-10 w-auto" />
            </Link>

            <Link
              to="/connexion"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← {t('auth.forgotPassword.backToLogin')}
            </Link>

            <h1 className="mt-10 text-5xl font-serif font-bold leading-tight text-[#071d49]">
              {t('auth.forgotPassword.titleLine1')}
              <br />
              {t('auth.forgotPassword.titleLine2')}
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-gray-500">
              {t('auth.forgotPassword.subtitle')}
            </p>

            <div className="mt-16">
              {sent ? (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle size={34} className="text-green-600" />
                  </div>

                  <h2 className="mt-6 text-2xl font-bold text-[#071d49]">
                    {t('auth.forgotPassword.successTitle')}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-gray-500">
                    {t('auth.forgotPassword.successMessage')}
                  </p>

                  <Link
                    to="/connexion"
                    className="mt-8 inline-flex w-full justify-center rounded-lg bg-[#2563FF] px-6 py-3 text-sm font-bold text-white hover:bg-[#1D4ED8]"
                  >
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {apiError && (
                    <div
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4"
                      role="alert"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">{apiError}</p>
                          <p className="mt-2 text-sm text-amber-800">
                            {t('auth.forgotPassword.noAccountHint')}{' '}
                            <Link
                              to="/inscription"
                              className="font-semibold text-[#2563FF] hover:underline"
                            >
                              {t('auth.forgotPassword.createAccount')}
                            </Link>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Input
                    label={t('auth.forgotPassword.email')}
                    type="email"
                    autoComplete="email"
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError('')
                      setApiError('')
                    }}
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

                  <div className="border-t border-gray-200 pt-6 text-center">
                    <span className="text-sm text-gray-500">
                      {t('auth.forgotPassword.rememberPassword')}{' '}
                    </span>
                    <Link to="/connexion" className="text-sm font-bold text-[#2563FF]">
                      {t('auth.forgotPassword.signIn')}
                    </Link>
                  </div>
                </form>
              )}
            </div>

            <p className="mt-32 text-xs text-gray-400">
              © {new Date().getFullYear()} SailingLoc. L’excellence maritime journalière.
            </p>
          </div>
        </section>

        <section
          className="hidden lg:flex relative items-end bg-cover bg-center px-16 py-20 text-white"
          style={{
            backgroundImage: `linear-gradient(rgba(3,18,50,0.02), rgba(3,18,50,0.55)), url(${loginBoat})`,
          }}
        >
          <Ship size={130} className="absolute right-20 top-16 text-white/25" />

          <div className="max-w-xl">
            <span className="inline-block rounded bg-[#2563FF] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              Conciergerie 24/7
            </span>

            <h2 className="mt-6 text-4xl font-serif font-bold leading-tight">
              Naviguez vers l’exceptionnel
              <br />
              en toute sérénité.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/90">
              Chaque voyage est unique. Nos équipes s’occupent de tout, même de vos accès.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ForgotPassword
