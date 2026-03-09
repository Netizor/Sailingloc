<?php

namespace App\Controller;

use App\Entity\Boat;
use App\Repository\BoatRepository;
use App\Repository\BookingRepository;
use App\Service\CloudinaryService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/boats')]
class BoatController extends AbstractApiController
{
    public function __construct(
        private readonly BoatRepository $boatRepo,
        private readonly BookingRepository $bookingRepo,
        private readonly EntityManagerInterface $em,
        private readonly CloudinaryService $cloudinary,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        [$page, $limit] = $this->paginationParams($request);

        $filters = [];

        $location = $request->query->get('location');
        if ($location !== null && $location !== '') {
            $filters['location'] = $location;
        }

        $types = $request->query->all('types');
        if (!empty($types)) {
            $filters['types'] = array_values(array_filter($types));
        }

        $capacity = $request->query->get('capacity');
        if ($capacity !== null && $capacity !== '') {
            $filters['capacity'] = $capacity;
        }

        $minPrice = $request->query->get('minPrice');
        if ($minPrice !== null && $minPrice !== '') {
            $filters['minPrice'] = $minPrice;
        }

        $maxPrice = $request->query->get('maxPrice');
        if ($maxPrice !== null && $maxPrice !== '') {
            $filters['maxPrice'] = $maxPrice;
        }

        $skipper = $request->query->get('withSkipper');
        if ($skipper !== null && $skipper !== '') {
            $filters['withSkipper'] = filter_var($skipper, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }

        $startDate = $request->query->get('startDate');
        $endDate   = $request->query->get('endDate');
        if ($startDate && $endDate) {
            $filters['startDate'] = $startDate;
            $filters['endDate']   = $endDate;
        }

        $sort = $request->query->get('sort');
        if (in_array($sort, ['price_asc', 'price_desc', 'rating_desc', 'created_desc'], true)) {
            $filters['sort'] = $sort;
        }

        $result = $this->boatRepo->findPublicPaginated($page, $limit, $filters);
        $items  = array_map(fn(Boat $b) => $b->toArray(true), $result['items']);

        return $this->paginated($items, $result['total'], $page, $limit);
    }

    #[Route('/my', methods: ['GET'])]
    public function myBoats(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        [$page, $limit] = $this->paginationParams($request);

        $qb = $this->em->createQueryBuilder()
            ->select('b')
            ->from(Boat::class, 'b')
            ->where('b.owner = :user')
            ->setParameter('user', $user)
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $boats = $qb->getQuery()->getResult();
        $total = (int) $this->em->createQueryBuilder()
            ->select('COUNT(b.id)')
            ->from(Boat::class, 'b')
            ->where('b.owner = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return $this->paginated(
            // includeOwnerFields=true : expose welcomeMessage uniquement au propriétaire
            array_map(fn(Boat $b) => $b->toArray(false, true), $boats),
            $total, $page, $limit
        );
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $boat = $this->boatRepo->find($id);
        if (!$boat) {
            return $this->error('Boat not found', 404);
        }
        return $this->success($boat->toArray(true));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        if (!in_array($user->getRole(), ['OWNER', 'ADMIN'], true)) {
            return $this->error('Only owners can create boats', 403);
        }

        // Email et profil doivent être complétés avant d'ajouter un bateau
        if (!$user->isEmailVerified()) {
            return $this->error('Veuillez vérifier votre adresse email avant d\'ajouter un bateau.', 403);
        }
        if (!$user->getPhone()) {
            return $this->error('Veuillez compléter votre profil en ajoutant un numéro de téléphone.', 403);
        }

        $body = $this->getJsonBody($request);

        // For drafts only title is required; publishing requires location + pricing
        $status = strtoupper($body['status'] ?? 'DRAFT');
        $required = $status === 'PUBLISHED'
            ? ['title', 'type', 'capacity', 'port', 'city', 'dailyRate']
            : ['title', 'type', 'capacity'];

        foreach ($required as $field) {
            $value = $body[$field] ?? null;
            if ($value === null || $value === '') {
                return $this->error("Field '{$field}' is required", 400);
            }
        }

        $boat = new Boat();
        $boat->setOwner($user);

        // Ensure NOT NULL columns always have a value even for drafts
        $boat->setDescription($body['description'] ?? '');
        $boat->setPort($body['port'] ?? '');
        $boat->setCity($body['city'] ?? '');
        $boat->setDailyRate(isset($body['dailyRate']) ? (float) $body['dailyRate'] : 0.0);
        $boat->setDepositAmount(isset($body['depositAmount']) ? (float) $body['depositAmount'] : 0.0);

        $this->applyBoatData($boat, $body);

        $this->em->persist($boat);
        $this->em->flush();

        return $this->success($boat->toArray(false, true), 201);
    }

    #[Route('/{id}', methods: ['PATCH', 'PUT'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($id);

        if (!$boat) {
            return $this->error('Boat not found', 404);
        }
        if ($boat->getOwner()->getId() !== $user->getId() && $user->getRole() !== 'ADMIN') {
            return $this->error('Forbidden', 403);
        }

        $body = $this->getJsonBody($request);
        $this->applyBoatData($boat, $body);

        $this->em->flush();
        return $this->success($boat->toArray(false, true));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($id);

        if (!$boat) {
            return $this->error('Boat not found', 404);
        }
        if ($boat->getOwner()->getId() !== $user->getId() && $user->getRole() !== 'ADMIN') {
            return $this->error('Forbidden', 403);
        }

        // Bloque la suppression si des réservations PENDING ou CONFIRMED existent.
        // Un locataire ayant réservé ce bateau ne doit pas se retrouver avec une
        // réservation fantôme pointant vers un bateau inexistant.
        $activeCount = $this->bookingRepo->countActiveByBoat((int) $boat->getId());
        if ($activeCount > 0) {
            return $this->error(
                sprintf(
                    'Ce bateau ne peut pas être supprimé : %d réservation(s) active(s) en cours ou à venir. '
                    . 'Annulez-les d\'abord avant de supprimer le bateau.',
                    $activeCount,
                ),
                409,
            );
        }

        // Suppression des images Cloudinary associées au bateau.
        // Opération best-effort : un échec de suppression Cloudinary ne doit pas
        // bloquer la suppression en base — on évite seulement la fuite de storage.
        foreach ($boat->getImages() ?? [] as $imageUrl) {
            $publicId = $this->extractCloudinaryPublicId($imageUrl);
            if ($publicId !== null) {
                try {
                    $this->cloudinary->delete($publicId);
                } catch (\Throwable) {
                    // Échec silencieux — la suppression DB continue
                }
            }
        }

        $this->em->remove($boat);
        $this->em->flush();
        return $this->success(['message' => 'Boat deleted']);
    }

    /**
     * Extrait le public_id Cloudinary depuis une URL sécurisée.
     * Format : https://res.cloudinary.com/{cloud}/image/upload/v{ver}/{public_id}.{ext}
     * Retourne null si l'URL n'est pas une URL Cloudinary valide.
     */
    private function extractCloudinaryPublicId(string $url): ?string
    {
        if (!str_contains($url, 'cloudinary.com')) {
            return null;
        }

        $parts = explode('/upload/', $url, 2);
        if (count($parts) < 2) {
            return null;
        }

        // Supprime le préfixe de version optionnel (v1234567890/)
        $path = preg_replace('/^v\d+\//', '', $parts[1]);

        // Supprime l'extension de fichier (.jpg, .png, .webp…)
        return preg_replace('/\.[^.\/]+$/', '', $path) ?: null;
    }

    /**
     * Upload d'un document officiel du bateau (assurance, immatriculation, permis) vers Cloudinary (E5).
     * Champ multipart : file (binaire) + docType (insurance|registration|license).
     */
    #[Route('/{id}/upload-document', methods: ['POST'])]
    public function uploadDocument(string $id, Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($id);
        if (!$boat) {
            return $this->error('Boat not found', 404);
        }
        if ($boat->getOwner()->getId() !== $user->getId() && $user->getRole() !== 'ADMIN') {
            return $this->error('Forbidden', 403);
        }

        $file    = $request->files->get('file');
        $docType = $request->request->get('docType');

        if (!$file || !$file->isValid()) {
            return $this->error('Fichier invalide ou manquant', 400);
        }
        if (!in_array($docType, ['insurance', 'registration', 'license'], true)) {
            return $this->error('docType invalide (insurance|registration|license)', 400);
        }

        // Vérifier le type MIME : PDF ou image
        $allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes, true)) {
            return $this->error('Format non supporté (PDF, JPEG, PNG, WebP)', 415);
        }

        try {
            $result = $this->cloudinary->upload(
                $file->getRealPath(),
                "sailingloc/documents/{$boat->getId()}"
            );
        } catch (\Throwable $e) {
            return $this->error('Erreur lors de l\'upload : ' . $e->getMessage(), 502);
        }

        $url = $result['url'];
        match ($docType) {
            'insurance'    => $boat->setInsuranceDoc($url),
            'registration' => $boat->setRegistrationDoc($url),
            'license'      => $boat->setLicenseScanDoc($url),
        };

        $this->em->flush();
        return $this->success($boat->toArray(false, true));
    }

    private function applyBoatData(Boat $boat, array $body): void
    {
        if (isset($body['title']))           $boat->setTitle($body['title']);
        if (isset($body['description']))     $boat->setDescription($body['description']);
        if (isset($body['type']))            $boat->setType($body['type']);
        if (isset($body['manufacturer']))    $boat->setManufacturer($body['manufacturer']);
        if (isset($body['model']))           $boat->setModel($body['model']);
        if (isset($body['year']))            $boat->setYear((int) $body['year']);
        if (isset($body['length']))          $boat->setLength((float) $body['length']);
        if (isset($body['capacity']))        $boat->setCapacity((int) $body['capacity']);
        if (isset($body['cabins']))          $boat->setCabins((int) $body['cabins']);
        if (isset($body['motorizationType'])) $boat->setMotorizationType($body['motorizationType']);
        if (isset($body['motorPower']))      $boat->setMotorPower((int) $body['motorPower']);
        if (isset($body['withSkipper']))     $boat->setWithSkipper((bool) $body['withSkipper']);
        if (isset($body['skipperPrice']))    $boat->setSkipperPrice((float) $body['skipperPrice']);
        if (isset($body['port']))            $boat->setPort($body['port']);
        if (isset($body['city']))            $boat->setCity($body['city']);
        if (isset($body['country']))         $boat->setCountry($body['country']);
        if (isset($body['lat']))             $boat->setLat((float) $body['lat']);
        if (isset($body['lng']))             $boat->setLng((float) $body['lng']);
        if (isset($body['dailyRate']))       $boat->setDailyRate((float) $body['dailyRate']);
        if (isset($body['weeklyRate']))      $boat->setWeeklyRate((float) $body['weeklyRate']);
        if (isset($body['depositAmount']))   $boat->setDepositAmount((float) $body['depositAmount']);
        if (isset($body['equipment']))       $boat->setEquipment($body['equipment']);
        if (isset($body['rules']))           $boat->setRules($body['rules']);
        // array_key_exists (et non isset) : permet d'effacer le champ en envoyant null ou ""
        if (array_key_exists('welcomeMessage', $body)) $boat->setWelcomeMessage($body['welcomeMessage'] ?: null);
        // Règles de réduction — on remplace le tableau entier ; envoi null pour tout effacer
        if (array_key_exists('discountRules', $body)) {
            $rules = $body['discountRules'];
            // Valider et normaliser chaque règle
            if (is_array($rules)) {
                $cleaned = [];
                foreach ($rules as $rule) {
                    $minDays = (int) ($rule['minDays'] ?? 0);
                    $pct     = (float) ($rule['discountPercent'] ?? 0.0);
                    if ($minDays > 0 && $pct > 0 && $pct <= 100) {
                        $cleaned[] = ['minDays' => $minDays, 'discountPercent' => $pct];
                    }
                }
                $boat->setDiscountRules(empty($cleaned) ? null : $cleaned);
            } else {
                $boat->setDiscountRules(null);
            }
        }
        if (isset($body['images']))          $boat->setImages($body['images']);
        if (isset($body['status'])) {
            // Normalize frontend status values to entity constants
            $statusMap = [
                'DRAFT'     => Boat::STATUS_DRAFT,
                'PUBLISHED' => Boat::STATUS_ACTIVE,
                'ACTIVE'    => Boat::STATUS_ACTIVE,
                'INACTIVE'  => Boat::STATUS_INACTIVE,
                'SUSPENDED' => Boat::STATUS_INACTIVE,
            ];
            $normalized = $statusMap[strtoupper($body['status'])] ?? $body['status'];
            $boat->setStatus($normalized);
        }
    }
}
