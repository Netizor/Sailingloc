import api from '../lib/axios'
import type { Conversation, Message } from '../types'

export interface SendMessageData {
  receiverId: number
  content: string
  /** ID de la conversation existante (optionnel - backend la crée si absent) */
  conversationId?: string
}

export interface ConversationMessagesResponse {
  messages: Message[]
  page: number
  totalPages: number
}

/**
 * Retourne la liste des conversations de l'utilisateur connecté.
 * @param archived true → conversations archivées, false (défaut) → actives
 */
export const getConversations = async (archived = false): Promise<Conversation[]> => {
  const { data } = await api.get<{ conversations: Conversation[] }>('/messages/conversations', {
    params: { archived },
  })
  return data?.conversations ?? []
}

export const archiveConversation = async (convId: string): Promise<void> => {
  await api.post(`/messages/conversations/${convId}/archive`)
}

export const unarchiveConversation = async (convId: string): Promise<void> => {
  await api.delete(`/messages/conversations/${convId}/archive`)
}

/**
 * Retourne les messages d'une conversation paginés.
 * Le backend retourne une PaginatedResponse : les messages sont dans `.data`.
 * Les messages sont déjà triés par date croissante (array_reverse côté backend).
 */
export const getConversationMessages = async (
  conversationId: string,
  page = 1,
): Promise<ConversationMessagesResponse> => {
  const { data } = await api.get<{ data: Message[]; page: number; totalPages: number }>(
    `/messages/conversation/${conversationId}`,
    { params: { page, limit: 30 } },
  )
  return {
    messages: data?.data ?? [],
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
  }
}

/**
 * Envoie un message à un destinataire.
 * Si conversationId est absent, le backend en crée une nouvelle.
 */
export const sendMessage = async (payload: SendMessageData): Promise<Message> => {
  const { data } = await api.post<Message>('/messages', {
    recipientId: payload.receiverId,
    content: payload.content,
  })
  return data
}

/**
 * Retourne le nombre de messages non lus via un endpoint dédié (léger).
 * Utilisé par le Header pour afficher le badge, sans charger toutes les conversations.
 */
export const getUnreadMessagesCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get<{ count: number }>('/messages/unread-count')
  return data
}
