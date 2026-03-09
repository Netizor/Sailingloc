<?php

namespace App\Service;

use App\Entity\PasswordResetToken;
use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\PasswordResetTokenRepository;
use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly RefreshTokenRepository $refreshTokenRepo,
        private readonly PasswordResetTokenRepository $passwordResetTokenRepo,
        private readonly int $jwtRefreshTtl,
    ) {}

    public function createUser(string $email, string $password, string $firstName, string $lastName, string $role = User::ROLE_RENTER): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setRole($role);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    public function createRefreshToken(User $user): RefreshToken
    {
        // Invalidate old tokens for this user (optional: keep last N)
        $oldTokens = $this->refreshTokenRepo->findBy(['user' => $user]);
        foreach ($oldTokens as $old) {
            $this->em->remove($old);
        }

        $token = new RefreshToken();
        $token->setToken(bin2hex(random_bytes(64)));
        $token->setUser($user);
        $token->setExpiresAt(new \DateTimeImmutable('+' . $this->jwtRefreshTtl . ' seconds'));

        $this->em->persist($token);
        $this->em->flush();

        return $token;
    }

    /**
     * Crée un token de réinitialisation de mot de passe (TTL 15 min).
     * Supprime les tokens existants de l'utilisateur — un seul actif à la fois.
     */
    public function createPasswordResetToken(User $user): string
    {
        // Suppression des anciens tokens pour cet utilisateur
        $oldTokens = $this->passwordResetTokenRepo->findBy(['user' => $user]);
        foreach ($oldTokens as $old) {
            $this->em->remove($old);
        }

        $plainToken  = bin2hex(random_bytes(32));
        // Seul le hash est stocké en DB — le token en clair ne circule que par email
        $hashedToken = hash('sha256', $plainToken);

        $prt = new PasswordResetToken();
        $prt->setToken($hashedToken);
        $prt->setUser($user);
        $prt->setExpiresAt(new \DateTimeImmutable('+15 minutes'));

        $this->em->persist($prt);
        $this->em->flush();

        return $plainToken;
    }

    public function rotateRefreshToken(RefreshToken $oldToken): RefreshToken
    {
        $user = $oldToken->getUser();
        $this->em->remove($oldToken);

        $newToken = new RefreshToken();
        $newToken->setToken(bin2hex(random_bytes(64)));
        $newToken->setUser($user);
        $newToken->setExpiresAt(new \DateTimeImmutable('+' . $this->jwtRefreshTtl . ' seconds'));

        $this->em->persist($newToken);
        $this->em->flush();

        return $newToken;
    }
}
