import React, { useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import VerificationBanner from '../ui/VerificationBanner'
import { useAuthStore } from '../../store/auth.store'
import { FullPageSpinner } from '../ui/Spinner'

// ─── ScrollToHash ────────────────────────────────────────────────────────────
// React Router v6 ne défile pas automatiquement vers les ancres lors d'une
// navigation cross-page (ex : footer → /a-propos#equipe). Ce composant écoute
// les changements de hash et scrolle vers l'élément cible après le rendu.

const ScrollToHash: React.FC = () => {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    // Délai minimal pour laisser la page lazy se rendre avant de chercher l'élément
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
    return () => clearTimeout(timer)
  }, [hash, pathname])

  return null
}

// ─── Main Layout ────────────────────────────────────────────────────────────

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <ScrollToHash />
      <Header />
      {/* Bandeau de vérification email / téléphone manquant — visible uniquement si connecté */}
      <VerificationBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// ─── Protected Route (requires any authenticated user) ───────────────────────

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <FullPageSpinner label="Vérification de la session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  return <Outlet />
}

// ─── Owner Route (requires OWNER or ADMIN role) ──────────────────────────────

export const OwnerRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <FullPageSpinner label="Vérification des droits…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') {
    return <Navigate to="/mon-espace" replace />
  }

  return <Outlet />
}

// ─── Admin Route (requires ADMIN role only) ──────────────────────────────────

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <FullPageSpinner label="Vérification des droits d'administration…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/mon-espace" replace />
  }

  return <Outlet />
}

export default Layout
