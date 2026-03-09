<?php

namespace App\Controller;

use App\Entity\Review;
use App\Repository\BookingRepository;
use App\Repository\ReviewRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/reviews')]
class ReviewController extends AbstractApiController
{
    public function __construct(
        private readonly ReviewRepository $reviewRepo,
        private readonly BookingRepository $bookingRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $body = $this->getJsonBody($request);

        $bookingId = $body['bookingId'] ?? null;
        $type      = $body['type'] ?? null;
        $rating    = (int) ($body['rating'] ?? 0);
        $comment   = $body['comment'] ?? '';

        if (!$bookingId || !$type || !$rating || !$comment) {
            return $this->error('bookingId, type, rating and comment are required', 400);
        }
        if (!in_array($type, [Review::TYPE_RENTER_TO_BOAT, Review::TYPE_OWNER_TO_RENTER], true)) {
            return $this->error('Invalid review type', 400);
        }
        if ($rating < 1 || $rating > 5) {
            return $this->error('Rating must be between 1 and 5', 400);
        }

        $booking = $this->bookingRepo->find($bookingId);
        if (!$booking) {
            return $this->error('Booking not found', 404);
        }
        if ($booking->getStatus() !== 'COMPLETED') {
            return $this->error('Can only review completed bookings', 400);
        }

        // Check authorization
        if ($type === Review::TYPE_RENTER_TO_BOAT && $booking->getRenter()->getId() !== $user->getId()) {
            return $this->error('Forbidden', 403);
        }
        if ($type === Review::TYPE_OWNER_TO_RENTER && $booking->getOwner()->getId() !== $user->getId()) {
            return $this->error('Forbidden', 403);
        }

        // Check if already reviewed
        $existing = $this->reviewRepo->findOneBy(['booking' => $booking, 'type' => $type]);
        if ($existing) {
            return $this->error('Review already submitted for this booking and type', 409);
        }

        $reviewee = $type === Review::TYPE_RENTER_TO_BOAT ? $booking->getOwner() : $booking->getRenter();

        $review = new Review();
        $review->setBooking($booking);
        $review->setBoat($booking->getBoat());
        $review->setReviewer($user);
        $review->setReviewee($reviewee);
        $review->setType($type);
        $review->setRating($rating);
        $review->setComment($comment);

        $this->em->persist($review);

        // La note du bateau est recalculée uniquement lors de l'approbation admin (F4).
        // Ici on ne met pas à jour boat.rating car l'avis est encore en PENDING.

        $this->em->flush();
        return $this->success(['review' => $review->toArray()], 201);
    }

    #[Route('/user/{userId}', methods: ['GET'])]
    public function userReviews(string $userId, Request $request): JsonResponse
    {
        [$page, $limit] = $this->paginationParams($request);

        $qb = $this->em->createQueryBuilder()
            ->select('r')
            ->from(Review::class, 'r')
            ->join('r.reviewee', 'reviewee')
            ->where('reviewee.id = :userId')
            ->andWhere('r.moderationStatus = :status')
            ->setParameter('userId', $userId)
            ->setParameter('status', Review::STATUS_APPROVED)
            ->orderBy('r.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $reviews = $qb->getQuery()->getResult();
        $total   = (int) $this->em->createQueryBuilder()
            ->select('COUNT(r.id)')
            ->from(Review::class, 'r')
            ->join('r.reviewee', 'reviewee')
            ->where('reviewee.id = :userId')
            ->andWhere('r.moderationStatus = :status')
            ->setParameter('userId', $userId)
            ->setParameter('status', Review::STATUS_APPROVED)
            ->getQuery()
            ->getSingleScalarResult();

        return $this->paginated(
            array_map(fn(Review $r) => $r->toArray(), $reviews),
            $total, $page, $limit
        );
    }

    #[Route('/boat/{boatId}', methods: ['GET'])]
    public function boatReviews(string $boatId, Request $request): JsonResponse
    {
        [$page, $limit] = $this->paginationParams($request);

        $qb = $this->em->createQueryBuilder()
            ->select('r')
            ->from(Review::class, 'r')
            ->join('r.boat', 'boat')
            ->where('boat.id = :boatId')
            ->andWhere('r.type = :type')
            ->andWhere('r.moderationStatus = :status')
            ->setParameter('boatId', $boatId)
            ->setParameter('type', Review::TYPE_RENTER_TO_BOAT)
            ->setParameter('status', Review::STATUS_APPROVED)
            ->orderBy('r.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $reviews = $qb->getQuery()->getResult();
        $total   = (int) $this->em->createQueryBuilder()
            ->select('COUNT(r.id)')
            ->from(Review::class, 'r')
            ->join('r.boat', 'boat')
            ->where('boat.id = :boatId')
            ->andWhere('r.type = :type')
            ->andWhere('r.moderationStatus = :status')
            ->setParameter('boatId', $boatId)
            ->setParameter('type', Review::TYPE_RENTER_TO_BOAT)
            ->setParameter('status', Review::STATUS_APPROVED)
            ->getQuery()
            ->getSingleScalarResult();

        return $this->paginated(
            array_map(fn(Review $r) => $r->toArray(), $reviews),
            $total, $page, $limit
        );
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /**
     * Liste tous les avis avec filtre optionnel sur moderationStatus.
     * Réservé aux admins.
     */
    #[Route('/admin', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        if ($user->getRole() !== 'ADMIN') {
            return $this->error('Accès réservé aux administrateurs', 403);
        }

        [$page, $limit] = $this->paginationParams($request, 20);
        $status = $request->query->get('status');

        $qb = $this->em->createQueryBuilder()
            ->select('r')
            ->from(Review::class, 'r')
            ->orderBy('r.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $countQb = $this->em->createQueryBuilder()
            ->select('COUNT(r.id)')
            ->from(Review::class, 'r');

        if ($status && in_array($status, [Review::STATUS_PENDING, Review::STATUS_APPROVED, Review::STATUS_REJECTED], true)) {
            $qb->where('r.moderationStatus = :status')->setParameter('status', $status);
            $countQb->where('r.moderationStatus = :status')->setParameter('status', $status);
        }

        $reviews = $qb->getQuery()->getResult();
        $total   = (int) $countQb->getQuery()->getSingleScalarResult();

        return $this->paginated(
            array_map(fn(Review $r) => $r->toArray(), $reviews),
            $total, $page, $limit
        );
    }

    /**
     * Approuve ou rejette un avis.
     * Met également à jour la note du bateau si l'avis est de type RENTER_TO_BOAT.
     */
    #[Route('/admin/{id}', methods: ['PATCH'])]
    public function adminUpdate(string $id, Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        if ($user->getRole() !== 'ADMIN') {
            return $this->error('Accès réservé aux administrateurs', 403);
        }

        $review = $this->reviewRepo->find($id);
        if (!$review) {
            return $this->error('Avis introuvable', 404);
        }

        $body      = $this->getJsonBody($request);
        $newStatus = $body['moderationStatus'] ?? null;

        if (!in_array($newStatus, [Review::STATUS_APPROVED, Review::STATUS_REJECTED], true)) {
            return $this->error('moderationStatus doit être APPROVED ou REJECTED', 400);
        }

        $previousStatus = $review->getModerationStatus();
        $review->setModerationStatus($newStatus);
        $review->setIsPublished($newStatus === Review::STATUS_APPROVED);

        // Recalcule la note du bateau si la visibilité d'un avis locataire change
        if ($review->getType() === Review::TYPE_RENTER_TO_BOAT) {
            $boat = $review->getBoat();
            $approvedReviews = $this->reviewRepo->findBy([
                'boat'             => $boat,
                'type'             => Review::TYPE_RENTER_TO_BOAT,
                'moderationStatus' => Review::STATUS_APPROVED,
            ]);

            // Si l'avis vient d'être approuvé, l'inclure dans le calcul
            $allApproved = $newStatus === Review::STATUS_APPROVED
                ? array_filter($approvedReviews, fn(Review $r) => $r->getId() !== $review->getId())
                : $approvedReviews;
            $ratings = array_map(fn(Review $r) => $r->getRating(), array_values($allApproved));
            if ($newStatus === Review::STATUS_APPROVED) {
                $ratings[] = $review->getRating();
            }

            $count = count($ratings);
            $boat->setRating($count > 0 ? round(array_sum($ratings) / $count, 1) : 0.0);
            $boat->setReviewCount($count);
        }

        $this->em->flush();
        return $this->success(['review' => $review->toArray()]);
    }
}
