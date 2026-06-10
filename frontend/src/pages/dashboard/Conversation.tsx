import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, MessageCircle } from 'lucide-react'
import {
  getConversationMessages,
  sendMessage,
  getConversations,
} from '../../api/messages.api'
import { resolveApiBaseUrl } from '../../lib/axios'
import { useAuthStore } from '../../store/auth.store'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { Message } from '../../types'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const Conversation: React.FC = () => {
  usePageTitle('Conversation')

  const { conversationId } = useParams<{ conversationId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, accessToken } = useAuthStore()

  // Paramètre `to` : ID du destinataire (utilisé lors d'une nouvelle conversation)
  const receiverId = searchParams.get('to')

  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // Dernier ID reçu — utilisé par le SSE pour ne pas renvoyer l'historique lors des reconnexions
  const lastMsgIdRef = useRef(0)

  // ── Chargement des messages ──────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getConversationMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 5_000,
    // Pas de refetchInterval : remplacé par SSE (G3)
  })

  // Résolution du nom de l'interlocuteur depuis la liste des conversations
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 30_000,
  })

  const currentConv = conversations?.find((c) => c.id === conversationId)
  const other = currentConv?.participants.find((p) => p.id !== user?.id)
  const otherName = other
    ? `${other.firstName ?? ''} ${other.lastName ?? ''}`.trim()
    : 'Conversation'

  const messages: Message[] = data?.messages ?? []

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // ── SSE (G3) — mise à jour de lastMsgIdRef depuis les données initiales ──────
  // Doit être placé AVANT l'effet SSE pour que lastMsgIdRef soit correct au premier connect
  useEffect(() => {
    const msgs = data?.messages ?? []
    if (msgs.length > 0) {
      const maxId = Math.max(...msgs.map((m) => m.id))
      if (maxId > lastMsgIdRef.current) lastMsgIdRef.current = maxId
    }
  }, [data])

  // ── SSE (G3) — remplace le polling ───────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !accessToken) return

    let es: EventSource | null = null
    let active = true

    const connect = () => {
      if (!active) return
      // Lit le token directement depuis le store (évite le token périmé en cas de reconnexion)
      const token = useAuthStore.getState().accessToken
      if (!token) return
      const apiBase = resolveApiBaseUrl()
      const url =
        `${apiBase}/messages/stream/${conversationId}` +
        `?token=${encodeURIComponent(token)}&lastId=${lastMsgIdRef.current}`

      es = new EventSource(url)

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const newMsgs: Message[] = JSON.parse(event.data)
          if (!newMsgs.length) return

          const maxId = Math.max(...newMsgs.map((m) => m.id))
          if (maxId > lastMsgIdRef.current) lastMsgIdRef.current = maxId

          // Injecte les nouveaux messages dans le cache TanStack Query sans refetch réseau
          qc.setQueryData<{ messages: Message[]; pagination: Record<string, number> }>(
            ['messages', conversationId],
            (old) => {
              if (!old) return old
              const existingIds = new Set(old.messages.map((m) => m.id))
              const toAdd = newMsgs.filter((m) => !existingIds.has(m.id))
              if (!toAdd.length) return old
              return { ...old, messages: [...old.messages, ...toAdd] }
            },
          )

          // Rafraîchit la liste des conversations (badge non-lus, dernier message)
          qc.invalidateQueries({ queryKey: ['conversations'] })
          qc.invalidateQueries({ queryKey: ['unread-messages-count'] })
        } catch { /* SSE parse error — silencieux */ }
      }

      es.onerror = () => {
        es?.close()
        es = null
        // Reconnexion automatique après 3 secondes en cas d'erreur réseau
        if (active) setTimeout(connect, 3_000)
      }
    }

    connect()

    return () => {
      active = false
      es?.close()
    }
  }, [conversationId, accessToken, qc])

  // ── Envoi de message ─────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setDraft('')
      // Invalide les messages et les conversations pour mise à jour immédiate
      qc.invalidateQueries({ queryKey: ['messages', conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['unread-messages-count'] })
    },
    onError: () => toast.error("Impossible d'envoyer le message."),
  })

  // Logique d'envoi partagée entre le bouton submit et le raccourci Entrée
  const doSend = () => {
    const content = draft.trim()
    if (!content) return

    // Guard : empêche l'envoi si le destinataire est inconnu
    const resolvedReceiverId = other?.id ?? (receiverId ? Number(receiverId) : null)
    if (!resolvedReceiverId) {
      toast.error("Impossible d'identifier le destinataire.")
      return
    }

    mutation.mutate({ receiverId: resolvedReceiverId, content, conversationId })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSend()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Envoyer avec Entrée (sans Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      doSend()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex flex-col">
      {/* ── En-tête ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 sticky top-16 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/mon-espace/messages')}
            aria-label="Retour aux messages"
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-9 w-9 rounded-full bg-ocean-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {other
              ? `${other.firstName?.[0] ?? ''}${other.lastName?.[0] ?? ''}`.toUpperCase()
              : <MessageCircle size={16} />}
          </div>

          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{otherName}</p>
        </div>
      </div>

      {/* ── Liste des messages ── */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
          ))
        )}
        {/* Ancre pour le scroll automatique */}
        <div ref={endRef} />
      </div>

      {/* ── Zone de saisie ── */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 sticky bottom-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-end gap-3"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message… (Entrée pour envoyer)"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent max-h-32 overflow-y-auto dark:bg-gray-800"
            style={{ minHeight: '44px' }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || mutation.isPending}
            aria-label="Envoyer"
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {mutation.isPending ? (
              <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Bulle de message ─────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isOwn
          ? 'bg-ocean-600 text-white rounded-br-md'
          : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
      }`}
    >
      <p className="whitespace-pre-wrap break-words">{message.content}</p>
      <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-ocean-200' : 'text-gray-400 dark:text-gray-500'}`}>
        {formatTime(message.createdAt)}
      </p>
    </div>
  </div>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default Conversation
