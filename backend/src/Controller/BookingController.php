<?php

namespace App\Controller;

use App\Entity\Availability;
use App\Entity\Booking;
use App\Entity\Notification;
use App\Entity\SeasonalPrice;
use App\Entity\User;
use App\Repository\AvailabilityRepository;
use App\Repository\BookingRepository;
use App\Repository\BoatRepository;
use App\Repository\SeasonalPriceRepository;
use App\Service\EmailService;
use App\Service\MessageService;
use App\Service\StripeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/bookings')]
class BookingController extends AbstractApiController
{
    public function __construct(
        private readonly BookingRepository $bookingRepo,
        private readonly BoatRepository $boatRepo,
        private readonly AvailabilityRepository $availabilityRepo,
        private readonly SeasonalPriceRepository $seasonalPriceRepo,
        private readonly EntityManagerInterface $em,
        private readonly StripeService $stripe,
        private readonly MessageService $messageService,
        private readonly EmailService $emailService,
        private readonly RateLimiterFactory $bookingCreateLimiter,
    ) {}

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();

        // Limite : 20 créations de réservation par heure par utilisateur
        if (!$this->bookingCreateLimiter->create('booking_' . $user->getId())->consume(1)->isAccepted()) {
            return $this->error('Trop de tentatives. Réessayez dans quelques instants.', 429);
        }

        $body = $this->getJsonBody($request);

        $boatId      = $body['boatId'] ?? null;
        $startDate   = $body['startDate'] ?? null;
        $endDate     = $body['endDate'] ?? null;
        $withSkipper = (bool) ($body['withSkipper'] ?? false);

        if (!$boatId || !$startDate || !$endDate) {
            return $this->error('boatId, startDate and endDate are required', 400);
        }

        $boat = $this->boatRepo->find($boatId);
        if (!$boat) {
            return $this->error('Boat not found', 404);
        }
        if ($boat->getStatus() !== 'active') {
            return $this->error('Boat is not available for booking', 400);
        }
        if ($boat->getOwner()->getId() === $user->getId()) {
            return $this->error('You cannot book your own boat', 400);
        }

        try {
            $start = new \DateTimeImmutable($startDate);
            $end   = new \DateTimeImmutable($endDate);
        } catch (\Exception) {
            return $this->error('Invalid date format', 400);
        }

        $start = $start->setTime(0, 0, 0);
        $end   = $end->setTime(0, 0, 0);

        if ($start >= $end) {
            return $this->error('endDate must be after startDate', 400);
        }

        // Idempotency: if an identical PENDING booking already exists for this renter
        // (e.g. the previous request succeeded server-side but timed out client-side),
        // return it instead of creating a duplicate or failing with 409.
        $existingBooking = $this->bookingRepo->findOneBy([
            'boat'      => $boat,
            'renter'    => $user,
            'startDate' => $start,
            'endDate'   => $end,
            'status'    => Booking::STATUS_PENDING,
        ]);
        if ($existingBooking) {
            return $this->success($existingBooking->toArray(), 201);
        }

        // Calcul du prix jour par jour en tenant compte des tarifs saisonniers.
        // Une seule requête DB récupère toutes les périodes qui chevauchent la réservation ;
        // la résolution jour par jour se fait ensuite en PHP (pas de N+1).
        $totalDays      = (int) $start->diff($end)->days;
        $seasonalPrices = $this->seasonalPriceRepo->findForBoatInRange(
            (string) $boat->getId(),
            $start,
            $end->modify('-1 day'), // endDate est exclusif : on s'arrête au dernier jour inclus
        );

        [$subtotal, $effectiveDailyRate] = $this->computeSubtotal(
            $boat->getDailyRate(),
            $boat->getSkipperPrice(),
            $withSkipper,
            $start,
            $totalDays,
            $seasonalPrices,
        );

        // Le tarif journalier effectif moyen est stocké sur la réservation pour l'affichage.
        $dailyRate = $effectiveDailyRate;

        // Appliquer la remise dégressive (E2) — règle avec le minDays le plus élevé ≤ totalDays.
        // Les remises s'appliquent sur le sous-total global, tarifs saisonniers inclus.
        $discountPercent = 0.0;
        foreach ($boat->getDiscountRules() ?? [] as $rule) {
            $minDays = (int) ($rule['minDays'] ?? 0);
            $pct     = (float) ($rule['discountPercent'] ?? 0.0);
            if ($totalDays >= $minDays && $pct > $discountPercent) {
                $discountPercent = $pct;
            }
        }
        if ($discountPercent > 0.0) {
            $subtotal = round($subtotal * (1 - $discountPercent / 100), 2);
        }

        $platformFee = $subtotal * ($this->stripe->getPlatformFeePercent() / 100);
        $totalAmount = $subtotal + $platformFee;

        try {
            $booking = $this->em->wrapInTransaction(function () use (
                $user, $boat, $start, $end, $totalDays, $dailyRate, $subtotal,
                $platformFee, $totalAmount, $body, $withSkipper
            ) {
                // Re-check overlapping bookings inside transaction
                $overlap = $this->bookingRepo->findOverlapping($boat->getId(), $start, $end);
                if ($overlap) {
                    throw new \RuntimeException('Boat is already booked for the selected dates', 409);
                }

                // Re-check blocked availability dates
                $blocked = $this->availabilityRepo->findBlockedInRange($boat->getId(), $start, $end);
                if (count($blocked) > 0) {
                    throw new \RuntimeException('Some dates in the selected range are not available', 409);
                }

                $booking = new Booking();
                $booking->setBoat($boat);
                $booking->setRenter($user);
                $booking->setOwner($boat->getOwner());
                $booking->setStartDate($start);
                $booking->setEndDate($end);
                $booking->setTotalDays($totalDays);
                $booking->setWithSkipper($withSkipper);
                $booking->setDailyRate($dailyRate);
                $booking->setSubtotal($subtotal);
                $booking->setPlatformFee($platformFee);
                $booking->setDepositAmount($boat->getDepositAmount());
                $booking->setTotalAmount($totalAmount);
                $booking->setMessage($body['message'] ?? null);
                $booking->setGuestCount((int) ($body['guestCount'] ?? 1));
                $booking->setSpecialRequests($body['specialRequests'] ?? null);
                $booking->setStatus(Booking::STATUS_PENDING);

                $this->em->persist($booking);

                return $booking;
            });
        } catch (\RuntimeException $e) {
            $code = $e->getCode() ?: 400;
            return $this->error($e->getMessage(), $code);
        }

        return $this->success($booking->toArray(), 201);
    }

    /**
     * Crée un Stripe PaymentIntent pour une réservation PENDING (démo Stripe Elements).
     * Retourne le clientSecret qui permet au frontend d'afficher le formulaire de carte.
     * La route statique est déclarée avant /{id} pour éviter toute ambiguïté.
     */
    #[Route('/{id}/payment-intent', methods: ['POST'])]
    public function createPaymentIntent(string $id): JsonResponse
    {
        $user = $this->getCurrentUser();

        // Limite : 10 créations de PaymentIntent par heure par utilisateur (anti-spam Stripe) (Issue #4)
        if (!$this->bookingCreateLimiter->create('pi_' . $user->getId())->consume(1)->isAccepted()) {
            return $this->error('Trop de tentatives. Réessayez dans quelques instants.', 429);
        }

        $booking = $this->bookingRepo->find($id);

        if (!$booking) {
            return $this->error('Réservation introuvable', 404);
        }
        if ($booking->getRenter()->getId() !== $user->getId()) {
            return $this->error('Accès refusé', 403);
        }
        if ($booking->getStatus() !== Booking::STATUS_PENDING) {
            return $this->error('Seules les réservations en attente peuvent être payées', 400);
        }

        // Réutiliser le PaymentIntent existant si déjà créé (idempotence)
        $existingPiId = $booking->getStripePaymentIntentId();
        if ($existingPiId) {
            try {
                $pi = $this->stripe->retrievePaymentIntent($existingPiId);
                if ($pi->status !== 'canceled') {
                    return $this->success([
                        'clientSecret' => $pi->client_secret,
                        'bookingId'    => $booking->getId(),
                        'amount'       => $booking->getTotalAmount(),
                    ]);
                }
            } catch (\Throwable) {
                // Si le PI est introuvable, on en crée un nouveau
            }
        }

        // Toute exception Stripe (clé invalide, réseau, etc.) est catchée pour retourner
        // un message clair plutôt qu'un 500 générique non loggué.
        try {
            $pi = $this->stripe->createPaymentIntent(
                $booking->getTotalAmount(),
                'eur',
                [
                    'bookingId' => (string) $booking->getId(),
                    'boatId'    => (string) $booking->getBoat()->getId(),
                    'renterId'  => (string) $booking->getRenter()->getId(),
                ],
            );
        } catch (\Stripe\Exception\AuthenticationException $e) {
            return $this->error('Configuration Stripe invalide. Vérifiez la clé API.', 500);
        } catch (\Stripe\Exception\ApiConnectionException $e) {
            return $this->error('Impossible de joindre Stripe. Vérifiez votre connexion.', 503);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return $this->error('Erreur Stripe : ' . $e->getMessage(), 502);
        }

        $booking->setStripePaymentIntentId($pi->id);
        $this->em->flush();

        return $this->success([
            'clientSecret' => $pi->client_secret,
            'bookingId'    => $booking->getId(),
            'amount'       => $booking->getTotalAmount(),
        ]);
    }

    #[Route('/confirm-payment', methods: ['POST'])]
    public function confirmPayment(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $body = $this->getJsonBody($request);
        $paymentIntentId = $body['paymentIntentId'] ?? null;

        if (!$paymentIntentId || !is_string($paymentIntentId)) {
            return $this->error('paymentIntentId est requis', 400);
        }

        // Vérification de format basique pour éviter un appel Stripe inutile (Issue #7)
        if (!str_starts_with($paymentIntentId, 'pi_')) {
            return $this->error('Format de paymentIntentId invalide', 400);
        }

        // Chercher la réservation EN PREMIER pour valider l'ownership avant tout appel Stripe (Issue #1, #2)
        $booking = $this->bookingRepo->findOneBy(['stripePaymentIntentId' => $paymentIntentId]);
        if (!$booking) {
            return $this->error('Réservation introuvable pour ce paiement', 404);
        }
        if ($booking->getRenter()->getId() !== $user->getId()) {
            return $this->error('Forbidden', 403);
        }
        // Idempotence : répondre directement si déjà confirmé
        if ($booking->getStatus() === Booking::STATUS_CONFIRMED) {
            return $this->success($booking->toArray(true, false, true));
        }

        // Vérification du statut auprès de Stripe (source de vérité)
        $pi = $this->stripe->retrievePaymentIntent($paymentIntentId);

        // Validation croisée : le PI doit appartenir à CETTE réservation (protection anti-replay) (Issue #1)
        $piBookingId = $pi->metadata['bookingId'] ?? null;
        if ((string) $booking->getId() !== $piBookingId) {
            return $this->error('Ce paiement ne correspond pas à cette réservation', 400);
        }

        if ($pi->status !== 'succeeded') {
            return $this->error('Le paiement n\'a pas abouti. Statut : ' . $pi->status, 400);
        }

        $booking->setStatus(Booking::STATUS_CONFIRMED);

        // Envoyer le message de bienvenue défini par le propriétaire (E3).
        // En cas d'erreur, ne pas bloquer la confirmation — le paiement a déjà été encaissé.
        $welcomeText = $booking->getBoat()->getWelcomeMessage();
        if ($welcomeText) {
            try {
                $this->messageService->send(
                    $booking->getBoat()->getOwner(),
                    $booking->getRenter(),
                    $welcomeText,
                );
            } catch (\Throwable) {
                // Le message de bienvenue est un bonus ; son échec ne doit pas bloquer la confirmation.
            }
        }

        // Block availability dates
        $dates = $this->generateDateRange($booking->getStartDate(), $booking->getEndDate());
        foreach ($dates as $date) {
            $avail = $this->availabilityRepo->findOneBy(['boat' => $booking->getBoat(), 'date' => $date]);
            if (!$avail) {
                $avail = new Availability();
                $avail->setBoat($booking->getBoat());
                $avail->setDate($date);
                $this->em->persist($avail);
            }
            $avail->setIsAvailable(false);
            $avail->setBookingId($booking->getId());
            $avail->setNote('Booked - booking #' . $booking->getId());
        }

        $this->em->flush();

        return $this->success($booking->toArray(true, false, true));
    }

    #[Route('/renter', methods: ['GET'])]
    public function myBookingsAsRenter(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        [$page, $limit] = $this->paginationParams($request);
        $status = $request->query->get('status') ? strtoupper($request->query->get('status')) : null;

        $result = $this->bookingRepo->findPaginatedByRenter($user->getId(), $page, $limit, $status);
        return $this->paginated(
            array_map(fn(Booking $b) => $b->toArray(true), $result['items']),
            $result['total'], $page, $limit
        );
    }

    #[Route('/owner', methods: ['GET'])]
    public function myBookingsAsOwner(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();

        // Cohérence avec ownerRevenues : seuls OWNER et ADMIN accèdent à cet endpoint
        if (!in_array($user->getRole(), ['OWNER', 'ADMIN'], true)) {
            return $this->error('Accès réservé aux propriétaires', 403);
        }

        [$page, $limit] = $this->paginationParams($request);
        $status = $request->query->get('status') ? strtoupper($request->query->get('status')) : null;

        // Rejeter toute valeur de statut inconnue pour un retour d'erreur explicite
        if ($status !== null) {
            $validStatuses = [
                Booking::STATUS_PENDING,
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_COMPLETED,
                Booking::STATUS_CANCELLED,
            ];
            if (!in_array($status, $validStatuses, true)) {
                return $this->error(
                    'Statut invalide. Valeurs acceptées : ' . implode(', ', $validStatuses),
                    400
                );
            }
        }

        $result = $this->bookingRepo->findPaginatedByOwner($user->getId(), $page, $limit, $status);
        return $this->paginated(
            // withBoat=true : le frontend affiche le titre/image du bateau dans chaque carte
            array_map(fn(Booking $b) => $b->toArray(true, true), $result['items']),
            $result['total'], $page, $limit
        );
    }

    /**
     * Retourne les données de revenus agrégées pour le propriétaire connecté.
     * Accepte ?year=YYYY (défaut = année courante) et ?boatId=XXX (optionnel).
     * La route est déclarée avant /{id} pour éviter qu'elle soit capturée par le pattern dynamique.
     */
    #[Route('/owner/revenues', methods: ['GET'])]
    public function ownerRevenues(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();

        // Seuls les propriétaires et les administrateurs peuvent consulter les revenus
        if (!in_array($user->getRole(), ['OWNER', 'ADMIN'], true)) {
            return $this->error('Accès réservé aux propriétaires', 403);
        }

        // L'année filtre uniquement la répartition mensuelle ;
        // le résumé global et la répartition par bateau couvrent toutes les années.
        $year   = (int) ($request->query->get('year') ?? date('Y'));
        $boatId = $request->query->get('boatId') ?: null;

        // Validation : la plateforme n'existait pas avant 2020
        if ($year < 2020 || $year > (int) date('Y') + 1) {
            return $this->error('Année invalide', 400);
        }

        return $this->success([
            'summary'        => $this->bookingRepo->findRevenueSummary($user->getId(), $boatId),
            'byMonth'        => $this->bookingRepo->findRevenueByMonth($user->getId(), $year, $boatId),
            'byBoat'         => $this->bookingRepo->findRevenueByBoat($user->getId(), $boatId),
            'recentBookings' => array_map(
                fn(Booking $b) => $b->toArray(true, true),
                $this->bookingRepo->findRecentByOwner($user->getId()),
            ),
        ]);
    }

    /**
     * Retourne toutes les réservations de tous les bateaux du propriétaire sur une plage de dates.
     * Conçu pour alimenter une vue agenda multi-bateaux côté frontend.
     *
     * Paramètres query :
     *   ?from=YYYY-MM-DD  (défaut : 1er jour du mois courant)
     *   ?to=YYYY-MM-DD    (défaut : dernier jour du mois courant + 2 mois)
     *   ?boatId=N         (optionnel — filtre un bateau spécifique)
     *   ?status=STATUS    (optionnel — PENDING | CONFIRMED | COMPLETED)
     *
     * Chaque événement retourné inclut un code couleur dérivé de l'ID du bateau
     * pour permettre au frontend de coloriser les blocs sans configuration supplémentaire.
     */
    #[Route('/owner/calendar', methods: ['GET'])]
    public function ownerCalendar(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!in_array($user->getRole(), ['OWNER', 'ADMIN'], true)) {
            return $this->error('Accès réservé aux propriétaires', 403);
        }

        // Palette de couleurs pour différencier visuellement chaque bateau dans l'agenda
        $palette = [
            '#0369a1', '#0891b2', '#059669', '#d97706',
            '#dc2626', '#7c3aed', '#db2777', '#65a30d',
        ];

        // Plage par défaut : mois courant + 2 mois suivants
        $defaultFrom = new \DateTimeImmutable('first day of this month');
        $defaultTo   = new \DateTimeImmutable('last day of +2 months');

        try {
            $from = $request->query->get('from')
                ? new \DateTimeImmutable($request->query->get('from'))
                : $defaultFrom;
            $to = $request->query->get('to')
                ? new \DateTimeImmutable($request->query->get('to'))
                : $defaultTo;
        } catch (\Exception) {
            return $this->error('Format de date invalide. Utilisez YYYY-MM-DD.', 400);
        }

        // Limite la plage à 1 an maximum pour éviter les requêtes trop lourdes
        if ($from->diff($to)->days > 366) {
            return $this->error('La plage ne peut pas dépasser 366 jours.', 400);
        }

        if ($from > $to) {
            return $this->error('La date de début doit être antérieure à la date de fin.', 400);
        }

        $boatId = $request->query->get('boatId') ?: null;
        $status = $request->query->get('status') ? strtoupper($request->query->get('status')) : null;

        if ($status !== null) {
            $validStatuses = [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED, Booking::STATUS_COMPLETED];
            if (!in_array($status, $validStatuses, true)) {
                return $this->error('Statut invalide. Valeurs acceptées : ' . implode(', ', $validStatuses), 400);
            }
        }

        $bookings = $this->bookingRepo->findCalendarByOwner(
            $user->getId(),
            $from,
            $to,
            $boatId,
            $status,
        );

        // Construit l'index des bateaux avec leur couleur calendrier (dérivée de l'ID)
        $boatsIndex = [];
        $events     = [];

        foreach ($bookings as $booking) {
            $boat   = $booking->getBoat();
            $boatId = $boat->getId();

            if (!isset($boatsIndex[$boatId])) {
                $boatsIndex[$boatId] = [
                    'id'    => $boatId,
                    'title' => $boat->getTitle(),
                    'image' => $boat->getImages()[0] ?? null,
                    'color' => $palette[$boatId % count($palette)],
                ];
            }

            $renter   = $booking->getRenter();
            $events[] = [
                'id'          => $booking->getId(),
                'boatId'      => $boatId,
                'boatTitle'   => $boat->getTitle(),
                'boatColor'   => $boatsIndex[$boatId]['color'],
                'status'      => $booking->getStatus(),
                'startDate'   => $booking->getStartDate()->format('Y-m-d'),
                'endDate'     => $booking->getEndDate()->format('Y-m-d'),
                'totalDays'   => $booking->getTotalDays(),
                'totalAmount' => $booking->getTotalAmount(),
                'withSkipper' => $booking->isWithSkipper(),
                'renter'      => [
                    'id'        => $renter->getId(),
                    'firstName' => $renter->getFirstName(),
                    'lastName'  => $renter->getLastName(),
                    'avatar'    => $renter->getAvatar(),
                ],
            ];
        }

        return $this->success([
            'events' => $events,
            'boats'  => array_values($boatsIndex),
            'period' => [
                'from' => $from->format('Y-m-d'),
                'to'   => $to->format('Y-m-d'),
            ],
        ]);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $user    = $this->getCurrentUser();
        $booking = $this->bookingRepo->find($id);

        if (!$booking) {
            return $this->error('Booking not found', 404);
        }

        $isRenter = $booking->getRenter()->getId() === $user->getId();
        $isOwner  = $booking->getBoat()->getOwner()->getId() === $user->getId();
        $isAdmin  = $user->getRole() === 'ADMIN';

        if (!$isRenter && !$isOwner && !$isAdmin) {
            return $this->error('Access denied', 403);
        }

        return $this->success($booking->toArray(true, true, true));
    }

    #[Route('/{id}/status', methods: ['PATCH'])]
    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $user    = $this->getCurrentUser();
        $booking = $this->bookingRepo->find($id);

        if (!$booking) {
            return $this->error('Booking not found', 404);
        }
        if ($booking->getBoat()->getOwner()->getId() !== $user->getId()) {
            return $this->error('Only the boat owner can update booking status', 403);
        }
        if ($booking->getStatus() !== Booking::STATUS_PENDING) {
            return $this->error('Cannot change status of a non-PENDING booking', 400);
        }

        $body   = $this->getJsonBody($request);
        $action = $body['action'] ?? null;

        if (!in_array($action, ['accept', 'reject'], true)) {
            return $this->error('action must be "accept" or "reject"', 400);
        }

        if ($action === 'accept') {
            $booking->setStatus(Booking::STATUS_CONFIRMED);
        } else {
            $paymentIntentId = $booking->getStripePaymentIntentId();
            if ($paymentIntentId) {
                try {
                    $pi = $this->stripe->retrievePaymentIntent($paymentIntentId);
                    if ($pi->status === 'succeeded') {
                        $this->stripe->createRefund($paymentIntentId);
                    } else {
                        $this->stripe->cancelPaymentIntent($paymentIntentId);
                    }
                } catch (\Throwable $e) {
                    // Log but don't block cancellation
                }
            }
            $booking->setStatus(Booking::STATUS_CANCELLED);
            $booking->setCancellationReason('Rejected by owner');
        }

        $this->em->flush();

        // Notifier le locataire par notification in-app + email selon l'action du propriétaire.
        // Les deux opérations sont best-effort : un échec d'envoi ne doit pas bloquer la réponse.
        $renter    = $booking->getRenter();
        $boatTitle = $booking->getBoat()->getTitle();
        $startFmt  = $booking->getStartDate()->format('d/m/Y');
        $endFmt    = $booking->getEndDate()->format('d/m/Y');

        if ($action === 'accept') {
            try {
                $this->createNotification(
                    $renter,
                    'BOOKING_ACCEPTED',
                    'Réservation acceptée',
                    "Votre réservation pour « {$boatTitle} » du {$startFmt} au {$endFmt} a été acceptée.",
                    ['bookingId' => $booking->getId()],
                );
            } catch (\Throwable $e) {
                error_log('[BookingController] createNotification (accept) failed: ' . $e->getMessage());
            }
            try {
                $this->emailService->sendBookingAccepted(
                    $renter->getEmail(),
                    $renter->getFirstName(),
                    $boatTitle,
                    $startFmt,
                    $endFmt,
                );
            } catch (\Throwable $e) {
                error_log('[BookingController] sendBookingAccepted failed: ' . $e->getMessage());
            }
        } else {
            try {
                $this->createNotification(
                    $renter,
                    'BOOKING_REJECTED',
                    'Demande refusée',
                    "Votre demande pour « {$boatTitle} » du {$startFmt} au {$endFmt} a été refusée.",
                    ['bookingId' => $booking->getId()],
                );
            } catch (\Throwable $e) {
                error_log('[BookingController] createNotification (reject) failed: ' . $e->getMessage());
            }
            try {
                $this->emailService->sendBookingRejected(
                    $renter->getEmail(),
                    $renter->getFirstName(),
                    $boatTitle,
                    $startFmt,
                    $endFmt,
                );
            } catch (\Throwable $e) {
                error_log('[BookingController] sendBookingRejected failed: ' . $e->getMessage());
            }
        }

        return $this->success($booking->toArray());
    }

    #[Route('/{id}/cancel', methods: ['POST'])]
    public function cancel(string $id, Request $request): JsonResponse
    {
        $user    = $this->getCurrentUser();
        $booking = $this->bookingRepo->find($id);

        if (!$booking) {
            return $this->error('Booking not found', 404);
        }

        $isRenter = $booking->getRenter()->getId() === $user->getId();
        $isOwner  = $booking->getBoat()->getOwner()->getId() === $user->getId();

        if (!$isRenter && !$isOwner) {
            return $this->error('Forbidden', 403);
        }

        $currentStatus = $booking->getStatus();
        if (!in_array($currentStatus, [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED], true)) {
            return $this->error("Cannot cancel a booking with status {$currentStatus}", 400);
        }

        if ($currentStatus === Booking::STATUS_CONFIRMED) {
            $paymentIntentId = $booking->getStripePaymentIntentId();
            if ($paymentIntentId) {
                try {
                    $pi = $this->stripe->retrievePaymentIntent($paymentIntentId);
                    if ($pi->status === 'succeeded') {
                        $this->stripe->createRefund($paymentIntentId);
                    }
                } catch (\Throwable $e) {
                    // Journaliser l'échec du remboursement — ne pas bloquer l'annulation (Issue #8)
                    error_log(sprintf(
                        '[Booking#%d] Échec du remboursement Stripe pour PI %s : %s',
                        $booking->getId(),
                        $paymentIntentId,
                        $e->getMessage(),
                    ));
                }
            }

            // Unblock availability dates
            $dates = $this->generateDateRange($booking->getStartDate(), $booking->getEndDate());
            foreach ($dates as $date) {
                $avail = $this->availabilityRepo->findOneBy(['boat' => $booking->getBoat(), 'date' => $date]);
                if ($avail) {
                    $avail->setIsAvailable(true);
                    $avail->setNote(null);
                    $avail->setBookingId(null);
                }
            }
        }

        $body = $this->getJsonBody($request);
        $booking->setStatus(Booking::STATUS_CANCELLED);
        $booking->setCancellationReason($body['cancellationReason'] ?? 'Cancelled by user');
        $booking->setCancelledAt(new \DateTimeImmutable());
        $booking->setCancelledBy($user->getId());

        $this->em->flush();

        // Notifier l'autre partie (best-effort) selon qui annule.
        $boatTitle = $booking->getBoat()->getTitle();
        $startFmt  = $booking->getStartDate()->format('d/m/Y');
        $endFmt    = $booking->getEndDate()->format('d/m/Y');

        if ($isRenter) {
            // Le locataire annule → notifier le propriétaire
            $owner      = $booking->getBoat()->getOwner();
            $renterName = $booking->getRenter()->getFirstName() . ' ' . $booking->getRenter()->getLastName();
            try {
                $this->createNotification(
                    $owner,
                    'BOOKING_CANCELLED',
                    'Réservation annulée',
                    "{$renterName} a annulé sa réservation pour « {$boatTitle} » du {$startFmt} au {$endFmt}.",
                    ['bookingId' => $booking->getId()],
                );
            } catch (\Throwable $e) {
                error_log('[BookingController] createNotification (cancelByRenter) failed: ' . $e->getMessage());
            }
            try {
                $this->emailService->sendBookingCancelledByRenter(
                    $owner->getEmail(),
                    $owner->getFirstName(),
                    $renterName,
                    $boatTitle,
                    $startFmt,
                    $endFmt,
                );
            } catch (\Throwable $e) {
                error_log('[BookingController] sendBookingCancelledByRenter failed: ' . $e->getMessage());
            }
        } else {
            // Le propriétaire annule → notifier le locataire
            $renter = $booking->getRenter();
            try {
                $this->createNotification(
                    $renter,
                    'BOOKING_CANCELLED',
                    'Réservation annulée',
                    "Le propriétaire a annulé votre réservation pour « {$boatTitle} » du {$startFmt} au {$endFmt}.",
                    ['bookingId' => $booking->getId()],
                );
            } catch (\Throwable $e) {
                error_log('[BookingController] createNotification (cancelByOwner) failed: ' . $e->getMessage());
            }
            try {
                $this->emailService->sendBookingCancelledByOwner(
                    $renter->getEmail(),
                    $renter->getFirstName(),
                    $boatTitle,
                    $startFmt,
                    $endFmt,
                );
            } catch (\Throwable $e) {
                error_log('[BookingController] sendBookingCancelledByOwner failed: ' . $e->getMessage());
            }
        }

        return $this->success($booking->toArray());
    }

    /**
     * Crée et persiste une notification in-app pour un utilisateur.
     * Utilisé pour les changements de statut de réservation (acceptée, refusée, annulée).
     *
     * @param array<string, mixed> $data Données contextuelles optionnelles (ex. bookingId)
     */
    private function createNotification(
        User $recipient,
        string $type,
        string $title,
        string $message,
        array $data = [],
    ): void {
        $notif = new Notification();
        $notif->setUser($recipient);
        $notif->setType($type);
        $notif->setTitle($title);
        $notif->setMessageText($message);
        $notif->setData($data);
        $this->em->persist($notif);
        $this->em->flush();
    }

    /**
     * Calcule le sous-total d'une réservation jour par jour en appliquant les tarifs saisonniers.
     *
     * Pour chaque jour de la période :
     *   1. Cherche un tarif saisonnier actif (les prix sont triés startDate DESC → le plus spécifique prime)
     *   2. Fallback sur le tarif de base du bateau si aucun tarif saisonnier ne couvre ce jour
     *   3. Ajoute le supplément skipper si demandé
     *
     * @param SeasonalPrice[] $seasonalPrices Périodes saisonnières chevauchant la réservation (pré-chargées)
     * @return array{0: float, 1: float} [subtotal, effectiveDailyRate moyen arrondi à 2 décimales]
     */
    private function computeSubtotal(
        float $baseDailyRate,
        ?float $skipperPrice,
        bool $withSkipper,
        \DateTimeImmutable $start,
        int $totalDays,
        array $seasonalPrices,
    ): array {
        $subtotal = 0.0;
        $current  = $start->setTime(0, 0, 0);

        for ($i = 0; $i < $totalDays; $i++) {
            $rate = $baseDailyRate;

            // Le premier tarif saisonnier qui couvre ce jour est retenu
            // (triés par startDate DESC : la période la plus récente/spécifique prime en cas de chevauchement)
            foreach ($seasonalPrices as $sp) {
                if ($sp->getStartDate() <= $current && $sp->getEndDate() >= $current) {
                    $rate = $sp->getDailyRate();
                    break;
                }
            }

            if ($withSkipper && $skipperPrice) {
                $rate += $skipperPrice;
            }

            $subtotal += $rate;
            $current   = $current->modify('+1 day');
        }

        $effectiveDailyRate = $totalDays > 0 ? round($subtotal / $totalDays, 2) : $baseDailyRate;

        return [round($subtotal, 2), $effectiveDailyRate];
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
