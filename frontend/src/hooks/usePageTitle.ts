import { useEffect } from 'react'

const BASE_TITLE = 'SailingLoc'

/**
 * Met à jour le titre de l'onglet navigateur.
 * Réinitialise à BASE_TITLE au démontage du composant.
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE
    return () => {
      document.title = BASE_TITLE
    }
  }, [title])
}
