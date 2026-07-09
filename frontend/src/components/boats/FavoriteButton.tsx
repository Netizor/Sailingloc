import React from 'react'
import { Heart } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useFavoriteBoat } from '../../hooks/useFavoriteBoat'

interface FavoriteButtonProps {
  boatId: number
  size?: 'sm' | 'md'
  className?: string
}

const sizeMap = {
  sm: { btn: 'p-1.5', icon: 16 },
  md: { btn: 'p-2', icon: 18 },
} as const

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ boatId, size = 'md', className }) => {
  const { isFavorite, toggle, isPending } = useFavoriteBoat(boatId)
  const s = sizeMap[size]

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={isFavorite}
      className={cn(
        'rounded-full transition-all duration-150 shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-1',
        'disabled:opacity-60',
        s.btn,
        isFavorite
          ? 'bg-rose-500 text-white hover:bg-rose-600'
          : 'bg-white/95 dark:bg-gray-800/95 text-brand-slate dark:text-gray-200 hover:text-rose-500 hover:scale-105',
        className,
      )}
    >
      <Heart size={s.icon} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  )
}

export default FavoriteButton
