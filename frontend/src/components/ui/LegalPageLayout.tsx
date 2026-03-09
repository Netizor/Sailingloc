import React from 'react'
import type { LucideIcon } from 'lucide-react'
import PageHero from './PageHero'

interface LegalPageLayoutProps {
  icon: LucideIcon
  /** Libellé du badge affiché dans le hero (ex. "Légal") */
  badge: string
  title: string
  lastUpdated: string
  children: React.ReactNode
}

/**
 * Enveloppe commune à toutes les pages légales :
 * hero gris + zone de contenu centrée avec carte blanche.
 */
const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  icon,
  badge,
  title,
  lastUpdated,
  children,
}) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <PageHero variant="gray" icon={icon} badge={badge} title={title} subtitle={lastUpdated} />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 dark:bg-gray-800 dark:border-gray-700">
        {children}
      </div>
    </div>
  </div>
)

export default LegalPageLayout
