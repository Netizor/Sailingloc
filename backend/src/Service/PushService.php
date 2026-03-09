<?php

namespace App\Service;

use App\Entity\PushSubscription;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * D5 — Service Web Push.
 * Gère l'envoi de notifications push via le Web Push Protocol (VAPID).
 */
class PushService
{
    private WebPush $webPush;
    private string $vapidPublicKey;

    public function __construct(
        private readonly EntityManagerInterface $em,
        string $vapidPublicKey,
        string $vapidPrivateKey,
        string $vapidSubject,
    ) {
        $this->vapidPublicKey = $vapidPublicKey;

        $this->webPush = new WebPush([
            'VAPID' => [
                'subject'    => $vapidSubject,
                'publicKey'  => $vapidPublicKey,
                'privateKey' => $vapidPrivateKey,
            ],
        ]);

        // Désactive les batches pour simplifier la gestion des erreurs
        $this->webPush->setReuseVAPIDHeaders(true);
    }

    /** Retourne la clé publique VAPID à exposer au client. */
    public function getVapidPublicKey(): string
    {
        return $this->vapidPublicKey;
    }

    /**
     * Envoie une notification push à tous les appareils abonnés d'un utilisateur.
     * Les abonnements expirés ou invalides sont automatiquement supprimés.
     *
     * @param string $url URL vers laquelle renvoyer au clic sur la notification
     */
    public function sendToUser(User $user, string $title, string $body, string $url = '/'): void
    {
        $repo          = $this->em->getRepository(PushSubscription::class);
        $subscriptions = $repo->findBy(['user' => $user]);

        if (empty($subscriptions)) {
            return;
        }

        $payload = json_encode(['title' => $title, 'body' => $body, 'url' => $url], JSON_THROW_ON_ERROR);

        foreach ($subscriptions as $sub) {
            $this->webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $sub->getEndpoint(),
                    'keys'     => [
                        'p256dh' => $sub->getP256dh(),
                        'auth'   => $sub->getAuth(),
                    ],
                ]),
                $payload,
            );
        }

        // Récupérer et traiter les résultats d'envoi
        $toRemove = [];
        foreach ($this->webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                // L'endpoint n'est plus valide — marquer pour suppression
                $sub = $repo->findOneBy(['endpointHash' => hash('sha256', $report->getEndpoint())]);
                if ($sub) {
                    $toRemove[] = $sub;
                }
            }
        }

        // Supprimer les abonnements expirés en une seule passe
        foreach ($toRemove as $sub) {
            $this->em->remove($sub);
        }
        if (!empty($toRemove)) {
            $this->em->flush();
        }
    }
}
