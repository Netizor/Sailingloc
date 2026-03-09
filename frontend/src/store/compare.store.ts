import { create } from 'zustand'

// Limite : 3 bateaux maximum dans le comparateur
const MAX_COMPARE = 3

interface CompareStore {
  ids: number[]
  add: (id: number) => void
  remove: (id: number) => void
  clear: () => void
}

export const useCompareStore = create<CompareStore>((set) => ({
  ids: [],

  add: (id) =>
    set((state) =>
      state.ids.length < MAX_COMPARE && !state.ids.includes(id)
        ? { ids: [...state.ids, id] }
        : state,
    ),

  remove: (id) =>
    set((state) => ({ ids: state.ids.filter((i) => i !== id) })),

  clear: () => set({ ids: [] }),
}))
