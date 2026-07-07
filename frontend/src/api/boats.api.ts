import api from '../lib/axios'
import type { Boat, BoatListParams, BoatStatus, PaginatedResponse } from '../types'

/**
 * Fetch a paginated, filtered list of active boats.
 */
export const listBoats = async (
  params: BoatListParams = {},
): Promise<PaginatedResponse<Boat>> => {
  const { types, countries, locations, ...rest } = params
  const query = new URLSearchParams()
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value))
    }
  })
  types?.forEach((type) => query.append('types[]', type))
  countries?.forEach((c) => query.append('countries[]', c))
  locations?.forEach((l) => query.append('locations[]', l))
  const qs = query.toString()
  const { data } = await api.get<PaginatedResponse<Boat>>(`/boats${qs ? `?${qs}` : ''}`)
  return data
}

/**
 * Fetch a single boat by its ID (public endpoint).
 */
export const getBoat = async (id: number): Promise<Boat> => {
  const { data } = await api.get<Boat>(`/boats/${id}`)
  return data
}

/**
 * Fetch all boats owned by the authenticated user.
 * Le backend retourne une réponse paginée comme tous les autres endpoints /boats.
 */
export const getMyBoats = async (): Promise<PaginatedResponse<Boat>> => {
  const { data } = await api.get<PaginatedResponse<Boat>>('/boats/my')
  return data
}

/**
 * Create a new boat listing.
 * The boat starts in DRAFT status until documents are uploaded and approved.
 */
export const createBoat = async (boatData: Partial<Boat>): Promise<Boat> => {
  const { data } = await api.post<Boat>('/boats', boatData)
  return data
}

/**
 * Update an existing boat's details.
 * Only the owner (or admin) may update the boat.
 */
export const updateBoat = async (id: number, boatData: Partial<Boat>): Promise<Boat> => {
  const { data } = await api.put<Boat>(`/boats/${id}`, boatData)
  return data
}

/**
 * Change the publication status of a boat (e.g. ACTIVE -> INACTIVE).
 * Only the owner (or admin) may call this endpoint.
 */
export const updateBoatStatus = async (id: number, status: BoatStatus): Promise<Boat> => {
  const { data } = await api.patch<Boat>(`/boats/${id}/status`, { status })
  return data
}

/**
 * Permanently delete a boat listing.
 * Only allowed when there are no pending or confirmed bookings.
 */
export const deleteBoat = async (id: number): Promise<void> => {
  await api.delete(`/boats/${id}`)
}

/**
 * Replace/append image URLs for a boat.
 * The backend stores the provided array as the boat's image list.
 */
export const uploadBoatImages = async (id: number, imageUrls: string[]): Promise<Boat> => {
  const { data } = await api.post<Boat>(`/boats/${id}/images`, { imageUrls })
  return data
}

/**
 * Attach a document URL to a boat (registrationDoc | insuranceDoc | licenseScanDoc | contractDoc).
 * documentType must match one of the accepted field names on the Boat model.
 */
/** Upload d'un document officiel via multipart (E5). */
export const uploadBoatDocument = async (
  id: number,
  docType: 'insurance' | 'registration' | 'license' | 'contract',
  file: File,
): Promise<Boat> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('docType', docType)
  const { data } = await api.post<Boat>(`/boats/${id}/upload-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export interface DestinationCountrySummary {
  country: string
  count: number
  image: string | null
}

export const getDestinationSummary = async (): Promise<DestinationCountrySummary[]> => {
  const { data } = await api.get<{ countries: DestinationCountrySummary[] }>('/boats/destinations/summary')
  return data.countries
}

export interface LocationSuggestion {
  label: string
  type: 'city' | 'port' | 'country'
}

export const autocompleteLocation = async (q: string): Promise<LocationSuggestion[]> => {
  if (q.trim().length < 2) return []
  const { data } = await api.get<{ suggestions: LocationSuggestion[] }>(`/boats/autocomplete?q=${encodeURIComponent(q)}`)
  return data.suggestions ?? []
}

export const boatsApi = {
  list: listBoats,
  search: listBoats,
  getDestinationSummary,
  autocomplete: autocompleteLocation,
  getById: getBoat,
  getMyBoats,
  create: createBoat,
  update: updateBoat,
  updateStatus: updateBoatStatus,
  delete: deleteBoat,
  uploadImages: uploadBoatImages,
  uploadDocument: uploadBoatDocument,
}
