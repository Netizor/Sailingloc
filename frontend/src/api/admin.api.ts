import api from '../lib/axios'
import type {
  AdminDashboardStats,
  Boat,
  Booking,
  PaginatedResponse,
  Review,
  Transaction,
  User,
} from '../types'

// ─── Shared param types ───────────────────────────────────────────────────────

interface PaginationParams {
  page?: number
  limit?: number
}

interface AdminUserListParams extends PaginationParams {
  search?: string
  role?: string
  kycVerified?: boolean
  isActive?: boolean
}

interface AdminBoatListParams extends PaginationParams {
  search?: string
  status?: string
  type?: string
  ownerId?: number
}

interface AdminBookingListParams extends PaginationParams {
  status?: string
  renterId?: number
  ownerId?: number
  boatId?: number
  startDate?: string
  endDate?: string
}

interface AdminReviewListParams extends PaginationParams {
  boatId?: number
  reviewerId?: number
  isPublished?: boolean
  minRating?: number
  maxRating?: number
}

interface AdminTransactionListParams extends PaginationParams {
  type?: string
  status?: string
  startDate?: string
  endDate?: string
}

interface ModerateBoatPayload {
  status: string
  rejectionReason?: string
}

interface ModerateReviewPayload {
  isPublished: boolean
  moderationNote?: string
}

interface UpdateUserStatusPayload {
  isActive?: boolean
  kycVerified?: boolean
  role?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * Fetch high-level platform statistics for the admin dashboard.
 * Includes user counts, booking totals, revenue figures, and recent activity.
 */
export const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const { data } = await api.get<AdminDashboardStats>('/admin/dashboard')
  return data
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of all registered users.
 * Supports filtering by role, KYC status, and a free-text search on name/email.
 */
export const listUsers = async (
  params: AdminUserListParams = {},
): Promise<PaginatedResponse<User>> => {
  const { data } = await api.get<PaginatedResponse<User>>('/admin/users', { params })
  return data
}

/**
 * Update a user's account status, KYC verification, or role.
 * Returns the updated user record.
 */
export const updateUserStatus = async (
  userId: number,
  payload: UpdateUserStatusPayload,
): Promise<User> => {
  const { data } = await api.patch<User>(`/admin/users/${userId}`, payload)
  return data
}

// ─── Boats ────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of all boat listings across the platform.
 * Supports filtering by status, type, and owner.
 */
export const listBoats = async (
  params: AdminBoatListParams = {},
): Promise<PaginatedResponse<Boat>> => {
  const { data } = await api.get<PaginatedResponse<Boat>>('/admin/boats', { params })
  return data
}

/**
 * Approve or reject a boat listing, or change its status (e.g. suspend).
 * An optional rejection reason is stored and surfaced to the owner.
 */
export const moderateBoat = async (
  boatId: number,
  payload: ModerateBoatPayload,
): Promise<Boat> => {
  const { data } = await api.patch<Boat>(`/admin/boats/${boatId}/moderate`, payload)
  return data
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of all bookings on the platform.
 * Supports filtering by status, participant IDs, boat, and date range.
 */
export const listBookings = async (
  params: AdminBookingListParams = {},
): Promise<PaginatedResponse<Booking>> => {
  const { data } = await api.get<PaginatedResponse<Booking>>('/admin/bookings', { params })
  return data
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of all reviews.
 * Supports filtering by boat, reviewer, publication status, and rating range.
 */
export const listReviews = async (
  params: AdminReviewListParams = {},
): Promise<PaginatedResponse<Review>> => {
  const { data } = await api.get<PaginatedResponse<Review>>('/admin/reviews', { params })
  return data
}

/**
 * Publish or unpublish a review, with an optional moderation note stored server-side.
 */
export const moderateReview = async (
  reviewId: number,
  payload: ModerateReviewPayload,
): Promise<Review> => {
  const { data } = await api.patch<Review>(`/admin/reviews/${reviewId}/moderate`, payload)
  return data
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of all Stripe transactions (payments, refunds, payouts).
 * Supports filtering by transaction type, status, and date range.
 */
export const getTransactions = async (
  params: AdminTransactionListParams = {},
): Promise<PaginatedResponse<Transaction>> => {
  const { data } = await api.get<PaginatedResponse<Transaction>>('/admin/transactions', {
    params,
  })
  return data
}

/** Payload de résolution de litige (F2). */
export interface ResolveDisputePayload {
  resolution: 'complete' | 'cancel'
  refund?: boolean
  adminNote?: string
}

/**
 * Admin — résout un litige : passe la réservation en COMPLETED ou CANCELLED
 * avec remboursement Stripe optionnel (F2).
 */
export const resolveDispute = async (
  bookingId: number,
  payload: ResolveDisputePayload,
): Promise<Booking> => {
  const { data } = await api.post<Booking>(`/admin/bookings/${bookingId}/resolve`, payload)
  return data
}

export const adminApi = {
  getStats: getDashboardStats,

  /** Returns a paginated list of all bookings */
  getBookings: listBookings,

  /** Returns recent bookings as a flat array */
  getRecentBookings: async (limit: number) => {
    const result = await listBookings({ limit, page: 1 })
    return result.data
  },

  /** Returns paginated users with `users` key for page compatibility */
  getUsers: async (params: AdminUserListParams = {}) => {
    const result = await listUsers(params)
    return { ...result, users: result.data }
  },

  setUserActive: (userId: number, isActive: boolean) =>
    updateUserStatus(userId, { isActive }),

  setUserRole: (userId: number, role: string) =>
    updateUserStatus(userId, { role }),

  /** Returns paginated boats with `boats` key for page compatibility */
  getBoats: async (params: AdminBoatListParams = {}) => {
    const result = await listBoats(params)
    return { ...result, boats: result.data }
  },

  setBoatStatus: (boatId: number, status: string) =>
    moderateBoat(boatId, { status }),

  listReviews,
  moderateReview,
  getTransactions,
  resolveDispute,
}
