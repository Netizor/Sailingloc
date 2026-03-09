import { useState, useCallback } from 'react'

export interface SavedSearch {
  id: string
  location: string
  startDate: string
  endDate: string
  capacity: number | ''
  savedAt: string
}

const STORAGE_KEY = 'sailingloc_saved_searches'

function load(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedSearch[]) : []
  } catch {
    return []
  }
}

function save(searches: SavedSearch[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
}

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>(load)

  const add = useCallback(
    (params: Omit<SavedSearch, 'id' | 'savedAt'>) => {
      setSearches((prev) => {
        // Éviter les doublons exacts (même lieu + mêmes dates)
        const isDuplicate = prev.some(
          (s) =>
            s.location === params.location &&
            s.startDate === params.startDate &&
            s.endDate === params.endDate &&
            s.capacity === params.capacity,
        )
        if (isDuplicate) return prev

        const next = [
          { ...params, id: crypto.randomUUID(), savedAt: new Date().toISOString() },
          ...prev,
        ].slice(0, 20) // Maximum 20 recherches
        save(next)
        return next
      })
    },
    [],
  )

  const remove = useCallback((id: string) => {
    setSearches((prev) => {
      const next = prev.filter((s) => s.id !== id)
      save(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSearches([])
    save([])
  }, [])

  return { searches, add, remove, clear }
}
