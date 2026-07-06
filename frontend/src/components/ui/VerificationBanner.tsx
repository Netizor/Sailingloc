import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MailWarning, Phone, X, RefreshCw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/auth.store'
import { authApi } from '../../api/auth.api'
import { UserRole } from '../../types'

/**
 * Bandeau persistant affiché quand :
 * - L'email n'est pas encore vérifié (tous les utilisateurs)
 * - L'utilisateur est OWNER et n'a pas renseigné son téléphone
 *
 * Les deux alertes peuvent coexister mais sont empilées verticalement.
 */
const VerificationBanner: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const [emailDismissed, setEmailDismissed] = useState(false)
  const [phoneDismissed, setPhoneDismissed] = useState(false)

  const showEmailBanner = !!user && !user.emailVerifiedAt && !emailDismissed
  const showPhoneBanner = !!user && user.role === UserRole.OWNER && !user.phone && !phoneDismissed

  const resendMutation = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => toast.success(t('verificationBanner.emailSent')),
    onError:   () => toast.error(t('verificationBanner.emailSendFailed')),
  })

  if (!showEmailBanner && !showPhoneBanner) return null

  return (
    <div className="sticky top-0 z-40 flex flex-col">
      {showEmailBanner && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <MailWarning size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">
              <span className="font-semibold">{t('verificationBanner.verifyEmail')}</span>
              {' '}{t('verificationBanner.verifyEmailDesc')}
            </p>
            <button
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline underline-offset-2 flex-shrink-0 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={resendMutation.isPending ? 'animate-spin' : ''} />
              {t('verificationBanner.resend')}
            </button>
            <button
              onClick={() => setEmailDismissed(true)}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 flex-shrink-0 transition-colors"
              aria-label={t('common.close')}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {showPhoneBanner && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-700 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <Phone size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="flex-1 text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">{t('verificationBanner.phoneRequired')}</span>
              {' '}{t('verificationBanner.phoneRequiredDesc')}
            </p>
            <Link
              to="/mon-espace/profil"
              className="text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline underline-offset-2 flex-shrink-0 transition-colors"
            >
              {t('verificationBanner.completeProfile')}
            </Link>
            <button
              onClick={() => setPhoneDismissed(true)}
              className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 flex-shrink-0 transition-colors"
              aria-label={t('common.close')}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VerificationBanner
