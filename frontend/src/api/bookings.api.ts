import api from '../lib/axios'
import type { Booking, BookingCreateData, PaginatedResponse } from '../types'

interface ConfirmPaymentData {
  bookingId: number
  paymentIntentId: string
}

interface PaymentIntentResponse {
  clientSecret: string
  bookingId: number
  amount: number
}

interface UpdateBookingStatusData {
  status: string
  cancellationReason?: string
}

interface CancelBookingData {
  cancellationReason: string
}

/**
 * Create a new booking request for a boat.
 * The booking is created in PENDING status (no payment at this stage).
 * Payment is handled separately via POST /api/payments/intent once confirmed.
 */
export const createBooking = async (bookingData: BookingCreateData): Promise<Booking> => {
  const { data } = await api.post<Booking>('/bookings', bookingData)
  return data
}

/**
 * Crée un Stripe PaymentIntent pour une réservation PENDING et retourne le clientSecret.
 * À appeler juste avant d'afficher le formulaire Stripe Elements.
 */
export const createPaymentIntent = async (
  bookingId: number,
): Promise<PaymentIntentResponse> => {
  const { data } = await api.post<PaymentIntentResponse>(
    `/bookings/${bookingId}/payment-intent`,
  )
  return data
}

/**
 * Confirm that the Stripe payment has been captured and finalise the booking.
 * Called after stripe.confirmPayment resolves successfully on the frontend.
 */
export const confirmPayment = async (
  payload: ConfirmPaymentData,
): Promise<Booking> => {
  const { data } = await api.post<Booking>('/bookings/confirm-payment', payload)
  return data
}

/**
 * Fetch all bookings where the authenticated user is the renter.
 * Supports optional page/limit query params via params object.
 */
export const getMyBookingsAsRenter = async (
  params: { page?: number; limit?: number; status?: string } = {},
): Promise<PaginatedResponse<Booking>> => {
  const { data } = await api.get<PaginatedResponse<Booking>>('/bookings/renter', { params })
  return data
}

/**
 * Fetch all bookings for boats owned by the authenticated user.
 * Supports optional page/limit/status filters.
 */
export const getMyBookingsAsOwner = async (
  params: { page?: number; limit?: number; status?: string } = {},
): Promise<PaginatedResponse<Booking>> => {
  const { data } = await api.get<PaginatedResponse<Booking>>('/bookings/owner', { params })
  return data
}

/**
 * Fetch a single booking by its ID.
 * Both renter and owner have access to their shared booking.
 */
export const getBooking = async (id: number): Promise<Booking> => {
  const { data } = await api.get<Booking>(`/bookings/${id}`)
  return data
}

/**
 * Update the status of a booking (e.g. owner confirms or rejects a pending request).
 * Allowed transitions depend on the server-side state machine.
 */
export const updateBookingStatus = async (
  id: number,
  payload: UpdateBookingStatusData,
): Promise<Booking> => {
  const { data } = await api.patch<Booking>(`/bookings/${id}/status`, payload)
  return data
}

/**
 * Cancel an existing booking.
 * Either party can cancel; a cancellation reason is required.
 * Refund logic is handled server-side according to the cancellation policy.
 */
export const cancelBooking = async (
  id: number,
  payload: CancelBookingData,
): Promise<Booking> => {
  const { data } = await api.post<Booking>(`/bookings/${id}/cancel`, payload)
  return data
}

export const getMyAllBookings = async (): Promise<Booking[]> => {
  const { data } = await api.get<PaginatedResponse<Booking>>('/bookings/renter', {
    params: { page: 1, limit: 200 },
  })
  return data?.data ?? []
}

export const bookingsApi = {
  create: createBooking,
  createPaymentIntent,
  confirmPayment,
  getMyBookings: getMyBookingsAsRenter,
  getMyBookingsAsOwner,
  getBooking,
  updateStatus: updateBookingStatus,
  cancel: cancelBooking,

  /** Fetch PENDING bookings for the authenticated owner */
  getOwnerPendingBookings: async () => {
    const result = await getMyBookingsAsOwner({ status: 'PENDING', limit: 50 })
    return { bookings: result.data }
  },

  /** Compute earnings totals from CONFIRMED/COMPLETED owner bookings */
  getOwnerEarnings: async () => {
    const [confirmed, completed] = await Promise.all([
      getMyBookingsAsOwner({ status: 'CONFIRMED', limit: 100 }),
      getMyBookingsAsOwner({ status: 'COMPLETED', limit: 100 }),
    ])
    const all = [...(confirmed.data ?? []), ...(completed.data ?? [])]
    const total = all.reduce((sum, b: any) => sum + (b.totalAmount ?? 0), 0)
    const now = new Date()
    const thisMonth = all
      .filter((b: any) => {
        const d = new Date(b.createdAt ?? '')
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
      .reduce((sum, b: any) => sum + (b.totalAmount ?? 0), 0)
    const pending = (confirmed.data ?? []).reduce((sum, b: any) => sum + (b.totalAmount ?? 0), 0)
    return { total, thisMonth, pending }
  },

  accept: (id: number) => api.patch(`/bookings/${id}/status`, { action: 'accept' }).then((r) => r.data as Booking),
  decline: (id: number) => api.patch(`/bookings/${id}/status`, { action: 'reject' }).then((r) => r.data as Booking),
}
