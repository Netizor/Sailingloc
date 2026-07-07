import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ChevronRight, X, Anchor, FileText } from 'lucide-react'

interface Draft {
  key: string
  title: string
  subtitle?: string
  link: string
  savedAt: Date
}

interface DraftSectionProps {
  type: 'boats' | 'bookings'
}

const DraftSection: React.FC<DraftSectionProps> = ({ type }) => {
  const [drafts, setDrafts] = useState<Draft[]>([])

  const load = useCallback(() => {
    const found: Draft[] = []

    if (type === 'boats') {
      try {
        const raw = localStorage.getItem('sailingloc_boat_draft_new')
        if (raw) {
          const saved = JSON.parse(raw)
          if (saved.savedAt) {
            found.push({
              key: 'sailingloc_boat_draft_new',
              title: saved.form?.title?.trim() || 'Nouvelle annonce sans titre',
              subtitle: saved.form?.boatType || undefined,
              link: '/proprietaire/bateaux/nouveau',
              savedAt: new Date(saved.savedAt),
            })
          }
        }
      } catch {}

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith('sailingloc_boat_draft_') || key === 'sailingloc_boat_draft_new') continue
        try {
          const raw = localStorage.getItem(key)!
          const saved = JSON.parse(raw)
          if (!saved.savedAt) continue
          const boatId = key.replace('sailingloc_boat_draft_', '')
          found.push({
            key,
            title: saved.form?.title?.trim() || `Bateau #${boatId}`,
            subtitle: saved.form?.boatType || undefined,
            link: `/proprietaire/bateaux/${boatId}/editer`,
            savedAt: new Date(saved.savedAt),
          })
        } catch {}
      }
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith('sailingloc_booking_')) continue
        try {
          const raw = localStorage.getItem(key)!
          const saved = JSON.parse(raw)
          if (!saved.savedAt) continue
          const boatId = key.replace('sailingloc_booking_', '')
          const parts: string[] = []
          if (saved.range?.from) {
            const from = new Date(saved.range.from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            const to = saved.range.to
              ? new Date(saved.range.to).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
              : '...'
            parts.push(`${from} → ${to}`)
          }
          if (saved.withSkipper) parts.push('Avec skipper')
          found.push({
            key,
            title: saved.boatTitle || `Bateau #${boatId}`,
            subtitle: parts.join(' · ') || undefined,
            link: `/bateaux/${boatId}`,
            savedAt: new Date(saved.savedAt),
          })
        } catch {}
      }
    }

    setDrafts(
      found
        .filter(d => !isNaN(d.savedAt.getTime()))
        .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime()),
    )
  }, [type])

  useEffect(() => { load() }, [load])

  const remove = useCallback((key: string) => {
    try { localStorage.removeItem(key) } catch {}
    setDrafts(d => d.filter(x => x.key !== key))
  }, [])

  if (drafts.length === 0) return null

  const fmtTime = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const isBoats = type === 'boats'

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Clock size={12} />
        {isBoats ? 'Brouillons en cours' : 'Réservations non finalisées'}
        <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1 text-[10px] font-bold">
          {drafts.length}
        </span>
      </h2>
      <div className="flex flex-col gap-2">
        {drafts.map(d => (
          <div
            key={d.key}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              isBoats
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50'
                : 'bg-ocean-50 dark:bg-ocean-900/20 border-ocean-200 dark:border-ocean-700/50'
            }`}
          >
            {isBoats
              ? <Anchor size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              : <FileText size={16} className="text-ocean-600 dark:text-ocean-400 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{d.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {d.subtitle ? `${d.subtitle} · ` : ''}Sauvegardé à {fmtTime(d.savedAt)}
              </p>
            </div>
            <Link
              to={d.link}
              className={`flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                isBoats
                  ? 'text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200'
                  : 'text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-200'
              }`}
            >
              Continuer <ChevronRight size={13} />
            </Link>
            <button
              onClick={() => remove(d.key)}
              className="ml-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
              aria-label="Supprimer ce brouillon"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DraftSection
