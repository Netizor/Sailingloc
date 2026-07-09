import React, { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
type BadgeSize = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  success: 'badge-variant-success',
  warning: 'badge-variant-warning',
  danger: 'badge-variant-danger',
  info: 'badge-variant-info',
  primary: 'badge-variant-primary',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  success: 'badge-dot-success',
  warning: 'badge-dot-warning',
  danger: 'badge-dot-danger',
  info: 'badge-dot-info',
  primary: 'badge-dot-primary',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        'whitespace-nowrap select-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

export default Badge
export type { BadgeProps, BadgeVariant }
