import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeroProps {
  /** 'ocean' = dégradé bleu (py-20, titre large) — 'gray' = dégradé gris (py-16, titre moyen) */
  variant?: 'ocean' | 'gray'
  icon: LucideIcon
  badge: string
  title: string
  subtitle: string
  /** Contenu optionnel affiché sous le sous-titre (ex. bouton CTA) */
  children?: React.ReactNode
}

const PageHero: React.FC<PageHeroProps> = ({
  variant = 'ocean',
  icon: Icon,
  badge,
  title,
  subtitle,
  children,
}) => {
  const isOcean = variant === 'ocean'

  return (
    <section
      className={`text-white px-4 text-center ${
        isOcean
          ? 'bg-gradient-to-br from-ocean-900 to-ocean-700 py-20'
          : 'bg-gradient-to-br from-gray-900 to-gray-700 py-16'
      }`}
    >
      <span
        className={`inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm font-medium px-4 py-1.5 rounded-full ${
          isOcean ? 'mb-6' : 'mb-4'
        }`}
      >
        <Icon size={15} />
        {badge}
      </span>
      <h1
        className={`font-bold ${
          isOcean
            ? 'text-4xl sm:text-5xl tracking-tight mb-4'
            : 'text-3xl sm:text-4xl mb-2'
        }`}
      >
        {title}
      </h1>
      <p className={isOcean ? 'text-lg text-ocean-100 max-w-xl mx-auto' : 'text-gray-400 dark:text-gray-300 text-sm'}>
        {subtitle}
      </p>
      {children}
    </section>
  )
}

export default PageHero
