<?php

namespace App\Entity;

use App\Repository\AvailabilityRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AvailabilityRepository::class)]
#[ORM\Table(name: 'availability')]
#[ORM\UniqueConstraint(columns: ['boat_id', 'date'])]
#[ORM\Index(columns: ['boat_id'], name: 'idx_availability_boat')]
class Availability
{
    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Boat::class, inversedBy: 'availabilities')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Boat $boat;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $date;

    #[ORM\Column]
    private bool $isAvailable = true;

    #[ORM\Column(nullable: true)]
    private ?int $bookingId = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $note = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }
    public function getBoat(): Boat { return $this->boat; }
    public function setBoat(Boat $boat): static { $this->boat = $boat; return $this; }
    public function getDate(): \DateTimeImmutable { return $this->date; }
    public function setDate(\DateTimeImmutable $date): static { $this->date = $date; return $this; }
    public function isAvailable(): bool { return $this->isAvailable; }
    public function setIsAvailable(bool $isAvailable): static { $this->isAvailable = $isAvailable; return $this; }
    public function getBookingId(): ?int { return $this->bookingId; }
    public function setBookingId(?int $bookingId): static { $this->bookingId = $bookingId; return $this; }
    public function getNote(): ?string { return $this->note; }
    public function setNote(?string $note): static { $this->note = $note; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'boatId'      => $this->boat->getId(),
            'date'        => $this->date->format('Y-m-d'),
            'isAvailable' => $this->isAvailable,
            'bookingId'   => $this->bookingId,
            'note'        => $this->note,
            'createdAt'   => $this->createdAt->format(\DateTimeInterface::ATOM),
        ];
    }
}
