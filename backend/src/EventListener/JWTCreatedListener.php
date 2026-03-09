<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;

class JWTCreatedListener
{
    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        /** @var User $user */
        $user = $event->getUser();

        $payload = $event->getData();
        $payload['id']        = $user->getId();
        $payload['role']      = $user->getRole();
        $payload['firstName'] = $user->getFirstName();
        $payload['lastName']  = $user->getLastName();

        $event->setData($payload);
    }
}
