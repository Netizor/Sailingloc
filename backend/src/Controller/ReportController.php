<?php

namespace App\Controller;

use App\Entity\Report;
use App\Repository\BoatRepository;
use App\Repository\ReportRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class ReportController extends AbstractApiController
{
    private const VALID_REASONS = [
        'INAPPROPRIATE_CONTENT',
        'FRAUD',
        'DUPLICATE',
        'WRONG_CATEGORY',
        'OTHER',
    ];

    public function __construct(
        private readonly BoatRepository $boatRepo,
        private readonly ReportRepository $reportRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    /** POST /api/reports — Signaler une annonce */
    #[Route('/reports', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $body = $this->getJsonBody($request);

        $boatId = (int) ($body['boatId'] ?? 0);
        $reason = $body['reason'] ?? '';

        if (!in_array($reason, self::VALID_REASONS, true)) {
            return $this->error('Raison invalide', 422);
        }

        $boat = $this->boatRepo->find($boatId);
        if (!$boat) {
            return $this->error('Bateau introuvable', 404);
        }

        // Évite les doublons de signalement par le même utilisateur
        $existing = $this->reportRepo->findOneBy(['boat' => $boat, 'reporter' => $user]);
        if ($existing) {
            return $this->success($existing->toArray(), 200);
        }

        $report = (new Report())
            ->setBoat($boat)
            ->setReporter($user)
            ->setReason($reason)
            ->setDetails($body['details'] ?? null);

        $this->em->persist($report);
        $this->em->flush();

        return $this->success($report->toArray(), 201);
    }

    /** GET /api/admin/reports — Liste admin des signalements */
    #[Route('/admin/reports', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        if ($this->getCurrentUser()->getRole() !== 'ADMIN') {
            return $this->error('Accès refusé', 403);
        }

        [$page, $limit] = $this->paginationParams($request);
        $status = $request->query->get('status');
        $filters = $status ? ['status' => strtoupper($status)] : [];

        $result = $this->reportRepo->findPaginated($page, $limit, $filters);
        return $this->paginated(
            array_map(fn(Report $r) => $r->toArray(), $result['items']),
            $result['total'], $page, $limit
        );
    }

    /** PATCH /api/admin/reports/{id} — Traiter un signalement */
    #[Route('/admin/reports/{id}', methods: ['PATCH'])]
    public function adminUpdate(string $id, Request $request): JsonResponse
    {
        if ($this->getCurrentUser()->getRole() !== 'ADMIN') {
            return $this->error('Accès refusé', 403);
        }

        $report = $this->reportRepo->find($id);
        if (!$report) {
            return $this->error('Signalement introuvable', 404);
        }

        $body = $this->getJsonBody($request);

        if (isset($body['status'])) {
            $report->setStatus(strtoupper($body['status']));
            $report->setProcessedAt(new \DateTimeImmutable());
        }
        if (array_key_exists('adminNote', $body)) {
            $report->setAdminNote($body['adminNote'] ?: null);
        }

        $this->em->flush();
        return $this->success($report->toArray());
    }
}
