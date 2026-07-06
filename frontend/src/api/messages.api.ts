import api from '../lib/axios'
import type { Conversation, Message } from '../types'

export interface SendMessageData {
  recipientId: number
  content: string
  conversationId?: string
  boatId?: number
}

export interface ConversationMessagesResponse {
  messages: Message[]
  page: number
  totalPages: number
}

export const getConversations = async (): Promise<Conversation[]> => {
  const { data } = await api.get<{ conversations: Conversation[] }>('/messages/conversations')
  return data?.conversations ?? []
}

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

export const sendMessage = async (payload: SendMessageData): Promise<Message> => {
  const { data } = await api.post<Message>('/messages', {
    recipientId: payload.receiverId,
    content: payload.content,
  })
  return data
}

export const getUnreadMessagesCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get<{ count: number }>('/messages/unread-count')
  return data
}
