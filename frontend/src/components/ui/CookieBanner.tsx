import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

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
const CONSENT_VERSION = '3'

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
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [analytical, setAnalytical] = useState(false)
  const [marketing, setMarketing] = useState(false)

  const openModal = useCallback(() => {
    const existing = getCookieConsent()
    setAnalytical(existing?.analytical ?? false)
    setMarketing(existing?.marketing ?? false)
    setShowDetail(false)
    setLeaving(false)
    setVisible(true)
  }, [])

  useEffect(() => {
    openPreferencesHandler = openModal
    return () => {
      if (openPreferencesHandler === openModal) openPreferencesHandler = null
    }
  }, [openModal])

  useEffect(() => {
    if (needsConsentPrompt()) setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) {
      setEntered(false)
      return
    }
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [visible])

  const dismiss = (analyticalValue: boolean, marketingValue: boolean) => {
    saveConsent(analyticalValue, marketingValue)
    setLeaving(true)
    window.setTimeout(() => {
      setVisible(false)
      setLeaving(false)
      setShowDetail(false)
    }, 320)
  }

  const accept = (all: boolean) => dismiss(all, all)

  const saveCustom = () => dismiss(analytical, marketing)

  if (!visible) return null

  const panel = (
    <div
      className={[
        'cookie-banner-root fixed inset-0 z-[100000]',
        entered && !leaving ? 'cookie-banner-root--open' : '',
        leaving ? 'cookie-banner-root--leave' : '',
      ].join(' ')}
      role="presentation"
    >
      <div className="cookie-banner-scrim absolute inset-0 bg-black/45" aria-hidden />

      <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 sm:w-[min(100%,26rem)]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          aria-label={t('cookies.banner.ariaLabel')}
          className="cookie-banner-panel relative overflow-hidden rounded-2xl bg-[#003366] text-white shadow-2xl shadow-black/40"
        >
          {!showDetail ? (
            <div className="p-5 sm:p-6">
              <button
                type="button"
                onClick={() => accept(false)}
                className="text-xs text-white/80 underline underline-offset-2 hover:text-white transition-colors"
              >
                {t('cookies.banner.continueWithout')}
              </button>

              <div className="mt-3 flex items-start gap-3">
                <h2
                  id="cookie-modal-title"
                  className="font-serif text-[1.55rem] sm:text-[1.7rem] font-bold leading-[1.2] tracking-tight flex-1 min-w-0"
                >
                  {t('cookies.banner.hookTitle')}
                </h2>
                <img
                  src="/cookie-banner.jpg"
                  alt=""
                  width={88}
                  height={88}
                  className="cookie-banner-photo w-[4.75rem] h-[4.75rem] sm:w-[5.25rem] sm:h-[5.25rem] rounded-xl object-cover flex-shrink-0 ring-2 ring-white/15"
                />
              </div>

              <p className="mt-3 text-sm text-white/85 leading-relaxed">
                {t('cookies.banner.hookDescription')}{' '}
                <Link
                  to="/cookies"
                  className="underline underline-offset-2 text-sky-200 hover:text-white"
                >
                  {t('footer.legal.cookies')}
                </Link>
                .
              </p>

              <p className="mt-3 text-[11px] text-amber-200/90 leading-snug">
                {t('studentNotice.title')}. {t('studentNotice.message')}
              </p>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDetail(true)}
                  className="px-3 py-2.5 text-sm font-medium text-white/95 hover:text-white transition-colors"
                >
                  {t('cookies.banner.choose')}
                </button>
                <button
                  type="button"
                  onClick={() => accept(true)}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-[#2563FF] hover:bg-[#3b76ff] rounded-xl transition-colors"
                >
                  {t('cookies.banner.okForMe')}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-serif text-xl font-bold leading-tight">
                  {t('cookies.banner.customizeTitle')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDetail(false)}
                  className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={t('cookies.banner.back')}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5 mb-5">
                <CookieToggle
                  label={t('cookies.banner.essentialLabel')}
                  description={t('cookies.banner.essentialDesc')}
                  checked
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDetail(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white/90 border border-white/25 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {t('cookies.banner.back')}
                </button>
                <button
                  type="button"
                  onClick={saveCustom}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563FF] hover:bg-[#3b76ff] rounded-xl transition-colors"
                >
                  {t('cookies.banner.save')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}

interface CookieToggleProps {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}

const CookieToggle: React.FC<CookieToggleProps> = ({ label, description, checked, disabled, onChange }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-white/65 mt-0.5 leading-relaxed">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative flex-shrink-0 w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-1 focus:ring-offset-[#003366]',
        checked ? 'bg-[#2563FF]' : 'bg-white/25',
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
