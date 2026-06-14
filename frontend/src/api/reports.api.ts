import api from '../lib/axios'

export type ReportReason =
  | 'INAPPROPRIATE_CONTENT'
  | 'FRAUD'
  | 'DUPLICATE'
  | 'WRONG_CATEGORY'
  | 'OTHER'

export type ReportStatus = 'PENDING' | 'PROCESSED' | 'DISMISSED'

export interface ReportPayload {
  boatId: number
  reason: ReportReason
  details?: string
}

export interface Report {
  id: number
  boatId: number
  boatTitle: string
  reporterId: number
  reporterName: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  adminNote: string | null
  createdAt: string
  processedAt: string | null
}

/** Signale une annonce auprès de la modération. */
export const reportBoat = async (payload: ReportPayload): Promise<void> => {
  await api.post('/reports', payload)
}

/** Admin - liste paginée des signalements */
export const adminListReports = async (params?: { status?: string; page?: number; limit?: number }) => {
  const { data } = await api.get<{ data: Report[]; total: number; page: number; totalPages: number }>('/admin/reports', { params })
  return data
}

/** Admin - met à jour le statut d'un signalement */
export const adminUpdateReport = async (id: number, payload: { status?: ReportStatus; adminNote?: string }): Promise<void> => {
  await api.patch(`/admin/reports/${id}`, payload)
}
