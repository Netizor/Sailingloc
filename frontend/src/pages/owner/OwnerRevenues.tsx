import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  Euro,
  Ship,
  TrendingUp,
  Download,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { formatDate, formatPrice } from '../../lib/utils'
import { downloadCsv } from '../../lib/exportCsv'
import { getOwnerRevenues } from '../../api/revenues.api'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Spinner from '../../components/ui/Spinner'
import type { RevenueByBoat, RevenueByMonth } from '../../types'

// ─── Constantes ───────────────────────────────────────────────────────────────

// CURRENT_YEAR et YEAR_OPTIONS sont calculés dans le composant
// pour rester à jour si l'onglet reste ouvert longtemps (ex : changement d'année à minuit).

// ─── Sous-composants ──────────────────────────────────────────────────────────

const SummaryCard: React.FC<{
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  color: string
}> = ({ label, value, sub, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
)

// Graphique barres CA mensuel (E4)
const MonthlyBarChart: React.FC<{ rows: RevenueByMonth[] }> = ({ rows }) => {
  const data = rows.map((r) => ({
    name: r.label.slice(0, 3),
    revenus: r.earnings,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp size={16} className="text-gray-400 dark:text-gray-500" />
          Évolution des revenus
        </h2>
      </div>
      <div className="px-4 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `${v}€`}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value: number | undefined) => [formatPrice(value ?? 0), 'Revenus']}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="revenus" fill="#0369a1" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const MonthlyTable: React.FC<{ rows: RevenueByMonth[] }> = ({ rows }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <BarChart3 size={16} className="text-gray-400 dark:text-gray-500" />
        CA mensuel
      </h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide bg-gray-50 dark:bg-gray-800/50">
            <th className="px-5 py-3 text-left font-medium">Mois</th>
            <th className="px-5 py-3 text-right font-medium">Réservations</th>
            <th className="px-5 py-3 text-right font-medium">Revenus</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {rows.map((row) => (
            <tr
              key={row.month}
              className={row.earnings > 0 ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}
            >
              <td className="px-5 py-3 font-medium">{row.label}</td>
              <td className="px-5 py-3 text-right">
                {row.bookings > 0 ? row.bookings : '—'}
              </td>
              <td className="px-5 py-3 text-right font-semibold">
                {row.earnings > 0 ? formatPrice(row.earnings) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const BoatBreakdownTable: React.FC<{ rows: RevenueByBoat[] }> = ({ rows }) => {
  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
        <Ship size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
        <p className="text-gray-400 dark:text-gray-500 text-sm">Aucune donnée pour la période sélectionnée</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Ship size={16} className="text-gray-400 dark:text-gray-500" />
          Par bateau
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide bg-gray-50 dark:bg-gray-800/50">
              <th className="px-5 py-3 text-left font-medium">Bateau</th>
              <th className="px-5 py-3 text-right font-medium">Rés.</th>
              <th className="px-5 py-3 text-right font-medium">Tarif moy./j</th>
              <th className="px-5 py-3 text-right font-medium">Revenus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {rows.map((row) => (
              <tr key={row.boatId} className="text-gray-900 dark:text-gray-100">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {row.boatImage ? (
                      <img
                        src={row.boatImage}
                        alt={row.boatTitle}
                        className="h-8 w-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Ship size={14} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    <span className="font-medium">{row.boatTitle}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">{row.bookings}</td>
                <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400">
                  {formatPrice(row.averageDailyRate)}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-green-700">
                  {formatPrice(row.earnings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

const OwnerRevenues: React.FC = () => {
  // Calculé dans le composant pour rester à jour si l'onglet est ouvert lors d'un changement d'année
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i)

  const [year, setYear]     = useState(currentYear)
  const [boatId, setBoatId] = useState('')

  // Requête principale — filtrée si un bateau est sélectionné
  const { data, isLoading, isError } = useQuery({
    queryKey: ['owner', 'revenues', year, boatId] as const,
    queryFn: () => getOwnerRevenues({ year, boatId: boatId ? Number(boatId) : undefined }),
    staleTime: 5 * 60 * 1000,
  })

  // Requête sans filtre — uniquement pour peupler le sélecteur quand un bateau est actif.
  // Désactivée quand boatId vaut '' : la requête principale suffit (même clé → déduplication React Query).
  const { data: allData } = useQuery({
    queryKey: ['owner', 'revenues', year, ''] as const,
    queryFn: () => getOwnerRevenues({ year }),
    staleTime: 5 * 60 * 1000,
    enabled: boatId !== '',
  })

  const summary        = data?.summary
  const byMonth        = data?.byMonth        ?? []
  const byBoat         = data?.byBoat         ?? []
  const recentBookings = data?.recentBookings ?? []

  // Options du sélecteur : depuis allData si un filtre est actif, sinon depuis la requête principale
  const boatOptions = (boatId !== '' ? allData?.byBoat : data?.byBoat) ?? []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* En-tête */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <Link
              to="/proprietaire"
              className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-2"
            >
              <ArrowLeft size={14} /> Espace propriétaire
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 size={24} className="text-ocean-700 dark:text-ocean-400" />
              Revenus
            </h1>
          </div>

          {/* Filtres + Export */}
          <div className="flex items-center gap-3 flex-wrap">
            {boatOptions.length > 1 && (
              <select
                value={boatId}
                onChange={(e) => setBoatId(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-600 text-sm px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                aria-label="Filtrer par bateau"
              >
                <option value="">Tous les bateaux</option>
                {boatOptions.map((b) => (
                  <option key={b.boatId} value={b.boatId}>
                    {b.boatTitle}
                  </option>
                ))}
              </select>
            )}
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-gray-200 dark:border-gray-600 text-sm px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-500"
              aria-label="Filtrer par année"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* C6 — Export CSV des réservations récentes */}
            {recentBookings.length > 0 && (
              <button
                onClick={() => downloadCsv(
                  `revenus-${year}`,
                  ['Date', 'Bateau', 'Durée (j)', 'Montant TTC (€)', 'Statut'],
                  recentBookings.map((b) => [
                    b.startDate ? new Date(b.startDate).toLocaleDateString('fr-FR') : '',
                    b.boat?.title ?? '',
                    b.totalDays ?? '',
                    b.totalAmount ?? '',
                    b.status ?? '',
                  ]),
                )}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-ocean-700 dark:hover:text-ocean-400 border border-gray-200 dark:border-gray-600 hover:border-ocean-300 dark:hover:border-ocean-700 rounded-lg px-3 py-2 transition-colors bg-white dark:bg-gray-700"
              >
                <Download size={14} />
                Exporter CSV
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
            <p className="text-red-500 text-sm">Impossible de charger les données de revenus.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* Cartes résumé */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                label="Total généré"
                value={formatPrice(summary?.totalEarnings ?? 0)}
                sub={`${summary?.totalBookings ?? 0} réservation(s)`}
                icon={<Euro size={22} />}
                color="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <SummaryCard
                label="Ce mois-ci"
                value={formatPrice(summary?.thisMonthEarnings ?? 0)}
                icon={<TrendingUp size={22} />}
                color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <SummaryCard
                label="En attente (confirmées)"
                value={formatPrice(summary?.confirmedEarnings ?? 0)}
                sub={`${summary?.confirmedBookings ?? 0} réservation(s)`}
                icon={<Clock size={22} />}
                color="bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
              />
            </div>

            {/* Seconde ligne : terminées */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SummaryCard
                label="Réservations terminées"
                value={formatPrice(summary?.completedEarnings ?? 0)}
                sub={`${summary?.completedBookings ?? 0} réservation(s)`}
                icon={<CheckCircle size={22} />}
                color="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              />
              <SummaryCard
                label="Réservations en attente"
                value={formatPrice(summary?.pendingEarnings ?? 0)}
                icon={<Clock size={22} />}
                color="bg-yellow-50 text-yellow-600"
              />
            </div>

            {/* Graphique CA mensuel (E4) */}
            {byMonth.some((r) => r.earnings > 0) && <MonthlyBarChart rows={byMonth} />}

            {/* Tableau CA mensuel */}
            {byMonth.length > 0 && <MonthlyTable rows={byMonth} />}

            {/* Par bateau */}
            <BoatBreakdownTable rows={byBoat} />

            {/* Dernières réservations */}
            {recentBookings.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Dernières réservations
                  </h2>
                  <Link
                    to="/proprietaire/reservations"
                    className="text-sm text-ocean-600 dark:text-ocean-400 hover:text-ocean-800 dark:hover:text-ocean-300"
                  >
                    Tout voir
                  </Link>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {recentBookings.map((booking, index) => (
                    <div
                      key={booking.id ?? index}
                      className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {booking.boat?.title ?? 'Bateau'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {booking.startDate && booking.endDate
                            ? `${formatDate(booking.startDate)} — ${formatDate(booking.endDate)}`
                            : ''}
                        </p>
                        {booking.renter && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {booking.renter.firstName} {booking.renter.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {booking.status && (
                          <BookingStatusBadge status={booking.status} />
                        )}
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatPrice(booking.totalAmount ?? 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerRevenues
