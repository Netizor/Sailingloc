import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Anchor, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { bookingsApi } from '../../api/bookings.api'
import type { Booking } from '../../types'
import { BookingStatus } from '../../types'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDate, formatPrice } from '../../lib/utils'

type FilterTab = 'ALL' | BookingStatus

const TAB_KEYS: { key: FilterTab; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'booking.ownerBookings.filterAll' },
  { key: BookingStatus.PENDING, labelKey: 'booking.status.PENDING' },
  { key: BookingStatus.CONFIRMED, labelKey: 'booking.ownerBookings.filterConfirmed' },
  { key: BookingStatus.COMPLETED, labelKey: 'booking.ownerBookings.filterCompleted' },
  { key: BookingStatus.CANCELLED, labelKey: 'booking.ownerBookings.filterCancelled' },
]

const LIMIT = 10

const OwnerBookings: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [page, setPage] = useState(1)

  const status = activeTab === 'ALL' ? undefined : activeTab

  const { data, isLoading, isError } = useQuery({
    queryKey: ['owner', 'bookings', activeTab, page],
    queryFn: () => bookingsApi.getMyBookingsAsOwner({ page, limit: LIMIT, status }),
    staleTime: 60 * 1000,
  })

  const bookings = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab)
    setPage(1)
  }

  const activeTabLabel = TAB_KEYS.find((tab) => tab.key === activeTab)?.labelKey

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('booking.ownerBookings.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t('booking.ownerBookings.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
          {TAB_KEYS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-ocean-700 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            {t('booking.ownerBookings.loadError')}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center mx-auto mb-5">
              <Anchor size={36} className="text-ocean-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('booking.ownerBookings.noBookings')}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto">
              {activeTab === 'ALL'
                ? t('booking.ownerBookings.noBookingsAll')
                : t('booking.ownerBookings.noBookingsStatus', {
                    status: activeTabLabel ? t(activeTabLabel) : '',
                  })}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft size={16} />}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('common.previous')}
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('booking.ownerBookings.pageOf', { page, total: totalPages })}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight size={16} />}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const boat = booking.boat
  const renter = booking.renter
  const mainImage = boat?.images?.[0]
  const isPending   = booking.status === BookingStatus.PENDING
  const isCompleted = booking.status === BookingStatus.COMPLETED
  const daysLabel = t('booking.days', { count: booking.totalDays })

  const { mutate: decline, isPending: isDeclining } = useMutation({
    mutationFn: () => bookingsApi.decline(booking.id),
    onSuccess: () => {
      toast.success(t('booking.ownerBookings.declined'))
      queryClient.invalidateQueries({ queryKey: ['owner', 'bookings'] })
    },
    onError: () => toast.error(t('booking.ownerBookings.declineError')),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow">
      <div className="sm:w-44 h-44 sm:h-auto bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        {mainImage ? (
          <img src={mainImage} alt={boat?.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-ocean-50 dark:bg-ocean-900/30 gap-2">
            <Anchor size={28} className="text-ocean-300" />
            <span className="text-xs text-ocean-400">{t('booking.ownerBookings.noPhoto')}</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BookingStatusBadge status={booking.status} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
              {boat?.title ?? ''}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
              <span className="ml-2 text-gray-400 dark:text-gray-500">({daysLabel})</span>
            </p>
            {renter && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {t('booking.ownerBookings.renterLabel', { name: `${renter.firstName} ${renter.lastName}` })}
              </p>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-orange-500">
              {formatPrice(booking.totalAmount)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{daysLabel}</p>
          </div>
        </div>

        {isPending && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('booking.ownerBookings.pendingPayment')}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="danger"
                size="sm"
                onClick={() => decline()}
                disabled={isDeclining}
                loading={isDeclining}
              >
                {t('booking.ownerBookings.decline')}
              </Button>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/proprietaire/reservations/${booking.id}/avis?target=renter`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean-700 dark:text-ocean-400 hover:underline"
            >
              <Star size={14} />
              {t('booking.ownerBookings.rateRenter')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerBookings
