<?php

namespace App\Entity;

use App\Repository\BookingRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BookingRepository::class)]
#[ORM\Table(name: 'booking')]
#[ORM\Index(columns: ['renter_id'], name: 'idx_booking_renter')]
#[ORM\Index(columns: ['owner_id'], name: 'idx_booking_owner')]
#[ORM\Index(columns: ['boat_id'], name: 'idx_booking_boat')]
#[ORM\Index(columns: ['status'], name: 'idx_booking_status')]
#[ORM\Index(columns: ['stripe_payment_intent_id'], name: 'idx_booking_stripe')]
#[ORM\HasLifecycleCallbacks]
class Booking
{
    public const STATUS_PENDING   = 'PENDING';
    public const STATUS_CONFIRMED = 'CONFIRMED';
    public const STATUS_CANCELLED = 'CANCELLED';
    public const STATUS_COMPLETED = 'COMPLETED';
    public const STATUS_DISPUTED  = 'DISPUTED';

    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Boat::class, inversedBy: 'bookings')]
    #[ORM\JoinColumn(nullable: false)]
    private Boat $boat;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'bookingsAsRenter')]
    #[ORM\JoinColumn(nullable: false)]
    private User $renter;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'bookingsAsOwner')]
    #[ORM\JoinColumn(nullable: false)]
    private User $owner;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $startDate;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $endDate;

    #[ORM\Column]
    private int $totalDays;

    #[ORM\Column]
    private bool $withSkipper = false;

    #[ORM\Column]
    private float $dailyRate;

    #[ORM\Column]
    private float $subtotal;

    #[ORM\Column]
    private float $platformFee;

    #[ORM\Column]
    private float $depositAmount;

    #[ORM\Column]
    private float $totalAmount;

    #[ORM\Column]
    private int $guestCount = 1;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $specialRequests = null;

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $cancellationReason = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $cancelledAt = null;

    #[ORM\Column(nullable: true)]
    private ?int $cancelledBy = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stripePaymentIntentId = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stripeTransferId = null;

    #[ORM\Column]
    private bool $depositRefunded = false;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $message = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    #[ORM\OneToMany(targetEntity: Review::class, mappedBy: 'booking')]
    private Collection $reviews;

    public function __construct()
    {
        $this->reviews   = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }
    public function getBoat(): Boat { return $this->boat; }
    public function setBoat(Boat $boat): static { $this->boat = $boat; return $this; }
    public function getRenter(): User { return $this->renter; }
    public function setRenter(User $renter): static { $this->renter = $renter; return $this; }
    public function getOwner(): User { return $this->owner; }
    public function setOwner(User $owner): static { $this->owner = $owner; return $this; }
    public function getStartDate(): \DateTimeImmutable { return $this->startDate; }
    public function setStartDate(\DateTimeImmutable $d): static { $this->startDate = $d; return $this; }
    public function getEndDate(): \DateTimeImmutable { return $this->endDate; }
    public function setEndDate(\DateTimeImmutable $d): static { $this->endDate = $d; return $this; }
    public function getTotalDays(): int { return $this->totalDays; }
    public function setTotalDays(int $d): static { $this->totalDays = $d; return $this; }
    public function isWithSkipper(): bool { return $this->withSkipper; }
    public function setWithSkipper(bool $w): static { $this->withSkipper = $w; return $this; }
    public function getDailyRate(): float { return $this->dailyRate; }
    public function setDailyRate(float $r): static { $this->dailyRate = $r; return $this; }
    public function getSubtotal(): float { return $this->subtotal; }
    public function setSubtotal(float $s): static { $this->subtotal = $s; return $this; }
    public function getPlatformFee(): float { return $this->platformFee; }
    public function setPlatformFee(float $f): static { $this->platformFee = $f; return $this; }
    public function getDepositAmount(): float { return $this->depositAmount; }
    public function setDepositAmount(float $d): static { $this->depositAmount = $d; return $this; }
    public function getTotalAmount(): float { return $this->totalAmount; }
    public function setTotalAmount(float $t): static { $this->totalAmount = $t; return $this; }
    public function getGuestCount(): int { return $this->guestCount; }
    public function setGuestCount(int $g): static { $this->guestCount = $g; return $this; }
    public function getSpecialRequests(): ?string { return $this->specialRequests; }
    public function setSpecialRequests(?string $s): static { $this->specialRequests = $s; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $s): static { $this->status = $s; return $this; }
    public function getCancellationReason(): ?string { return $this->cancellationReason; }
    public function setCancellationReason(?string $r): static { $this->cancellationReason = $r; return $this; }
    public function getCancelledAt(): ?\DateTimeImmutable { return $this->cancelledAt; }
    public function setCancelledAt(?\DateTimeImmutable $d): static { $this->cancelledAt = $d; return $this; }
    public function getCancelledBy(): ?int { return $this->cancelledBy; }
    public function setCancelledBy(?int $id): static { $this->cancelledBy = $id; return $this; }
    public function getStripePaymentIntentId(): ?string { return $this->stripePaymentIntentId; }
    public function setStripePaymentIntentId(?string $id): static { $this->stripePaymentIntentId = $id; return $this; }
    public function getStripeTransferId(): ?string { return $this->stripeTransferId; }
    public function setStripeTransferId(?string $id): static { $this->stripeTransferId = $id; return $this; }
    public function isDepositRefunded(): bool { return $this->depositRefunded; }
    public function setDepositRefunded(bool $r): static { $this->depositRefunded = $r; return $this; }
    public function getMessage(): ?string { return $this->message; }
    public function setMessage(?string $m): static { $this->message = $m; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function getReviews(): Collection { return $this->reviews; }

    public function toArray(bool $withBoat = false, bool $withRenter = false, bool $withOwner = false): array
    {
        $data = [
            'id'                    => $this->id,
            'boatId'                => $this->boat->getId(),
            'renterId'              => $this->renter->getId(),
            'ownerId'               => $this->owner->getId(),
            'startDate'             => $this->startDate->format('Y-m-d'),
            'endDate'               => $this->endDate->format('Y-m-d'),
            'totalDays'             => $this->totalDays,
            'withSkipper'           => $this->withSkipper,
            'dailyRate'             => $this->dailyRate,
            'subtotal'              => $this->subtotal,
            'platformFee'           => $this->platformFee,
            'depositAmount'         => $this->depositAmount,
            'totalAmount'           => $this->totalAmount,
            'guestCount'            => $this->guestCount,
            'specialRequests'       => $this->specialRequests,
            'status'                => $this->status,
            'cancellationReason'    => $this->cancellationReason,
            'cancelledAt'           => $this->cancelledAt?->format(\DateTimeInterface::ATOM),
            'cancelledBy'           => $this->cancelledBy,
            'stripePaymentIntentId' => $this->stripePaymentIntentId,
            'depositRefunded'       => $this->depositRefunded,
            'message'               => $this->message,
            'createdAt'             => $this->createdAt->format(\DateTimeInterface::ATOM),
            'updatedAt'             => $this->updatedAt->format(\DateTimeInterface::ATOM),
        ];
        if ($withBoat) {
            $data['boat'] = [
                'id'     => $this->boat->getId(),
                'title'  => $this->boat->getTitle(),
                'images' => $this->boat->getImages(),
                'port'   => $this->boat->getPort(),
                'city'   => $this->boat->getCity(),
            ];
        }
        if ($withRenter) {
            $data['renter'] = [
                'id'        => $this->renter->getId(),
                'firstName' => $this->renter->getFirstName(),
                'lastName'  => $this->renter->getLastName(),
                'avatar'    => $this->renter->getAvatar(),
                'email'     => $this->renter->getEmail(),
            ];
        }
        if ($withOwner) {
            $data['owner'] = [
                'id'        => $this->owner->getId(),
                'firstName' => $this->owner->getFirstName(),
                'lastName'  => $this->owner->getLastName(),
                'avatar'    => $this->owner->getAvatar(),
            ];
        }
        return $data;
    }
}
