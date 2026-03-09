<?php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Service\CloudinaryService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/users')]
class UserController extends AbstractApiController
{
    public function __construct(
        private readonly UserRepository $userRepo,
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly CloudinaryService $cloudinary,
    ) {}

    #[Route('/profile', methods: ['PATCH'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $body = $this->getJsonBody($request);

        // Valide et assainit les champs avant de les persister (longueurs calées sur le schéma DB)
        $fieldMaxLengths = [
            'firstName' => 100,
            'lastName'  => 100,
            'phone'     => 20,
            'bio'       => 2000,
        ];

        foreach ($fieldMaxLengths as $field => $maxLength) {
            if (!isset($body[$field])) {
                continue;
            }

            $value = trim((string) $body[$field]);

            if ($field === 'phone' && $value !== '' && !preg_match('/^\+?[\d\s\-().]{0,20}$/', $value)) {
                return $this->error('Numéro de téléphone invalide', 400);
            }

            if (mb_strlen($value) > $maxLength) {
                return $this->error("Le champ {$field} ne doit pas dépasser {$maxLength} caractères", 400);
            }

            $setter = 'set' . ucfirst($field);
            $user->$setter($value);
        }

        $this->em->flush();
        return $this->success(['user' => $user->toArray()]);
    }

    #[Route('/password', methods: ['PATCH'])]
    public function changePassword(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $body = $this->getJsonBody($request);

        $currentPassword = $body['currentPassword'] ?? '';
        $newPassword     = $body['newPassword'] ?? '';

        if (!$currentPassword || !$newPassword) {
            return $this->error('Les champs currentPassword et newPassword sont requis', 400);
        }
        if (!$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
            return $this->error('Le mot de passe actuel est incorrect', 400);
        }

        // P1 : minimum 12 caractères (CNIL 2022) / P3 : maximum 128 (NIST SP 800-63B)
        if (mb_strlen($newPassword) < 12) {
            return $this->error('Le mot de passe doit contenir au moins 12 caractères', 400);
        }
        if (mb_strlen($newPassword) > 128) {
            return $this->error('Le mot de passe ne doit pas dépasser 128 caractères', 400);
        }
        // Complexité requise : majuscule, minuscule, chiffre, caractère spécial (CNIL / OWASP)
        if (!preg_match('/[A-Z]/', $newPassword) ||
            !preg_match('/[a-z]/', $newPassword) ||
            !preg_match('/[0-9]/', $newPassword) ||
            !preg_match('/[^A-Za-z0-9]/', $newPassword)) {
            return $this->error(
                'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
                400,
            );
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $newPassword));
        $this->em->flush();

        return $this->success(['message' => 'Mot de passe modifié avec succès']);
    }

    #[Route('/avatar', methods: ['POST'])]
    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();
        $file = $request->files->get('avatar');

        if (!$file) {
            return $this->error('Aucun fichier fourni', 400);
        }

        // Limite la taille du fichier à 5 Mo pour éviter les abus
        if ($file->getSize() > 5 * 1024 * 1024) {
            return $this->error('Le fichier ne doit pas dépasser 5 Mo', 400);
        }

        // Vérifie le MIME type via allowlist (pas de SVG — risque XSS si servi directement)
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($file->getMimeType() ?? '', $allowedMimes, true)) {
            return $this->error('Le fichier doit être une image (JPG, PNG ou WebP)', 400);
        }

        // Conserve l'ancien avatar pour le supprimer après l'upload réussi
        $oldAvatar = $user->getAvatar();

        $result = $this->cloudinary->upload($file->getRealPath(), 'sailingloc/avatars');
        $user->setAvatar($result['url']);
        $this->em->flush();

        // Nettoyage de l'ancien avatar sur Cloudinary (best-effort, ne bloque pas la réponse)
        if ($oldAvatar) {
            try {
                if (preg_match('#/upload/(?:v\d+/)?(.+)\.\w+$#', $oldAvatar, $matches)) {
                    $this->cloudinary->delete($matches[1]);
                }
            } catch (\Throwable) {
                // Suppression optionnelle : on ne remonte pas l'erreur à l'utilisateur
            }
        }

        return $this->success(['user' => $user->toArray()]);
    }

    /**
     * RGPD Art. 20 — Droit à la portabilité des données.
     * Renvoie l'ensemble des données personnelles de l'utilisateur connecté en JSON.
     * La route /me/export est déclarée AVANT /{id} pour éviter toute collision.
     */
    #[Route('/me/export', methods: ['GET'])]
    public function exportMyData(): JsonResponse
    {
        $user = $this->getCurrentUser();

        return $this->success([
            'profile'    => $user->toArray(true),
            'exportedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $user = $this->userRepo->find($id);
        if (!$user || !$user->isActive()) {
            return $this->error('Utilisateur introuvable', 404);
        }

        // Profil public : n'expose que les informations non sensibles (pas email / phone / role)
        return $this->success(['user' => [
            'id'        => $user->getId(),
            'firstName' => $user->getFirstName(),
            'lastName'  => $user->getLastName(),
            'avatar'    => $user->getAvatar(),
            'bio'       => $user->getBio(),
            'createdAt' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ]]);
    }
}
