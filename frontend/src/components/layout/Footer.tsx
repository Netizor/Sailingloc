import React from 'react'
import { Link } from 'react-router-dom'
import { Anchor, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'
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

  const rentersLinks = [
    { label: t('footer.searchBoat'), to: '/bateaux' },
    { label: t('footer.howItWorks'), to: '/#comment-ca-marche' },
    { label: t('footer.availablePorts'), to: '/bateaux' },
    { label: t('footer.insurance'), to: '/faq' },
    { label: t('footer.faq'), to: '/faq' },
  ]

  const ownersLinks = [
    { label: t('footer.becomeOwner'), to: '/inscription' },
    { label: t('footer.ownerSpace'), to: '/proprietaire' },
    { label: t('footer.manageBoats'), to: '/proprietaire/bateaux' },
    { label: t('footer.estimateRevenue'), to: '/guide-proprietaire#revenus' },
    { label: t('footer.ownerGuide'), to: '/guide-proprietaire' },
  ]

  const aboutLinks = [
    { label: t('footer.aboutUs'), to: '/a-propos' },
    { label: t('footer.team'), to: '/a-propos#equipe' },
    { label: t('footer.contactUs'), to: '/contact' },
    { label: t('footer.press'), to: '/a-propos#presse' },
    { label: t('footer.careers'), to: '/a-propos#carrieres' },
  ]

  return (
    <footer className="bg-ocean-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="bg-white/10 group-hover:bg-white/20 transition-colors p-1.5 rounded-lg">
                <Anchor size={22} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">SailingLoc</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  {...(s.href !== '#'
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : { onClick: (e) => e.preventDefault() })}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                >
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title={t('footer.renters')} links={rentersLinks} />
          <FooterColumn title={t('footer.owners')} links={ownersLinks} />
          <FooterColumn title={t('footer.about')} links={aboutLinks} />
        </div>

        <div className="border-t border-white/10 mt-12 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <Link to="/cgu" className="hover:text-gray-300 transition-colors">
                {t('footer.legal.cgu')}
              </Link>
              <span aria-hidden="true" className="text-gray-700">·</span>
              <Link to="/mentions-legales" className="hover:text-gray-300 transition-colors">
                {t('footer.legal.mentions')}
              </Link>
              <span aria-hidden="true" className="text-gray-700">·</span>
              <Link to="/rgpd" className="hover:text-gray-300 transition-colors">
                {t('footer.legal.rgpd')}
              </Link>
              <span aria-hidden="true" className="text-gray-700">·</span>
              <Link to="/cookies" className="hover:text-gray-300 transition-colors">
                {t('footer.legal.cookies')}
              </Link>
            </nav>

            <p className="text-xs text-gray-500 text-center sm:text-right">
              © {year} SailingLoc —{' '}
              <span className="text-amber-400/80 font-medium">
                {t('footer.copyright')}
              </span>
            </p>
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
    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{title}</h3>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            to={link.to}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default Footer
