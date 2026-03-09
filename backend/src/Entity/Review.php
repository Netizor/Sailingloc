<?php

namespace App\Entity;

use App\Repository\ReviewRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReviewRepository::class)]
#[ORM\Table(name: 'review')]
#[ORM\UniqueConstraint(columns: ['booking_id', 'type'])]
#[ORM\Index(columns: ['boat_id'], name: 'idx_review_boat')]
#[ORM\Index(columns: ['reviewer_id'], name: 'idx_review_reviewer')]
class Review
{
    public const TYPE_RENTER_TO_BOAT   = 'RENTER_TO_BOAT';
    public const TYPE_OWNER_TO_RENTER  = 'OWNER_TO_RENTER';

    // Cycle de vie de modération (F4)
    public const STATUS_PENDING  = 'PENDING';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_REJECTED = 'REJECTED';

    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Booking::class, inversedBy: 'reviews')]
    #[ORM\JoinColumn(nullable: false)]
    private Booking $booking;

    #[ORM\ManyToOne(targetEntity: Boat::class, inversedBy: 'reviews')]
    #[ORM\JoinColumn(nullable: false)]
    private Boat $boat;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'reviewsGiven')]
    #[ORM\JoinColumn(nullable: false)]
    private User $reviewer;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'reviewsReceived')]
    #[ORM\JoinColumn(nullable: false)]
    private User $reviewee;

    #[ORM\Column(length: 30)]
    private string $type;

    #[ORM\Column]
    private int $rating;

    #[ORM\Column(type: Types::TEXT)]
    private string $comment;

    // Les nouveaux avis démarrent en PENDING, rendus publics uniquement après approbation admin
    #[ORM\Column(length: 20)]
    private string $moderationStatus = self::STATUS_PENDING;

    #[ORM\Column]
    private bool $isPublished = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }
    public function getBooking(): Booking { return $this->booking; }
    public function setBooking(Booking $booking): static { $this->booking = $booking; return $this; }
    public function getBoat(): Boat { return $this->boat; }
    public function setBoat(Boat $boat): static { $this->boat = $boat; return $this; }
    public function getReviewer(): User { return $this->reviewer; }
    public function setReviewer(User $reviewer): static { $this->reviewer = $reviewer; return $this; }
    public function getReviewee(): User { return $this->reviewee; }
    public function setReviewee(User $reviewee): static { $this->reviewee = $reviewee; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }
    public function getRating(): int { return $this->rating; }
    public function setRating(int $rating): static { $this->rating = $rating; return $this; }
    public function getComment(): string { return $this->comment; }
    public function setComment(string $comment): static { $this->comment = $comment; return $this; }
    public function isPublished(): bool { return $this->isPublished; }
    public function setIsPublished(bool $isPublished): static { $this->isPublished = $isPublished; return $this; }
    public function getModerationStatus(): string { return $this->moderationStatus; }
    public function setModerationStatus(string $status): static { $this->moderationStatus = $status; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'bookingId'   => $this->booking->getId(),
            'boatId'      => $this->boat->getId(),
            'reviewerId'  => $this->reviewer->getId(),
            'revieweeId'  => $this->reviewee->getId(),
            'type'        => $this->type,
            'rating'      => $this->rating,
            'comment'     => $this->comment,
            'isPublished'        => $this->isPublished,
            'moderationStatus'   => $this->moderationStatus,
            'createdAt'          => $this->createdAt->format(\DateTimeInterface::ATOM),
            'reviewer'    => [
                'id'        => $this->reviewer->getId(),
                'firstName' => $this->reviewer->getFirstName(),
                'lastName'  => $this->reviewer->getLastName(),
                'avatar'    => $this->reviewer->getAvatar(),
            ],
            'reviewee'    => [
                'id'        => $this->reviewee->getId(),
                'firstName' => $this->reviewee->getFirstName(),
                'lastName'  => $this->reviewee->getLastName(),
                'avatar'    => $this->reviewee->getAvatar(),
            ],
            'boatTitle'   => $this->boat->getTitle(),
        ];
    }
}
