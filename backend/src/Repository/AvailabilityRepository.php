<?php

namespace App\Repository;

use App\Entity\Availability;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AvailabilityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Availability::class);
    }

    /** @return Availability[] */
    public function findBlockedInRange(string $boatId, \DateTimeImmutable $start, \DateTimeImmutable $end): array
    {
        return $this->createQueryBuilder('a')
            ->join('a.boat', 'boat')
            ->where('boat.id = :boatId')
            ->andWhere('a.date >= :start')
            ->andWhere('a.date <= :end')
            ->andWhere('a.isAvailable = false')
            ->setParameter('boatId', $boatId)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->getQuery()
            ->getResult();
    }
}
