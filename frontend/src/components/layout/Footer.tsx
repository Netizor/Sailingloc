import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Youtube, ArrowUp, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'

interface SocialLink {
  icon: LucideIcon
  label: string
  href: string
}

const socialLinks: SocialLink[] = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Twitter, label: 'X (Twitter)', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
]

const Footer: React.FC = () => {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  const [email, setEmail] = useState('')

  const platformLinks = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.boats'), to: '/bateaux' },
    { label: t('nav.destinationsShort'), to: '/destinations' },
    { label: t('footer.contactUs'), to: '/contact' },
  ]

  const destinationLinks = [
    { label: "Côte d'Azur", to: '/destinations/cannes' },
    { label: 'Corse', to: '/destinations/ajaccio' },
    { label: 'Bretagne', to: '/destinations/brest' },
    { label: 'Grèce', to: '/destinations/grece' },
  ]

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    setEmail('')
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="bg-[#f8f9fa] text-brand-slate border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div>
            <Link to="/" className="inline-flex mb-4">
              <img src="/logo.jpeg" alt="SailingLoc" className="h-10 w-auto max-w-[180px] object-contain" />
            </Link>
            <p className="text-sm text-brand-slate leading-relaxed mb-5 max-w-xs">
              {t('footer.taglineShort')}
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  onClick={s.href === '#' ? (e) => e.preventDefault() : undefined}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-brand-slate"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title={t('footer.platform')} links={platformLinks} />
          <FooterColumn title={t('footer.destinationsCol')} links={destinationLinks} />

          <div>
            <h3 className="text-sm font-bold text-brand-navy mb-4">{t('footer.newsletter')}</h3>
            <p className="text-sm text-brand-slate mb-4 leading-relaxed">
              {t('footer.newsletterDesc')}
            </p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.emailPlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-blue text-white text-sm font-semibold rounded-xl whitespace-nowrap"
              >
                {t('footer.subscribe')}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-brand-slate">
            <Link to="/cgu">{t('footer.legal.cgu')}</Link>
            <span aria-hidden="true">·</span>
            <Link to="/mentions-legales">{t('footer.legal.mentions')}</Link>
            <span aria-hidden="true">·</span>
            <Link to="/rgpd">{t('footer.legal.rgpd')}</Link>
            <span aria-hidden="true">·</span>
            <Link to="/cookies">{t('footer.legal.cookies')}</Link>
          </nav>

          <div className="flex items-center gap-4">
            <p className="text-xs text-brand-slate">
              © {year} SailingLoc. {t('footer.rights')}
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Retour en haut"
              className="p-2 rounded-lg bg-white border border-gray-200 text-brand-slate"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

interface FooterColumnProps {
  title: string
  links: { label: string; to: string }[]
}

const FooterColumn: React.FC<FooterColumnProps> = ({ title, links }) => (
  <div>
    <h3 className="text-sm font-bold text-brand-navy mb-4">{title}</h3>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link to={link.to} className="text-sm text-brand-slate">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default Footer
