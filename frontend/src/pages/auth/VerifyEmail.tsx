import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { getDefaultDashboardPath } from '../../lib/profilePaths'
import { usePageTitle } from '../../hooks/usePageTitle'
import Button from '../../components/ui/Button'

type State = 'loading' | 'success' | 'error'

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation()
  usePageTitle(t('auth.verifyEmail.pageTitle'))

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth, user, isAuthenticated } = useAuthStore()
  const token = searchParams.get('token') ?? ''

  const [state, setState] = useState<State>('loading')
  const [message, setMessage] = useState('')
  // Prevents a double call in StrictMode (double mount in dev)
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage(t('auth.verifyEmail.errorMissingToken'))
      return
    }
    if (calledRef.current) return
    calledRef.current = true

    authApi
      .verifyEmail(token)
      .then((res) => {
        setAuth(res.user, res.accessToken, res.refreshToken)
        setState('success')
        setMessage(t('auth.verifyEmail.successMessage'))
      })
      .catch((err) => {
        const msg: string =
          err?.response?.data?.message ?? t('auth.verifyEmail.errorDefault')
        setState('error')
        setMessage(msg)
      })
  }, [token, setAuth, t])

  const redirectPath = getDefaultDashboardPath(user?.role)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#003366] via-ocean-800 to-[#2563FF] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          <div className="bg-[#003366] px-8 py-8 text-center">
            <Link to="/" className="inline-flex flex-col items-center gap-2 mb-3">
              <img
                src="/logo.jpeg"
                alt="SailingLoc"
                className="h-12 w-auto max-w-[160px] object-contain rounded-lg bg-white/10 p-1"
              />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                {t('auth.verifyEmail.heading')}
              </span>
            </Link>
          </div>

          <div className="px-8 py-10 flex flex-col items-center gap-6 text-center">
            {state === 'loading' && (
              <>
                <Loader2 size={48} className="text-[#2563FF] animate-spin" />
                <p className="text-brand-slate dark:text-gray-400">
                  {t('auth.verifyEmail.loading')}
                </p>
              </>
            )}

            {state === 'success' && (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#003366] dark:text-gray-100 mb-2">
                    {t('auth.verifyEmail.successTitle')}
                  </p>
                  <p className="text-sm text-brand-slate dark:text-gray-400 leading-relaxed">
                    {message}
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(isAuthenticated ? redirectPath : '/connexion')}
                >
                  {isAuthenticated
                    ? t('auth.verifyEmail.goToSpace')
                    : t('auth.verifyEmail.signIn')}
                </Button>
              </>
            )}

            {state === 'error' && (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
                  <XCircle size={40} className="text-red-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#003366] dark:text-gray-100 mb-2">
                    {t('auth.verifyEmail.errorTitle')}
                  </p>
                  <p className="text-sm text-brand-slate dark:text-gray-400 leading-relaxed">
                    {message}
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  {isAuthenticated ? (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => navigate(redirectPath)}
                    >
                      {t('auth.verifyEmail.backToSpace')}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => navigate('/connexion')}
                    >
                      {t('auth.verifyEmail.signIn')}
                    </Button>
                  )}
                  <p className="text-xs text-brand-muted dark:text-gray-500 leading-relaxed">
                    {t('auth.verifyEmail.resendHint')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
