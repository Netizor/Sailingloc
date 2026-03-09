import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Anchor, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import Button from '../../components/ui/Button'

type State = 'loading' | 'success' | 'error'

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { setAuth, user, isAuthenticated } = useAuthStore()
  const token          = searchParams.get('token') ?? ''

  const [state, setState] = useState<State>('loading')
  const [message, setMessage] = useState('')
  // Empêche un double appel en mode StrictMode (double montage en dev)
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Lien de vérification manquant ou invalide.')
      return
    }
    if (calledRef.current) return
    calledRef.current = true

    authApi.verifyEmail(token)
      .then((res) => {
        // Met à jour le store avec le user vérifié + nouveaux tokens
        setAuth(res.user, res.accessToken, res.refreshToken)
        setState('success')
        setMessage('Votre adresse email a été vérifiée avec succès.')
      })
      .catch((err) => {
        const msg: string = err?.response?.data?.message ?? 'Lien invalide ou expiré.'
        setState('error')
        setMessage(msg)
      })
  }, [token])  // eslint-disable-line react-hooks/exhaustive-deps

  const redirectPath = user?.role === 'OWNER' ? '/proprietaire/tableau-de-bord' : '/mon-espace'

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
            <h1 className="text-xl font-bold text-white">Vérification de l'email</h1>
          </div>

          <div className="px-8 py-10 flex flex-col items-center gap-6 text-center">
            {state === 'loading' && (
              <>
                <Loader2 size={48} className="text-ocean-600 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Vérification en cours…</p>
              </>
            )}

            {state === 'success' && (
              <>
                <CheckCircle size={56} className="text-green-500" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Email vérifié !
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => navigate(isAuthenticated ? redirectPath : '/connexion')}
                >
                  {isAuthenticated ? 'Accéder à mon espace' : 'Se connecter'}
                </Button>
              </>
            )}

            {state === 'error' && (
              <>
                <XCircle size={56} className="text-red-500" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Lien invalide
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  {isAuthenticated ? (
                    <Button variant="primary" onClick={() => navigate(redirectPath)}>
                      Retourner à mon espace
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => navigate('/connexion')}>
                      Se connecter
                    </Button>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Une fois connecté, vous pouvez renvoyer un email de vérification depuis votre profil.
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
