import React from 'react'
import { Navigate } from 'react-router-dom'
import { SETTINGS_ROUTE } from '../../lib/profilePaths'

/** Ancienne URL /mon-espace/parametres → Mon profil */
const LegacyProfileRedirect: React.FC = () => (
  <Navigate to={SETTINGS_ROUTE} replace />
)

export default LegacyProfileRedirect
