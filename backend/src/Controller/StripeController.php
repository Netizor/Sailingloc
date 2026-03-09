<?php

namespace App\Controller;

use App\Service\StripeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * D6 — Gestion des cartes de paiement sauvegardées (Stripe SetupIntent).
 */
#[Route('/api/stripe')]
class StripeController extends AbstractApiController
{
    public function __construct(
        private readonly StripeService $stripe,
        private readonly EntityManagerInterface $em,
    ) {}

    /**
     * Crée (ou récupère) le Stripe Customer de l'utilisateur,
     * puis crée un SetupIntent pour sauvegarder une carte.
     */
    #[Route('/setup-intent', methods: ['POST'])]
    public function createSetupIntent(): JsonResponse
    {
        $user = $this->getCurrentUser();

        try {
            $customerId = $this->stripe->createOrRetrieveCustomer(
                $user->getEmail(),
                $user->getFirstName() . ' ' . $user->getLastName(),
                $user->getStripeCustomerId(),
            );

            // Persiste si l'ID a changé (première fois ou Customer recréé après suppression côté Stripe)
            if ($user->getStripeCustomerId() !== $customerId) {
                $user->setStripeCustomerId($customerId);
                $this->em->flush();
            }

            $setupIntent = $this->stripe->createSetupIntent($customerId);
        } catch (\Throwable) {
            return $this->error('Service de paiement temporairement indisponible.', 502);
        }

        return $this->success(['clientSecret' => $setupIntent->client_secret]);
    }

    /**
     * Liste les cartes sauvegardées de l'utilisateur courant.
     */
    #[Route('/payment-methods', methods: ['GET'])]
    public function listPaymentMethods(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user->getStripeCustomerId()) {
            return $this->success(['paymentMethods' => []]);
        }

        $methods = $this->stripe->listPaymentMethods($user->getStripeCustomerId());

        $formatted = array_map(fn ($pm) => [
            'id'       => $pm->id,
            'brand'    => $pm->card->brand,
            'last4'    => $pm->card->last4,
            'expMonth' => $pm->card->exp_month,
            'expYear'  => $pm->card->exp_year,
        ], $methods);

        return $this->success(['paymentMethods' => $formatted]);
    }

    /**
     * Détache (supprime) une carte sauvegardée.
     * Vérifie que la carte appartient bien à l'utilisateur courant avant suppression.
     */
    #[Route('/payment-methods/{id}', methods: ['DELETE'], requirements: ['id' => 'pm_[a-zA-Z0-9]+'])]
    public function detachPaymentMethod(string $id): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user->getStripeCustomerId()) {
            return $this->error('Aucune carte enregistrée', 404);
        }

        // Récupère le PaymentMethod pour vérifier qu'il appartient bien à ce Customer
        try {
            $pm = $this->stripe->getClient()->paymentMethods->retrieve($id);
        } catch (\Throwable) {
            return $this->error('Carte introuvable', 404);
        }

        if ($pm->customer !== $user->getStripeCustomerId()) {
            return $this->error('Carte introuvable', 404);
        }

        try {
            $this->stripe->detachPaymentMethod($id);
        } catch (\Throwable) {
            return $this->error('Impossible de supprimer la carte.', 500);
        }

        return $this->success(['message' => 'Carte supprimée']);
    }
}
