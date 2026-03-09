import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, User, AlertCircle } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { cn } from '../../lib/utils'
import type { Boat } from '../../types'
import { useAuthStore } from '../../store/auth.store'
import Button from '../ui/Button'
import PriceBreakdown from '../boats/PriceBreakdown'

export interface BookingFormData {
  startDate: string
  endDate: string
  withSkipper: boolean
  message: string
}

interface BookingFormProps {
  boat: Boat
  onSubmit: (data: BookingFormData) => Promise<void>
  loading?: boolean
  className?: string
  /** Dates indisponibles (réservées ou bloquées) au format YYYY-MM-DD */
  disabledDates?: string[]
}

const BookingForm: React.FC<BookingFormProps> = ({
  boat,
  onSubmit,
  loading = false,
  className,
  disabledDates = [],
}) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [range, setRange] = useState<DateRange | undefined>()
  const [withSkipper, setWithSkipper] = useState(false)
  const [message, setMessage] = useState('')
  const [dateError, setDateError] = useState<string | undefined>()

  // Jours désactivés : passé + dates réservées/bloquées
  const disabledDays = useMemo(() => {
    const blocked = disabledDates.map((d) => parseISO(d))
    return [{ before: today }, ...blocked]
  }, [disabledDates, today])

  // Dérive les chaînes YYYY-MM-DD depuis le DateRange sélectionné
  const startDate = range?.from ? format(range.from, 'yyyy-MM-dd') : ''
  const endDate = range?.to ? format(range.to, 'yyyy-MM-dd') : ''

  const totalDays = useMemo(() => {
    if (!range?.from || !range?.to) return 0
    const diff = differenceInDays(range.to, range.from)
    return diff > 0 ? diff : 0
  }, [range])

  // Trouve la meilleure remise dégressive applicable au nombre de jours sélectionné (E2)
  const appliedDiscountPercent = useMemo(() => {
    if (!boat.discountRules || totalDays === 0) return 0
    let best = 0
    for (const rule of boat.discountRules) {
      if (totalDays >= rule.minDays && rule.discountPercent > best) {
        best = rule.discountPercent
      }
    }
    return best
  }, [boat.discountRules, totalDays])

  const validate = (): boolean => {
    if (!range?.from) {
      setDateError('Choisissez une date de départ')
      return false
    }
    if (!range?.to) {
      setDateError('Choisissez une date de retour')
      return false
    }
    if (range.to <= range.from) {
      setDateError('La date de retour doit être après la date de départ')
      return false
    }
    setDateError(undefined)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/connexion', { state: { from: location } })
      return
    }
    if (!validate()) return
    await onSubmit({ startDate, endDate, withSkipper, message })
  }

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-200 shadow-lg p-5 flex flex-col gap-5',
        className
      )}
    >
      {/* Price header */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-orange-500">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(boat.dailyRate)}
        </span>
        <span className="text-gray-400 text-sm">/ jour</span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Date range picker */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Sélectionnez vos dates</p>

          {/* Surcharge des couleurs react-day-picker avec le thème ocean */}
          <div
            className="flex justify-center"
            style={{
              '--rdp-accent-color': '#0369a1',
              '--rdp-background-color': '#e0f2fe',
              '--rdp-selected-color': '#fff',
            } as React.CSSProperties}
          >
            <DayPicker
              mode="range"
              selected={range}
              onSelect={(newRange) => {
                setRange(newRange)
                setDateError(undefined)
              }}
              disabled={disabledDays}
              locale={fr}
              fromDate={today}
              showOutsideDays={false}
              fixedWeeks={false}
            />
          </div>

          {/* Résumé des dates sélectionnées */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className={cn(
              'rounded-xl border px-3 py-2 text-sm',
              startDate ? 'border-ocean-300 bg-ocean-50 text-ocean-800' : 'border-gray-200 text-gray-400'
            )}>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5">Départ</p>
              <p className="font-medium">
                {range?.from
                  ? format(range.from, 'd MMM yyyy', { locale: fr })
                  : '—'}
              </p>
            </div>
            <div className={cn(
              'rounded-xl border px-3 py-2 text-sm',
              endDate ? 'border-ocean-300 bg-ocean-50 text-ocean-800' : 'border-gray-200 text-gray-400'
            )}>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5">Retour</p>
              <p className="font-medium">
                {range?.to
                  ? format(range.to, 'd MMM yyyy', { locale: fr })
                  : '—'}
              </p>
            </div>
          </div>

          {dateError && (
            <p className="text-xs text-red-600 mt-1.5">{dateError}</p>
          )}

          {/* Légende */}
          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-orange-100 border border-orange-200 inline-block" />
              Réservé
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-gray-100 border border-gray-200 inline-block" />
              Indisponible
            </span>
          </div>
        </div>

        {/* Skipper option */}
        {boat.withSkipper && (
          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-ocean-400 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={withSkipper}
              onChange={(e) => setWithSkipper(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-ocean-600 focus:ring-ocean-500 cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                <User size={14} className="text-ocean-600" />
                Avec skipper
              </p>
              {boat.skipperPrice && (
                <p className="text-xs text-gray-500 mt-0.5">
                  +{' '}
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(boat.skipperPrice)}{' '}
                  / jour
                </p>
              )}
            </div>
          </label>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <MessageSquare size={14} className="text-gray-400" />
              Message au propriétaire
              <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
            </span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Présentez-vous, précisez votre expérience en navigation…"
            rows={3}
            maxLength={500}
            className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{message.length}/500</p>
        </div>

        {/* Price breakdown */}
        {totalDays > 0 && (
          <PriceBreakdown
            dailyRate={boat.dailyRate}
            totalDays={totalDays}
            depositAmount={boat.depositAmount ?? 0}
            withSkipper={withSkipper && !!boat.skipperPrice}
            skipperPrice={boat.skipperPrice ?? 0}
            discountPercent={appliedDiscountPercent}
          />
        )}

        {/* Not logged in notice */}
        {!isAuthenticated && (
          <div className="flex items-start gap-2 bg-blue-50 text-blue-800 rounded-xl px-3 py-2.5 text-xs">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-blue-500" />
            Vous devez être connecté pour réserver. Cliquez sur "Réserver" pour vous connecter.
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          {totalDays > 0 ? `Réserver & Payer — ${totalDays}j` : 'Réserver & Payer'}
        </Button>

        <p className="text-xs text-center text-gray-400">
          Aucun débit avant la confirmation du propriétaire.
        </p>
      </form>
    </div>
  )
}

export default BookingForm
export type { BookingFormProps }
