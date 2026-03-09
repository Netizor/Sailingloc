<?php

namespace App\Controller;

use App\Entity\PushSubscription;
use App\Service\PushService;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * D5 — Endpoints Web Push.
 * Gère l'abonnement, la désinscription et l'exposition de la clé VAPID publique.
 */
#[OA\Tag(name: 'Notifications Push')]
#[Route('/api/push')]
class PushController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PushService $push,
    ) {}

    /**
     * Retourne la clé publique VAPID pour que le client puisse s'abonner.
     * Endpoint public (pas besoin d'authentification).
     */
    #[OA\Get(
        path: '/api/push/vapid-key',
        summary: 'Clé publique VAPID pour Web Push',
        security: [],
        tags: ['Notifications Push'],
        responses: [
            new OA\Response(response: 200, description: 'Clé publique VAPID'),
        ]
    )]
    #[Route('/vapid-key', methods: ['GET'])]
    public function vapidKey(): JsonResponse
    {
        return $this->success(['vapidPublicKey' => $this->push->getVapidPublicKey()]);
    }

    /**
     * Enregistre ou met à jour un abonnement push pour l'utilisateur connecté.
     * Corps attendu : { endpoint, keys: { p256dh, auth } }
     */
    #[OA\Post(
        path: '/api/push/subscribe',
        summary: 'S\'abonner aux notifications push',
        security: [['bearerAuth' => []]],
        tags: ['Notifications Push'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['endpoint', 'keys'],
                properties: [
                    new OA\Property(property: 'endpoint', type: 'string', description: 'URL du service push'),
                    new OA\Property(
                        property: 'keys',
                        type: 'object',
                        required: ['p256dh', 'auth'],
                        properties: [
                            new OA\Property(property: 'p256dh', type: 'string'),
                            new OA\Property(property: 'auth', type: 'string'),
                        ]
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Abonnement enregistré'),
            new OA\Response(response: 400, description: 'Données manquantes'),
            new OA\Response(response: 401, description: 'Non authentifié'),
        ]
    )]
    #[Route('/subscribe', methods: ['POST'])]
    public function subscribe(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $body = $this->getJsonBody($request);

        $endpoint = $body['endpoint'] ?? null;
        $p256dh   = $body['keys']['p256dh'] ?? null;
        $auth     = $body['keys']['auth'] ?? null;

        if (!$endpoint || !$p256dh || !$auth) {
            return $this->error('endpoint, keys.p256dh et keys.auth sont requis', 400);
        }

        $repo = $this->em->getRepository(PushSubscription::class);

        // Mettre à jour si l'endpoint existe déjà pour CET utilisateur (re-souscription après expiration de clés).
        // La recherche inclut l'utilisateur pour éviter qu'un user B écrase les clés d'un user A
        // en réutilisant le même endpoint (IDOR sur les notifications push).
        $endpointHash = hash('sha256', $endpoint);
        $existing     = $repo->findOneBy(['endpointHash' => $endpointHash, 'user' => $user]);

        if (!$existing) {
            $existing = new PushSubscription();
            $existing->setUser($user);
            $existing->setEndpoint($endpoint); // calcule endpointHash en interne
            $this->em->persist($existing);
        }

        $existing->setP256dh($p256dh);
        $existing->setAuth($auth);
        $this->em->flush();

        return $this->success(['message' => 'Abonnement push enregistré'], 201);
    }

    /**
     * Supprime un abonnement push (désinscription).
     * Corps attendu : { endpoint }
     */
    #[OA\Delete(
        path: '/api/push/unsubscribe',
        summary: 'Se désabonner des notifications push',
        security: [['bearerAuth' => []]],
        tags: ['Notifications Push'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['endpoint'],
                properties: [
                    new OA\Property(property: 'endpoint', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Abonnement supprimé'),
            new OA\Response(response: 400, description: 'endpoint manquant'),
            new OA\Response(response: 401, description: 'Non authentifié'),
        ]
    )]
    #[Route('/unsubscribe', methods: ['DELETE'])]
    public function unsubscribe(Request $request): JsonResponse
    {
        $user     = $this->getCurrentUser();
        $body     = $this->getJsonBody($request);
        $endpoint = $body['endpoint'] ?? null;

        if (!$endpoint) {
            return $this->error('endpoint est requis', 400);
        }

        $sub = $this->em->getRepository(PushSubscription::class)->findOneBy([
            'endpointHash' => hash('sha256', $endpoint),
            'user'         => $user,
        ]);

        if ($sub) {
            $this->em->remove($sub);
            $this->em->flush();
        }

        return $this->success(['message' => 'Abonnement push supprimé']);
    }
}
