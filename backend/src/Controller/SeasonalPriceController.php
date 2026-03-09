<?php

namespace App\Controller;

use App\Entity\SeasonalPrice;
use App\Repository\BoatRepository;
use App\Repository\SeasonalPriceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/boats/{boatId}/seasonal-prices')]
class SeasonalPriceController extends AbstractApiController
{
    public function __construct(
        private readonly SeasonalPriceRepository $repo,
        private readonly BoatRepository $boatRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    /** Liste les prix saisonniers d'un bateau (public) */
    #[Route('', methods: ['GET'])]
    public function list(string $boatId): JsonResponse
    {
        $boat = $this->boatRepo->find($boatId);
        if (!$boat) {
            return $this->error('Bateau introuvable', 404);
        }

        $prices = $this->repo->findForBoat($boatId);

        return $this->success([
            'seasonalPrices' => array_map(fn(SeasonalPrice $sp) => $sp->toArray(), $prices),
        ]);
    }

    /** Crée un nouveau tarif saisonnier (propriétaire du bateau uniquement) */
    #[Route('', methods: ['POST'])]
    public function create(string $boatId, Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($boatId);

        if (!$boat) {
            return $this->error('Bateau introuvable', 404);
        }
        if ($boat->getOwner()->getId() !== $user->getId() && $user->getRole() !== 'ADMIN') {
            return $this->error('Accès interdit', 403);
        }

        $body = $this->getJsonBody($request);
        $label     = trim($body['label'] ?? '');
        $startDate = $body['startDate'] ?? null;
        $endDate   = $body['endDate'] ?? null;
        $dailyRate = $body['dailyRate'] ?? null;

        if (!$label || !$startDate || !$endDate || $dailyRate === null) {
            return $this->error('Champs requis : label, startDate, endDate, dailyRate', 422);
        }
        if (mb_strlen($label) > 100) {
            return $this->error('Le libellé ne peut pas dépasser 100 caractères', 422);
        }
        if (!is_numeric($dailyRate) || (float) $dailyRate <= 0) {
            return $this->error('Le tarif journalier doit être un nombre positif', 422);
        }

        try {
            $start = new \DateTimeImmutable($startDate);
            $end   = new \DateTimeImmutable($endDate);
        } catch (\Exception) {
            return $this->error('Format de date invalide (attendu YYYY-MM-DD)', 422);
        }

        if ($start >= $end) {
            return $this->error('La date de début doit être antérieure à la date de fin', 422);
        }

        $sp = new SeasonalPrice();
        $sp->setBoat($boat);
        $sp->setLabel($label);
        $sp->setStartDate($start);
        $sp->setEndDate($end);
        $sp->setDailyRate((float) $dailyRate);

        $this->em->persist($sp);
        $this->em->flush();

        return $this->success(['seasonalPrice' => $sp->toArray()], 201);
    }

    /** Met à jour un tarif saisonnier */
    #[Route('/{id}', methods: ['PUT', 'PATCH'])]
    public function update(string $boatId, string $id, Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($boatId);
        $sp   = $this->repo->find($id);

        if (!$boat || !$sp || $sp->getBoat()->getId() !== $boatId) {
            return $this->error('Tarif introuvable', 404);
        }
        if ($boat->getOwner()->getId() !== $user->getId() && $user->getRole() !== 'ADMIN') {
            return $this->error('Accès interdit', 403);
        }

        $body = $this->getJsonBody($request);

        if (isset($body['label'])) {
            $label = trim($body['label']);
            if (mb_strlen($label) > 100) {
                return $this->error('Le libellé ne peut pas dépasser 100 caractères', 422);
            }
            $sp->setLabel($label);
        }
        if (isset($body['startDate'])) {
            try { $sp->setStartDate(new \DateTimeImmutable($body['startDate'])); }
            catch (\Exception) { return $this->error('Format de date invalide', 422); }
        }
        if (isset($body['endDate'])) {
            try { $sp->setEndDate(new \DateTimeImmutable($body['endDate'])); }
            catch (\Exception) { return $this->error('Format de date invalide', 422); }
        }
        if (isset($body['dailyRate'])) {
            if (!is_numeric($body['dailyRate']) || (float) $body['dailyRate'] <= 0) {
                return $this->error('Le tarif journalier doit être un nombre positif', 422);
            }
            $sp->setDailyRate((float) $body['dailyRate']);
        }

        if ($sp->getStartDate() >= $sp->getEndDate()) {
            return $this->error('La date de début doit être antérieure à la date de fin', 422);
        }

        $this->em->flush();

        return $this->success(['seasonalPrice' => $sp->toArray()]);
    }

    /** Supprime un tarif saisonnier */
    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(string $boatId, string $id): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($boatId);
        $sp   = $this->repo->find($id);

        if (!$boat || !$sp || $sp->getBoat()->getId() !== $boatId) {
            return $this->error('Tarif introuvable', 404);
        }
        if ($boat->getOwner()->getId() !== $user->getId() && $user->getRole() !== 'ADMIN') {
            return $this->error('Accès interdit', 403);
        }

        $this->em->remove($sp);
        $this->em->flush();

        return $this->success(['message' => 'Tarif supprimé']);
    }
}
