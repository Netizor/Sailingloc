<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * D5 — Abonnement push Web Push Protocol.
 * Un utilisateur peut avoir plusieurs abonnements (un par navigateur/appareil).
 */
#[ORM\Entity]
#[ORM\Table(name: 'push_subscription')]
#[ORM\UniqueConstraint(name: 'uniq_push_endpoint', columns: ['endpoint_hash'])]
#[ORM\Index(columns: ['user_id'], name: 'idx_push_user')]
class PushSubscription
{
    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    /** URL complète du push endpoint (peut dépasser 255 car.) */
    #[ORM\Column(type: Types::TEXT)]
    private string $endpoint;

    /** Hash SHA-256 de l'endpoint pour l'index d'unicité */
    #[ORM\Column(length: 64)]
    private string $endpointHash;

    #[ORM\Column(length: 255)]
    private string $p256dh;

    #[ORM\Column(length: 255)]
    private string $auth;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }

    public function getUser(): User { return $this->user; }
    public function setUser(User $user): static { $this->user = $user; return $this; }

    public function getEndpoint(): string { return $this->endpoint; }
    public function setEndpoint(string $endpoint): static
    {
        $this->endpoint     = $endpoint;
        $this->endpointHash = hash('sha256', $endpoint);
        return $this;
    }

    public function getEndpointHash(): string { return $this->endpointHash; }

    public function getP256dh(): string { return $this->p256dh; }
    public function setP256dh(string $p256dh): static { $this->p256dh = $p256dh; return $this; }

    public function getAuth(): string { return $this->auth; }
    public function setAuth(string $auth): static { $this->auth = $auth; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
