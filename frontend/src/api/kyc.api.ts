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
