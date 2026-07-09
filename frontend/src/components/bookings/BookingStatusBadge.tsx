import React from 'react'
import Badge from '../ui/Badge'
import { getBookingStatusLabel } from '../../lib/utils'
import type { BadgeVariant } from '../ui/Badge'
import type { BookingStatus } from '../../types'

interface BookingStatusBadgeProps {
  status: BookingStatus
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const statusToVariant: Record<string, BadgeVariant> = {
  PENDING:   'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'primary',
  DISPUTED:  'info',
}

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = 'sm',
  dot = true,
  className,
}) => {
  const label = getBookingStatusLabel(status)
  const variant: BadgeVariant = statusToVariant[status] ?? 'default'

  return (
    <Badge variant={variant} size={size} dot={dot} className={className}>
      {label}
    </Badge>
  )
}

export default BookingStatusBadge
export type { BookingStatusBadgeProps }
