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
          <div className="absolute inset-0 media-scrim" aria-hidden />
        </>
      )}

      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <span
          className={`inline-flex items-center gap-2 bg-white/15 border border-white/30 text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm text-on-media ${
            isOcean ? 'mb-6' : 'mb-4'
          }`}
        >
          <Icon size={15} aria-hidden />
          {badge}
        </span>
        <h1
          className={`font-bold text-on-media ${
            isOcean
              ? 'text-4xl sm:text-5xl tracking-tight mb-4'
              : 'text-3xl sm:text-4xl mb-2'
          }`}
        >
          {title}
        </h1>
        <p className={isOcean ? 'text-lg text-on-media-muted max-w-xl mx-auto font-medium' : 'text-gray-200 text-sm font-medium'}>
          {subtitle}
        </p>
        {children}
      </div>
    </section>
  )
}

export default PageHero
