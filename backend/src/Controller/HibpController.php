<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Service\EmailService;
use App\Service\HibpService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth')]
class HibpController extends AbstractApiController
{
    public function __construct(
        private readonly HibpService $hibpService,
        private readonly EmailService $emailService,
        private readonly EntityManagerInterface $em,
    ) {}

    /**
     * Vérifie si le mot de passe de l'utilisateur connecté figure dans des fuites de données
     * connues via l'API Have I Been Pwned (k-anonymity — le mot de passe n'est jamais transmis
     * à des tiers).
     *
     * Si compromis et qu'aucune alerte n'a été envoyée dans les dernières 24 h :
     *   - crée une notification in-app de type PASSWORD_COMPROMISED
     *   - envoie un email d'alerte
     *
     * Cet endpoint est appelé en arrière-plan après chaque connexion réussie.
     * Il ne bloque jamais l'accès même en cas d'erreur.
     */
    #[Route('/hibp-check', methods: ['POST'])]
    public function check(Request $request): JsonResponse
    {
        $user     = $this->getCurrentUser();
        $body     = $this->getJsonBody($request);
        $password = $body['password'] ?? '';

        if (!$password) {
            return $this->error('password is required', 400);
        }

        $count = $this->hibpService->getBreachCount($password);

        if ($count === 0) {
            return $this->success(['compromised' => false]);
        }

        // Évite les notifications en doublon : max une alerte toutes les 24 heures
        $recentCount = (int) $this->em->createQueryBuilder()
            ->select('COUNT(n.id)')
            ->from(Notification::class, 'n')
            ->where('n.user = :user')
            ->andWhere('n.type = :type')
            ->andWhere('n.createdAt > :since')
            ->setParameter('user', $user)
            ->setParameter('type', 'PASSWORD_COMPROMISED')
            ->setParameter('since', new \DateTimeImmutable('-24 hours'))
            ->getQuery()
            ->getSingleScalarResult();

        if ($recentCount === 0) {
            $notification = (new Notification())
                ->setUser($user)
                ->setType('PASSWORD_COMPROMISED')
                ->setTitle('Mot de passe compromis détecté')
                ->setMessageText(sprintf(
                    'Votre mot de passe a été trouvé %s fois dans des fuites de données connues. Changez-le dès maintenant pour sécuriser votre compte.',
                    number_format($count, 0, ',', ' ')
                ))
                ->setData(['breachCount' => $count]);

            $this->em->persist($notification);
            $this->em->flush();

            // L'email est non bloquant : une erreur d'envoi ne doit pas faire échouer la réponse
            try {
                $this->emailService->sendPasswordCompromised(
                    $user->getEmail(),
                    $user->getFirstName(),
                    $count,
                );
            } catch (\Throwable) {
                // Échec silencieux — la notification in-app suffit
            }
        }

        return $this->success(['compromised' => true, 'count' => $count]);
    }
}
