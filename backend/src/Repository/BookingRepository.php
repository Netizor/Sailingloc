<?php

namespace App\Repository;

use App\Entity\Boat;
use App\Entity\Booking;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class BookingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Booking::class);
    }

    /**
     * Compte les réservations actives (PENDING ou CONFIRMED) pour un bateau donné.
     * Utilisé avant la suppression d'un bateau pour bloquer l'opération si des
     * locataires ont des réservations en cours ou à venir.
     */
    public function countActiveByBoat(int $boatId): int
    {
        return (int) $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->join('b.boat', 'boat')
            ->where('boat.id = :boatId')
            ->andWhere('b.status IN (:statuses)')
            ->setParameter('boatId', $boatId)
            ->setParameter('statuses', [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED])
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findOverlapping(string $boatId, \DateTimeImmutable $start, \DateTimeImmutable $end, ?string $excludeId = null): ?Booking
    {
        $qb = $this->createQueryBuilder('b')
            ->join('b.boat', 'boat')
            ->where('boat.id = :boatId')
            ->andWhere('b.status IN (:statuses)')
            ->andWhere('b.startDate < :end')
            ->andWhere('b.endDate > :start')
            ->setParameter('boatId', $boatId)
            ->setParameter('statuses', [Booking::STATUS_CONFIRMED, Booking::STATUS_PENDING])
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setMaxResults(1);

        if ($excludeId) {
            $qb->andWhere('b.id != :excludeId')->setParameter('excludeId', $excludeId);
        }

        return $qb->getQuery()->getOneOrNullResult();
    }

    public function findPaginatedByRenter(string $renterId, int $page, int $limit, ?string $status = null): array
    {
        $qb = $this->createQueryBuilder('b')
            ->join('b.boat', 'boat')
            ->addSelect('boat')
            ->where('b.renter = :renterId')
            ->setParameter('renterId', $renterId)
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $countQb = $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.renter = :renterId')
            ->setParameter('renterId', $renterId);

        if ($status) {
            $qb->andWhere('b.status = :status')->setParameter('status', $status);
            $countQb->andWhere('b.status = :status')->setParameter('status', $status);
        }

        return [
            'items' => $qb->getQuery()->getResult(),
            'total' => (int) $countQb->getQuery()->getSingleScalarResult(),
        ];
    }

    public function findPaginatedByOwner(string $ownerId, int $page, int $limit, ?string $status = null): array
    {
        $qb = $this->createQueryBuilder('b')
            // Joint le locataire ET le bateau : la page réservations propriétaire
            // doit afficher le titre/image du bateau pour chaque réservation.
            ->join('b.renter', 'renter')
            ->addSelect('renter')
            ->join('b.boat', 'boat')
            ->addSelect('boat')
            ->where('b.owner = :ownerId')
            ->setParameter('ownerId', $ownerId)
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $countQb = $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.owner = :ownerId')
            ->setParameter('ownerId', $ownerId);

        if ($status) {
            // Valider contre les constantes de l'entité pour échouer tôt si la valeur est invalide
            $validStatuses = [
                Booking::STATUS_PENDING,
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_COMPLETED,
                Booking::STATUS_CANCELLED,
            ];
            if (!in_array($status, $validStatuses, true)) {
                throw new \InvalidArgumentException("Statut de réservation invalide : {$status}");
            }
            $qb->andWhere('b.status = :status')->setParameter('status', $status);
            $countQb->andWhere('b.status = :status')->setParameter('status', $status);
        }

        return [
            'items' => $qb->getQuery()->getResult(),
            'total' => (int) $countQb->getQuery()->getSingleScalarResult(),
        ];
    }

    // ─── Méthodes de revenus ───────────────────────────────────────────────────

    /**
     * Retourne un résumé global des revenus du propriétaire.
     * Une seule requête SQL avec agrégations conditionnelles (CASE WHEN) remplace
     * les 4 requêtes DQL initiales, réduisant les round-trips base de données de 75 %.
     * Note : le résumé couvre toutes les années confondues ; seule la répartition mensuelle
     * (findRevenueByMonth) est filtrée par année.
     */
    public function findRevenueSummary(string $ownerId, ?string $boatId = null): array
    {
        $now        = new \DateTimeImmutable();
        $monthStart = new \DateTimeImmutable($now->format('Y-m-01'));
        $monthEnd   = new \DateTimeImmutable($now->format('Y-m-t'));

        $conn   = $this->getEntityManager()->getConnection();
        $params = [
            'ownerId'    => $ownerId,
            'confirmed'  => Booking::STATUS_CONFIRMED,
            'completed'  => Booking::STATUS_COMPLETED,
            'pending'    => Booking::STATUS_PENDING,
            'monthStart' => $monthStart->format('Y-m-d'),
            'monthEnd'   => $monthEnd->format('Y-m-d'),
        ];

        $boatFilter = '';
        if ($boatId) {
            $boatFilter       = ' AND boat_id = :boatId';
            $params['boatId'] = $boatId;
        }

        $sql = "SELECT
                    SUM(CASE WHEN status IN (:confirmed, :completed) THEN total_amount ELSE 0 END) AS total_revenue,
                    SUM(CASE WHEN status IN (:confirmed, :completed) THEN 1 ELSE 0 END)            AS total_cnt,
                    SUM(CASE WHEN status = :completed THEN total_amount ELSE 0 END)                 AS completed_revenue,
                    SUM(CASE WHEN status = :completed THEN 1 ELSE 0 END)                            AS completed_cnt,
                    SUM(CASE WHEN status = :pending THEN total_amount ELSE 0 END)                   AS pending_revenue,
                    SUM(CASE WHEN status IN (:confirmed, :completed)
                                  AND start_date >= :monthStart AND start_date <= :monthEnd
                             THEN total_amount ELSE 0 END)                                          AS month_revenue
                FROM booking
                WHERE owner_id = :ownerId{$boatFilter}";

        $row = $conn->executeQuery($sql, $params)->fetchAssociative();

        $totalEarnings     = (float) ($row['total_revenue']     ?? 0);
        $completedEarnings = (float) ($row['completed_revenue'] ?? 0);

        return [
            'totalEarnings'     => $totalEarnings,
            'thisMonthEarnings' => (float) ($row['month_revenue']    ?? 0),
            'pendingEarnings'   => (float) ($row['pending_revenue']  ?? 0),
            'completedEarnings' => $completedEarnings,
            'confirmedEarnings' => $totalEarnings - $completedEarnings,
            'totalBookings'     => (int) ($row['total_cnt']     ?? 0),
            'completedBookings' => (int) ($row['completed_cnt'] ?? 0),
            'confirmedBookings' => (int) ($row['total_cnt'] ?? 0) - (int) ($row['completed_cnt'] ?? 0),
        ];
    }

    /**
     * Retourne les 12 mois de l'année demandée avec le CA et le nombre de réservations.
     * Les mois sans réservations sont remplis avec des zéros (table complète garantie).
     * Utilise du SQL natif car DQL n'inclut pas YEAR() / MONTH() nativement.
     */
    public function findRevenueByMonth(string $ownerId, int $year, ?string $boatId = null): array
    {
        $conn   = $this->getEntityManager()->getConnection();
        $params = [
            'ownerId'   => $ownerId,
            'year'      => $year,
            // Utilise les constantes de l'entité pour éviter toute désynchronisation si les valeurs changent
            'confirmed' => Booking::STATUS_CONFIRMED,
            'completed' => Booking::STATUS_COMPLETED,
        ];

        $sql = "SELECT MONTH(start_date) AS mo, SUM(total_amount) AS revenue, COUNT(id) AS cnt
                FROM booking
                WHERE owner_id = :ownerId
                  AND status IN (:confirmed, :completed)
                  AND YEAR(start_date) = :year";

        if ($boatId) {
            $sql .= ' AND boat_id = :boatId';
            $params['boatId'] = $boatId;
        }

        $sql .= ' GROUP BY mo ORDER BY mo ASC';

        $dbRows = $conn->executeQuery($sql, $params)->fetchAllAssociative();

        // Indexe par numéro de mois pour un accès O(1)
        $byMonth = [];
        foreach ($dbRows as $row) {
            $byMonth[(int) $row['mo']] = ['revenue' => (float) $row['revenue'], 'cnt' => (int) $row['cnt']];
        }

        // Génère le tableau complet des 12 mois (zéros pour les mois vides)
        $frenchMonths = [
            1 => 'Janvier', 2 => 'Février',  3 => 'Mars',     4 => 'Avril',
            5 => 'Mai',     6 => 'Juin',     7 => 'Juillet',  8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
        ];

        $result = [];
        for ($m = 1; $m <= 12; $m++) {
            $result[] = [
                'month'    => sprintf('%04d-%02d', $year, $m),
                'label'    => $frenchMonths[$m] . ' ' . $year,
                'earnings' => $byMonth[$m]['revenue'] ?? 0.0,
                'bookings' => $byMonth[$m]['cnt']     ?? 0,
            ];
        }

        return $result;
    }

    /**
     * Retourne le CA, le nombre de réservations et le tarif moyen par bateau.
     * Effectue une seconde requête pour récupérer titre et image sans conflit GROUP BY.
     */
    public function findRevenueByBoat(string $ownerId, ?string $boatId = null): array
    {
        $statuses = [Booking::STATUS_CONFIRMED, Booking::STATUS_COMPLETED];

        $qb = $this->createQueryBuilder('b')
            ->select('IDENTITY(b.boat) AS boatId, SUM(b.totalAmount) AS revenue, COUNT(b.id) AS cnt, AVG(b.dailyRate) AS avgRate')
            ->where('b.owner = :ownerId')
            ->andWhere('b.status IN (:statuses)')
            ->groupBy('b.boat')
            ->orderBy('revenue', 'DESC')
            ->setParameter('ownerId', $ownerId)
            ->setParameter('statuses', $statuses);

        if ($boatId) {
            $qb->join('b.boat', 'boat')
               ->andWhere('boat.id = :boatId')
               ->setParameter('boatId', $boatId);
        }

        $rows = $qb->getQuery()->getArrayResult();

        if (empty($rows)) {
            return [];
        }

        // Charge les infos des bateaux en une seule requête supplémentaire
        $boatIds  = array_column($rows, 'boatId');
        $boatData = $this->getEntityManager()
            ->createQueryBuilder()
            ->select('boat.id, boat.title, boat.images')
            ->from(Boat::class, 'boat')
            ->where('boat.id IN (:ids)')
            ->setParameter('ids', $boatIds)
            ->getQuery()
            ->getArrayResult();

        $boatMap = array_column($boatData, null, 'id');

        return array_map(fn(array $row) => [
            'boatId'           => $row['boatId'],
            'boatTitle'        => $boatMap[$row['boatId']]['title'] ?? '—',
            'boatImage'        => is_array($boatMap[$row['boatId']]['images'] ?? null)
                                    ? ($boatMap[$row['boatId']]['images'][0] ?? null)
                                    : null,
            'earnings'         => (float) ($row['revenue'] ?? 0),
            'bookings'         => (int) ($row['cnt'] ?? 0),
            'averageDailyRate' => round((float) ($row['avgRate'] ?? 0), 2),
        ], $rows);
    }

    /**
     * Retourne toutes les réservations de tous les bateaux du propriétaire sur une plage de dates,
     * formatées pour un affichage calendrier (vue agenda multi-bateaux).
     *
     * Une seule requête JOIN remplace les N requêtes séparées par bateau.
     * Les réservations annulées sont exclues par défaut.
     *
     * @param string                 $ownerId   ID du propriétaire
     * @param \DateTimeImmutable     $from      Début de la plage (inclus)
     * @param \DateTimeImmutable     $to        Fin de la plage (inclus)
     * @param string|null            $boatId    Filtre optionnel sur un bateau
     * @param string|null            $status    Filtre optionnel sur le statut
     */
    public function findCalendarByOwner(
        string $ownerId,
        \DateTimeImmutable $from,
        \DateTimeImmutable $to,
        ?string $boatId = null,
        ?string $status = null,
    ): array {
        $qb = $this->createQueryBuilder('b')
            ->join('b.boat', 'boat')
            ->addSelect('boat')
            ->join('b.renter', 'renter')
            ->addSelect('renter')
            ->where('b.owner = :ownerId')
            // Inclut toute réservation qui chevauche la plage demandée (pas seulement celles qui commencent dedans)
            ->andWhere('b.startDate <= :to')
            ->andWhere('b.endDate >= :from')
            ->andWhere('b.status != :cancelled')
            ->orderBy('b.startDate', 'ASC')
            ->setParameter('ownerId', $ownerId)
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->setParameter('cancelled', Booking::STATUS_CANCELLED);

        if ($boatId) {
            $qb->andWhere('boat.id = :boatId')->setParameter('boatId', $boatId);
        }

        if ($status) {
            $qb->andWhere('b.status = :status')->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Retourne les dernières réservations CONFIRMED/COMPLETED avec bateau et locataire.
     */
    public function findRecentByOwner(string $ownerId, int $limit = 10): array
    {
        return $this->createQueryBuilder('b')
            ->join('b.boat', 'boat')
            ->addSelect('boat')
            ->join('b.renter', 'renter')
            ->addSelect('renter')
            ->where('b.owner = :ownerId')
            ->andWhere('b.status IN (:statuses)')
            ->orderBy('b.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setParameter('ownerId', $ownerId)
            ->setParameter('statuses', [Booking::STATUS_CONFIRMED, Booking::STATUS_COMPLETED])
            ->getQuery()
            ->getResult();
    }
}
