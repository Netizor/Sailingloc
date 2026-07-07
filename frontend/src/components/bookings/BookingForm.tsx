import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageSquare, User, AlertCircle } from 'lucide-react'
import { differenceInDays, parseISO, format, addDays, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
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
  /** Dates déjà réservées (affichées en bleu sur le calendrier) */
  bookedDates?: string[]
  /** Dates bloquées par le propriétaire (affichées en bleu marine) */
  unavailableDates?: string[]
  /** Style fiche bateau (sidebar maquette) */
  variant?: 'default' | 'detail'
}

const formatDailyPrice = (amount: number, locale: string) =>
  new Intl.NumberFormat(locale.startsWith('en') ? 'en-US' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)

const BookingForm: React.FC<BookingFormProps> = ({
  boat,
  onSubmit,
  loading = false,
  className,
  disabledDates = [],
  bookedDates = [],
  unavailableDates = [],
  variant = 'default',
}) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const dateLocale = i18n.language.startsWith('en') ? enUS : fr
  const priceLocale = i18n.language

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [range, setRange] = useState<DateRange | undefined>()
  const [withSkipper, setWithSkipper] = useState(false)
  const [message, setMessage] = useState('')
  const [dateError, setDateError] = useState<string | undefined>()
  const [passengers, setPassengers] = useState(Math.min(2, boat.capacity))

  const bookingDraftKey = `sailingloc_booking_${boat.id}`
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(bookingDraftKey)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved.withSkipper !== undefined) setWithSkipper(saved.withSkipper)
      if (saved.message) setMessage(saved.message)
      if (saved.passengers) setPassengers(Math.min(saved.passengers, boat.capacity))
      if (saved.range?.from) {
        const from = new Date(saved.range.from)
        const to = saved.range.to ? new Date(saved.range.to) : undefined
        if (from > new Date()) setRange({ from, to })
      }
      if (saved.savedAt) setSavedAt(new Date(saved.savedAt))
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave on changes (debounce 600 ms)
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        const now = new Date()
        localStorage.setItem(bookingDraftKey, JSON.stringify({
          range: range ? { from: range.from?.toISOString(), to: range.to?.toISOString() } : null,
          withSkipper,
          message,
          passengers,
          boatTitle: boat.title,
          savedAt: now.toISOString(),
        }))
        setSavedAt(now)
      } catch {}
    }, 600)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [range, withSkipper, message, passengers, bookingDraftKey])

  const disabledSet = useMemo(() => new Set(disabledDates), [disabledDates])

  const disabledDays = useMemo(() => {
    const blocked = disabledDates.map((d) => parseISO(d))
    return [{ before: today }, ...blocked]
  }, [disabledDates, today])

  const bookedDays = useMemo(() => bookedDates.map((d) => parseISO(d)), [bookedDates])
  const unavailableDays = useMemo(() => unavailableDates.map((d) => parseISO(d)), [unavailableDates])
  const calendarModifiers = useMemo(
    () => ({ booked: bookedDays, indispo: unavailableDays }),
    [bookedDays, unavailableDays],
  )
  const calendarModifiersStyles = useMemo(
    () => ({
      booked: { backgroundColor: '#2563FF', color: '#fff', borderRadius: '8px' },
      indispo: {
        backgroundColor: '#003366',
        color: '#fff',
        borderRadius: '8px',
        textDecoration: 'line-through' as const,
      },
    }),
    [],
  )

  const rangeHasBlockedDays = (from: Date, to: Date) => {
    let cur = from
    while (isBefore(cur, to)) {
      if (disabledSet.has(format(cur, 'yyyy-MM-dd'))) return true
      cur = addDays(cur, 1)
    }
    return false
  }

  const startDate = range?.from ? format(range.from, 'yyyy-MM-dd') : ''
  const endDate = range?.to ? format(range.to, 'yyyy-MM-dd') : ''

  const totalDays = useMemo(() => {
    if (!range?.from || !range?.to) return 0
    const diff = differenceInDays(range.to, range.from)
    return diff > 0 ? diff : 0
  }, [range])

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
      setDateError(t('booking.form.errorStartDate'))
      return false
    }
    if (!range?.to) {
      setDateError(t('booking.form.errorEndDate'))
      return false
    }
    if (range.to <= range.from) {
      setDateError(t('booking.form.errorEndAfterStart'))
      return false
    }
    if (rangeHasBlockedDays(range.from, range.to)) {
      setDateError(t('booking.form.errorDatesUnavailable'))
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
    try { localStorage.removeItem(bookingDraftKey) } catch {}
  }

  const isDetail = variant === 'detail'

  const subtotal = totalDays > 0 ? boat.dailyRate * totalDays : 0
  const serviceFee = totalDays > 0 ? Math.round(subtotal * 0.1) : 0
  const cleaningFee = totalDays > 0 ? 120 : 0
  const detailTotal = subtotal + serviceFee + cleaningFee

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,51,102,0.08)] p-6 flex flex-col gap-5',
        className
      )}
    >
      <div className="flex items-baseline gap-1">
        <span className={cn('text-2xl font-bold', isDetail ? 'text-[#003366]' : 'text-orange-500')}>
          {formatDailyPrice(boat.dailyRate, priceLocale)}
        </span>
        <span className="text-[#8A94A6] text-sm">{t('common.perDay')}</span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {isDetail ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#8A94A6]">{t('booking.form.selectAvailabilityDates')}</p>
            <div
              className="flex justify-center rounded-xl border border-gray-100 p-2"
              style={{
                '--rdp-accent-color': '#2563FF',
                '--rdp-background-color': '#eef3fb',
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
                modifiers={calendarModifiers}
                modifiersStyles={calendarModifiersStyles}
                locale={dateLocale}
                fromDate={today}
                numberOfMonths={1}
                showOutsideDays={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className={cn(
                'rounded-lg border px-3 py-2 text-sm',
                startDate ? 'border-[#2563FF]/40 bg-[#eef3fb] text-[#003366]' : 'border-gray-200 text-gray-400'
              )}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5">{t('booking.startDate')}</p>
                <p className="font-medium">
                  {range?.from ? format(range.from, 'd MMM yyyy', { locale: dateLocale }) : '—'}
                </p>
              </div>
              <div className={cn(
                'rounded-lg border px-3 py-2 text-sm',
                endDate ? 'border-[#2563FF]/40 bg-[#eef3fb] text-[#003366]' : 'border-gray-200 text-gray-400'
              )}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5">{t('booking.endDate')}</p>
                <p className="font-medium">
                  {range?.to ? format(range.to, 'd MMM yyyy', { locale: dateLocale }) : '—'}
                </p>
              </div>
            </div>
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1.5">{t('booking.form.passengers')}</span>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#003366] focus:outline-none focus:ring-2 focus:ring-[#2563FF]/30"
              >
                {Array.from({ length: boat.capacity }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {t('booking.form.person', { count: n })}
                  </option>
                ))}
              </select>
            </label>
            {dateError && <p className="text-xs text-red-600">{dateError}</p>}
            <div className="flex items-center gap-4 text-[10px] text-[#8A94A6]">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#2563FF] inline-block" />
                {t('booking.form.booked')}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#003366] inline-block" />
                {t('booking.form.unavailable')}
              </span>
            </div>
          </div>
        ) : (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">{t('booking.form.selectDates')}</p>
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
              modifiers={calendarModifiers}
              modifiersStyles={calendarModifiersStyles}
              locale={dateLocale}
              fromDate={today}
              showOutsideDays={false}
              fixedWeeks={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className={cn(
              'rounded-xl border px-3 py-2 text-sm',
              startDate ? 'border-ocean-300 bg-ocean-50 text-ocean-800' : 'border-gray-200 text-gray-400'
            )}>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5">{t('booking.startDate')}</p>
              <p className="font-medium">
                {range?.from ? format(range.from, 'd MMM yyyy', { locale: dateLocale }) : ''}
              </p>
            </div>
            <div className={cn(
              'rounded-xl border px-3 py-2 text-sm',
              endDate ? 'border-ocean-300 bg-ocean-50 text-ocean-800' : 'border-gray-200 text-gray-400'
            )}>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5">{t('booking.endDate')}</p>
              <p className="font-medium">
                {range?.to ? format(range.to, 'd MMM yyyy', { locale: dateLocale }) : ''}
              </p>
            </div>
          </div>
          {dateError && <p className="text-xs text-red-600 mt-1.5">{dateError}</p>}
          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-orange-100 border border-orange-200 inline-block" />
              {t('booking.form.booked')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-gray-100 border border-gray-200 inline-block" />
              {t('booking.form.unavailable')}
            </span>
          </div>
        </div>
        )}

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
                {t('booking.form.withSkipper')}
              </p>
              {boat.skipperPrice && (
                <p className="text-xs text-gray-500 mt-0.5">
                  +{' '}
                  {formatDailyPrice(boat.skipperPrice, priceLocale)}{' '}
                  {t('common.perDay')}
                </p>
              )}
            </div>
          </label>
        )}

        {!isDetail && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-gray-400" />
                {t('booking.form.messageToOwner')}
                <span className="text-xs text-gray-400 font-normal">({t('common.optional')})</span>
              </span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('booking.form.messagePlaceholder')}
              rows={3}
              maxLength={500}
              className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
            />
          </div>
        )}

        {isDetail && totalDays > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm text-[#334155]">
              <span>{t('booking.form.nights', { price: formatDailyPrice(boat.dailyRate, priceLocale), count: totalDays })}</span>
              <span>{formatDailyPrice(subtotal, priceLocale)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#334155]">
              <span>{t('booking.form.serviceFee')}</span>
              <span>{formatDailyPrice(serviceFee, priceLocale)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#334155]">
              <span>{t('booking.form.cleaningFee')}</span>
              <span>{formatDailyPrice(cleaningFee, priceLocale)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#003366] pt-2 border-t border-gray-100">
              <span>{t('booking.total')}</span>
              <span>{formatDailyPrice(detailTotal, priceLocale)}</span>
            </div>
          </div>
        )}

        {!isDetail && totalDays > 0 && (
          <PriceBreakdown
            dailyRate={boat.dailyRate}
            totalDays={totalDays}
            depositAmount={boat.depositAmount ?? 0}
            withSkipper={withSkipper && !!boat.skipperPrice}
            skipperPrice={boat.skipperPrice ?? 0}
            discountPercent={appliedDiscountPercent}
          />
        )}

        {!isAuthenticated && (
          <div className="flex items-start gap-2 bg-blue-50 text-blue-800 rounded-xl px-3 py-2.5 text-xs">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-blue-500" />
            {t('booking.form.loginRequired')}
          </div>
        )}

        {isDetail ? (
          <button
            type="submit"
            disabled={loading}
            className="sl-btn-navy w-full py-3.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? t('booking.form.loading') : t('booking.form.bookNow')}
          </button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {totalDays > 0
              ? t('booking.form.bookAndPayDays', { count: totalDays })
              : t('booking.form.bookAndPay')}
          </Button>
        )}

        {savedAt && (
          <p className="text-xs text-center text-gray-400">
            Sélection sauvegardée à {savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

        <p className="text-xs text-center text-[#8A94A6]">
          {isDetail ? t('booking.form.notChargedYet') : t('booking.form.noChargeBeforeConfirm')}
        </p>
      </form>
    </div>
  )
}

export default BookingForm
export type { BookingFormProps }
