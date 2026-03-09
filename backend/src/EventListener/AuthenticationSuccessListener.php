<?php

namespace App\EventListener;

use App\Entity\User;
use App\Service\AuthService;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;

class AuthenticationSuccessListener
{
    public function __construct(private readonly AuthService $authService) {}

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        /** @var User $user */
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        $refreshToken = $this->authService->createRefreshToken($user);

        $data = $event->getData();
        // Rename Lexik's default "token" key to "accessToken" expected by the frontend
        if (isset($data['token'])) {
            $data['accessToken'] = $data['token'];
            unset($data['token']);
        }
        $data['refreshToken'] = $refreshToken->getToken();
        $data['user']         = $user->toArray();
        $event->setData($data);
    }
}
