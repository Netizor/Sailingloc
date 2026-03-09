<?php

namespace App\Controller;

use App\Entity\Availability;
use App\Entity\Boat;
use App\Entity\Booking;
use App\Entity\Review;
use App\Entity\User;
use App\Repository\AvailabilityRepository;
use App\Repository\BoatRepository;
use App\Repository\BookingRepository;
use App\Repository\ReviewRepository;
use App\Repository\UserRepository;
use App\Service\StripeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin')]
class AdminController extends AbstractApiController
{
    public function __construct(
        private readonly UserRepository $userRepo,
        private readonly BoatRepository $boatRepo,
        private readonly BookingRepository $bookingRepo,
        private readonly ReviewRepository $reviewRepo,
        private readonly AvailabilityRepository $availabilityRepo,
        private readonly EntityManagerInterface $em,
        private readonly StripeService $stripe,
    ) {}

    private function assertAdmin(): void
    {
        if ($this->getCurrentUser()->getRole() !== 'ADMIN') {
            throw new \RuntimeException('Admin access required', 403);
        }
    }

    #[Route('/dashboard', methods: ['GET'])]
    #[Route('/stats', methods: ['GET'])]
    public function dashboard(): JsonResponse
    {
        $this->assertAdmin();

        $totalUsers    = (int) $this->em->createQueryBuilder()->select('COUNT(u.id)')->from(User::class, 'u')->getQuery()->getSingleScalarResult();
        $totalBoats    = (int) $this->em->createQueryBuilder()->select('COUNT(b.id)')->from(Boat::class, 'b')->getQuery()->getSingleScalarResult();
        $totalBookings = (int) $this->em->createQueryBuilder()->select('COUNT(bk.id)')->from(Booking::class, 'bk')->getQuery()->getSingleScalarResult();
        $confirmedBookings = (int) $this->em->createQueryBuilder()
            ->select('COUNT(bk.id)')->from(Booking::class, 'bk')
            ->where('bk.status = :s')->setParameter('s', 'CONFIRMED')
            ->getQuery()->getSingleScalarResult();
        $pendingBoats = (int) $this->em->createQueryBuilder()
            ->select('COUNT(b.id)')->from(Boat::class, 'b')
            ->where('b.status = :s')->setParameter('s', 'PENDING_REVIEW')
            ->getQuery()->getSingleScalarResult();

        $completedBookings = (int) $this->em->createQueryBuilder()
            ->select('COUNT(bk.id)')->from(Booking::class, 'bk')
            ->where('bk.status = :s')->setParameter('s', 'COMPLETED')
            ->getQuery()->getSingleScalarResult();

        $revenue = $this->em->createQueryBuilder()
            ->select('SUM(bk.platformFee)')
            ->from(Booking::class, 'bk')
            ->where('bk.status IN (:statuses)')
            ->setParameter('statuses', ['CONFIRMED', 'COMPLETED'])
            ->getQuery()->getSingleScalarResult() ?? 0;

        // Taux de conversion : réservations abouties / total réservations (F1)
        $conversionRate = $totalBookings > 0
            ? round(($confirmedBookings + $completedBookings) / $totalBookings * 100, 1)
            : 0.0;

        // Nombre d'avis en attente de modération (F4)
        $pendingReviews = (int) $this->em->createQueryBuilder()
            ->select('COUNT(r.id)')->from(Review::class, 'r')
            ->where('r.moderationStatus = :s')->setParameter('s', 'PENDING')
            ->getQuery()->getSingleScalarResult();

        // Revenus plateforme par mois pour l'année en cours (E4 — graphique)
        $currentYear       = (int) (new \DateTimeImmutable())->format('Y');
        $revenueByMonthRaw = $this->em->getConnection()->executeQuery(
            'SELECT MONTH(created_at) AS m, SUM(platform_fee) AS revenue
               FROM booking
              WHERE status IN (\'CONFIRMED\', \'COMPLETED\')
                AND YEAR(created_at) = :year
              GROUP BY m
              ORDER BY m ASC',
            ['year' => $currentYear],
        )->fetchAllAssociative();

        // Construire un tableau indexé par numéro de mois pour lookup O(1)
        $monthlyRevenue = array_fill(1, 12, 0.0);
        foreach ($revenueByMonthRaw as $row) {
            $monthlyRevenue[(int) $row['m']] = (float) $row['revenue'];
        }
        $monthNames     = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        $revenueByMonth = array_map(
            fn(int $i) => ['month' => $monthNames[$i - 1], 'revenue' => $monthlyRevenue[$i]],
            range(1, 12),
        );

        return $this->success([
            'totalUsers'        => $totalUsers,
            'totalBoats'        => $totalBoats,
            'totalBookings'     => $totalBookings,
            'confirmedBookings' => $confirmedBookings,
            'completedBookings' => $completedBookings,
            'pendingBoats'      => $pendingBoats,
            'platformRevenue'   => (float) $revenue,
            'conversionRate'    => $conversionRate,
            'pendingReviews'    => $pendingReviews,
            'revenueByMonth'    => $revenueByMonth,
        ]);
    }

    #[Route('/users', methods: ['GET'])]
    public function users(Request $request): JsonResponse
    {
        $this->assertAdmin();
        [$page, $limit] = $this->paginationParams($request);
        $filters = array_filter([
            'role'     => $request->query->get('role'),
            'isActive' => $request->query->has('isActive') ? (bool) $request->query->get('isActive') : null,
            'search'   => $request->query->get('search'),
        ], fn($v) => $v !== null);

        $result = $this->userRepo->findPaginated($page, $limit, $filters);
        return $this->paginated(
            array_map(fn(User $u) => $u->toArray(), $result['items']),
            $result['total'], $page, $limit
        );
    }

    #[Route('/users/{id}', methods: ['PATCH'])]
    public function updateUser(string $id, Request $request): JsonResponse
    {
        $this->assertAdmin();
        $user = $this->userRepo->find($id);
        if (!$user) {
            return $this->error('User not found', 404);
        }

        $body = $this->getJsonBody($request);
        if (isset($body['isActive']))    $user->setIsActive((bool) $body['isActive']);
        if (isset($body['role']))        $user->setRole($body['role']);
        if (isset($body['kycVerified'])) $user->setKycVerified((bool) $body['kycVerified']);

        $this->em->flush();
        return $this->success($user->toArray());
    }

    #[Route('/boats', methods: ['GET'])]
    public function boats(Request $request): JsonResponse
    {
        $this->assertAdmin();
        [$page, $limit] = $this->paginationParams($request);

        $qb = $this->em->createQueryBuilder()
            ->select('b')
            ->from(Boat::class, 'b')
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $status = $request->query->get('status');
        if ($status) {
            $qb->where('b.status = :status')->setParameter('status', $status);
        }

        $boats = $qb->getQuery()->getResult();
        $total = (int) $this->em->createQueryBuilder()
            ->select('COUNT(b.id)')->from(Boat::class, 'b')
            ->getQuery()->getSingleScalarResult();

        return $this->paginated(
            array_map(fn(Boat $b) => $b->toArray(true), $boats),
            $total, $page, $limit
        );
    }

    #[Route('/boats/{id}', methods: ['PATCH'])]
    #[Route('/boats/{id}/moderate', methods: ['PATCH'])]
    public function updateBoat(string $id, Request $request): JsonResponse
    {
        $this->assertAdmin();
        $boat = $this->boatRepo->find($id);
        if (!$boat) {
            return $this->error('Boat not found', 404);
        }

        $body = $this->getJsonBody($request);
        if (isset($body['status'])) $boat->setStatus($body['status']);

        $this->em->flush();
        return $this->success($boat->toArray());
    }

    #[Route('/bookings', methods: ['GET'])]
    public function bookings(Request $request): JsonResponse
    {
        $this->assertAdmin();
        [$page, $limit] = $this->paginationParams($request);

        $qb = $this->em->createQueryBuilder()
            ->select('bk')
            ->from(Booking::class, 'bk')
            ->orderBy('bk.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $status = $request->query->get('status');
        if ($status) {
            $qb->where('bk.status = :status')->setParameter('status', strtoupper($status));
        }

        $bookings = $qb->getQuery()->getResult();
        $total    = (int) $this->em->createQueryBuilder()
            ->select('COUNT(bk.id)')->from(Booking::class, 'bk')
            ->getQuery()->getSingleScalarResult();

        return $this->paginated(
            array_map(fn(Booking $b) => $b->toArray(true, true), $bookings),
            $total, $page, $limit
        );
    }

    #[Route('/reviews', methods: ['GET'])]
    public function reviews(Request $request): JsonResponse
    {
        $this->assertAdmin();
        [$page, $limit] = $this->paginationParams($request);

        $qb = $this->em->createQueryBuilder()
            ->select('r')
            ->from(Review::class, 'r')
            ->orderBy('r.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $isPublished = $request->query->get('isPublished');
        if ($isPublished !== null) {
            $qb->where('r.isPublished = :pub')->setParameter('pub', (bool) $isPublished);
        }

        $reviews = $qb->getQuery()->getResult();
        $total   = (int) $this->em->createQueryBuilder()
            ->select('COUNT(r.id)')->from(Review::class, 'r')
            ->getQuery()->getSingleScalarResult();

        return $this->paginated(
            array_map(fn(Review $r) => $r->toArray(), $reviews),
            $total, $page, $limit
        );
    }

    #[Route('/reviews/{id}/moderate', methods: ['PATCH'])]
    public function moderateReview(string $id, Request $request): JsonResponse
    {
        $this->assertAdmin();
        $review = $this->reviewRepo->find($id);
        if (!$review) {
            return $this->error('Review not found', 404);
        }

        $body = $this->getJsonBody($request);
        if (isset($body['isPublished'])) {
            $review->setIsPublished((bool) $body['isPublished']);
        }

        $this->em->flush();
        return $this->success($review->toArray());
    }

    #[Route('/transactions', methods: ['GET'])]
    public function transactions(Request $request): JsonResponse
    {
        $this->assertAdmin();
        [$page, $limit] = $this->paginationParams($request);

        $qb = $this->em->createQueryBuilder()
            ->select('bk')
            ->from(Booking::class, 'bk')
            ->where('bk.stripePaymentIntentId IS NOT NULL')
            ->orderBy('bk.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $status = $request->query->get('status');
        if ($status) {
            $qb->andWhere('bk.status = :status')->setParameter('status', strtoupper($status));
        }

        $bookings = $qb->getQuery()->getResult();
        $total    = (int) $this->em->createQueryBuilder()
            ->select('COUNT(bk.id)')->from(Booking::class, 'bk')
            ->where('bk.stripePaymentIntentId IS NOT NULL')
            ->getQuery()->getSingleScalarResult();

        $transactions = array_map(fn(Booking $b) => [
            'id'                    => $b->getId(),
            'type'                  => $b->getDepositRefunded() ? 'REFUND' : 'PAYMENT',
            'amount'                => $b->getTotalAmount(),
            'platformFee'           => $b->getPlatformFee(),
            'status'                => $b->getStatus(),
            'stripePaymentIntentId' => $b->getStripePaymentIntentId(),
            'createdAt'             => $b->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'booking'               => $b->toArray(true, true),
        ], $bookings);

        return $this->paginated($transactions, $total, $page, $limit);
    }

    /**
     * Résout un litige (F2) : passe la réservation en COMPLETED ou CANCELLED.
     * Si la décision est CANCELLED et qu'un paiement Stripe existe, un remboursement est créé.
     */
    #[Route('/bookings/{id}/resolve', methods: ['POST'])]
    public function resolveDispute(string $id, Request $request): JsonResponse
    {
        $this->assertAdmin();

        $booking = $this->bookingRepo->find($id);
        if (!$booking) {
            return $this->error('Réservation introuvable', 404);
        }
        if ($booking->getStatus() !== Booking::STATUS_DISPUTED) {
            return $this->error('Seules les réservations en litige peuvent être résolues', 400);
        }

        $body       = $this->getJsonBody($request);
        $resolution = $body['resolution'] ?? null; // 'complete' ou 'cancel'
        $refund     = (bool) ($body['refund'] ?? false);

        if (!in_array($resolution, ['complete', 'cancel'], true)) {
            return $this->error('resolution doit être "complete" ou "cancel"', 400);
        }

        if ($resolution === 'cancel') {
            // Remboursement Stripe si demandé et paiement existant
            $paymentIntentId = $booking->getStripePaymentIntentId();
            if ($refund && $paymentIntentId) {
                try {
                    $pi = $this->stripe->retrievePaymentIntent($paymentIntentId);
                    if ($pi->status === 'succeeded') {
                        $this->stripe->createRefund($paymentIntentId);
                    }
                } catch (\Throwable $e) {
                    // Le remboursement Stripe est best-effort ; ne pas bloquer la résolution
                }
            }

            // Libérer les dates de disponibilité bloquées
            $dates = $this->generateDateRange($booking->getStartDate(), $booking->getEndDate());
            foreach ($dates as $date) {
                $avail = $this->availabilityRepo->findOneBy(['boat' => $booking->getBoat(), 'date' => $date]);
                if ($avail) {
                    $avail->setIsAvailable(true);
                    $avail->setNote(null);
                    $avail->setBookingId(null);
                }
            }

            $booking->setStatus(Booking::STATUS_CANCELLED);
            $booking->setCancellationReason($body['adminNote'] ?? 'Résolution de litige — annulé par l\'administration');
            $booking->setCancelledAt(new \DateTimeImmutable());
        } else {
            $booking->setStatus(Booking::STATUS_COMPLETED);
        }

        $this->em->flush();
        return $this->success($booking->toArray(true, true));
    }

    /** @return \DateTimeImmutable[] */
    private function generateDateRange(\DateTimeImmutable $start, \DateTimeImmutable $end): array
    {
        $dates   = [];
        $current = $start->setTime(0, 0, 0);
        $end     = $end->setTime(0, 0, 0);
        while ($current <= $end) {
            $dates[] = $current;
            $current = $current->modify('+1 day');
        }
        return $dates;
    }
}
