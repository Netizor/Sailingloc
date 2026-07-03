import api from '../lib/axios'
import type {
  AdminDashboardStats,
  Boat,
  Booking,
  PaginatedResponse,
  Review,
  User,
} from '../types'

interface PaginationParams {
  page?: number
  limit?: number
  status?: string
}

interface AdminUserListParams extends PaginationParams {
  search?: string
  role?: string
}

interface AdminBoatListParams extends PaginationParams {
  search?: string
  status?: string
}

interface AdminBookingListParams extends PaginationParams {
  status?: string
}

export const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const { data } = await api.get<AdminDashboardStats>('/admin/dashboard')
  return data
}

export const listUsers = async (
  params: AdminUserListParams = {},
): Promise<PaginatedResponse<User>> => {
  const { data } = await api.get<PaginatedResponse<User>>('/admin/users', { params })
  return data
}

export const getUser = async (userId: number): Promise<User> => {
  const { data } = await api.get<User>(`/admin/users/${userId}`)
  return data
}

export const updateUserStatus = async (
  userId: number,
  payload: { isActive?: boolean; role?: string },
): Promise<void> => {
  if (payload.isActive !== undefined) {
    await api.patch(`/admin/users/${userId}/block`, { blocked: !payload.isActive, isActive: payload.isActive })
  }
  if (payload.role) {
    await api.patch(`/admin/users/${userId}/role`, { role: payload.role })
  }
}

export const reviewSailorCv = async (
  userId: number,
  payload: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
): Promise<void> => {
  await api.patch(`/admin/users/${userId}/sailor-cv`, payload)
}

export const listBoats = async (
  params: AdminBoatListParams = {},
): Promise<PaginatedResponse<Boat>> => {
  const { data } = await api.get<PaginatedResponse<Boat>>('/admin/boats', { params })
  return data
}

export const setBoatStatus = async (boatId: number, status: string): Promise<void> => {
  await api.patch(`/admin/boats/${boatId}/status`, { status })
}

export const deleteBoat = async (boatId: number): Promise<void> => {
  await api.delete(`/admin/boats/${boatId}`)
}

export const listBookings = async (
  params: AdminBookingListParams = {},
): Promise<PaginatedResponse<Booking>> => {
  const { data } = await api.get<PaginatedResponse<Booking>>('/admin/bookings', { params })
  return data
}

export const getBooking = async (bookingId: number): Promise<Booking> => {
  const { data } = await api.get<Booking>(`/admin/bookings/${bookingId}`)
  return data
}

export const updateBookingStatus = async (
  bookingId: number,
  status: string,
): Promise<Booking> => {
  const { data } = await api.patch<Booking>(`/admin/bookings/${bookingId}/status`, { status })
  return data
}

export const listReviews = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<Review>> => {
  const { data } = await api.get<PaginatedResponse<Review>>('/reviews/admin', { params })
  return data
}

export const deleteReview = async (reviewId: number): Promise<void> => {
  await api.delete(`/reviews/admin/${reviewId}`)
}

export const moderateReview = async (
  reviewId: number,
  isPublished: boolean,
  adminNote?: string,
): Promise<Review> => {
  const { data } = await api.patch<Review>(`/reviews/admin/${reviewId}`, { isPublished, adminNote })
  return data
}

export const adminApi = {
  getStats: getDashboardStats,
  getBookings: listBookings,
  getBooking,
  updateBookingStatus,
  getRecentBookings: async (limit: number) => {
    const result = await listBookings({ limit, page: 1 })
    return result.data
  },
  getUsers: async (params: AdminUserListParams = {}) => {
    const result = await listUsers(params)
    return { ...result, users: result.data }
  },
  getUser,
  setUserActive: (userId: number, isActive: boolean) =>
    updateUserStatus(userId, { isActive }),
  setUserRole: (userId: number, role: string) =>
    updateUserStatus(userId, { role }),
  reviewSailorCv,
  getBoats: async (params: AdminBoatListParams = {}) => {
    const result = await listBoats(params)
    return { ...result, boats: result.data }
  },
  setBoatStatus,
  deleteBoat,
  listReviews,
  deleteReview,
  moderateReview,
}
