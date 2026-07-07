import React, { useEffect, useRef, useState } from 'react'
import { MapPin, MessageSquareQuote, Star } from 'lucide-react'
import type { Review } from '../../types'
import Stars from '../ui/Stars'
import { formatDate } from '../../lib/utils'

interface OwnerReviewsSectionProps {
  reviews: Partial<Review>[]
  rating: number
  reviewCount: number
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

function AnimatedRating({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!active) return
    const duration = 900
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(value * eased * 10) / 10)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, active])

  return <>{display.toFixed(1)}</>
}

function ReviewCard({
  review,
  index,
  active,
}: {
  review: Partial<Review>
  index: number
  active: boolean
}) {
  const initials = `${review.reviewer?.firstName?.[0] ?? ''}${review.reviewer?.lastName?.[0] ?? ''}`

  return (
    <article
      className={[
        'owner-review-card flex-shrink-0 w-[min(100%,320px)] sm:w-[340px]',
        active ? 'owner-review-card--visible' : '',
      ].join(' ')}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-ocean-100 dark:bg-ocean-800/40 text-ocean-700 dark:text-ocean-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {review.reviewer?.avatar ? (
              <img
                src={review.reviewer.avatar}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                {review.reviewer?.firstName} {review.reviewer?.lastName}
              </p>
              {review.rating != null && (
                <Stars rating={review.rating} size="sm" />
              )}
            </div>
            {review.boat && (
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                <MapPin size={11} className="flex-shrink-0" />
                {review.boat.title}
              </p>
            )}
          </div>
        </div>

        {review.comment ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic flex-1">
            &ldquo;{review.comment}&rdquo;
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic flex-1">
            Avis sans commentaire
          </p>
        )}

        {review.createdAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(review.createdAt)}
          </p>
        )}
      </div>
    </article>
  )
}

const OwnerReviewsSection: React.FC<OwnerReviewsSectionProps> = ({
  reviews,
  rating,
  reviewCount,
}) => {
  const { ref, inView } = useInView()
  const hasReviews = reviews.length > 0
  const marqueeReviews = hasReviews && reviews.length >= 2
    ? [...reviews, ...reviews]
    : reviews

  return (
    <section ref={ref} className="owner-reviews-section">
      <div
        className={[
          'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8 overflow-hidden',
          inView ? 'owner-reviews-section--visible' : '',
        ].join(' ')}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Star size={18} className="text-amber-400 fill-amber-400 owner-reviews-star" />
              Avis des locataires
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Retours laissés après des locations sur ses bateaux
            </p>
          </div>

          <div
            className={[
              'owner-reviews-score inline-flex items-center gap-3 rounded-2xl px-4 py-3',
              'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10',
              'border border-amber-100 dark:border-amber-800/40',
              inView ? 'owner-reviews-score--visible' : '',
            ].join(' ')}
          >
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {hasReviews ? (
                <AnimatedRating value={rating} active={inView} />
              ) : (
                '—'
              )}
            </div>
            <div>
              <Stars rating={hasReviews ? rating : 0} size="sm" />
              <p className="text-xs text-amber-800/70 dark:text-amber-300/70 mt-0.5 font-medium">
                {reviewCount} avis{reviewCount > 1 ? '' : ''}
              </p>
            </div>
          </div>
        </div>

        {hasReviews ? (
          <div className="relative -mx-2 sm:-mx-4">
            {marqueeReviews.length >= 4 && (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10" />
            )}
            {marqueeReviews.length >= 4 && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10" />
            )}

            <div
              className={[
                'flex gap-4 px-2 sm:px-4 pb-1',
                marqueeReviews.length >= 4 ? 'owner-reviews-track' : 'flex-wrap',
              ].join(' ')}
            >
              {marqueeReviews.map((review, index) => (
                <ReviewCard
                  key={`${review.id}-${index}`}
                  review={review}
                  index={marqueeReviews.length >= 4 ? index % reviews.length : index}
                  active={inView}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className={[
              'owner-reviews-empty text-center py-10 px-4 rounded-xl',
              'bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-200 dark:border-gray-700',
              inView ? 'owner-reviews-empty--visible' : '',
            ].join(' ')}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 mb-4 owner-reviews-empty-icon">
              <MessageSquareQuote size={24} className="text-amber-500" />
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Aucun avis pour le moment
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Les locataires pourront laisser un avis après une location terminée sur l&apos;un de ses bateaux.
            </p>
            <div className="flex justify-center gap-1 mt-4 owner-reviews-empty-stars">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={18}
                  className="text-gray-200 dark:text-gray-600"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default OwnerReviewsSection








