import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle, Send, ArrowLeft,
  Search, MapPin, ExternalLink,
} from 'lucide-react'
import {
  getConversations, sendMessage, getConversationMessages,
} from '../../api/messages.api'
import { getBoat } from '../../api/boats.api'
import { resolveApiBaseUrl } from '../../lib/axios'
import { useAuthStore } from '../../store/auth.store'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { Conversation, Message } from '../../types'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { formatPrice } from '../../lib/utils'
import toast from 'react-hot-toast'

// ─── Page principale ───────────────────────────────────────────────────────────

const Messages: React.FC = () => {
  usePageTitle('Messages')

  const { conversationId } = useParams<{ conversationId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, accessToken } = useAuthStore()

  // Context params
  const toId    = searchParams.get('to')   ? Number(searchParams.get('to'))   : null
  const boatParam = searchParams.get('boat') ? Number(searchParams.get('boat')) : null

  // State
  const [search, setSearch]       = useState('')
  const [draft, setDraft]         = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [convBoatId, setConvBoatId] = useState<number | null>(null)

  const endRef        = useRef<HTMLDivElement>(null)
  const lastMsgIdRef  = useRef(0)
  const redirectedRef = useRef(false)

  // ── Conversations list ─────────────────────────────────────────────────────

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const currentConv = conversations?.find(c => c.id === conversationId)
  const other = currentConv?.participants.find(p => p.id !== user?.id)
  const otherName = other ? `${other.firstName ?? ''} ${other.lastName ?? ''}`.trim() : 'Conversation'

  // Redirect if existing conversation with ?to= user
  useEffect(() => {
    if (!toId || !conversations || redirectedRef.current) return
    const existing = conversations.find(c => c.participants?.some(p => p.id === toId))
    if (existing) {
      redirectedRef.current = true
      navigate(`/mon-espace/messages/${existing.id}`, { replace: true })
    }
  }, [toId, conversations, navigate])

  // ── Messages of active conversation ───────────────────────────────────────

  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getConversationMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 5_000,
  })
  const messages: Message[] = msgData?.messages ?? []

  // Extract boatId from messages context
  useEffect(() => {
    const first = messages.find(m => m.boatId)
    if (first?.boatId) setConvBoatId(first.boatId)
  }, [messages])

  // Reset boatId when switching conversation
  useEffect(() => { setConvBoatId(null) }, [conversationId])

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Update lastMsgIdRef
  useEffect(() => {
    if (messages.length > 0) {
      const maxId = Math.max(...messages.map(m => m.id))
      if (maxId > lastMsgIdRef.current) lastMsgIdRef.current = maxId
    }
  }, [msgData])

  // ── SSE temps réel ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!conversationId || !accessToken) return
    let es: EventSource | null = null
    let active = true

    const connect = () => {
      if (!active) return
      const token = useAuthStore.getState().accessToken
      if (!token) return
      const url =
        `${resolveApiBaseUrl()}/messages/stream/${conversationId}` +
        `?token=${encodeURIComponent(token)}&lastId=${lastMsgIdRef.current}`
      es = new EventSource(url)

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const newMsgs: Message[] = JSON.parse(event.data)
          if (!newMsgs.length) return
          const maxId = Math.max(...newMsgs.map(m => m.id))
          if (maxId > lastMsgIdRef.current) lastMsgIdRef.current = maxId
          qc.setQueryData<{ messages: Message[]; page: number; totalPages: number }>(
            ['messages', conversationId],
            (old) => {
              if (!old) return old
              const existingIds = new Set(old.messages.map(m => m.id))
              const toAdd = newMsgs.filter(m => !existingIds.has(m.id))
              return toAdd.length ? { ...old, messages: [...old.messages, ...toAdd] } : old
            },
          )
          qc.invalidateQueries({ queryKey: ['conversations'] })
          qc.invalidateQueries({ queryKey: ['unread-messages-count'] })
        } catch { /* parse error silencieux */ }
      }
      es.onerror = () => {
        es?.close()
        es = null
        if (active) setTimeout(connect, 3_000)
      }
    }
    connect()
    return () => { active = false; es?.close() }
  }, [conversationId, accessToken, qc])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setDraft('')
      qc.invalidateQueries({ queryKey: ['messages', conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error("Impossible d'envoyer le message"),
  })

  const firstMsgMutation = useMutation({
    mutationFn: (content: string) =>
      sendMessage({ recipientId: toId!, content, boatId: boatParam ?? undefined }),
    onSuccess: (msg) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      if (msg.conversationId) navigate(`/mon-espace/messages/${msg.conversationId}`, { replace: true })
    },
    onError: () => toast.error("Impossible d'envoyer le message"),
  })

  // ── Handlers ───────────────────────────────────────────────────────────────

  const doSend = () => {
    const content = draft.trim()
    if (!content || !other?.id) return
    sendMutation.mutate({ recipientId: other.id, content, conversationId })
  }

  const filteredConvs = (conversations ?? []).filter(c => {
    if (!search) return true
    const o = c.participants.find(p => p.id !== user?.id)
    const name = `${o?.firstName ?? ''} ${o?.lastName ?? ''}`.toLowerCase()
    return name.includes(search.toLowerCase()) ||
      c.lastMessage?.content?.toLowerCase().includes(search.toLowerCase())
  })

  const showCompose = toId && !convLoading &&
    !conversations?.some(c => c.participants?.some(p => p.id === toId))
  const hasConv = !!conversationId
  const effectiveBoatId = convBoatId ?? boatParam

  return (
    <div className="flex overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
      style={{ height: 'calc(100vh - 9rem)' }}>

      {/* ── GAUCHE : liste conversations ──────────────────────────────── */}
      <div className={`flex flex-col border-r border-gray-100 dark:border-gray-700 w-full md:w-72 lg:w-80 flex-shrink-0 ${hasConv ? 'hidden md:flex' : 'flex'}`}>

        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Centre de messagerie</h2>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une conversation…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-ocean-500 placeholder-gray-400 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Formulaire amorce (?to= sans conversation existante) */}
        {showCompose && (
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-ocean-50 dark:bg-ocean-900/20">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Nouveau message</p>
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              rows={2}
              placeholder="Bonjour, je suis intéressé par votre bateau…"
              className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
            <Button
              variant="primary"
              size="sm"
              fullWidth
              className="mt-2"
              loading={firstMsgMutation.isPending}
              disabled={!newMessage.trim()}
              onClick={() => firstMsgMutation.mutate(newMessage.trim())}
            >
              <Send size={12} className="mr-1.5" /> Envoyer
            </Button>
          </div>
        )}

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="flex justify-center py-10"><Spinner size="sm" /></div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-10 px-4">
              <MessageCircle size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Aucune conversation
              </p>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                currentUserId={user?.id}
                isActive={conv.id === conversationId}
                onClick={() => navigate(`/mon-espace/messages/${conv.id}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── CENTRE : fil de discussion ────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${!hasConv ? 'hidden md:flex' : 'flex'}`}>
        {hasConv ? (
          <>
            {/* Header conversation */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <button
                onClick={() => navigate('/mon-espace/messages')}
                className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="h-9 w-9 rounded-full bg-ocean-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {other
                  ? `${other.firstName?.[0] ?? ''}${other.lastName?.[0] ?? ''}`.toUpperCase()
                  : <MessageCircle size={14} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{otherName}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {msgLoading ? (
                <div className="flex justify-center py-10"><Spinner size="sm" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-10">
                  Aucun message. Commencez la conversation !
                </div>
              ) : (
                messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
                ))
              )}
              <div ref={endRef} />
            </div>

            {/* Zone de saisie */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <form
                onSubmit={e => { e.preventDefault(); doSend() }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend() } }}
                  placeholder="Écrire un message…"
                  rows={1}
                  maxLength={2000}
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:bg-gray-800 max-h-32 overflow-y-auto"
                  style={{ minHeight: '44px' }}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sendMutation.isPending}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {sendMutation.isPending
                    ? <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    : <Send size={15} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* État vide (aucune conversation sélectionnée) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-ocean-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
              Sélectionnez une conversation ou contactez un propriétaire depuis une fiche bateau.
            </p>
          </div>
        )}
      </div>

      {/* ── DROITE : détails du bateau ────────────────────────────────── */}
      {hasConv && effectiveBoatId && (
        <BoatPanel boatId={effectiveBoatId} />
      )}
    </div>
  )
}

// ─── Élément de conversation ──────────────────────────────────────────────────

interface ConvItemProps {
  conv: Conversation
  currentUserId: number | undefined
  isActive: boolean
  onClick: () => void
}

const ConvItem: React.FC<ConvItemProps> = ({ conv, currentUserId, isActive, onClick }) => {
  const other = conv.participants?.find(p => p.id !== currentUserId)
  const name = other ? `${other.firstName ?? ''} ${other.lastName ?? ''}`.trim() : 'Inconnu'
  const initials = other ? `${other.firstName?.[0] ?? ''}${other.lastName?.[0] ?? ''}`.toUpperCase() : '?'
  const hasUnread = (conv.unreadCount ?? 0) > 0

  return (
    <div
      className={`group relative flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        isActive ? 'bg-ocean-50 dark:bg-ocean-900/20 border-l-2 border-l-ocean-600' : ''
      }`}
      onClick={onClick}
    >
      <div className="h-10 w-10 rounded-full bg-ocean-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
            {name}
          </p>
          {conv.lastMessage?.createdAt && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {formatRelativeTime(conv.lastMessage.createdAt)}
            </span>
          )}
        </div>
        {conv.lastMessage ? (
          <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
            {conv.lastMessage.senderId === currentUserId ? 'Vous : ' : ''}
            {conv.lastMessage.content}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Aucun message</p>
        )}
      </div>
      {hasUnread && (
        <span className="h-4 min-w-[16px] flex items-center justify-center bg-ocean-600 text-white text-[9px] font-bold rounded-full px-1 flex-shrink-0">
          {conv.unreadCount}
        </span>
      )}
    </div>
  )
}

// ─── Bulle de message ─────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: Message; isOwn: boolean }> = ({ message, isOwn }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
      isOwn
        ? 'bg-ocean-600 text-white rounded-br-md'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
    }`}>
      <p className="whitespace-pre-wrap break-words">{message.content}</p>
      <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-ocean-200' : 'text-gray-400 dark:text-gray-500'}`}>
        {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </div>
)

// ─── Panneau détails bateau (colonne droite) ──────────────────────────────────

const BoatPanel: React.FC<{ boatId: number }> = ({ boatId }) => {
  const { data: boat } = useQuery({
    queryKey: ['boat', boatId],
    queryFn: () => getBoat(boatId),
    staleTime: 5 * 60_000,
  })

  if (!boat) return (
    <div className="w-64 xl:w-72 border-l border-gray-100 dark:border-gray-700 flex-shrink-0 hidden lg:flex items-center justify-center">
      <Spinner size="sm" />
    </div>
  )

  const mainImage = boat.images?.[0]

  return (
    <div className="w-64 xl:w-72 border-l border-gray-100 dark:border-gray-700 flex-shrink-0 hidden lg:flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Détails du bateau
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mainImage && (
          <img
            src={mainImage}
            alt={boat.title}
            className="w-full h-36 object-cover rounded-xl"
          />
        )}
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">{boat.title}</p>
          {(boat.port || boat.city) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <MapPin size={11} />
              {[boat.port, boat.city].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {boat.dailyRate && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">À partir de</p>
            <p className="text-lg font-bold text-orange-500">
              {formatPrice(boat.dailyRate)}
              <span className="text-xs text-gray-400 font-normal ml-1">/jour</span>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Link
            to={`/bateaux/${boat.id}`}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-semibold transition-colors"
          >
            <ExternalLink size={12} />
            Voir l'annonce
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60_000) return "À l'instant"
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  return `${Math.floor(hours / 24)} j`
}

export default Messages
