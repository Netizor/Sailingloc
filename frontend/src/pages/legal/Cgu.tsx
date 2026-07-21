import React from 'react'
import { useTranslation } from 'react-i18next'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

const ARTICLE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

const Cgu: React.FC = () => {
  const { t } = useTranslation()
  usePageTitle(t('legalPages.cgu.pageTitle'))

  return (
    <LegalPageLayout
      title={t('legalPages.cgu.title')}
      lastUpdated={t('legalPages.cgu.lastUpdated')}
    >
      {ARTICLE_KEYS.map((key) => (
        <LegalSection key={key} title={t(`legalPages.cgu.articles.${key}.title`)}>
          <p>{t(`legalPages.cgu.articles.${key}.body`)}</p>
        </LegalSection>
      ))}
    </LegalPageLayout>
  )
}

export default Cgu
