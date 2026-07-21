import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { getDefaultDashboardPath } from '../../lib/profilePaths'
import RenterDashboard from './RenterDashboard'

/** Affiche le tableau de bord locataire ou redirige les propriétaires vers /proprietaire */
const DashboardHome: React.FC = () => {
  const { user } = useAuthStore()
  const dashboardPath = getDefaultDashboardPath(user?.role)

  if (dashboardPath !== '/mon-espace') {
    return <Navigate to={dashboardPath} replace />
  }

  return <RenterDashboard />
}

export default DashboardHome
