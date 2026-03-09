<?php

namespace App\Service;

use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeService
{
    private StripeClient $stripe;

    public function __construct(
        private readonly string $secretKey,
        private readonly string $webhookSecret,
        private readonly int $platformFeePercent,
    ) {
        $this->stripe = new StripeClient($this->secretKey);
    }

    public function getClient(): StripeClient
    {
        return $this->stripe;
    }

    public function getPlatformFeePercent(): int
    {
        return $this->platformFeePercent;
    }

    public function createPaymentIntent(float $amount, string $currency, array $metadata = []): \Stripe\PaymentIntent
    {
        return $this->stripe->paymentIntents->create([
            'amount'                    => (int) round($amount * 100),
            'currency'                  => $currency,
            'metadata'                  => $metadata,
            'automatic_payment_methods' => ['enabled' => true],
        ]);
    }

    public function cancelPaymentIntent(string $id): void
    {
        try {
            $this->stripe->paymentIntents->cancel($id);
        } catch (\Throwable) {
            // Silently ignore cancellation errors
        }
    }

    public function retrievePaymentIntent(string $id): \Stripe\PaymentIntent
    {
        return $this->stripe->paymentIntents->retrieve($id);
    }

    public function updatePaymentIntentMetadata(string $id, array $metadata): void
    {
        $this->stripe->paymentIntents->update($id, ['metadata' => $metadata]);
    }

    public function createRefund(string $paymentIntentId): void
    {
        $this->stripe->refunds->create(['payment_intent' => $paymentIntentId]);
    }

    public function constructWebhookEvent(string $payload, string $sigHeader): \Stripe\Event
    {
        return Webhook::constructEvent($payload, $sigHeader, $this->webhookSecret);
    }

    // ── D6 — Carte de paiement sauvegardée ────────────────────────────────────

    /**
     * Crée un Customer Stripe si l'utilisateur n'en a pas encore, sinon retourne l'ID existant.
     */
    public function createOrRetrieveCustomer(string $email, string $name, ?string $existingId): string
    {
        if ($existingId) {
            try {
                $customer = $this->stripe->customers->retrieve($existingId);
                // Un Customer supprimé côté Stripe a deleted = true
                if (!$customer->deleted) {
                    return $existingId;
                }
            } catch (\Throwable) {
                // Le Customer n'existe plus chez Stripe — on en recrée un neuf
            }
        }

        $customer = $this->stripe->customers->create(['email' => $email, 'name' => $name]);

        return $customer->id;
    }

    /**
     * Crée un SetupIntent lié au Customer pour sauvegarder une carte sans prélèvement.
     */
    public function createSetupIntent(string $customerId): \Stripe\SetupIntent
    {
        return $this->stripe->setupIntents->create([
            'customer'                  => $customerId,
            'automatic_payment_methods' => ['enabled' => true],
        ]);
    }

    /**
     * Liste les PaymentMethods de type "card" attachés au Customer.
     */
    public function listPaymentMethods(string $customerId): array
    {
        $result = $this->stripe->paymentMethods->all([
            'customer' => $customerId,
            'type'     => 'card',
        ]);

        return $result->data;
    }

    /**
     * Détache un PaymentMethod du Customer (suppression de carte).
     */
    public function detachPaymentMethod(string $paymentMethodId): void
    {
        $this->stripe->paymentMethods->detach($paymentMethodId);
    }
}
