<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/notifications')]
class NotificationController extends AbstractApiController
{
    public function __construct(
        private readonly NotificationRepository $notifRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        [$page, $limit] = $this->paginationParams($request);

        $qb = $this->em->createQueryBuilder()
            ->select('n')
            ->from(Notification::class, 'n')
            ->where('n.user = :user')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $notifications = $qb->getQuery()->getResult();
        $total = (int) $this->em->createQueryBuilder()
            ->select('COUNT(n.id)')
            ->from(Notification::class, 'n')
            ->where('n.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        $unreadCount = (int) $this->em->createQueryBuilder()
            ->select('COUNT(n.id)')
            ->from(Notification::class, 'n')
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return new JsonResponse([
            'success' => true,
            'data' => [
                'notifications' => array_map(fn(Notification $n) => $n->toArray(), $notifications),
                'unreadCount' => $unreadCount,
                'pagination' => [
                    'page'       => $page,
                    'limit'      => $limit,
                    'total'      => $total,
                    'totalPages' => (int) ceil($total / $limit),
                ],
            ],
        ]);
    }

    #[Route('/unread-count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        $user  = $this->getCurrentUser();
        $count = (int) $this->em->createQueryBuilder()
            ->select('COUNT(n.id)')
            ->from(Notification::class, 'n')
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return $this->success(['count' => $count]);
    }

    #[Route('/read-all', methods: ['PATCH'])]
    public function markAllRead(): JsonResponse
    {
        $user = $this->getCurrentUser();
        $this->em->createQueryBuilder()
            ->update(Notification::class, 'n')
            ->set('n.isRead', true)
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        return $this->success(['message' => 'All notifications marked as read']);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $user  = $this->getCurrentUser();
        $notif = $this->notifRepo->find($id);

        if (!$notif || $notif->getUser()->getId() !== $user->getId()) {
            return $this->error('Notification not found', 404);
        }

        return $this->success($notif->toArray());
    }

    #[Route('/{id}/read', methods: ['PATCH'])]
    public function markRead(string $id): JsonResponse
    {
        $user  = $this->getCurrentUser();
        $notif = $this->notifRepo->find($id);

        if (!$notif || $notif->getUser()->getId() !== $user->getId()) {
            return $this->error('Notification not found', 404);
        }

        $notif->setIsRead(true);
        $this->em->flush();

        return $this->success($notif->toArray());
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $user  = $this->getCurrentUser();
        $notif = $this->notifRepo->find($id);

        if (!$notif || $notif->getUser()->getId() !== $user->getId()) {
            return $this->error('Notification not found', 404);
        }

        $this->em->remove($notif);
        $this->em->flush();

        return $this->success(['message' => 'Notification deleted']);
    }
}
