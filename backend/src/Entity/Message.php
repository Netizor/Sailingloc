<?php

namespace App\Entity;

use App\Repository\MessageRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MessageRepository::class)]
#[ORM\Table(name: 'message')]
#[ORM\Index(columns: ['conversation_id'], name: 'idx_message_conversation')]
#[ORM\Index(columns: ['sender_id'], name: 'idx_message_sender')]
#[ORM\Index(columns: ['receiver_id'], name: 'idx_message_receiver')]
class Message
{
    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    // Format : 'conv_' suivi du MD5 des IDs triés des deux utilisateurs (ex. conv_a1b2c3...)
    #[ORM\Column(length: 50)]
    private string $conversationId;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'messagesSent')]
    #[ORM\JoinColumn(nullable: false)]
    private User $sender;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'messagesReceived')]
    #[ORM\JoinColumn(nullable: false)]
    private User $receiver;

    #[ORM\Column(type: Types::TEXT)]
    private string $content;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $readAt = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }
    public function getConversationId(): string { return $this->conversationId; }
    public function setConversationId(string $conversationId): static { $this->conversationId = $conversationId; return $this; }
    public function getSender(): User { return $this->sender; }
    public function setSender(User $sender): static { $this->sender = $sender; return $this; }
    public function getReceiver(): User { return $this->receiver; }
    public function setReceiver(User $receiver): static { $this->receiver = $receiver; return $this; }
    public function getContent(): string { return $this->content; }
    public function setContent(string $content): static { $this->content = $content; return $this; }
    public function getReadAt(): ?\DateTimeImmutable { return $this->readAt; }
    public function setReadAt(?\DateTimeImmutable $readAt): static { $this->readAt = $readAt; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id'             => $this->id,
            'conversationId' => $this->conversationId,
            'senderId'       => $this->sender->getId(),
            'receiverId'     => $this->receiver->getId(),
            'content'        => $this->content,
            'readAt'         => $this->readAt?->format(\DateTimeInterface::ATOM),
            'createdAt'      => $this->createdAt->format(\DateTimeInterface::ATOM),
            'sender'         => [
                'id'        => $this->sender->getId(),
                'firstName' => $this->sender->getFirstName(),
                'avatar'    => $this->sender->getAvatar(),
            ],
        ];
    }
}
