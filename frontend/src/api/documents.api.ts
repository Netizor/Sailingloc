import api from '../lib/axios'

export interface DocumentsData {
  identity?: {
    frontUrl?: string | null
    backUrl?: string | null
  }
  sailingLicense?: {
    url?: string | null
  }
  cvMarin?: {
    yearsExperience?: number | null
    vesselTypes?: string[]
    navigationZones?: string | string[]
    certifications?: string | string[]
  }
  insurance?: {
    rcProUrl?: string | null
    rcProExpiry?: string | null
  }
}

export const getDocuments = async (): Promise<DocumentsData> => {
  const { data } = await api.get<{ documents: DocumentsData }>('/documents')
  return data.documents
}

export const saveDocumentSection = async (
  section: string,
  sectionData: Record<string, unknown>,
): Promise<DocumentsData> => {
  const { data } = await api.patch<{ documents: DocumentsData }>('/documents', {
    section,
    data: sectionData,
  })
  return data.documents
}

export const uploadDocument = async (
  file: File,
  section: string,
  field: string,
): Promise<{ url: string; documents: DocumentsData }> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('section', section)
  formData.append('field', field)
  const { data } = await api.post<{ url: string; documents: DocumentsData }>(
    '/documents/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export const documentsApi = {
  get: getDocuments,
  saveSection: saveDocumentSection,
  upload: uploadDocument,
}
