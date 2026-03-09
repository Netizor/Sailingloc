import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Clock, Anchor, Send, Archive, ArchiveRestore } from 'lucide-react'
import { getConversations, sendMessage, archiveConversation, unarchiveConversation } from '../../api/messages.api'
import { useAuthStore } from '../../store/auth.store'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { Conversation } from '../../types'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'

const Messages: React.FC = () => {
  usePageTitle('Messages')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  // ?to=<ownerId> passé depuis le bouton "Contacter" d'une fiche bateau
  const toId = searchParams.get('to') ? Number(searchParams.get('to')) : null

  // Onglet actif : 'active' | 'archived'
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const isArchived = tab === 'archived'

  // Formulaire d'amorce de conversation (affiché si ?to= sans conversation existante)
  const [newMessage, setNewMessage] = useState('')
  const redirectedRef = useRef(false)

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', isArchived],
    queryFn: () => getConversations(isArchived),
    staleTime: 30 * 1000,
    refetchInterval: isArchived ? false : 30 * 1000,
  })

  const archiveMutation = useMutation({
    mutationFn: ({ convId, archive }: { convId: string; archive: boolean }) =>
      archive ? archiveConversation(convId) : unarchiveConversation(convId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      sendMessage({ receiverId: toId!, content }),
    onSuccess: async (msg) => {
      await qc.invalidateQueries({ queryKey: ['conversations'] })
      // Le backend retourne le message avec conversationId
      if (msg.conversationId) {
        navigate(`/mon-espace/messages/${msg.conversationId}`, { replace: true })
      }
    },
  })

  // Si une conversation avec ce proprio existe déjà → rediriger directement
  useEffect(() => {
    if (!toId || !conversations || redirectedRef.current) return
    const existing = conversations.find((c) =>
      c.participants.some((p) => p.id === toId)
    )
    if (existing) {
      redirectedRef.current = true
      navigate(`/mon-espace/messages/${existing.id}`, { replace: true })
    }
  }, [toId, conversations, navigate])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center">
            <MessageCircle size={22} className="text-ocean-600 dark:text-ocean-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
        </div>

        {/* Onglets Actifs / Archivés */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6">
          {(['active', 'archived'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t === 'active' ? <MessageCircle size={14} /> : <Archive size={14} />}
              {t === 'active' ? 'Actifs' : 'Archivés'}
            </button>
          ))}
        </div>

        {/* Formulaire de démarrage de conversation depuis ?to= */}
        {toId && !isLoading && !conversations?.some((c) => c.participants.some((p) => p.id === toId)) && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-ocean-100 dark:border-ocean-800 p-6 mb-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Démarrer une conversation avec ce propriétaire
            </p>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Bonjour, je suis intéressé par votre bateau…"
              rows={3}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
            <div className="flex justify-end mt-3">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send size={14} />}
                loading={sendMutation.isPending}
                disabled={!newMessage.trim() || sendMutation.isPending}
                onClick={() => sendMutation.mutate(newMessage.trim())}
              >
                Envoyer
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-5">
              <Anchor size={36} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun message</h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mb-6">
              Contactez un propriétaire depuis la fiche d'un bateau pour démarrer une conversation.
            </p>
            <Button variant="secondary" onClick={() => navigate('/bateaux')}>
              Explorer les bateaux
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                currentUserId={user?.id}
                isArchived={isArchived}
                onClick={() => navigate(`/mon-espace/messages/${conv.id}`)}
                onArchive={() => archiveMutation.mutate({ convId: conv.id, archive: !isArchived })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Élément de conversation ──────────────────────────────────────────────────

interface ConversationItemProps {
  conversation: Conversation
  currentUserId: number | undefined
  isArchived: boolean
  onClick: () => void
  onArchive: () => void
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  isArchived,
  onClick,
  onArchive,
}) => {
  // L'interlocuteur est le participant qui n'est pas l'utilisateur courant
  const other = conversation.participants.find((p) => p.id !== currentUserId)
  const name = other ? `${other.firstName ?? ''} ${other.lastName ?? ''}`.trim() : 'Inconnu'
  const initials = other
    ? `${other.firstName?.[0] ?? ''}${other.lastName?.[0] ?? ''}`.toUpperCase()
    : '?'

  const lastMsg = conversation.lastMessage
  const hasUnread = (conversation.unreadCount ?? 0) > 0

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-ocean-200 dark:hover:border-ocean-700 hover:shadow-sm transition-all flex items-center gap-3 pr-2">
      <button
        onClick={onClick}
        className="flex-1 p-4 flex items-center gap-4 text-left min-w-0"
      >
        {/* Avatar */}
        <div className="h-12 w-12 rounded-full bg-ocean-700 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
          {initials}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate ${hasUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
              {name}
            </p>
            {lastMsg?.createdAt && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                <Clock size={11} />
                {formatRelativeTime(lastMsg.createdAt)}
              </span>
            )}
          </div>
          {lastMsg ? (
            <p className={`text-xs truncate ${hasUnread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
              {lastMsg.senderId === currentUserId ? 'Vous : ' : ''}
              {lastMsg.content}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">Aucun message</p>
          )}
        </div>

        {/* Badge non lus */}
        {hasUnread && (
          <span className="h-5 min-w-[20px] flex items-center justify-center bg-ocean-600 text-white text-[10px] font-bold rounded-full px-1.5 flex-shrink-0">
            {conversation.unreadCount}
          </span>
        )}
      </button>

      {/* Bouton archive — visible au survol */}
      <button
        onClick={(e) => { e.stopPropagation(); onArchive() }}
        title={isArchived ? 'Désarchiver' : 'Archiver'}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-ocean-600 dark:hover:text-ocean-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
      >
        {isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  // Décalage d'horloge possible : traite toute valeur < 1 minute comme "à l'instant"
  if (diff < 60_000) return "À l'instant"
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  return `${days} j`
}

export default Messages
