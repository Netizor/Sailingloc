import React from 'react'

interface LegalSectionProps {
  title: string
  children: React.ReactNode
}

/** Bloc section pour les pages légales (titre H2 + contenu enfant). */
const LegalSection: React.FC<LegalSectionProps> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h2>
    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </section>
)

export default LegalSection
