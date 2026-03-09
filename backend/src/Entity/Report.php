<?php

namespace App\Entity;

use App\Repository\ReportRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReportRepository::class)]
#[ORM\Table(name: 'report')]
#[ORM\Index(columns: ['boat_id'], name: 'idx_report_boat')]
#[ORM\Index(columns: ['reporter_id'], name: 'idx_report_reporter')]
#[ORM\Index(columns: ['status'], name: 'idx_report_status')]
class Report
{
    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Boat::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Boat $boat;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $reporter;

    /** Raison du signalement : INAPPROPRIATE_CONTENT | FRAUD | DUPLICATE | WRONG_CATEGORY | OTHER */
    #[ORM\Column(length: 50)]
    private string $reason;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $details = null;

    /** Statut : PENDING | PROCESSED | DISMISSED */
    #[ORM\Column(length: 20)]
    private string $status = 'PENDING';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $adminNote = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $processedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }

    public function getBoat(): Boat { return $this->boat; }
    public function setBoat(Boat $boat): static { $this->boat = $boat; return $this; }

    public function getReporter(): User { return $this->reporter; }
    public function setReporter(User $reporter): static { $this->reporter = $reporter; return $this; }

    public function getReason(): string { return $this->reason; }
    public function setReason(string $reason): static { $this->reason = $reason; return $this; }

    public function getDetails(): ?string { return $this->details; }
    public function setDetails(?string $details): static { $this->details = $details; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getAdminNote(): ?string { return $this->adminNote; }
    public function setAdminNote(?string $note): static { $this->adminNote = $note; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getProcessedAt(): ?\DateTimeImmutable { return $this->processedAt; }
    public function setProcessedAt(?\DateTimeImmutable $dt): static { $this->processedAt = $dt; return $this; }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'boatId'      => $this->boat->getId(),
            'boatTitle'   => $this->boat->getTitle(),
            'reporterId'  => $this->reporter->getId(),
            'reporterName' => $this->reporter->getFirstName() . ' ' . $this->reporter->getLastName(),
            'reason'      => $this->reason,
            'details'     => $this->details,
            'status'      => $this->status,
            'adminNote'   => $this->adminNote,
            'createdAt'   => $this->createdAt->format(\DateTimeInterface::ATOM),
            'processedAt' => $this->processedAt?->format(\DateTimeInterface::ATOM),
        ];
    }
}
