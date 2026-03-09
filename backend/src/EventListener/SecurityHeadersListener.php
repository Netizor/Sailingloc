<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Injecte les headers de sécurité HTTP sur toutes les réponses API.
 *
 * Ces headers sont recommandés par l'OWASP (Secure Headers Project) et
 * le guide ANSSI pour les applications web exposées sur Internet.
 */
#[AsEventListener(event: KernelEvents::RESPONSE)]
class SecurityHeadersListener
{
    public function onKernelResponse(ResponseEvent $event): void
    {
        // Ignore les sous-requêtes (fragments Symfony, ESI…)
        if (!$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();

        // Empêche le MIME-type sniffing — l'API ne retourne que du JSON (OWASP A05)
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Interdit l'affichage de l'API dans un iframe — protection clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');

        // Contrôle les informations envoyées dans le header Referer sur les redirections
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Désactive les API navigateur non utilisées par l'API
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        // HSTS : force HTTPS pour 2 ans — appliqué uniquement en production (connexion sécurisée)
        if ($event->getRequest()->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=63072000; includeSubDomains; preload',
            );
        }

        // Supprime les headers qui révèlent la technologie sous-jacente (fingerprinting)
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');
    }
}
