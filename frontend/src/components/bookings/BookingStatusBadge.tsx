import React from 'react'
import Badge from '../ui/Badge'
import { getBookingStatusLabel, getBookingStatusColor } from '../../lib/utils'
import type { BadgeVariant } from '../ui/Badge'
import type { BookingStatus } from '../../types'

interface BookingStatusBadgeProps {
  status: BookingStatus
  size?: 'sm' | 'md'
  dot?: boolean
}

const colorToVariant: Record<string, BadgeVariant> = {
  gray: 'default',
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  blue: 'info',
  ocean: 'primary',
}

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = 'sm',
  dot = true,
}) => {
  const label = getBookingStatusLabel(status)
  const color = getBookingStatusColor(status)
  const variant: BadgeVariant = colorToVariant[color] ?? 'default'

  return (
    <Badge variant={variant} size={size} dot={dot}>
      {label}
    </Badge>
  )
}

export default BookingStatusBadge
export type { BookingStatusBadgeProps }
