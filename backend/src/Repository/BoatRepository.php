<?php

namespace App\Repository;

use App\Entity\Boat;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class BoatRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Boat::class);
    }

    public function findPublicPaginated(int $page, int $limit, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('b')
            ->leftJoin('b.owner', 'o')
            ->addSelect('o')
            ->where('b.status = :status')
            ->setParameter('status', 'active');

        $this->applyFilters($qb, $filters);
        $this->applySort($qb, $filters['sort'] ?? null);

        $qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit);

        $items = $qb->getQuery()->getResult();

        $countQb = $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.status = :status')
            ->setParameter('status', 'active');

        $this->applyFilters($countQb, $filters);

        $total = (int) $countQb->getQuery()->getSingleScalarResult();

        return ['items' => $items, 'total' => $total];
    }

    private function applyFilters(QueryBuilder $qb, array $filters): void
    {
        // Location: search in both city and port (case-insensitive LIKE)
        if (!empty($filters['location'])) {
            $qb->andWhere('b.city LIKE :location OR b.port LIKE :location')
               ->setParameter('location', '%' . $filters['location'] . '%');
        }

        // Types: array of boat type values
        if (!empty($filters['types'])) {
            $qb->andWhere('b.type IN (:types)')
               ->setParameter('types', (array) $filters['types']);
        }

        // Minimum capacity
        if (isset($filters['capacity']) && $filters['capacity'] !== '') {
            $qb->andWhere('b.capacity >= :capacity')
               ->setParameter('capacity', (int) $filters['capacity']);
        }

        // Price range
        if (isset($filters['minPrice']) && $filters['minPrice'] !== '') {
            $qb->andWhere('b.dailyRate >= :minPrice')
               ->setParameter('minPrice', (float) $filters['minPrice']);
        }
        if (isset($filters['maxPrice']) && $filters['maxPrice'] !== '') {
            $qb->andWhere('b.dailyRate <= :maxPrice')
               ->setParameter('maxPrice', (float) $filters['maxPrice']);
        }

        // Skipper availability
        if (isset($filters['withSkipper']) && $filters['withSkipper'] !== null) {
            $qb->andWhere('b.withSkipper = :withSkipper')
               ->setParameter('withSkipper', (bool) $filters['withSkipper']);
        }

        // Date availability: exclude boats that have overlapping CONFIRMED or PENDING bookings
        if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
            $qb->andWhere(
                'NOT EXISTS (
                    SELECT 1 FROM App\Entity\Booking bk
                    WHERE bk.boat = b
                      AND bk.status IN (:busyStatuses)
                      AND bk.startDate < :endDate
                      AND bk.endDate > :startDate
                )'
            )
            ->setParameter('busyStatuses', ['CONFIRMED', 'PENDING'])
            ->setParameter('startDate', new \DateTimeImmutable($filters['startDate']))
            ->setParameter('endDate', new \DateTimeImmutable($filters['endDate']));
        }
    }

    private function applySort(QueryBuilder $qb, ?string $sort): void
    {
        match ($sort) {
            'price_asc'    => $qb->orderBy('b.dailyRate', 'ASC'),
            'price_desc'   => $qb->orderBy('b.dailyRate', 'DESC'),
            'rating_desc'  => $qb->orderBy('b.rating', 'DESC'),
            'created_desc' => $qb->orderBy('b.createdAt', 'DESC'),
            default        => $qb->orderBy('b.createdAt', 'DESC'),
        };
    }
}
