import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Legal notice page ─────────────────────────────────────────────────────────

const MentionsLegales: React.FC = () => {
  const { t } = useTranslation()
  // #6 - Tab title for SEO and accessibility
  usePageTitle(t('legalPages.mentions.pageTitle'))

  return (
    // #7 - badge <span> (consistency via PageHero)  #8 - hero boilerplate + card extracted in LegalPageLayout
    <LegalPageLayout
      title={t('legalPages.mentions.title')}
      lastUpdated={t('legalPages.mentions.lastUpdated')}
    >
      <LegalSection title={t('legalPages.mentions.publisherTitle')}>
        <p>
          {t('legalPages.mentions.publisherP1Before')}
          <strong>SailingLoc SAS</strong>
          {t('legalPages.mentions.publisherP1After')}
        </p>
        <p>{t('legalPages.mentions.publisherOffice')}</p>
        <p>
          {t('legalPages.mentions.publisherDirector')}
          <br />
          {t('legalPages.mentions.publisherContact')}
        </p>
      </LegalSection>

      <LegalSection title={t('legalPages.mentions.hostingTitle')}>
        <p>
          {t('legalPages.mentions.hostingP1Before')}
          <strong>Vercel Inc.</strong>
          {t('legalPages.mentions.hostingP1After')}
        </p>
        <p>
          {t('legalPages.mentions.hostingP2Before')}
          <strong>Railway Corp.</strong>
          {t('legalPages.mentions.hostingP2After')}
        </p>
        <p>
          {t('legalPages.mentions.hostingP3Before')}
          <strong>Cloudinary Ltd.</strong>
          {t('legalPages.mentions.hostingP3After')}
        </p>
      </LegalSection>

      <LegalSection title={t('legalPages.mentions.ipTitle')}>
        <p>{t('legalPages.mentions.ipP1')}</p>
        <p>{t('legalPages.mentions.ipP2')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.mentions.cookiesTitle')}>
        <p>
          {t('legalPages.mentions.cookiesTextBefore')}{' '}
          <Link to="/cookies" className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2">
            {t('legalPages.mentions.cookiesLink')}
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title={t('legalPages.mentions.dataProtectionTitle')}>
        <p>{t('legalPages.mentions.dataProtectionP1')}</p>
        <p>
          {t('legalPages.mentions.dataProtectionP2Before')}{' '}
          <a
            href="mailto:dpo@sailingloc.fr"
            className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2"
          >
            dpo@sailingloc.fr
          </a>
          .
        </p>
        <p>
          {t('legalPages.mentions.dataProtectionP3Before')}{' '}
          <Link to="/rgpd" className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2">
            {t('legalPages.mentions.dataProtectionLink')}
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default MentionsLegales
