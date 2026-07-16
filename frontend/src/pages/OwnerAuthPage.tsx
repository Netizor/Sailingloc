import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LogIn, UserPlus } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

const OwnerAuthPage: React.FC = () => {
  usePageTitle('Owner Login & Registration')
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-72px)] bg-white dark:bg-gray-900 text-brand-navy dark:text-gray-100">
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-10 sm:py-16">
        <Link
          to="/devenir-proprietaire"
          className="inline-flex items-center gap-1.5 text-sm text-brand-slate dark:text-gray-400 hover:text-brand-navy dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </Link>

        <div className="text-center mb-10">
          <p className="text-brand-blue text-sm font-medium mb-2">Owner space</p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy dark:text-white mb-2">
            Join SailingLoc
          </h1>
          <p className="text-brand-slate dark:text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
            Sign in or create your owner account to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-8 flex flex-col">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 text-brand-blue mb-5">
              <LogIn size={22} />
            </div>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-2">
              Already an owner?
            </h2>
            <p className="text-sm text-brand-slate dark:text-gray-400 leading-relaxed mb-8 flex-1">
              Sign in to your space to manage your boats, bookings, and earnings.
            </p>
            <button
              type="button"
              onClick={() => navigate('/connexion', { state: { from: { pathname: '/proprietaire' } } })}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 text-sm font-semibold text-white bg-brand-blue hover:bg-ocean-600 rounded-full transition-colors"
            >
              Sign in
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-brand-navy text-white shadow-sm p-8 flex flex-col">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 text-brand-blue mb-5">
              <UserPlus size={22} />
            </div>
            <h2 className="text-xl font-bold mb-2">New owner?</h2>
            <p className="text-sm text-white/75 leading-relaxed mb-8 flex-1">
              Create your account in a few minutes and publish your first listing on the platform.
            </p>
            <button
              type="button"
              onClick={() => navigate('/inscription?role=owner')}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 text-sm font-semibold text-brand-navy bg-white hover:bg-gray-100 rounded-full transition-colors"
            >
              Create an account
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-brand-slate dark:text-gray-400">
          Looking to rent a boat?{' '}
          <Link to="/inscription" className="font-semibold text-brand-blue hover:text-ocean-600 transition-colors">
            Create a renter account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default OwnerAuthPage
