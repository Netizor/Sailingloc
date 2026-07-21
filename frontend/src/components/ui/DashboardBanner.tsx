import React from 'react'

interface DashboardBannerProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}

/** Bannière dégradée bleue utilisée en en-tête des pages de l'espace membre. */
const DashboardBanner: React.FC<DashboardBannerProps> = ({ icon, title, subtitle, action }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ocean-700 via-brand-blue to-ocean-600 text-white p-6 sm:p-8 mb-6 shadow-lg shadow-ocean-700/20">
    <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-white/5 blur-xl" />
    <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
        </div>
        {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
      </div>
      {action}
    </div>
  </div>
)

export default DashboardBanner
