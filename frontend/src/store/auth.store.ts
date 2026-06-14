import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

// ─── Clés de session ──────────────────────────────────────────────────────────

// Indique que cette session navigateur est active (effacé à la fermeture du navigateur)
const SESSION_FLAG = 'sailingloc-session-active'
// Indique si l'utilisateur a coché "Se souvenir de moi" (persiste dans localStorage)
const REMEMBER_KEY = 'sailingloc-remember-me'

/**
 * Vérifie au démarrage si la session doit être invalidée.
 * Si l'utilisateur n'avait pas coché "Se souvenir de moi" et a fermé le navigateur,
 * le flag sessionStorage est absent → déconnexion automatique.
 * À appeler une seule fois au montage de l'app (useEffect dans App.tsx).
 */
export function initSessionGuard(): void {
  const { isAuthenticated, logout } = useAuthStore.getState()
  if (!isAuthenticated) return

  const rememberMe = localStorage.getItem(REMEMBER_KEY) === 'true'
  // Si "Se souvenir de moi" n'était pas coché et que la session n'est plus active
  // (navigateur fermé → sessionStorage vidé), on déconnecte l'utilisateur
  if (!rememberMe && !sessionStorage.getItem(SESSION_FLAG)) {
    logout()
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void
  setAccessToken: (token: string) => void
  setRefreshToken: (token: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, accessToken, refreshToken, rememberMe = true) => {
        // Mémorise le choix "Se souvenir de moi" dans localStorage
        localStorage.setItem(REMEMBER_KEY, String(rememberMe))
        // Marque la session courante comme active (vidé si le navigateur se ferme)
        sessionStorage.setItem(SESSION_FLAG, '1')
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      updateUser: (userData) =>
        set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })),
      logout: () => {
        // Nettoyage des flags de session
        localStorage.removeItem(REMEMBER_KEY)
        sessionStorage.removeItem(SESSION_FLAG)
        // RGPD - suppression des données comportementales stockées localement à la déconnexion
        localStorage.removeItem('sailingloc_saved_searches')
        localStorage.removeItem('sailingloc_owner_onboarded')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'sailingloc-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
