import React, { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize
  label?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label,
  className,
  ...props
}) => {
  const { t } = useTranslation()
  const ariaLabel = label ?? t('common.loading')

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <span
        className={cn(
          'block rounded-full border-ocean-200 border-t-ocean-700 animate-spin',
          sizeClasses[size]
        )}
        style={{ borderTopColor: '#2563FF', borderColor: '#bae6fd' }}
        aria-hidden="true"
      />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
}

export const FullPageSpinner: React.FC<{ label?: string }> = ({ label }) => {
  const { t } = useTranslation()
  const displayLabel = label ?? t('common.loading')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" label={displayLabel} />
        <p className="text-gray-500 dark:text-gray-400 text-sm">{displayLabel}</p>
      </div>
    </div>
  )
}

export default Spinner
export type { SpinnerProps, SpinnerSize }
