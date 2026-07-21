import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeroProps {
  /** 'ocean' = dégradé bleu (py-20, titre large) - 'gray' = dégradé gris (py-16, titre moyen) */
  variant?: 'ocean' | 'gray'
  icon: LucideIcon
  badge: string
  title: string
  subtitle: string
  /** Image de fond optionnelle (plein écran sous un overlay) */
  backgroundImage?: string
  /** Contenu optionnel affiché sous le sous-titre (ex. bouton CTA) */
  children?: React.ReactNode
}

const PageHero: React.FC<PageHeroProps> = ({
  variant = 'ocean',
  icon: Icon,
  badge,
  title,
  subtitle,
  backgroundImage,
  children,
}) => {
  const isOcean = variant === 'ocean'
  const hasImage = Boolean(backgroundImage)

  return (
    <section
      className={`relative overflow-hidden text-white px-4 text-center ${
        hasImage
          ? 'min-h-[420px] sm:min-h-[480px] flex items-center justify-center py-20'
          : isOcean
            ? 'bg-gradient-to-br from-ocean-900 to-ocean-700 py-20'
            : 'bg-gradient-to-br from-gray-900 to-gray-700 py-16'
      }`}
    >
      {hasImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/80 via-brand-navy/65 to-brand-navy/85" />
        </>
      )}

      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <span
          className={`inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm font-medium px-4 py-1.5 rounded-full backdrop-blur-sm ${
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
        <p className={isOcean ? 'text-lg text-white/85 max-w-xl mx-auto' : 'text-gray-400 dark:text-gray-300 text-sm'}>
          {subtitle}
        </p>
        {children}
      </div>
    </section>
  )
}

export default PageHero
