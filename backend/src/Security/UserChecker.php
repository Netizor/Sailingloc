<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Vérifie l'état du compte avant et après l'authentification.
 * P2 — Bloque la connexion si le compte est temporairement verrouillé (10 tentatives échouées).
 */
class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        // Compte désactivé (supprimé / anonymisé RGPD)
        if (!$user->isActive()) {
            throw new CustomUserMessageAuthenticationException(
                'Ce compte a été désactivé.',
            );
        }

        // Compte temporairement verrouillé suite à trop de tentatives
        if ($user->isLocked()) {
            $until = $user->getLockedUntil();
            $minutesLeft = $until !== null
                ? (int) ceil(($until->getTimestamp() - time()) / 60)
                : 0;

            throw new CustomUserMessageAuthenticationException(
                "Compte temporairement bloqué. Réessayez dans {$minutesLeft} minute(s).",
            );
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
        // Pas de vérification post-auth nécessaire ici
    }
}
