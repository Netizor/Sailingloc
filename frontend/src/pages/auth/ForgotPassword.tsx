import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle, Ship } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import loginBoat from '../../assets/images/login-boat.png'
import logo from '../../assets/images/logo-sailingloc.png'

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
    <div className="min-h-screen bg-white text-[#071d49]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="flex items-center justify-center px-8 py-12 lg:px-20">
          <div className="w-full max-w-[520px]">
            <Link to="/" className="inline-block mb-20">
              <img src={logo} alt="SailingLoc" className="h-10 w-auto" />
            </Link>

            <Link
              to="/connexion"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Retour à la connexion
            </Link>

            <h1 className="mt-10 text-5xl font-serif font-bold leading-tight text-[#071d49]">
              Réinitialiser votre
              <br />
              mot de passe
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-gray-500">
              Entrez votre adresse e-mail pour recevoir un lien de
              <br />
              <span className="font-semibold text-gray-600">réinitialisation sécurisé.</span>
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
                    className="mt-8 inline-flex w-full justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {apiError && (
                    <div
                      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                      role="alert"
                    >
                      <AlertCircle size={16} className="text-red-500" />
                      <p className="text-sm text-red-700">{apiError}</p>
                    </div>
                  )}

                  <Input
                    label="ADRESSE EMAIL"
                    type="email"
                    autoComplete="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError('')
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
                    Envoyer le lien
                  </Button>

                  <div className="border-t border-gray-200 pt-6 text-center">
                    <span className="text-sm text-gray-500">
                      Vous vous souvenez du mot de passe ?{' '}
                    </span>
                    <Link to="/connexion" className="text-sm font-bold text-blue-600">
                      Se connecter
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
            <span className="inline-block rounded bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
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