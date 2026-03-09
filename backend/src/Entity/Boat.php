<?php

namespace App\Entity;

use App\Repository\BoatRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BoatRepository::class)]
#[ORM\Table(name: 'boat')]
#[ORM\Index(columns: ['owner_id'], name: 'idx_boat_owner')]
#[ORM\Index(columns: ['status'], name: 'idx_boat_status')]
#[ORM\Index(columns: ['city'], name: 'idx_boat_city')]
#[ORM\Index(columns: ['port'], name: 'idx_boat_port')]
#[ORM\HasLifecycleCallbacks]
class Boat
{
    public const STATUS_DRAFT   = 'draft';
    public const STATUS_ACTIVE  = 'active';
    public const STATUS_INACTIVE = 'inactive';

    public const TYPE_SAILBOAT   = 'SAILBOAT';
    public const TYPE_MOTORBOAT  = 'MOTORBOAT';
    public const TYPE_CATAMARAN  = 'CATAMARAN';
    public const TYPE_INFLATABLE = 'INFLATABLE';

    public const MOTORIZATION_SAIL   = 'SAIL';
    public const MOTORIZATION_MOTOR  = 'MOTOR';
    public const MOTORIZATION_HYBRID = 'HYBRID';

    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue]
    private int $id;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'boats')]
    #[ORM\JoinColumn(nullable: false)]
    private User $owner;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(type: Types::TEXT)]
    private string $description;

    #[ORM\Column(length: 20)]
    private string $type;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $manufacturer = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $model = null;

    #[ORM\Column(nullable: true)]
    private ?int $year = null;

    #[ORM\Column(nullable: true)]
    private ?float $length = null;

    #[ORM\Column]
    private int $capacity;

    #[ORM\Column]
    private int $cabins = 0;

    #[ORM\Column(length: 20)]
    private string $motorizationType = self::MOTORIZATION_SAIL;

    #[ORM\Column(nullable: true)]
    private ?int $motorPower = null;

    #[ORM\Column]
    private bool $withSkipper = false;

    #[ORM\Column(nullable: true)]
    private ?float $skipperPrice = null;

    #[ORM\Column(length: 255)]
    private string $port;

    #[ORM\Column(length: 255)]
    private string $city;

    #[ORM\Column(length: 10)]
    private string $country = 'FR';

    #[ORM\Column(nullable: true)]
    private ?float $lat = null;

    #[ORM\Column(nullable: true)]
    private ?float $lng = null;

    #[ORM\Column]
    private float $dailyRate;

    #[ORM\Column(nullable: true)]
    private ?float $weeklyRate = null;

    #[ORM\Column]
    private float $depositAmount;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $equipment = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $rules = null;

    // Message envoyé automatiquement au locataire lors de la confirmation de réservation
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $welcomeMessage = null;

    // Règles de réduction dégressive (E2) — format : [{minDays: int, discountPercent: float}]
    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $discountRules = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $images = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $registrationDoc = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $insuranceDoc = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $licenseScanDoc = null;

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_DRAFT;

    #[ORM\Column]
    private float $rating = 0.0;

    #[ORM\Column]
    private int $reviewCount = 0;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    #[ORM\OneToMany(targetEntity: Booking::class, mappedBy: 'boat')]
    private Collection $bookings;

    #[ORM\OneToMany(targetEntity: Availability::class, mappedBy: 'boat', cascade: ['remove'])]
    private Collection $availabilities;

    #[ORM\OneToMany(targetEntity: Review::class, mappedBy: 'boat')]
    private Collection $reviews;

    #[ORM\OneToMany(targetEntity: Favorite::class, mappedBy: 'boat', cascade: ['remove'])]
    private Collection $favorites;

    public function __construct()
    {
        $this->bookings      = new ArrayCollection();
        $this->availabilities = new ArrayCollection();
        $this->reviews       = new ArrayCollection();
        $this->favorites     = new ArrayCollection();
        $this->createdAt     = new \DateTimeImmutable();
        $this->updatedAt     = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): int { return $this->id; }
    public function getOwner(): User { return $this->owner; }
    public function setOwner(User $owner): static { $this->owner = $owner; return $this; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }
    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }
    public function getManufacturer(): ?string { return $this->manufacturer; }
    public function setManufacturer(?string $m): static { $this->manufacturer = $m; return $this; }
    public function getModel(): ?string { return $this->model; }
    public function setModel(?string $m): static { $this->model = $m; return $this; }
    public function getYear(): ?int { return $this->year; }
    public function setYear(?int $y): static { $this->year = $y; return $this; }
    public function getLength(): ?float { return $this->length; }
    public function setLength(?float $l): static { $this->length = $l; return $this; }
    public function getCapacity(): int { return $this->capacity; }
    public function setCapacity(int $c): static { $this->capacity = $c; return $this; }
    public function getCabins(): int { return $this->cabins; }
    public function setCabins(int $c): static { $this->cabins = $c; return $this; }
    public function getMotorizationType(): string { return $this->motorizationType; }
    public function setMotorizationType(string $t): static { $this->motorizationType = $t; return $this; }
    public function getMotorPower(): ?int { return $this->motorPower; }
    public function setMotorPower(?int $p): static { $this->motorPower = $p; return $this; }
    public function isWithSkipper(): bool { return $this->withSkipper; }
    public function setWithSkipper(bool $w): static { $this->withSkipper = $w; return $this; }
    public function getSkipperPrice(): ?float { return $this->skipperPrice; }
    public function setSkipperPrice(?float $p): static { $this->skipperPrice = $p; return $this; }
    public function getPort(): string { return $this->port; }
    public function setPort(string $p): static { $this->port = $p; return $this; }
    public function getCity(): string { return $this->city; }
    public function setCity(string $c): static { $this->city = $c; return $this; }
    public function getCountry(): string { return $this->country; }
    public function setCountry(string $c): static { $this->country = $c; return $this; }
    public function getLat(): ?float { return $this->lat; }
    public function setLat(?float $l): static { $this->lat = $l; return $this; }
    public function getLng(): ?float { return $this->lng; }
    public function setLng(?float $l): static { $this->lng = $l; return $this; }
    public function getDailyRate(): float { return $this->dailyRate; }
    public function setDailyRate(float $r): static { $this->dailyRate = $r; return $this; }
    public function getWeeklyRate(): ?float { return $this->weeklyRate; }
    public function setWeeklyRate(?float $r): static { $this->weeklyRate = $r; return $this; }
    public function getDepositAmount(): float { return $this->depositAmount; }
    public function setDepositAmount(float $d): static { $this->depositAmount = $d; return $this; }
    public function getEquipment(): ?array { return $this->equipment; }
    public function setEquipment(?array $e): static { $this->equipment = $e; return $this; }
    public function getRules(): ?string { return $this->rules; }
    public function setRules(?string $r): static { $this->rules = $r; return $this; }
    public function getWelcomeMessage(): ?string { return $this->welcomeMessage; }
    public function setWelcomeMessage(?string $m): static { $this->welcomeMessage = $m; return $this; }
    public function getDiscountRules(): ?array { return $this->discountRules; }
    public function setDiscountRules(?array $rules): static { $this->discountRules = $rules; return $this; }
    public function getImages(): ?array { return $this->images; }
    public function setImages(?array $i): static { $this->images = $i; return $this; }
    public function getRegistrationDoc(): ?string { return $this->registrationDoc; }
    public function setRegistrationDoc(?string $d): static { $this->registrationDoc = $d; return $this; }
    public function getInsuranceDoc(): ?string { return $this->insuranceDoc; }
    public function setInsuranceDoc(?string $d): static { $this->insuranceDoc = $d; return $this; }
    public function getLicenseScanDoc(): ?string { return $this->licenseScanDoc; }
    public function setLicenseScanDoc(?string $d): static { $this->licenseScanDoc = $d; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $s): static { $this->status = $s; return $this; }
    public function getRating(): float { return $this->rating; }
    public function setRating(float $r): static { $this->rating = $r; return $this; }
    public function getReviewCount(): int { return $this->reviewCount; }
    public function setReviewCount(int $c): static { $this->reviewCount = $c; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function getBookings(): Collection { return $this->bookings; }
    public function getAvailabilities(): Collection { return $this->availabilities; }
    public function getReviews(): Collection { return $this->reviews; }
    public function getFavorites(): Collection { return $this->favorites; }

    public function toArray(bool $withOwner = false, bool $includeOwnerFields = false): array
    {
        $data = [
            'id'              => $this->id,
            'title'           => $this->title,
            'description'     => $this->description,
            'type'            => $this->type,
            'manufacturer'    => $this->manufacturer,
            'model'           => $this->model,
            'year'            => $this->year,
            'length'          => $this->length,
            'capacity'        => $this->capacity,
            'cabins'          => $this->cabins,
            'motorizationType' => $this->motorizationType,
            'motorPower'      => $this->motorPower,
            'withSkipper'     => $this->withSkipper,
            'skipperPrice'    => $this->skipperPrice,
            'port'            => $this->port,
            'city'            => $this->city,
            'country'         => $this->country,
            'lat'             => $this->lat,
            'lng'             => $this->lng,
            'dailyRate'       => $this->dailyRate,
            'weeklyRate'      => $this->weeklyRate,
            'depositAmount'   => $this->depositAmount,
            'equipment'       => $this->equipment,
            'rules'           => $this->rules,
            'discountRules'   => $this->discountRules,
            // welcomeMessage omis volontairement : champ privé du propriétaire,
            // visible uniquement via les endpoints owner (/api/boats/my et /api/boats/{id} PATCH).
            'images'          => $this->images,
            'status'          => $this->status,
            'rating'          => $this->rating,
            'reviewCount'     => $this->reviewCount,
            'createdAt'       => $this->createdAt->format(\DateTimeInterface::ATOM),
            'updatedAt'       => $this->updatedAt->format(\DateTimeInterface::ATOM),
            'ownerId'         => $this->owner->getId(),
        ];
        if ($withOwner) {
            $data['owner'] = [
                'id'        => $this->owner->getId(),
                'firstName' => $this->owner->getFirstName(),
                'lastName'  => $this->owner->getLastName(),
                'avatar'    => $this->owner->getAvatar(),
            ];
        }
        if ($includeOwnerFields) {
            // Champs privés du propriétaire — ne pas inclure dans les routes publiques
            $data['welcomeMessage'] = $this->welcomeMessage;
        }
        return $data;
    }
}
