import React from 'react'
import { MapPin, Ship, Star } from 'lucide-react'
import type { Testimonial } from '../../data/testimonials'
import { cn } from '../../lib/utils'

interface TestimonialCardProps {
  item: Testimonial
  className?: string
  style?: React.CSSProperties
  animated?: boolean
  inView?: boolean
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  item,
  className,
  style,
  animated = false,
  inView = true,
}) => (
  <article
    className={cn(
      'bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4 h-full',
      animated && 'transition-[transform,opacity] duration-700 ease-out will-change-transform',
      animated && (inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'),
      className,
    )}
    style={style}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: item.rating }).map((_, j) => (
          <Star key={j} size={14} fill="currentColor" strokeWidth={0} className="text-amber-400" />
        ))}
      </div>
      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{item.date}</span>
    </div>

    <p className="text-brand-slate dark:text-gray-300 text-sm leading-relaxed flex-1">
      &ldquo;{item.text}&rdquo;
    </p>

    <div className="space-y-2 pt-1 border-t border-gray-50 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
          {item.avatar}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-brand-navy dark:text-gray-100 text-sm truncate">{item.name}</p>
          <p className="text-xs text-brand-slate dark:text-gray-400">{item.role}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} />
          {item.location}
        </span>
        {item.boat && (
          <span className="inline-flex items-center gap-1">
            <Ship size={11} />
            {item.boat}
          </span>
        )}
      </div>
    </div>
  </article>
)

export default TestimonialCard
