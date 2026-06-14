import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Login from './auth/Login'
import Register from './auth/Register'
import { UserRole } from '../types'
import { usePageTitle } from '../hooks/usePageTitle'

const OwnerAuthPage: React.FC = () => {
  usePageTitle('Connexion & Inscription Propriétaire')

  return (
    <div className="min-h-screen bg-gray-50 py-10 sm:py-14">
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <Link
          to="/devenir-proprietaire"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-navy mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Retour
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Rejoignez SailingLoc
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Connectez-vous ou créez votre compte propriétaire pour commencer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Login embedded redirectAfterLogin="/proprietaire" />
          <Register embedded defaultRole={UserRole.OWNER} hideRoleToggle />
        </div>
      </div>
    </div>
  )
}

export default OwnerAuthPage
