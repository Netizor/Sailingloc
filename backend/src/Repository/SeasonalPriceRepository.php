<?php

namespace App\Repository;

use App\Entity\SeasonalPrice;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SeasonalPriceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SeasonalPrice::class);
    }

    /**
     * Retourne tous les prix saisonniers d'un bateau,
     * triés par date de début croissante.
     *
     * @return SeasonalPrice[]
     */
    public function findForBoat(string $boatId): array
    {
        return $this->createQueryBuilder('sp')
            ->join('sp.boat', 'b')
            ->where('b.id = :boatId')
            ->setParameter('boatId', $boatId)
            ->orderBy('sp.startDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne tous les tarifs saisonniers d'un bateau qui chevauchent une plage de dates.
     * Utilisé pour calculer le prix d'une réservation multi-jours en une seule requête,
     * évitant un appel DB par jour de réservation.
     * Triés par startDate DESC : en cas de chevauchement, la période la plus récente prime.
     *
     * @return SeasonalPrice[]
     */
    public function findForBoatInRange(
        string $boatId,
        \DateTimeImmutable $from,
        \DateTimeImmutable $to,
    ): array {
        return $this->createQueryBuilder('sp')
            ->join('sp.boat', 'b')
            ->where('b.id = :boatId')
            ->andWhere('sp.startDate <= :to')
            ->andWhere('sp.endDate >= :from')
            ->setParameter('boatId', $boatId)
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->orderBy('sp.startDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne le tarif saisonnier applicable à une date précise pour un bateau,
     * ou null si aucune règle ne couvre cette date.
     */
    public function findActiveForDate(string $boatId, \DateTimeImmutable $date): ?SeasonalPrice
    {
        // En cas de chevauchement, on retourne la période la plus spécifique (startDate la plus récente).
        return $this->createQueryBuilder('sp')
            ->join('sp.boat', 'b')
            ->where('b.id = :boatId')
            ->andWhere('sp.startDate <= :date')
            ->andWhere('sp.endDate >= :date')
            ->setParameter('boatId', $boatId)
            ->setParameter('date', $date)
            ->orderBy('sp.startDate', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
