import React from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import {
  Anchor,
  Star,
  Users,
  Ruler,
  Euro,
  CheckCircle,
  ArrowLeft,
  MapPin,
} from 'lucide-react'
import { getBoat } from '../api/boats.api'
import { formatPrice } from '../lib/utils'
import { BOAT_TYPE_LABELS, MOTORIZATION_LABELS } from '../lib/labels'
import { usePageTitle } from '../hooks/usePageTitle'
import type { Boat } from '../types'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

// ─── Page Comparer ────────────────────────────────────────────────────────────

const Comparer: React.FC = () => {
  usePageTitle('Comparateur de bateaux')

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Récupère les IDs depuis ?ids=id1,id2,id3
  const ids = (searchParams.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3) // maximum 3

  // Charge chaque bateau en parallèle
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['boat', id],
      queryFn: () => getBoat(Number(id)),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const hasError = queries.some((q) => q.isError)
  const boats = queries.map((q) => q.data).filter(Boolean) as Boat[]

  if (ids.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-4 text-center px-4">
        <Anchor size={40} className="text-gray-300 dark:text-gray-600" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Sélectionnez au moins 2 bateaux pour les comparer.
        </p>
        <Button variant="secondary" onClick={() => navigate('/bateaux')}>
          Retour à la recherche
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Retour
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Comparateur de bateaux
        </h1>

        {/* Erreur chargement partiel */}
        {hasError && !isLoading && (
          <p className="text-sm text-red-500 mb-4">
            Certains bateaux n'ont pas pu être chargés.
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {/* Colonne étiquettes */}
                  <th className="w-32 sm:w-44 text-left" />
                  {boats.map((boat) => (
                    <th
                      key={boat.id}
                      className="text-center pb-4 px-4 min-w-[150px] sm:min-w-[200px]"
                    >
                      <BoatHeader boat={boat} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow
                  label="Type"
                  icon={<Anchor size={14} />}
                  values={boats.map((b) => BOAT_TYPE_LABELS[b.type] ?? b.type)}
                />
                <CompareRow
                  label="Port"
                  icon={<MapPin size={14} />}
                  values={boats.map((b) => `${b.port}${b.city ? `, ${b.city}` : ''}`)}
                />
                <CompareRow
                  label="Longueur"
                  icon={<Ruler size={14} />}
                  values={boats.map((b) => (b.length ? `${b.length} m` : ''))}
                />
                <CompareRow
                  label="Capacité"
                  icon={<Users size={14} />}
                  values={boats.map((b) => `${b.capacity} pers.`)}
                />
                <CompareRow
                  label="Cabines"
                  values={boats.map((b) => `${b.cabins} cabine${b.cabins !== 1 ? 's' : ''}`)}
                />
                <CompareRow
                  label="Motorisation"
                  values={boats.map((b) => MOTORIZATION_LABELS[b.motorizationType] ?? b.motorizationType)}
                />
                <CompareRow
                  label="Skipper inclus"
                  values={boats.map((b) => (b.withSkipper ? '✓ Oui' : '✗ Non'))}
                  highlight
                />
                <CompareRow
                  label="Note"
                  icon={<Star size={14} />}
                  values={boats.map((b) =>
                    b.rating > 0
                      ? `${b.rating.toFixed(1)} / 5 (${b.reviewCount} avis)`
                      : 'Pas encore noté',
                  )}
                />
                <CompareRow
                  label="Prix / jour"
                  icon={<Euro size={14} />}
                  values={boats.map((b) => formatPrice(b.dailyRate))}
                  bold
                />
                <CompareRow
                  label="Caution"
                  values={boats.map((b) => formatPrice(b.depositAmount))}
                />
                {/* Équipements */}
                <tr>
                  <td className="py-4 pr-4 text-sm font-semibold text-gray-500 dark:text-gray-400 align-top whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      Équipements
                    </span>
                  </td>
                  {boats.map((boat) => (
                    <td
                      key={boat.id}
                      className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300 align-top border-t border-gray-100 dark:border-gray-700"
                    >
                      {boat.equipment && boat.equipment.length > 0 ? (
                        <ul className="space-y-1">
                          {boat.equipment.map((eq) => (
                            <li key={eq} className="flex items-center gap-1.5 text-xs">
                              <span className="text-green-500 text-base leading-none">•</span>
                              {eq}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs italic">Non renseigné</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* CTA */}
                <tr>
                  <td className="pt-6" />
                  {boats.map((boat) => (
                    <td key={boat.id} className="pt-6 px-4 text-center">
                      <Link to={`/bateaux/${boat.id}`}>
                        <Button variant="primary" className="w-full">
                          Voir l'annonce
                        </Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── En-tête colonne bateau ────────────────────────────────────────────────────

const BoatHeader: React.FC<{ boat: Boat }> = ({ boat }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="h-20 sm:h-28 w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
      {boat.images?.[0] ? (
        <img
          src={boat.images[0]}
          alt={boat.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-ocean-50 dark:bg-ocean-900/30">
          <Anchor size={28} className="text-ocean-300 dark:text-ocean-600" />
        </div>
      )}
    </div>
    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm text-center line-clamp-2 leading-snug">
      {boat.title}
    </p>
  </div>
)

// ─── Ligne de comparaison ─────────────────────────────────────────────────────

interface CompareRowProps {
  label: string
  icon?: React.ReactNode
  values: string[]
  bold?: boolean
  highlight?: boolean
}

const CompareRow: React.FC<CompareRowProps> = ({
  label,
  icon,
  values,
  bold = false,
  highlight = false,
}) => (
  <tr className={highlight ? 'bg-ocean-50/40 dark:bg-ocean-900/20' : undefined}>
    <td className="py-3 pr-4 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap border-t border-gray-100 dark:border-gray-700">
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </td>
    {values.map((val, i) => (
      <td
        key={i}
        className={`py-3 px-4 text-sm text-center border-t border-gray-100 dark:border-gray-700 ${
          bold ? 'font-bold text-ocean-700 dark:text-ocean-400 text-base' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {val}
      </td>
    ))}
  </tr>
)

export default Comparer
