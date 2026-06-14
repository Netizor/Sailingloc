import { create } from 'zustand'

export type Theme = 'light' | 'dark'
export type ColorBlindMode = 'none' | 'yellow'

const THEME_KEY = 'sailingloc_theme'
const COLOR_BLIND_KEY = 'sailingloc_color_blind'

const LEGACY_COLOR_BLIND = ['protanopia', 'deuteranopia', 'tritanopia']

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialColorBlindMode(): ColorBlindMode {
  const stored = localStorage.getItem(COLOR_BLIND_KEY)
  if (stored === 'yellow') return 'yellow'
  if (stored && LEGACY_COLOR_BLIND.includes(stored)) return 'yellow'
  return 'none'
}

export function applyPreferences(theme: Theme, colorBlindMode: ColorBlindMode) {
  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  root.classList.remove('cb-yellow')
  LEGACY_COLOR_BLIND.forEach((mode) => root.classList.remove(`cb-${mode}`))
  if (colorBlindMode === 'yellow') {
    root.classList.add('cb-yellow')
  }
}

interface PreferencesState {
  theme: Theme
  colorBlindMode: ColorBlindMode
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setColorBlindMode: (mode: ColorBlindMode) => void
  toggleColorBlind: () => void
  init: () => void
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  theme: getInitialTheme(),
  colorBlindMode: getInitialColorBlindMode(),

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme)
    applyPreferences(theme, get().colorBlindMode)
    set({ theme })
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },

  setColorBlindMode: (mode) => {
    localStorage.setItem(COLOR_BLIND_KEY, mode)
    applyPreferences(get().theme, mode)
    set({ colorBlindMode: mode })
  },

  toggleColorBlind: () => {
    const next: ColorBlindMode = get().colorBlindMode === 'yellow' ? 'none' : 'yellow'
    get().setColorBlindMode(next)
  },

  init: () => {
    const { theme, colorBlindMode } = get()
    applyPreferences(theme, colorBlindMode)
  },
}))
