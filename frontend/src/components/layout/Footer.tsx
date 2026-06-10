import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Footer: React.FC = () => {
  const { t } = useTranslation()

  const navLinks = [
    { label: t('footer.rentBoat'), to: '/bateaux' },
    { label: t('footer.becomeOwner'), to: '/inscription' },
    { label: t('nav.destinationsShort'), to: '/destinations' },
  ]

  const supportLinks = [
    { label: t('footer.helpSupport'), to: '/faq' },
    { label: t('footer.contactUs'), to: '/contact' },
    { label: t('footer.faq'), to: '/faq' },
  ]

  const legalLinks = [
    { label: t('footer.legal.cguFull'), to: '/cgu' },
    { label: t('footer.legal.privacy'), to: '/rgpd' },
  ]

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Twitter, label: 'X (Twitter)', href: '#' },
  ]

  return (
    <footer className="bg-white text-brand-slate border-t border-gray-200">
      <div className="w-full px-[10%] pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div>
            <Link to="/" className="inline-flex mb-4">
              <img src="/logo.jpeg" alt="SailingLoc" className="h-10 w-auto max-w-[180px] object-contain" />
            </Link>
            <p className="text-sm text-brand-slate leading-relaxed max-w-xs">
              {t('footer.taglineListing')}
            </p>
          </div>

          <FooterColumn title={t('footer.navigation')} links={navLinks} />
          <FooterColumn title={t('footer.support')} links={supportLinks} />
          <FooterColumn title={t('footer.legalCol')} links={legalLinks} />
        </div>

        <div className="border-t border-gray-200 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-muted">
            © 2024 SailingLoc. {t('footer.editorial')}
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                onClick={s.href === '#' ? (e) => e.preventDefault() : undefined}
                className="p-2 text-brand-muted hover:text-brand-navy transition-colors"
              >
                <s.icon size={16} />
              </a>
            ))}
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
    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy mb-4">{title}</h3>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link to={link.to} className="text-sm text-brand-slate hover:text-brand-navy transition-colors">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default Footer
