<?php

namespace App\Controller;

use App\Entity\Favorite;
use App\Repository\BoatRepository;
use App\Repository\FavoriteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/favorites')]
class FavoriteController extends AbstractApiController
{
    public function __construct(
        private readonly FavoriteRepository $favoriteRepo,
        private readonly BoatRepository $boatRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $user      = $this->getCurrentUser();
        $favorites = $this->favoriteRepo->findBy(['user' => $user], ['createdAt' => 'DESC']);
        return $this->success([
            'favorites' => array_map(fn(Favorite $f) => $f->toArray(), $favorites),
        ]);
    }

    #[Route('', methods: ['POST'])]
    public function add(Request $request): JsonResponse
    {
        $user   = $this->getCurrentUser();
        $body   = $this->getJsonBody($request);
        $boatId = $body['boatId'] ?? null;

        if (!$boatId) {
            return $this->error('boatId is required', 400);
        }

        $boat = $this->boatRepo->find($boatId);
        if (!$boat) {
            return $this->error('Boat not found', 404);
        }

        $existing = $this->favoriteRepo->findOneBy(['user' => $user, 'boat' => $boat]);
        if ($existing) {
            return $this->success(['favorited' => true, 'favorite' => $existing->toArray()]);
        }

        $favorite = new Favorite();
        $favorite->setUser($user);
        $favorite->setBoat($boat);

        $this->em->persist($favorite);
        $this->em->flush();

        return $this->success(['favorited' => true, 'favorite' => $favorite->toArray()], 201);
    }

    #[Route('/{boatId}', methods: ['DELETE'])]
    public function remove(string $boatId): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($boatId);

        if (!$boat) {
            return $this->error('Boat not found', 404);
        }

        $existing = $this->favoriteRepo->findOneBy(['user' => $user, 'boat' => $boat]);
        if ($existing) {
            $this->em->remove($existing);
            $this->em->flush();
        }

        return $this->success(['favorited' => false]);
    }

    #[Route('/check/{boatId}', methods: ['GET'])]
    public function check(string $boatId): JsonResponse
    {
        $user = $this->getCurrentUser();
        $boat = $this->boatRepo->find($boatId);

        if (!$boat) {
            return $this->success(['isFavorite' => false]);
        }

        $existing = $this->favoriteRepo->findOneBy(['user' => $user, 'boat' => $boat]);
        return $this->success(['isFavorite' => $existing !== null]);
    }
}
