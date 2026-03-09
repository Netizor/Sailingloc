<?php

namespace App\Service;

use App\Entity\Message;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Gère la création programmatique de messages (ex. message de bienvenue E3).
 */
class MessageService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    /**
     * Envoie un message et le persiste. Retourne le message créé.
     * Ne fait pas flush — c'est à l'appelant de décider du moment du flush.
     */
    public function send(User $sender, User $receiver, string $content, ?string $conversationId = null): Message
    {
        // Identifiant de conversation déterministe basé sur les IDs triés des utilisateurs
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

        return $message;
    }
}
