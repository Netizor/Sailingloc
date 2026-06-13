import { usePreferencesStore } from '../store/preferences.store'

/**
 * Gère le thème clair/sombre via le store global des préférences.
 */
export function useTheme() {
  const theme = usePreferencesStore((s) => s.theme)
  const toggle = usePreferencesStore((s) => s.toggleTheme)

  return { theme, toggle }
}
