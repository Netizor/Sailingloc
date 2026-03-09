<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

abstract class AbstractApiController extends AbstractController
{
    protected function success(mixed $data, int $status = 200): JsonResponse
    {
        return new JsonResponse(['success' => true, 'data' => $data], $status);
    }

    protected function error(string $message, int $status = 400): JsonResponse
    {
        return new JsonResponse(['success' => false, 'message' => $message], $status);
    }

    protected function paginated(array $items, int $total, int $page, int $limit): JsonResponse
    {
        $totalPages = $total > 0 ? (int) ceil($total / $limit) : 0;
        return new JsonResponse([
            'success' => true,
            'data' => [
                'data'        => $items,
                'total'       => $total,
                'page'        => $page,
                'limit'       => $limit,
                'totalPages'  => $totalPages,
                'hasNextPage' => $page < $totalPages,
                'hasPrevPage' => $page > 1,
            ],
        ]);
    }

    protected function getJsonBody(Request $request): array
    {
        $content = $request->getContent();
        if (empty($content)) {
            return [];
        }
        return json_decode($content, true) ?? [];
    }

    protected function getCurrentUser(): User
    {
        /** @var User $user */
        $user = $this->getUser();
        return $user;
    }

    protected function paginationParams(Request $request, int $defaultLimit = 10): array
    {
        $page  = max(1, (int) $request->query->get('page', 1));
        $limit = min(50, max(1, (int) $request->query->get('limit', $defaultLimit)));
        return [$page, $limit];
    }
}
