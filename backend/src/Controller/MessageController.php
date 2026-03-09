<?php

namespace App\Controller;

use App\Entity\ConversationArchive;
use App\Entity\Message;
use App\Repository\MessageRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/messages')]
class MessageController extends AbstractApiController
{
    public function __construct(
        private readonly MessageRepository $messageRepo,
        private readonly UserRepository $userRepo,
        private readonly EntityManagerInterface $em,
        private readonly RateLimiterFactory $messageSendLimiter,
    ) {}

    /** Endpoint léger utilisé par le Header pour afficher le badge de messages non lus. */
    #[Route('/unread-count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        $user = $this->getCurrentUser();
        return $this->success(['count' => $this->messageRepo->countUnread($user->getId())]);
    }

    #[Route('/conversations', methods: ['GET'])]
    public function conversations(Request $request): JsonResponse
    {
        $user   = $this->getCurrentUser();
        $userId = $user->getId();

        // ?archived=true → conversations archivées, sinon actives
        $wantArchived = filter_var($request->query->get('archived', 'false'), FILTER_VALIDATE_BOOLEAN);

        // IDs des conversations archivées par cet utilisateur (table peut être vide si migration pas encore appliquée)
        try {
            $archivedIds = array_map(
                fn(ConversationArchive $a) => $a->getConversationId(),
                $this->em->getRepository(ConversationArchive::class)->findBy(['user' => $user])
            );
        } catch (\Throwable) {
            $archivedIds = [];
        }

        // Récupère les conversation_id + unread_count de l'utilisateur
        $rows = $this->messageRepo->findConversations($userId);

        $result = [];
        foreach ($rows as $row) {
            $convId     = $row['conversation_id'];
            $isArchived = in_array($convId, $archivedIds, true);

            // Filtre selon l'onglet demandé
            if ($wantArchived !== $isArchived) {
                continue;
            }

            // Dernier message de cette conversation
            // Utilise l'entité $user (et non l'ID) pour la comparaison DQL sur les champs relation
            $lastMsg = $this->em->createQueryBuilder()
                ->select('m')
                ->from(Message::class, 'm')
                ->where('m.conversationId = :convId')
                ->andWhere('m.sender = :user OR m.receiver = :user')
                ->setParameter('convId', $convId)
                ->setParameter('user', $user)
                ->orderBy('m.createdAt', 'DESC')
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();

            if (!$lastMsg) {
                continue;
            }

            // L'interlocuteur est le participant qui n'est pas l'utilisateur courant
            $other = $lastMsg->getSender()->getId() === $userId
                ? $lastMsg->getReceiver()
                : $lastMsg->getSender();

            $result[] = [
                'id'          => $convId,
                'participants' => [
                    [
                        'id'        => $user->getId(),
                        'firstName' => $user->getFirstName(),
                        'lastName'  => $user->getLastName(),
                        'avatar'    => $user->getAvatar(),
                    ],
                    [
                        'id'        => $other->getId(),
                        'firstName' => $other->getFirstName(),
                        'lastName'  => $other->getLastName(),
                        'avatar'    => $other->getAvatar(),
                    ],
                ],
                'lastMessage' => $lastMsg->toArray(),
                'unreadCount' => (int) $row['unread_count'],
                'isArchived'  => $isArchived,
                'updatedAt'   => $lastMsg->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return $this->success(['conversations' => $result]);
    }

    /** Archiver une conversation (personnel — n'affecte pas l'autre participant) */
    #[Route('/conversations/{convId}/archive', methods: ['POST'])]
    public function archive(string $convId): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$this->userParticipatesInConversation($convId, $user)) {
            return $this->error('Conversation introuvable', 404);
        }

        $existing = $this->em->getRepository(ConversationArchive::class)
            ->findOneBy(['user' => $user, 'conversationId' => $convId]);

        if (!$existing) {
            $archive = new ConversationArchive($user, $convId);
            $this->em->persist($archive);
            $this->em->flush();
        }

        return $this->success(['archived' => true]);
    }

    /** Désarchiver une conversation */
    #[Route('/conversations/{convId}/archive', methods: ['DELETE'])]
    public function unarchive(string $convId): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$this->userParticipatesInConversation($convId, $user)) {
            return $this->error('Conversation introuvable', 404);
        }

        $existing = $this->em->getRepository(ConversationArchive::class)
            ->findOneBy(['user' => $user, 'conversationId' => $convId]);

        if ($existing) {
            $this->em->remove($existing);
            $this->em->flush();
        }

        return $this->success(['archived' => false]);
    }

    #[Route('/conversation/{conversationId}', methods: ['GET'])]
    public function getConversation(string $conversationId, Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        [$page, $limit] = $this->paginationParams($request, 20);

        $qb = $this->em->createQueryBuilder()
            ->select('m')
            ->from(Message::class, 'm')
            ->where('m.conversationId = :convId')
            ->andWhere('m.sender = :user OR m.receiver = :user')
            ->setParameter('convId', $conversationId)
            ->setParameter('user', $user)
            ->orderBy('m.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $messages = $qb->getQuery()->getResult();
        $total    = (int) $this->em->createQueryBuilder()
            ->select('COUNT(m.id)')
            ->from(Message::class, 'm')
            ->where('m.conversationId = :convId')
            ->andWhere('m.sender = :user OR m.receiver = :user')
            ->setParameter('convId', $conversationId)
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        // Mark messages as read
        foreach ($messages as $msg) {
            if ($msg->getReceiver()->getId() === $user->getId() && !$msg->getReadAt()) {
                $msg->setReadAt(new \DateTimeImmutable());
            }
        }
        $this->em->flush();

        return $this->paginated(
            array_map(fn(Message $m) => $m->toArray(), array_reverse($messages)),
            $total, $page, $limit
        );
    }

    #[Route('', methods: ['POST'])]
    public function send(Request $request): JsonResponse
    {
        $sender = $this->getCurrentUser();

        // Limite : 60 messages par heure par utilisateur
        if (!$this->messageSendLimiter->create('msg_' . $sender->getId())->consume(1)->isAccepted()) {
            return $this->error('Trop de messages envoyés. Réessayez dans quelques instants.', 429);
        }

        $body   = $this->getJsonBody($request);

        $receiverId     = $body['receiverId'] ?? null;
        $content        = trim($body['content'] ?? '');
        $conversationId = $body['conversationId'] ?? null;

        if (!$receiverId || !$content) {
            return $this->error('receiverId and content are required', 400);
        }

        $receiver = $this->userRepo->find($receiverId);
        if (!$receiver) {
            return $this->error('Receiver not found', 404);
        }
        if ($receiver->getId() === $sender->getId()) {
            return $this->error('Cannot send message to yourself', 400);
        }

        // Generate conversationId if not provided (deterministic: sorted user IDs)
        if (!$conversationId) {
            $ids = [$sender->getId(), $receiver->getId()];
            sort($ids);
            $conversationId = 'conv_' . md5(implode('_', $ids));
        }

        $message = new Message();
        $message->setConversationId($conversationId);
        $message->setSender($sender);
        $message->setReceiver($receiver);
        $message->setContent($content);

        $this->em->persist($message);
        $this->em->flush();

        return $this->success(['message' => $message->toArray()], 201);
    }

    /**
     * G3 — Flux SSE : envoie les nouveaux messages en temps réel.
     *
     * Authentification via ?token= (EventSource ne supporte pas les headers custom).
     * Le paramètre ?lastId= indique le dernier message connu du client.
     */
    #[Route('/stream/{conversationId}', methods: ['GET'])]
    public function sseStream(string $conversationId, Request $request): Response
    {
        // Validation stricte du format pour éviter les injections SQL via le paramètre de route
        if (!preg_match('/^conv_[a-f0-9]{32}$/', $conversationId)) {
            return $this->error('Identifiant de conversation invalide', 400);
        }

        $user   = $this->getCurrentUser();
        $userId = $user->getId();

        // Dernière ID connue du client — seuls les messages plus récents seront envoyés
        $lastId = max(0, (int) $request->query->get('lastId', 0));
        $conn   = $this->em->getConnection();

        // Formateur de date MySQL → ATOM (identique à toArray())
        $fmt = static fn (?string $d): ?string => $d !== null
            ? (new \DateTimeImmutable($d))->format(\DateTimeInterface::ATOM)
            : null;

        // Durée maximale d'une connexion SSE : 30 minutes (évite les connexions zombies)
        $deadline = time() + 1800;

        $response = new StreamedResponse(function () use ($conversationId, $userId, &$lastId, $conn, $fmt, $deadline): void {
            // Désactive le buffering PHP pour que les données soient envoyées immédiatement
            while (ob_get_level()) {
                ob_end_flush();
            }
            // Assure que connection_aborted() détecte bien les déconnexions
            ignore_user_abort(false);

            while (!connection_aborted() && time() < $deadline) {
                try {
                    // Requête DBAL sans cache Doctrine pour obtenir les vrais nouveaux messages
                    $rows = $conn->executeQuery(
                        'SELECT m.id, m.conversation_id, m.sender_id, m.receiver_id,
                                m.content, m.read_at, m.created_at,
                                u.first_name AS sender_first_name, u.avatar AS sender_avatar
                           FROM message m
                           JOIN user u ON u.id = m.sender_id
                          WHERE m.conversation_id = :convId
                            AND (m.sender_id = :uid OR m.receiver_id = :uid)
                            AND m.id > :lastId
                          ORDER BY m.id ASC',
                        ['convId' => $conversationId, 'uid' => $userId, 'lastId' => $lastId],
                    )->fetchAllAssociative();
                } catch (\Throwable) {
                    // Erreur DBAL (connexion perdue, timeout…) — on ferme proprement
                    break;
                }

                if ($rows) {
                    $lastId = (int) end($rows)['id'];

                    $formatted = array_map(fn (array $r) => [
                        'id'             => (int) $r['id'],
                        'conversationId' => $r['conversation_id'],
                        'senderId'       => (int) $r['sender_id'],
                        'receiverId'     => (int) $r['receiver_id'],
                        'content'        => $r['content'],
                        'readAt'         => $fmt($r['read_at']),
                        'createdAt'      => $fmt($r['created_at']),
                        'sender'         => [
                            'id'        => (int) $r['sender_id'],
                            'firstName' => $r['sender_first_name'],
                            'avatar'    => $r['sender_avatar'],
                        ],
                    ], $rows);

                    echo 'data: ' . json_encode($formatted) . "\n\n";
                } else {
                    // Heartbeat pour que connection_aborted() puisse détecter les déconnexions
                    echo ": heartbeat\n\n";
                }

                flush();
                sleep(2);
            }
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        // Désactive le buffering Nginx pour que les événements arrivent instantanément
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }

    /**
     * Vérifie que l'utilisateur est bien participant à la conversation (expéditeur ou destinataire).
     * Utilisé pour les actions archive/unarchive afin d'éviter qu'un utilisateur
     * puisse agir sur un convId arbitraire (IDOR cosmétique).
     */
    private function userParticipatesInConversation(string $convId, object $user): bool
    {
        return (bool) $this->em->createQueryBuilder()
            ->select('COUNT(m.id)')
            ->from(Message::class, 'm')
            ->where('m.conversationId = :convId')
            ->andWhere('m.sender = :user OR m.receiver = :user')
            ->setParameter('convId', $convId)
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
