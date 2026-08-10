import api from '../lib/axios'
import type { AuthResponse, LoginCredentials, RegisterData, User } from '../types'

/**
 * Authenticate a user with email and password.
 * Returns user object with access + refresh tokens.
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials)
  return data
}

/**
 * Create a new user account.
 * Returns the newly created user with tokens.
 */
export const register = async (registerData: RegisterData): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', registerData)
  return data
}

/**
 * Invalidate the current session server-side by revoking the refresh token.
 */
export const logout = async (refreshToken: string): Promise<void> => {
  await api.post('/auth/logout', { refreshToken })
}

/**
 * Exchange a valid refresh token for a new access token.
 */
export const refreshToken = async (token: string): Promise<{ accessToken: string }> => {
  const { data } = await api.post<{ accessToken: string }>('/auth/refresh', {
    refreshToken: token,
  })
  return data
}

/**
 * Fetch the currently authenticated user's profile.
 */
export const getMe = async (): Promise<User> => {
  const { data } = await api.get<User>('/auth/me')
  return data
}

/**
 * Demande un lien de réinitialisation de mot de passe par email.
 * Retourne toujours 200 même si l'email n'existe pas (anti-énumération).
 */
export const forgotPassword = async (
  email: string,
): Promise<{ message: string; exists?: boolean }> => {
  const { data } = await api.post<{ message: string; exists?: boolean }>(
    '/auth/forgot-password',
    { email },
  )
  return data
}

/**
 * Réinitialise le mot de passe avec le token reçu par email.
 */
export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password })
  return data
}

/**
 * Vérifie l'adresse email via le token reçu par email (route publique).
 * Retourne un nouveau JWT + user avec emailVerifiedAt.
 */
export const verifyEmail = async (token: string): Promise<AuthResponse> => {
  const { data } = await api.get<AuthResponse>('/auth/verify-email', { params: { token } })
  return data
}

/**
 * Renvoie un email de vérification (utilisateur connecté).
 */
export const resendVerification = async (): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/auth/resend-verification')
  return data
}

/**
 * Vérifie si le mot de passe fourni figure dans des fuites de données connues (Have I Been Pwned).
 * Utilise la méthode k-anonymity côté backend - le mot de passe n'est jamais transmis à HIBP.
 * Appelé en arrière-plan après connexion réussie, sans bloquer la navigation.
 */
export const checkPasswordHibp = async (
  password: string,
): Promise<{ compromised: boolean; count?: number }> => {
  const { data } = await api.post<{ compromised: boolean; count?: number }>(
    '/auth/hibp-check',
    { password },
  )
  return data
}

export const authApi = {
  login: (email: string, password: string) => login({ email, password }),
  register,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  checkPasswordHibp,
}
