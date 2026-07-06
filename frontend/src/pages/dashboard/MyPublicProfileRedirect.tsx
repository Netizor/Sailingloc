import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { getPublicProfilePath } from '../../lib/profilePaths'

/**
 * Redirection sécurisée : l'ID du profil est toujours celui de l'utilisateur connecté,
 * jamais saisi manuellement dans l'URL du menu.
 */
const MyPublicProfileRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/connexion" replace />
  }

  const publicPath = getPublicProfilePath(user)
  if (!publicPath) {
    return <Navigate to="/mon-espace" replace />
  }

  return <Navigate to={publicPath} replace />
}

export default MyPublicProfileRedirect
