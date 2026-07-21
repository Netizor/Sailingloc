import React from 'react'
import { useTranslation } from 'react-i18next'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Cookie types table ───────────────────────────────────────────────────────

const COOKIE_TYPES = [
  { key: 'essential', consent: 'notRequired' as const },
  { key: 'analytics', consent: 'required' as const },
  { key: 'marketing', consent: 'required' as const },
]

// ─── Cookie Policy page ───────────────────────────────────────────────────────

const Cookies: React.FC = () => {
  const { t } = useTranslation()
  // #6 - Tab title for SEO and accessibility
  usePageTitle(t('legalPages.cookies.pageTitle'))

  return (
    // #7 - badge <span> (consistency via PageHero)  #8 - hero boilerplate + card extracted in LegalPageLayout
    <LegalPageLayout
      title={t('legalPages.cookies.title')}
      lastUpdated={t('legalPages.cookies.lastUpdated')}
    >
      <LegalSection title={t('legalPages.cookies.section1Title')}>
        <p>{t('legalPages.cookies.section1P1')}</p>
        <p>{t('legalPages.cookies.section1P2')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.cookies.section2Title')}>
        <p>{t('legalPages.cookies.section2Intro')}</p>
        {/* Responsive table */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">
                  {t('legalPages.cookies.table.typeHeader')}
                </th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">
                  {t('legalPages.cookies.table.purposeHeader')}
                </th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">
                  {t('legalPages.cookies.table.durationHeader')}
                </th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">
                  {t('legalPages.cookies.table.consentHeader')}
                </th>
              </tr>
            </thead>
            <tbody>
              {COOKIE_TYPES.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800">
                    {t(`legalPages.cookies.types.${row.key}.type`)}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">
                    {t(`legalPages.cookies.types.${row.key}.purpose`)}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">
                    {t(`legalPages.cookies.types.${row.key}.duration`)}
                  </td>
                  <td className="px-3 py-2 border border-gray-200">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.consent === 'required'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      {t(`legalPages.cookies.table.${row.consent}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title={t('legalPages.cookies.section3Title')}>
        <p>{t('legalPages.cookies.section3P1')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.cookies.section4Title')}>
        <p>{t('legalPages.cookies.section4Intro')}</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Chrome:</strong> {t('legalPages.cookies.browsers.chrome')}
          </li>
          <li>
            <strong>Firefox:</strong> {t('legalPages.cookies.browsers.firefox')}
          </li>
          <li>
            <strong>Safari:</strong> {t('legalPages.cookies.browsers.safari')}
          </li>
          <li>
            <strong>Edge:</strong> {t('legalPages.cookies.browsers.edge')}
          </li>
        </ul>
        <p>{t('legalPages.cookies.section4Note')}</p>
      </LegalSection>

      <LegalSection title={t('legalPages.cookies.section5Title')}>
        <p>
          {t('legalPages.cookies.section5TextBefore')}{' '}
          <a
            href="mailto:dpo@sailingloc.fr"
            className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2"
          >
            dpo@sailingloc.fr
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default Cookies
