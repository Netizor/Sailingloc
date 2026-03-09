<?php

namespace App\Controller;

use App\Entity\EmailVerificationToken;
use App\Entity\User;
use App\Repository\EmailVerificationTokenRepository;
use App\Repository\PasswordResetTokenRepository;
use App\Repository\RefreshTokenRepository;
use App\Repository\UserRepository;
use App\Service\AuthService;
use App\Service\EmailService;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\User\UserInterface;

#[Route('/api/auth')]
class AuthController extends AbstractApiController
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepo,
        private readonly RefreshTokenRepository $refreshTokenRepo,
        private readonly PasswordResetTokenRepository $passwordResetTokenRepo,
        private readonly EmailVerificationTokenRepository $emailVerificationTokenRepo,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EmailService $emailService,
        private readonly RateLimiterFactory $registerLimiter,
        private readonly RateLimiterFactory $resetPasswordLimiter,
    ) {}

    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        // Limite : 5 inscriptions par heure par IP
        if (!$this->registerLimiter->create($request->getClientIp())->consume(1)->isAccepted()) {
            return $this->error('Trop de tentatives. Réessayez dans quelques instants.', 429);
        }

        $body = $this->getJsonBody($request);
        $email     = trim($body['email'] ?? '');
        $password  = $body['password'] ?? '';
        $firstName = trim($body['firstName'] ?? '');
        $lastName  = trim($body['lastName'] ?? '');
        $role      = $body['role'] ?? User::ROLE_RENTER;

        if (!$email || !$password || !$firstName || !$lastName) {
            return $this->error('email, password, firstName and lastName are required', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->error('Invalid email format', 400);
        }
        // P1 : minimum 12 caractères (CNIL 2022, délibération n°2022-100)
        // P3 : maximum 128 caractères (NIST SP 800-63B, OWASP)
        if (strlen($password) < 12) {
            return $this->error('Le mot de passe doit contenir au moins 12 caractères.', 400);
        }
        if (strlen($password) > 128) {
            return $this->error('Le mot de passe ne doit pas dépasser 128 caractères.', 400);
        }
        // Complexité requise : majuscule, minuscule, chiffre, caractère spécial (CNIL / OWASP)
        if (!preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/[0-9]/', $password) ||
            !preg_match('/[^A-Za-z0-9]/', $password)) {
            return $this->error(
                'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.',
                400,
            );
        }
        if (!in_array($role, [User::ROLE_RENTER, User::ROLE_OWNER], true)) {
            $role = User::ROLE_RENTER;
        }
        if ($this->userRepo->findOneBy(['email' => $email])) {
            return $this->error('Email already in use', 409);
        }

        $user  = $this->authService->createUser($email, $password, $firstName, $lastName, $role);
        // RGPD Art. 7 — horodatage du consentement aux CGU et à la politique de confidentialité
        $user->setTermsAcceptedAt(new \DateTimeImmutable());

        // Crée et persiste le token de vérification d'email (24 h)
        $verificationToken = (new EmailVerificationToken())
            ->setToken(bin2hex(random_bytes(32)))
            ->setUser($user)
            ->setExpiresAt(new \DateTimeImmutable('+24 hours'));
        $this->em->persist($verificationToken);
        $this->em->flush();

        // Envoi du mail de vérification en best-effort (ne bloque pas l'inscription)
        try {
            $this->emailService->sendEmailVerification($email, $firstName, $verificationToken->getToken());
        } catch (\Throwable) {
            // L'email peut échouer sans bloquer la création du compte
        }

        $token = $this->jwtManager->create($user);
        $refreshToken = $this->authService->createRefreshToken($user);

        return $this->success([
            'user'         => $user->toArray(),
            'accessToken'  => $token,
            'refreshToken' => $refreshToken->getToken(),
        ], 201);
    }

    #[Route('/login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // Handled by Symfony security (json_login firewall)
        return $this->error('Unreachable', 500);
    }

    #[Route('/refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $body = $this->getJsonBody($request);
        $tokenStr = $body['refreshToken'] ?? '';

        if (!$tokenStr) {
            return $this->error('refreshToken is required', 400);
        }

        $refreshToken = $this->refreshTokenRepo->findOneBy(['token' => $tokenStr]);
        if (!$refreshToken || $refreshToken->isExpired()) {
            return $this->error('Invalid or expired refresh token', 401);
        }

        $user         = $refreshToken->getUser();
        $newRefresh   = $this->authService->rotateRefreshToken($refreshToken);
        $accessToken  = $this->jwtManager->create($user);

        return $this->success([
            'accessToken'  => $accessToken,
            'refreshToken' => $newRefresh->getToken(),
        ]);
    }

    #[Route('/me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        return $this->success($this->getCurrentUser()->toArray());
    }

    /**
     * Demande de réinitialisation de mot de passe.
     * Réponse identique que l'email existe ou non (anti-énumération).
     */
    #[Route('/forgot-password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        // Limite : 5 demandes par heure par IP
        if (!$this->resetPasswordLimiter->create($request->getClientIp())->consume(1)->isAccepted()) {
            return $this->error('Trop de tentatives. Réessayez dans quelques instants.', 429);
        }

        $body  = $this->getJsonBody($request);
        $email = trim($body['email'] ?? '');

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->error('email invalide', 400);
        }

        $user = $this->userRepo->findOneBy(['email' => $email]);

        // Anti-énumération RGPD : réponse identique que l'email existe ou non.
        // On ne révèle jamais si une adresse est enregistrée sur la plateforme.
        if (!$user) {
            return $this->success(['message' => 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.']);
        }

        $token = $this->authService->createPasswordResetToken($user);
        try {
            $this->emailService->sendPasswordReset($email, $user->getFirstName(), $token);
        } catch (\RuntimeException) {
            // L'échec d'envoi est loggué dans EmailService
            return $this->error('L\'envoi de l\'email a échoué. Veuillez réessayer.', 500);
        }

        return $this->success(['message' => 'Un lien de réinitialisation a été envoyé à votre adresse email.']);
    }

    /**
     * Réinitialisation du mot de passe avec le token reçu par email.
     * Token invalidé après usage (usage unique).
     */
    #[Route('/reset-password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        $body     = $this->getJsonBody($request);
        $tokenStr = $body['token'] ?? '';
        $password = $body['password'] ?? '';

        if (!$tokenStr) {
            return $this->error('token requis', 400);
        }
        // P1 : minimum 12 caractères (CNIL 2022) / P3 : maximum 128 (NIST SP 800-63B)
        if (strlen($password) < 12) {
            return $this->error('Le mot de passe doit contenir au moins 12 caractères.', 400);
        }
        if (strlen($password) > 128) {
            return $this->error('Le mot de passe ne doit pas dépasser 128 caractères.', 400);
        }
        // Complexité requise : majuscule, minuscule, chiffre, caractère spécial (CNIL / OWASP)
        if (!preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/[0-9]/', $password) ||
            !preg_match('/[^A-Za-z0-9]/', $password)) {
            return $this->error(
                'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.',
                400,
            );
        }

        // Comparaison sur le hash — le token en clair n'est jamais stocké en DB
        $prt = $this->passwordResetTokenRepo->findOneBy(['token' => hash('sha256', $tokenStr)]);

        if (!$prt || $prt->isExpired()) {
            return $this->error('Token invalide ou expiré', 400);
        }

        $user = $prt->getUser();
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));

        // Invalidation de toutes les sessions existantes — si le compte était compromis,
        // les refresh tokens de l'attaquant sont révoqués immédiatement
        $existingRefreshTokens = $this->refreshTokenRepo->findBy(['user' => $user]);
        foreach ($existingRefreshTokens as $rt) {
            $this->em->remove($rt);
        }

        // Token utilisé une seule fois — on le supprime immédiatement
        $this->em->remove($prt);
        $this->em->flush();

        return $this->success(['message' => 'Mot de passe réinitialisé avec succès.']);
    }

    /**
     * Vérifie l'adresse email via le token reçu par email (route publique).
     * Token à usage unique, valable 24 h. Retourne un nouveau JWT avec emailVerifiedAt.
     */
    #[Route('/verify-email', methods: ['GET'])]
    public function verifyEmail(Request $request): JsonResponse
    {
        $tokenStr = $request->query->get('token', '');

        if (!$tokenStr) {
            return $this->error('Token manquant', 400);
        }

        $evt = $this->emailVerificationTokenRepo->findOneBy(['token' => $tokenStr]);

        if (!$evt) {
            return $this->error('Lien de vérification invalide.', 400);
        }
        if ($evt->isExpired()) {
            return $this->error('Ce lien a expiré. Demandez-en un nouveau.', 400);
        }

        $user = $evt->getUser();

        // Idempotent : si déjà vérifié, succès immédiat
        if (!$user->isEmailVerified()) {
            $user->setEmailVerifiedAt(new \DateTimeImmutable());
        }

        // Token consommé — suppression immédiate
        $this->em->remove($evt);
        $this->em->flush();

        // Retourne un JWT mis à jour pour que le frontend rafraîchisse l'état
        $accessToken  = $this->jwtManager->create($user);
        $refreshToken = $this->authService->createRefreshToken($user);

        return $this->success([
            'message'      => 'Adresse email vérifiée avec succès.',
            'user'         => $user->toArray(),
            'accessToken'  => $accessToken,
            'refreshToken' => $refreshToken->getToken(),
        ]);
    }

    /**
     * Renvoie un email de vérification (route protégée — utilisateur connecté).
     * Limite : 3 renvois par heure pour éviter les abus.
     */
    #[Route('/resend-verification', methods: ['POST'])]
    public function resendVerification(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if ($user->isEmailVerified()) {
            return $this->success(['message' => 'Votre adresse email est déjà vérifiée.']);
        }

        // Supprime les anciens tokens non expirés pour ce compte
        $existing = $this->emailVerificationTokenRepo->findBy(['user' => $user]);
        foreach ($existing as $old) {
            $this->em->remove($old);
        }

        $verificationToken = (new EmailVerificationToken())
            ->setToken(bin2hex(random_bytes(32)))
            ->setUser($user)
            ->setExpiresAt(new \DateTimeImmutable('+24 hours'));
        $this->em->persist($verificationToken);
        $this->em->flush();

        try {
            $this->emailService->sendEmailVerification(
                $user->getEmail(),
                $user->getFirstName(),
                $verificationToken->getToken()
            );
        } catch (\Throwable) {
            return $this->error('L\'envoi de l\'email a échoué. Veuillez réessayer.', 500);
        }

        return $this->success(['message' => 'Un nouvel email de vérification a été envoyé.']);
    }

    /**
     * Suppression de compte — RGPD Art. 17 (droit à l'effacement).
     * Les données personnelles sont anonymisées (pas de suppression brutale pour
     * conserver les obligations légales et financières liées aux réservations).
     */
    #[Route('/account', methods: ['DELETE'])]
    public function deleteAccount(): JsonResponse
    {
        $user   = $this->getCurrentUser();
        $userId = $user->getId();

        // Anonymisation des données personnelles identifiantes
        $user->setEmail("supprime_{$userId}@deleted.sailingloc.fr");
        $user->setFirstName('Utilisateur');
        $user->setLastName('Supprimé');
        $user->setPhone(null);
        $user->setBio(null);
        $user->setAvatar(null);
        $user->setIsActive(false);
        // Mot de passe aléatoire pour invalider toute connexion future
        $user->setPassword(
            $this->passwordHasher->hashPassword($user, bin2hex(random_bytes(32)))
        );

        // Révocation de tous les tokens d'authentification actifs
        foreach ($this->refreshTokenRepo->findBy(['user' => $user]) as $rt) {
            $this->em->remove($rt);
        }
        foreach ($this->passwordResetTokenRepo->findBy(['user' => $user]) as $prt) {
            $this->em->remove($prt);
        }

        $this->em->flush();

        return $this->success(['message' => 'Votre compte a été supprimé. Vos données personnelles ont été effacées conformément au RGPD.']);
    }

    #[Route('/logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $body = $this->getJsonBody($request);
        $tokenStr = $body['refreshToken'] ?? '';

        if ($tokenStr) {
            $refreshToken = $this->refreshTokenRepo->findOneBy(['token' => $tokenStr]);
            if ($refreshToken) {
                $this->em->remove($refreshToken);
                $this->em->flush();
            }
        }

        return $this->success(['message' => 'Logged out successfully']);
    }
}
