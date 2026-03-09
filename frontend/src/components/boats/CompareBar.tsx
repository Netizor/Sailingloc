import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, GitCompareArrows } from 'lucide-react'
import { useCompareStore } from '../../store/compare.store'
import Button from '../ui/Button'

const CompareBar: React.FC = () => {
  const navigate = useNavigate()
  const { ids, remove, clear } = useCompareStore()

  // La barre n'apparaît que si au moins un bateau est sélectionné
  if (ids.length === 0) return null

  const handleCompare = () => {
    navigate(`/bateaux/comparer?ids=${ids.join(',')}`)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
        {/* Pastilles des bateaux sélectionnés */}
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {ids.map((id) => (
            <div
              key={id}
              className="flex items-center gap-1.5 bg-ocean-50 border border-ocean-200 rounded-full px-3 py-1 text-xs font-medium text-ocean-700 dark:bg-ocean-900/30 dark:border-ocean-700 dark:text-ocean-400"
            >
              <span>Bateau #{id}</span>
              <button
                onClick={() => remove(id)}
                aria-label="Retirer du comparateur"
                className="text-ocean-400 hover:text-ocean-700 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {/* Emplacements vides (jusqu'à 3) */}
          {Array.from({ length: 3 - ids.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded-full px-3 py-1 text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500"
            >
              Ajouter un bateau
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={clear}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Tout effacer
          </button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<GitCompareArrows size={14} />}
            onClick={handleCompare}
            disabled={ids.length < 2}
          >
            Comparer ({ids.length})
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CompareBar
