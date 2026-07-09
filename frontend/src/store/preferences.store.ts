import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'sailingloc_theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyPreferences(theme: Theme) {
  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  root.classList.remove('cb-yellow')
}

interface PreferencesState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  init: () => void
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme)
    applyPreferences(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },

  init: () => {
    applyPreferences(get().theme)
  },
}))
