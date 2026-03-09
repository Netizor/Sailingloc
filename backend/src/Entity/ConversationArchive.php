<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Enregistre qu'un utilisateur a archivé une conversation.
 * L'archivage est personnel : chaque participant gère sa propre vue.
 */
#[ORM\Entity]
#[ORM\UniqueConstraint(fields: ['user', 'conversationId'])]
class ConversationArchive
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private int $id;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    /** Identifiant de conversation (conv_<md5>) */
    #[ORM\Column(length: 64)]
    private string $conversationId;

    #[ORM\Column]
    private \DateTimeImmutable $archivedAt;

    public function __construct(User $user, string $conversationId)
    {
        $this->user           = $user;
        $this->conversationId = $conversationId;
        $this->archivedAt     = new \DateTimeImmutable();
    }

    public function getId(): int                      { return $this->id; }
    public function getUser(): User                   { return $this->user; }
    public function getConversationId(): string       { return $this->conversationId; }
    public function getArchivedAt(): \DateTimeImmutable { return $this->archivedAt; }
}
