import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CookieConsent {
  essential:  true         // toujours vrai — pas modifiable
  analytical: boolean
  marketing:  boolean
  date:       string
}

const CONSENT_KEY = 'sailingloc-cookie-consent'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function saveConsent(analytical: boolean, marketing: boolean): void {
  const consent: CookieConsent = {
    essential:  true,
    analytical,
    marketing,
    date: new Date().toISOString(),
  }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
}

export function getCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    return raw ? (JSON.parse(raw) as CookieConsent) : null
  } catch {
    return null
  }
}

// ─── Composant ────────────────────────────────────────────────────────────────

const CookieBanner: React.FC = () => {
  const [visible,    setVisible]    = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [analytical, setAnalytical] = useState(false)
  const [marketing,  setMarketing]  = useState(false)

  useEffect(() => {
    // Affiche le bandeau uniquement si aucun consentement n'a encore été enregistré
    if (!getCookieConsent()) {
      setVisible(true)
    }
  }, [])

  const accept = (all: boolean) => {
    saveConsent(all, all)
    setVisible(false)
  }

  const saveCustom = () => {
    saveConsent(analytical, marketing)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Bandeau de consentement aux cookies"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {!showDetail ? (
          /* ── Vue principale ─────────────────────────────────────── */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="bg-ocean-50 dark:bg-ocean-900/30 p-2 rounded-xl">
                <Cookie size={22} className="text-ocean-600 dark:text-ocean-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                Nous utilisons des cookies
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Les cookies essentiels sont nécessaires au fonctionnement du site. Les cookies
                analytiques et marketing nécessitent votre consentement (
                <Link to="/cookies" className="underline hover:text-ocean-600" target="_blank">
                  politique cookies
                </Link>
                ).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowDetail(true)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Personnaliser
              </button>
              <button
                onClick={() => accept(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Essentiels uniquement
              </button>
              <button
                onClick={() => accept(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-ocean-600 hover:bg-ocean-700 rounded-lg transition-colors"
              >
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          /* ── Vue détaillée ──────────────────────────────────────── */
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Personnaliser mes préférences
              </p>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Retour"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {/* Essentiels — toujours actifs */}
              <CookieToggle
                label="Cookies essentiels"
                description="Authentification, sécurité, préférences de session. Ne peuvent pas être désactivés."
                checked={true}
                disabled
                onChange={() => {}}
              />
              {/* Analytiques */}
              <CookieToggle
                label="Cookies analytiques"
                description="Mesure d'audience anonymisée pour améliorer nos pages. Durée : 13 mois."
                checked={analytical}
                onChange={setAnalytical}
              />
              {/* Marketing */}
              <CookieToggle
                label="Cookies marketing"
                description="Personnalisation des publicités et retargeting. Durée : 30 jours."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={saveCustom}
                className="px-4 py-2 text-xs font-medium text-white bg-ocean-600 hover:bg-ocean-700 rounded-lg transition-colors"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Toggle individuel ────────────────────────────────────────────────────────

interface CookieToggleProps {
  label:       string
  description: string
  checked:     boolean
  disabled?:   boolean
  onChange:    (v: boolean) => void
}

const CookieToggle: React.FC<CookieToggleProps> = ({ label, description, checked, disabled, onChange }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>
    </div>
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative flex-shrink-0 w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-1',
        checked ? 'bg-ocean-600' : 'bg-gray-300 dark:bg-gray-600',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  </div>
)

export default CookieBanner
