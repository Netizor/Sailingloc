<?php

namespace App\Entity;

use App\Repository\SeasonalPriceRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SeasonalPriceRepository::class)]
#[ORM\Table(name: 'seasonal_price')]
#[ORM\Index(columns: ['boat_id'], name: 'idx_seasonal_price_boat')]
#[ORM\Index(columns: ['boat_id', 'start_date', 'end_date'], name: 'idx_seasonal_price_boat_dates')]
class SeasonalPrice
{
    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Boat::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Boat $boat;

    /** Libellé de la période (ex: "Juillet–Août", "Week-end") */
    #[ORM\Column(length: 100)]
    private string $label;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $startDate;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $endDate;

    /** Tarif journalier spécifique en euros */
    #[ORM\Column(type: 'float')]
    private float $dailyRate;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }

    public function getBoat(): Boat { return $this->boat; }
    public function setBoat(Boat $boat): static { $this->boat = $boat; return $this; }

    public function getLabel(): string { return $this->label; }
    public function setLabel(string $label): static { $this->label = $label; return $this; }

    public function getStartDate(): \DateTimeImmutable { return $this->startDate; }
    public function setStartDate(\DateTimeImmutable $startDate): static { $this->startDate = $startDate; return $this; }

    public function getEndDate(): \DateTimeImmutable { return $this->endDate; }
    public function setEndDate(\DateTimeImmutable $endDate): static { $this->endDate = $endDate; return $this; }

    public function getDailyRate(): float { return $this->dailyRate; }
    public function setDailyRate(float $dailyRate): static { $this->dailyRate = $dailyRate; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id'        => $this->id,
            'boatId'    => $this->boat->getId(),
            'label'     => $this->label,
            'startDate' => $this->startDate->format('Y-m-d'),
            'endDate'   => $this->endDate->format('Y-m-d'),
            'dailyRate' => $this->dailyRate,
            'createdAt' => $this->createdAt->format(\DateTimeInterface::ATOM),
        ];
    }
}
