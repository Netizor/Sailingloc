import api from '../lib/axios'

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface KycStatusResponse {
  status: KycStatus
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

/**
 * Récupère le statut KYC de l'utilisateur connecté.
 */
export const getKycStatus = async (): Promise<KycStatusResponse> => {
  const { data } = await api.get<KycStatusResponse>('/kyc/status')
  return data
}

/**
 * Soumet les documents d'identité (recto + verso) en multipart/form-data.
 */
export const submitKyc = async (frontFile: File, backFile: File): Promise<KycStatusResponse> => {
  const formData = new FormData()
  formData.append('front', frontFile)
  formData.append('back', backFile)
  const { data } = await api.post<KycStatusResponse>('/kyc/submit', formData)
  return data
}

export interface PendingKycUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  kycStatus: string
  kycFrontDoc?: string
  kycBackDoc?: string
  kycSubmittedAt?: string
}

function mapPendingKycUser(row: Record<string, unknown>): PendingKycUser {
  return {
    id: row.id as number,
    email: row.email as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    role: row.role as string,
    kycStatus: row.kyc_status as string,
    kycFrontDoc: row.kyc_front_doc as string | undefined,
    kycBackDoc: row.kyc_back_doc as string | undefined,
    kycSubmittedAt: row.kyc_submitted_at as string | undefined,
  }
}

export const getPendingKycUsers = async (): Promise<PendingKycUser[]> => {
  const { data } = await api.get<{ data: Record<string, unknown>[] }>('/kyc/admin/pending')
  return (data.data ?? []).map(mapPendingKycUser)
}

export const reviewKyc = async (
  userId: number,
  payload: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
): Promise<KycStatusResponse> => {
  const { data } = await api.patch<KycStatusResponse>(`/kyc/admin/${userId}`, payload)
  return data
}

export const kycApi = {
  getStatus: getKycStatus,
  submit: submitKyc,
  getPendingUsers: getPendingKycUsers,
  review: reviewKyc,
}
