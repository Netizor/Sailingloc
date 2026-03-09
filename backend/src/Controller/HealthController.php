<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class HealthController extends AbstractApiController
{
    #[Route('/api/health', methods: ['GET'])]
    public function health(EntityManagerInterface $em): JsonResponse
    {
        try {
            $em->getConnection()->executeQuery('SELECT 1');
            $db = 'ok';
        } catch (\Throwable) {
            $db = 'error';
        }

        return $this->success([
            'status' => 'ok',
            'db'     => $db,
        ]);
    }
}
