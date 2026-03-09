import React from 'react'

interface DisabledTooltipProps {
  /** Si true, affiche le tooltip et désactive les interactions du children */
  disabled: boolean
  /** Texte du tooltip affiché au survol */
  tooltip: string
  children: React.ReactElement
  className?: string
}

/**
 * Enveloppe un bouton ou tout autre élément interactif :
 * - Si `disabled` : applique `pointer-events-none` + `opacity-50` sur le children
 *   et affiche un tooltip au survol du wrapper.
 * - Si non disabled : render le children tel quel.
 *
 * Note : les boutons HTML natifs ne déclenchent pas les événements `title`
 * au survol quand ils sont disabled. Ce wrapper résout ce problème en
 * gérant le hover sur un div parent.
 */
const DisabledTooltip: React.FC<DisabledTooltipProps> = ({
  disabled,
  tooltip,
  children,
  className,
}) => {
  if (!disabled) return children

  return (
    <div className={`relative inline-flex group ${className ?? ''}`} style={{ cursor: 'not-allowed' }}>
      {/* Children avec interactions bloquées */}
      <div className="pointer-events-none opacity-50">
        {children}
      </div>

      {/* Tooltip au survol */}
      <div
        role="tooltip"
        className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5
          px-3 py-2 max-w-[220px] w-max
          bg-gray-900 dark:bg-gray-700 text-white text-xs leading-snug rounded-xl
          shadow-lg
          opacity-0 group-hover:opacity-100
          scale-95 group-hover:scale-100
          transition-all duration-150
          pointer-events-none
          z-30
          text-center
        "
      >
        {tooltip}
        {/* Flèche */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </div>
    </div>
  )
}

export default DisabledTooltip
