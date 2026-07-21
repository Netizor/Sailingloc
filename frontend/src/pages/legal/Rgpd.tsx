import React from 'react'
import { useTranslation } from 'react-i18next'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

const Rgpd: React.FC = () => {
  const { t } = useTranslation()
  usePageTitle(t('legalPages.rgpd.pageTitle'))

  return (
    <LegalPageLayout
      title={t('legalPages.rgpd.title')}
      lastUpdated={t('legalPages.rgpd.lastUpdated')}
    >
      <LegalSection title={t('legalPages.rgpd.sections.1.title')}>
        <p>{t('legalPages.rgpd.sections.1.body')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.rgpd.sections.2.title')}>
        <p>{t('legalPages.rgpd.sections.2.body')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.rgpd.sections.3.title')}>
        <p>{t('legalPages.rgpd.sections.3.body')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.rgpd.sections.4.title')}>
        <p>{t('legalPages.rgpd.sections.4.body')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.rgpd.sections.5.title')}>
        <p>
          {t('legalPages.rgpd.sections.5.bodyBefore')}{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 underline underline-offset-2"
          >
            www.cnil.fr
          </a>
          {t('legalPages.rgpd.sections.5.bodyAfter')}
        </p>
      </LegalSection>

      <LegalSection title={t('legalPages.rgpd.sections.6.title')}>
        <p>{t('legalPages.rgpd.sections.6.body')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.rgpd.sections.7.title')}>
        <p>{t('legalPages.rgpd.sections.7.body')}</p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default Rgpd
