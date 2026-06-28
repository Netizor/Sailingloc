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

export const getRoleStats = async (): Promise<Record<string, number>> => {
  const { data } = await api.get('/admin/role-stats')
  return data
}

export interface RoleDefinition {
  id: number
  name: string
  label: string
  description: string
  color: string
  is_system: boolean
  created_at: string
}

export const listRoles = async (): Promise<RoleDefinition[]> => {
  const { data } = await api.get<{ data: RoleDefinition[] }>('/admin/roles')
  return data.data
}

export const createRole = async (payload: { name: string; label: string; description?: string; color?: string }): Promise<RoleDefinition> => {
  const { data } = await api.post<RoleDefinition>('/admin/roles', payload)
  return data
}

export const updateRole = async (id: number, payload: { label?: string; description?: string; color?: string }): Promise<RoleDefinition> => {
  const { data } = await api.patch<RoleDefinition>(`/admin/roles/${id}`, payload)
  return data
}

export const deleteRole = async (id: number): Promise<void> => {
  await api.delete(`/admin/roles/${id}`)
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

export const createAdminUser = async (payload: {
  firstName: string
  lastName: string
  email: string
  password?: string
  role?: string
  phone?: string
}): Promise<User> => {
  const { data } = await api.post<User>('/admin/users', payload)
  return data
}

export const updateAdminUser = async (
  userId: number,
  payload: { firstName?: string; lastName?: string; email?: string; phone?: string; role?: string; isActive?: boolean },
): Promise<User> => {
  const { data } = await api.patch<User>(`/admin/users/${userId}`, payload)
  return data
}

export const deleteAdminUser = async (userId: number): Promise<void> => {
  await api.delete(`/admin/users/${userId}`)
}

export const verifyAdminUserEmail = async (userId: number): Promise<void> => {
  await api.patch(`/admin/users/${userId}/verify-email`)
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

interface ReviewAdminStats {
  total: number
  hiddenCount: number
  avgRating: number | null
}

export const getReviewStats = async (): Promise<ReviewAdminStats> => {
  const { data } = await api.get<ReviewAdminStats>('/reviews/admin/stats')
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
  getRoleStats,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
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
  createUser: createAdminUser,
  updateUser: updateAdminUser,
  deleteUser: deleteAdminUser,
  verifyUserEmail: verifyAdminUserEmail,
  setUserActive: (userId: number, isActive: boolean) =>
    updateUserStatus(userId, { isActive }),
  setUserRole: (userId: number, role: string) =>
    updateUserStatus(userId, { role }),
  getBoats: async (params: AdminBoatListParams = {}) => {
    const result = await listBoats(params)
    return { ...result, boats: result.data }
  },
  setBoatStatus,
  deleteBoat,
  getReviewStats,
  listReviews,
  deleteReview,
  moderateReview,
}
