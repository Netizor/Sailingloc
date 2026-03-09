<?php

namespace App\Repository;

use App\Entity\Message;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    /** Compte les messages non lus reçus par un utilisateur (toutes conversations confondues). */
    public function countUnread(int $userId): int
    {
        $conn = $this->getEntityManager()->getConnection();
        return (int) $conn->fetchOne(
            'SELECT COUNT(*) FROM message WHERE receiver_id = :uid AND read_at IS NULL',
            ['uid' => $userId],
        );
    }

    public function findConversations(string $userId): array
    {
        // Returns the latest message per conversation involving this user
        $conn = $this->getEntityManager()->getConnection();
        $sql = "
            SELECT m.conversation_id,
                   MAX(m.created_at) AS last_message_at,
                   COUNT(*) AS message_count,
                   SUM(CASE WHEN m.receiver_id = :uid AND m.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
            FROM message m
            WHERE m.sender_id = :uid OR m.receiver_id = :uid
            GROUP BY m.conversation_id
            ORDER BY last_message_at DESC
        ";
        return $conn->executeQuery($sql, ['uid' => $userId])->fetchAllAssociative();
    }
}
