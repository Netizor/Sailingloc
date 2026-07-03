// ─── Enums ───────────────────────────────────────────────────────────────────

export enum BoatType {
  SAILBOAT = 'SAILBOAT',
  MOTORBOAT = 'MOTORBOAT',
  CATAMARAN = 'CATAMARAN',
  INFLATABLE = 'INFLATABLE',
  YACHT = 'YACHT',
  PONTOON = 'PONTOON',
  DINGHY = 'DINGHY',
}

export enum MotorizationType {
  NONE = 'NONE',
  INBOARD = 'INBOARD',
  OUTBOARD = 'OUTBOARD',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum BoatStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

export enum ReviewType {
  BOAT = 'BOAT',
  OWNER = 'OWNER',
  RENTER = 'RENTER',
}

export enum UserRole {
  VISITOR = 'VISITOR',
  RENTER = 'RENTER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum NotificationType {
  BOOKING_REQUEST = 'BOOKING_REQUEST',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  NEW_REVIEW = 'NEW_REVIEW',
  NEW_MESSAGE = 'NEW_MESSAGE',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  BOAT_APPROVED = 'BOAT_APPROVED',
  BOAT_REJECTED = 'BOAT_REJECTED',
  PASSWORD_COMPROMISED = 'PASSWORD_COMPROMISED',
}

// ─── Core Models ─────────────────────────────────────────────────────────────

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  bio?: string
  role: UserRole
  kycVerified: boolean
  isActive: boolean
  sailingExperienceYears?: number | null
  sailingQualifications?: string | null
  sailingAreas?: string | null
  sailorBio?: string | null
  sailorCvStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  sailorCvDoc?: string | null
  sailorCvSubmittedAt?: string | null
  sailorCvReviewedAt?: string | null
  sailorCvRejectionReason?: string | null
  emailVerifiedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface Boat {
  id: number
  ownerId: number
  owner?: Partial<User>
  title: string
  description: string
  type: BoatType
  manufacturer?: string
  model?: string
  year?: number
  length?: number
  capacity: number
  cabins: number
  motorizationType: MotorizationType
  motorPower?: number
  withSkipper: boolean
  skipperPrice?: number
  port: string
  city: string
  country: string
  lat?: number
  lng?: number
  dailyRate: number
  weeklyRate?: number
  depositAmount: number
  equipment?: string[]
  rules?: string
  images?: string[]
  welcomeMessage?: string
  discountRules?: { minDays: number; discountPercent: number }[]
  registrationDoc?: string
  insuranceDoc?: string
  licenseScanDoc?: string
  status: BoatStatus
  rating: number
  reviewCount: number
  createdAt: string
  updatedAt?: string
}

export interface Booking {
  id: number
  boatId: number
  boat?: Partial<Boat>
  renterId: number
  renter?: Partial<User>
  ownerId: number
  owner?: Partial<User>
  startDate: string
  endDate: string
  totalDays: number
  withSkipper: boolean
  dailyRate: number
  subtotal: number
  platformFee: number
  depositAmount: number
  totalAmount: number
  status: BookingStatus
  cancellationReason?: string
  stripePaymentIntentId?: string
  message?: string
  createdAt: string
  updatedAt?: string
}

export interface Review {
  id: number
  bookingId: number
  boatId: number
  boat?: Partial<Boat>
  reviewerId: number
  reviewer?: Partial<User>
  revieweeId: number
  type: ReviewType
  rating: number
  comment: string
  isPublished: boolean
  createdAt: string
  updatedAt?: string
}

export interface Message {
  id: number
  conversationId: string
  senderId: number
  sender?: Partial<User>
  content: string
  isRead: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  participants: Partial<User>[]
  boatId?: number
  boat?: Partial<Boat>
  lastMessage?: Message
  unreadCount: number
  isArchived?: boolean
  createdAt: string
  updatedAt?: string
}

export interface Favorite {
  id: number
  userId: number
  boatId: number
  boat?: Partial<Boat>
  createdAt: string
}

export interface Notification {
  id: number
  userId: number
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

export interface Availability {
  id: number
  boatId: number
  startDate: string
  endDate: string
  isAvailable: boolean
  reason?: string
}

// ─── Generic Pagination ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: UserRole
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// ─── Filters / Query Params ───────────────────────────────────────────────────

export interface BoatListParams {
  location?: string
  country?: string
  countries?: string[]
  locations?: string[]
  types?: BoatType[]
  startDate?: string
  endDate?: string
  capacity?: number
  minPrice?: number
  maxPrice?: number
  withSkipper?: boolean
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'created_desc'
  page?: number
  limit?: number
}

export interface BookingCreateData {
  boatId: number
  startDate: string
  endDate: string
  withSkipper: boolean
  message?: string
}

export interface ReviewCreateData {
  bookingId: number
  type: 'RENTER_TO_BOAT' | 'OWNER_TO_RENTER'
  rating: number
  comment: string
}

export interface AvailabilityUpdateData {
  boatId: number
  startDate: string
  endDate: string
  isAvailable: boolean
  reason?: string
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalUsers: number
  totalBoats: number
  totalBookings: number
  totalRevenue?: number
  /** Commission nette encaissée par la plateforme */
  platformRevenue: number
  pendingKyc?: number
  pendingBoats: number
  activeBookings?: number
  confirmedBookings?: number
  completedBookings?: number
  /** Taux de conversion (%) - (confirmées + terminées) / total (F1) */
  conversionRate?: number
  /** Nombre d'avis en attente de modération (F4) */
  pendingReviews?: number
  recentBookings?: Partial<Booking>[]
  recentUsers?: Partial<User>[]
  revenueByMonth?: { month: string; revenue: number }[]
  bookingsByMonth?: { month: string; bookings: number }[]
  activeBoats?: number
}

// ─── Owner Revenues ───────────────────────────────────────────────────────────

export interface OwnerRevenueSummary {
  totalEarnings: number
  thisMonthEarnings: number
  pendingEarnings: number
  completedEarnings: number
  confirmedEarnings: number
  totalBookings: number
  completedBookings: number
  confirmedBookings: number
}

export interface RevenueByMonth {
  month: string   // 'YYYY-MM'
  label: string   // 'Janvier 2025'
  earnings: number
  bookings: number
}

export interface RevenueByBoat {
  boatId: number
  boatTitle: string
  boatImage: string | null
  earnings: number
  bookings: number
  averageDailyRate: number
}

export interface OwnerRevenuesResponse {
  summary: OwnerRevenueSummary
  byMonth: RevenueByMonth[]
  byBoat: RevenueByBoat[]
  recentBookings: Partial<Booking>[]
}

export interface RevenueFilterParams {
  year?: number
  boatId?: number
}

export interface Transaction {
  id: number
  bookingId: number
  booking?: Partial<Booking>
  amount: number
  currency: string
  type: 'PAYMENT' | 'REFUND' | 'PAYOUT'
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
  stripeId?: string
  createdAt: string
}
