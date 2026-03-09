import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Trash2, ExternalLink, BookmarkX } from 'lucide-react'
import { useSavedSearches } from '../../hooks/useSavedSearches'
import Button from '../../components/ui/Button'

const SavedSearches: React.FC = () => {
  const navigate = useNavigate()
  const { searches, remove, clear } = useSavedSearches()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookmarkX size={22} className="text-ocean-700 dark:text-ocean-400" />
            Recherches sauvegardées
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {searches.length} recherche{searches.length > 1 ? 's' : ''} enregistrée{searches.length > 1 ? 's' : ''}
          </p>
        </div>
        {searches.length > 0 && (
          <Button variant="secondary" size="sm" onClick={clear}>
            Tout supprimer
          </Button>
        )}
      </div>

      {searches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <Search size={40} strokeWidth={1.5} className="text-gray-200 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune recherche sauvegardée</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Depuis la page de recherche, cliquez sur "Sauvegarder" pour retrouver vos critères ici.
          </p>
          <Link to="/bateaux" className="text-sm text-ocean-700 dark:text-ocean-400 hover:underline font-medium">
            Lancer une recherche →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => {
            // Reconstruction de l'URL de recherche depuis les critères sauvegardés
            const params = new URLSearchParams()
            if (s.location) params.set('location', s.location)
            if (s.startDate) params.set('startDate', s.startDate)
            if (s.endDate) params.set('endDate', s.endDate)
            if (s.capacity) params.set('capacity', String(s.capacity))

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center flex-shrink-0">
                  <Search size={16} className="text-ocean-600 dark:text-ocean-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {s.location || 'Tous les ports'}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {s.startDate && s.endDate && (
                      <span>{s.startDate} → {s.endDate}</span>
                    )}
                    {s.capacity && <span>{s.capacity} personnes</span>}
                    <span>Sauvegardé le {new Date(s.savedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/bateaux?${params.toString()}`)}
                    className="p-2 rounded-lg text-ocean-600 dark:text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-900/30 transition-colors"
                    aria-label="Relancer cette recherche"
                    title="Relancer"
                  >
                    <ExternalLink size={15} />
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SavedSearches
