import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'

type StarSize = 'sm' | 'md' | 'lg'

interface StarsProps {
  rating: number
  max?: number
  size?: StarSize
  showValue?: boolean
  className?: string
}

interface StarInputProps {
  value: number
  onChange: (value: number) => void
  max?: number
  size?: StarSize
  className?: string
}

const sizeMap: Record<StarSize, number> = {
  sm: 12,
  md: 16,
  lg: 24,
}

const textSizeMap: Record<StarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const Stars: React.FC<StarsProps> = ({
  rating,
  max = 5,
  size = 'md',
  showValue = false,
  className,
}) => {
  const iconSize = sizeMap[size]
  const clampedRating = Math.min(Math.max(0, rating), max)

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`Note : ${clampedRating.toFixed(1)} sur ${max}`}
      role="img"
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = clampedRating >= i + 1
        const partial = !filled && clampedRating > i
        const fillPercent = partial ? (clampedRating - i) * 100 : 0

        return (
          <span key={i} className="relative inline-flex" aria-hidden="true">
            {/* Empty star background */}
            <Star
              size={iconSize}
              className="text-gray-300 dark:text-gray-600"
              fill="currentColor"
              strokeWidth={0}
            />
            {/* Filled overlay */}
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${fillPercent}%` }}
              >
                <Star
                  size={iconSize}
                  className="text-amber-400"
                  fill="currentColor"
                  strokeWidth={0}
                />
              </span>
            )}
          </span>
        )
      })}
      {showValue && (
        <span className={cn('ml-1 font-medium text-gray-700 dark:text-gray-300', textSizeMap[size])}>
          {clampedRating.toFixed(1)}
        </span>
      )}
    </span>
  )
}

const StarInput: React.FC<StarInputProps> = ({
  value,
  onChange,
  max = 5,
  size = 'md',
  className,
}) => {
  const [hovered, setHovered] = useState<number>(0)
  const iconSize = sizeMap[size]
  const active = hovered || value

  const labels = ['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent']

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <span
        className="inline-flex items-center gap-1"
        role="group"
        aria-label="Sélectionnez une note"
        onMouseLeave={() => setHovered(0)}
      >
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1
          const isFilled = active >= starValue
          return (
            <button
              key={starValue}
              type="button"
              aria-label={`${starValue} étoile${starValue > 1 ? 's' : ''}, ${labels[i] ?? ''}`}
              aria-pressed={value === starValue}
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHovered(starValue)}
              className="cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ocean-500 rounded"
            >
              <Star
                size={iconSize}
                className={isFilled ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}
                fill="currentColor"
                strokeWidth={0}
              />
            </button>
          )
        })}
      </span>
      {active > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400">{labels[active - 1]}</span>
      )}
    </div>
  )
}

export default Stars
export { StarInput }
export type { StarsProps, StarInputProps, StarSize }
