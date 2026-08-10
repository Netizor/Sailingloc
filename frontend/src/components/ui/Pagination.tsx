import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showFirstLast?: boolean
}

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const rangeStart = Math.max(2, current - 1)
  const rangeEnd = Math.min(total - 1, current + 1)

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i)
  }

  if (current < total - 2) pages.push('...')

  pages.push(total)

  return pages
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = false,
}) => {
  if (totalPages <= 1) return null

  const pages = buildPageRange(currentPage, totalPages)

  const baseBtn =
    'inline-flex items-center justify-center h-9 min-w-[36px] rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'

  const pageBtn = (active: boolean) =>
    cn(
      baseBtn,
      active
        ? 'bg-brand-blue text-white shadow-sm'
        : 'text-gray-700 hover:bg-gray-100 bg-white border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
    )

  const navBtn = cn(baseBtn, 'px-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700')

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1 flex-wrap', className)}
    >
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Première page"
          className={navBtn}
        >
          <ChevronLeft size={14} />
          <ChevronLeft size={14} className="-ml-2" />
        </button>
      )}

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Page précédente"
        className={navBtn}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, idx) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex items-center justify-center h-9 min-w-[36px] text-gray-400 dark:text-gray-500 text-sm select-none"
              aria-hidden="true"
            >
              &hellip;
            </span>
          )
        }

        const isActive = page === currentPage
        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            aria-label={`Page ${page}`}
            aria-current={isActive ? 'page' : undefined}
            className={pageBtn(isActive)}
          >
            {page}
          </button>
        )
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Page suivante"
        className={navBtn}
      >
        <ChevronRight size={16} />
      </button>

      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Dernière page"
          className={navBtn}
        >
          <ChevronRight size={14} />
          <ChevronRight size={14} className="-ml-2" />
        </button>
      )}
    </nav>
  )
}

export default Pagination
export type { PaginationProps }
