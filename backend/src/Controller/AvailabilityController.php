<?php

namespace App\Controller;

use App\Entity\Availability;
use App\Repository\AvailabilityRepository;
use App\Repository\BoatRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/availability')]
class AvailabilityController extends AbstractApiController
{
    public function __construct(
        private readonly AvailabilityRepository $availabilityRepo,
        private readonly BoatRepository $boatRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/{boatId}', methods: ['GET'])]
    public function getBoatAvailability(string $boatId, Request $request): JsonResponse
    {
        $boat = $this->boatRepo->find($boatId);
        if (!$boat) {
            return $this->error('Boat not found', 404);
        }

        $from = $request->query->get('from');
        $to   = $request->query->get('to');

        $qb = $this->em->createQueryBuilder()
            ->select('a')
            ->from(Availability::class, 'a')
            ->where('a.boat = :boat')
            ->setParameter('boat', $boat)
            ->orderBy('a.date', 'ASC');

        if ($from) {
            $qb->andWhere('a.date >= :from')->setParameter('from', new \DateTimeImmutable($from));
        }
        if ($to) {
            $qb->andWhere('a.date <= :to')->setParameter('to', new \DateTimeImmutable($to));
        }

        $availabilities = $qb->getQuery()->getResult();

        return $this->success([
            'availability' => array_map(fn(Availability $a) => $a->toArray(), $availabilities),
        ]);
    }

    #[Route('/{boatId}', methods: ['POST', 'PUT'])]
    public function setAvailability(string $boatId, Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($boatId);

        if (!$boat) {
            return $this->error('Boat not found', 404);
        }
        if ($boat->getOwner()->getId() !== $user->getId() && $user->getRole() !== 'ADMIN') {
            return $this->error('Forbidden', 403);
        }

        $body = $this->getJsonBody($request);
        $dates = $body['dates'] ?? [];
        $isAvailable = $body['isAvailable'] ?? true;

        foreach ($dates as $dateStr) {
            try {
                $date = new \DateTimeImmutable($dateStr);
            } catch (\Exception) {
                continue;
            }

            $avail = $this->availabilityRepo->findOneBy(['boat' => $boat, 'date' => $date]);
            if (!$avail) {
                $avail = new Availability();
                $avail->setBoat($boat);
                $avail->setDate($date);
                $this->em->persist($avail);
            }
            $avail->setIsAvailable((bool) $isAvailable);
            if (isset($body['note'])) {
                $avail->setNote($body['note']);
            }
        }

        $this->em->flush();
        return $this->success(['message' => 'Availability updated']);
    }
}
