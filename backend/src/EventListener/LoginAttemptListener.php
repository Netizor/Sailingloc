<?php

namespace App\EventListener;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;

/**
 * P2 — Comptabilise les tentatives de connexion échouées.
 * Après 10 échecs consécutifs, le compte est verrouillé 15 minutes.
 * Un succès remet le compteur à zéro.
 */
class LoginAttemptListener
{
    // Seuil avant verrouillage et durée en minutes (CNIL 2022 / OWASP)
    private const MAX_ATTEMPTS   = 10;
    private const LOCKOUT_MINUTES = 15;

    public function __construct(
        private readonly UserRepository $userRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    #[AsEventListener(event: LoginSuccessEvent::class)]
    public function onLoginSuccess(LoginSuccessEvent $event): void
    {
        $user = $event->getAuthenticatedToken()->getUser();
        if (!$user instanceof User) {
            return;
        }

        // Réinitialise le compteur et lève le verrou éventuel
        if ($user->getFailedLoginAttempts() > 0 || $user->getLockedUntil() !== null) {
            $user->resetFailedLoginAttempts();
            $this->em->flush();
        }
    }

    #[AsEventListener(event: LoginFailureEvent::class)]
    public function onLoginFailure(LoginFailureEvent $event): void
    {
        $request = $event->getRequest();
        $payload = json_decode($request->getContent(), true) ?? [];
        $email   = trim((string) ($payload['email'] ?? ''));

        if (!$email) {
            return;
        }

        $user = $this->userRepo->findOneBy(['email' => $email]);
        if (!$user) {
            // Anti-énumération : on ne révèle pas si l'email existe
            return;
        }

        // Si déjà verrouillé, on ne réincrémente pas (le UserChecker a déjà bloqué)
        if ($user->isLocked()) {
            return;
        }

        $user->incrementFailedLoginAttempts();

        if ($user->getFailedLoginAttempts() >= self::MAX_ATTEMPTS) {
            $lockUntil = new \DateTimeImmutable('+' . self::LOCKOUT_MINUTES . ' minutes');
            $user->setLockedUntil($lockUntil);
        }

        $this->em->flush();
    }
}
