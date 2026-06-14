import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Cookie } from 'lucide-react'

interface CookieConsent {
  version: string
  essential: true
  analytical: boolean
  marketing: boolean
  date: string
}

const CONSENT_KEY = 'sailingloc-cookie-consent'
const CONSENT_COOKIE = 'sailingloc_consent'
const CONSENT_MAX_AGE_DAYS = 395
/** Incrémenter si le modal ou le format de consentement change */
const CONSENT_VERSION = '2'

let openPreferencesHandler: (() => void) | null = null

/** Rouvre le modal cookies (ex. lien footer « Gérer les cookies ») */
export function openCookiePreferences(): void {
  openPreferencesHandler?.()
}

function setBrowserCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

function readBrowserCookie(name: string): string | null {
  const prefix = `${name}=`
  const match = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(prefix))
  if (!match) return null
  try {
    return decodeURIComponent(match.slice(prefix.length))
  } catch {
    return null
  }
}

function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CookieConsent
    if (parsed?.essential !== true || parsed?.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function saveConsent(analytical: boolean, marketing: boolean): void {
  const consent: CookieConsent = {
    version: CONSENT_VERSION,
    essential: true,
    analytical,
    marketing,
    date: new Date().toISOString(),
  }
  const payload = JSON.stringify(consent)
  localStorage.setItem(CONSENT_KEY, payload)
  setBrowserCookie(CONSENT_COOKIE, payload, CONSENT_MAX_AGE_DAYS)
}

export function getCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY) ?? readBrowserCookie(CONSENT_COOKIE)
    return parseConsent(raw)
  } catch {
    return null
  }
}

function needsConsentPrompt(): boolean {
  return getCookieConsent() === null
}

const CookieBanner: React.FC = () => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => needsConsentPrompt())
  const [showDetail, setShowDetail] = useState(false)
  const [analytical, setAnalytical] = useState(false)
  const [marketing, setMarketing] = useState(false)

  const openModal = useCallback(() => {
    const existing = getCookieConsent()
    setAnalytical(existing?.analytical ?? false)
    setMarketing(existing?.marketing ?? false)
    setShowDetail(false)
    setVisible(true)
  }, [])

  useEffect(() => {
    openPreferencesHandler = openModal
    return () => {
      if (openPreferencesHandler === openModal) openPreferencesHandler = null
    }
  }, [openModal])

  useEffect(() => {
    if (needsConsentPrompt()) {
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [visible])

  const accept = (all: boolean) => {
    saveConsent(all, all)
    setVisible(false)
  }

  const saveCustom = () => {
    saveConsent(analytical, marketing)
    setVisible(false)
  }

  if (!visible) return null

  const modal = (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="bg-amber-500 border-b-2 border-amber-600 px-5 py-4 flex gap-3">
          <AlertTriangle size={22} className="text-amber-950 flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-bold text-amber-950">{t('studentNotice.title')}</p>
            <p className="text-sm text-amber-950/90 mt-1 leading-relaxed">{t('studentNotice.message')}</p>
          </div>
        </div>

        {!showDetail ? (
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-ocean-50 dark:bg-ocean-900/30 p-2.5 rounded-xl">
                <Cookie size={24} className="text-ocean-600 dark:text-ocean-400" />
              </div>
              <h2 id="cookie-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('cookies.banner.title')}
              </h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              {t('cookies.banner.description')}{' '}
              <Link
                to="/cookies"
                className="text-ocean-600 dark:text-ocean-400 underline hover:text-ocean-700"
              >
                {t('footer.legal.cookies')}
              </Link>
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowDetail(true)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('cookies.banner.customize')}
              </button>
              <button
                type="button"
                onClick={() => accept(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cookies.banner.essentialOnly')}
              </button>
              <button
                type="button"
                onClick={() => accept(true)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-ocean-600 hover:bg-ocean-700 rounded-xl transition-colors"
              >
                {t('cookies.banner.acceptAll')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('cookies.banner.customizeTitle')}
            </h2>

            <div className="space-y-3 mb-6">
              <CookieToggle
                label={t('cookies.banner.essentialLabel')}
                description={t('cookies.banner.essentialDesc')}
                checked={true}
                disabled
                onChange={() => {}}
              />
              <CookieToggle
                label={t('cookies.banner.analyticalLabel')}
                description={t('cookies.banner.analyticalDesc')}
                checked={analytical}
                onChange={setAnalytical}
              />
              <CookieToggle
                label={t('cookies.banner.marketingLabel')}
                description={t('cookies.banner.marketingDesc')}
                checked={marketing}
                onChange={setMarketing}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('cookies.banner.back')}
              </button>
              <button
                type="button"
                onClick={saveCustom}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-ocean-600 hover:bg-ocean-700 rounded-xl transition-colors"
              >
                {t('cookies.banner.save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

interface CookieToggleProps {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}

const CookieToggle: React.FC<CookieToggleProps> = ({ label, description, checked, disabled, onChange }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>
    </div>
    <button
      type="button"
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
