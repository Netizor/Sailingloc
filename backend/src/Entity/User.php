<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'user')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    public const ROLE_VISITOR = 'VISITOR';
    public const ROLE_RENTER  = 'RENTER';
    public const ROLE_OWNER   = 'OWNER';
    public const ROLE_ADMIN   = 'ADMIN';

    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    private string $email;

    #[ORM\Column]
    private string $password;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: [self::ROLE_VISITOR, self::ROLE_RENTER, self::ROLE_OWNER, self::ROLE_ADMIN])]
    private string $role = self::ROLE_RENTER;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 100)]
    private string $firstName;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 100)]
    private string $lastName;

    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Length(max: 20)]
    #[Assert\Regex(pattern: '/^\+?[0-9\s\-().]{7,20}$/', message: 'Numéro de téléphone invalide.')]
    private ?string $phone = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Assert\Length(max: 500)]
    #[Assert\Url]
    private ?string $avatar = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 2000)]
    private ?string $bio = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stripeCustomerId = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stripeAccountId = null;

    #[ORM\Column]
    private bool $kycVerified = false;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $kycDocumentUrl = null;

    #[ORM\Column]
    private bool $isActive = true;

    // RGPD Art. 7 — horodatage du consentement aux CGU/politique de confidentialité
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $termsAcceptedAt = null;

    // Vérification email — null tant que l'adresse n'a pas été confirmée
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $emailVerifiedAt = null;

    // P2 — Verrouillage de compte après 10 tentatives échouées (CNIL 2022 / OWASP)
    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $failedLoginAttempts = 0;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lockedUntil = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    #[ORM\OneToMany(targetEntity: Boat::class, mappedBy: 'owner')]
    private Collection $boats;

    #[ORM\OneToMany(targetEntity: Booking::class, mappedBy: 'renter')]
    private Collection $bookingsAsRenter;

    #[ORM\OneToMany(targetEntity: Booking::class, mappedBy: 'owner')]
    private Collection $bookingsAsOwner;

    #[ORM\OneToMany(targetEntity: Review::class, mappedBy: 'reviewer')]
    private Collection $reviewsGiven;

    #[ORM\OneToMany(targetEntity: Review::class, mappedBy: 'reviewee')]
    private Collection $reviewsReceived;

    #[ORM\OneToMany(targetEntity: Message::class, mappedBy: 'sender')]
    private Collection $messagesSent;

    #[ORM\OneToMany(targetEntity: Message::class, mappedBy: 'receiver')]
    private Collection $messagesReceived;

    #[ORM\OneToMany(targetEntity: Favorite::class, mappedBy: 'user', cascade: ['remove'])]
    private Collection $favorites;

    #[ORM\OneToMany(targetEntity: Notification::class, mappedBy: 'user', cascade: ['remove'])]
    private Collection $notifications;

    #[ORM\OneToMany(targetEntity: RefreshToken::class, mappedBy: 'user', cascade: ['remove'])]
    private Collection $refreshTokens;

    #[ORM\OneToMany(targetEntity: PasswordResetToken::class, mappedBy: 'user', cascade: ['remove'])]
    private Collection $passwordResetTokens;

    public function __construct()
    {
        $this->boats               = new ArrayCollection();
        $this->bookingsAsRenter    = new ArrayCollection();
        $this->bookingsAsOwner     = new ArrayCollection();
        $this->reviewsGiven        = new ArrayCollection();
        $this->reviewsReceived     = new ArrayCollection();
        $this->messagesSent        = new ArrayCollection();
        $this->messagesReceived    = new ArrayCollection();
        $this->favorites           = new ArrayCollection();
        $this->notifications       = new ArrayCollection();
        $this->refreshTokens       = new ArrayCollection();
        $this->passwordResetTokens = new ArrayCollection();
        $this->createdAt           = new \DateTimeImmutable();
        $this->updatedAt           = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }

    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getUserIdentifier(): string { return $this->email; }

    public function getRoles(): array { return ['ROLE_USER']; }

    public function getPassword(): string { return $this->password; }
    public function setPassword(string $password): static { $this->password = $password; return $this; }

    public function eraseCredentials(): void {}

    public function getRole(): string { return $this->role; }
    public function setRole(string $role): static { $this->role = $role; return $this; }

    public function getFirstName(): string { return $this->firstName; }
    public function setFirstName(string $firstName): static { $this->firstName = $firstName; return $this; }

    public function getLastName(): string { return $this->lastName; }
    public function setLastName(string $lastName): static { $this->lastName = $lastName; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): static { $this->phone = $phone; return $this; }

    public function getAvatar(): ?string { return $this->avatar; }
    public function setAvatar(?string $avatar): static { $this->avatar = $avatar; return $this; }

    public function getBio(): ?string { return $this->bio; }
    public function setBio(?string $bio): static { $this->bio = $bio; return $this; }

    public function getStripeCustomerId(): ?string { return $this->stripeCustomerId; }
    public function setStripeCustomerId(?string $id): static { $this->stripeCustomerId = $id; return $this; }

    public function getStripeAccountId(): ?string { return $this->stripeAccountId; }
    public function setStripeAccountId(?string $id): static { $this->stripeAccountId = $id; return $this; }

    public function isKycVerified(): bool { return $this->kycVerified; }
    public function setKycVerified(bool $kycVerified): static { $this->kycVerified = $kycVerified; return $this; }

    public function getKycDocumentUrl(): ?string { return $this->kycDocumentUrl; }
    public function setKycDocumentUrl(?string $url): static { $this->kycDocumentUrl = $url; return $this; }

    public function isActive(): bool { return $this->isActive; }
    public function setIsActive(bool $isActive): static { $this->isActive = $isActive; return $this; }

    public function getTermsAcceptedAt(): ?\DateTimeImmutable { return $this->termsAcceptedAt; }
    public function setTermsAcceptedAt(?\DateTimeImmutable $dt): static { $this->termsAcceptedAt = $dt; return $this; }

    public function getEmailVerifiedAt(): ?\DateTimeImmutable { return $this->emailVerifiedAt; }
    public function setEmailVerifiedAt(?\DateTimeImmutable $dt): static { $this->emailVerifiedAt = $dt; return $this; }
    public function isEmailVerified(): bool { return $this->emailVerifiedAt !== null; }

    public function getFailedLoginAttempts(): int { return $this->failedLoginAttempts; }
    public function setFailedLoginAttempts(int $n): static { $this->failedLoginAttempts = $n; return $this; }
    public function incrementFailedLoginAttempts(): static { $this->failedLoginAttempts++; return $this; }
    public function resetFailedLoginAttempts(): static { $this->failedLoginAttempts = 0; $this->lockedUntil = null; return $this; }

    public function getLockedUntil(): ?\DateTimeImmutable { return $this->lockedUntil; }
    public function setLockedUntil(?\DateTimeImmutable $dt): static { $this->lockedUntil = $dt; return $this; }

    /** Retourne true si le compte est actuellement verrouillé. */
    public function isLocked(): bool
    {
        return $this->lockedUntil !== null && $this->lockedUntil > new \DateTimeImmutable();
    }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function getBoats(): Collection { return $this->boats; }
    public function getBookingsAsRenter(): Collection { return $this->bookingsAsRenter; }
    public function getBookingsAsOwner(): Collection { return $this->bookingsAsOwner; }
    public function getFavorites(): Collection { return $this->favorites; }
    public function getNotifications(): Collection { return $this->notifications; }

    public function toArray(bool $includePrivate = false): array
    {
        $data = [
            'id'          => $this->id,
            'email'       => $this->email,
            'role'        => $this->role,
            'firstName'   => $this->firstName,
            'lastName'    => $this->lastName,
            'phone'       => $this->phone,
            'avatar'      => $this->avatar,
            'bio'         => $this->bio,
            'kycVerified'      => $this->kycVerified,
            'isActive'         => $this->isActive,
            'termsAcceptedAt'  => $this->termsAcceptedAt?->format(\DateTimeInterface::ATOM),
            'emailVerifiedAt'  => $this->emailVerifiedAt?->format(\DateTimeInterface::ATOM),
            'createdAt'        => $this->createdAt->format(\DateTimeInterface::ATOM),
            'updatedAt'        => $this->updatedAt->format(\DateTimeInterface::ATOM),
        ];
        if ($includePrivate) {
            $data['stripeCustomerId'] = $this->stripeCustomerId;
            $data['stripeAccountId']  = $this->stripeAccountId;
            $data['kycDocumentUrl']   = $this->kycDocumentUrl;
        }
        return $data;
    }
}
