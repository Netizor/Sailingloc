<?php

namespace App\Controller;

use App\Repository\BookingRepository;
use App\Repository\UserRepository;
use App\Service\StripeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/payments')]
class PaymentController extends AbstractApiController
{
    public function __construct(
        private readonly StripeService $stripe,
        private readonly BookingRepository $bookingRepo,
        private readonly UserRepository $userRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/webhook', methods: ['POST'])]
    public function webhook(Request $request): Response
    {
        $payload   = $request->getContent();
        $sigHeader = $request->headers->get('stripe-signature', '');

        try {
            $event = $this->stripe->constructWebhookEvent($payload, $sigHeader);
        } catch (\Exception $e) {
            return new Response('Invalid signature', 400);
        }

        switch ($event->type) {
            case 'payment_intent.succeeded':
                $pi      = $event->data->object;
                $booking = $this->bookingRepo->findOneBy(['stripePaymentIntentId' => $pi->id]);
                if ($booking && $booking->getStatus() === 'PENDING') {
                    $booking->setStatus('CONFIRMED');
                    $this->em->flush();
                }
                break;

            case 'payment_intent.payment_failed':
                $pi      = $event->data->object;
                $booking = $this->bookingRepo->findOneBy(['stripePaymentIntentId' => $pi->id]);
                if ($booking && $booking->getStatus() === 'PENDING') {
                    $booking->setStatus('CANCELLED');
                    $booking->setCancellationReason('Payment failed');
                    $this->em->flush();
                }
                break;
        }

        return new Response('OK', 200);
    }

    #[Route('/connect/onboard', methods: ['POST'])]
    public function connectOnboard(): JsonResponse
    {
        $user = $this->getCurrentUser();

        $accountId = $user->getStripeAccountId();
        if (!$accountId) {
            $account   = $this->stripe->getClient()->accounts->create(['type' => 'express']);
            $accountId = $account->id;
            $user->setStripeAccountId($accountId);
            $this->em->flush();
        }

        $link = $this->stripe->getClient()->accountLinks->create([
            'account'     => $accountId,
            'refresh_url' => $_ENV['FRONTEND_URL'] . '/dashboard/payments?status=refresh',
            'return_url'  => $_ENV['FRONTEND_URL'] . '/dashboard/payments?status=success',
            'type'        => 'account_onboarding',
        ]);

        return $this->success(['url' => $link->url]);
    }

    #[Route('/connect/status', methods: ['GET'])]
    public function connectStatus(): JsonResponse
    {
        $user      = $this->getCurrentUser();
        $accountId = $user->getStripeAccountId();

        if (!$accountId) {
            return $this->success(['connected' => false, 'accountId' => null]);
        }

        $account = $this->stripe->getClient()->accounts->retrieve($accountId);
        return $this->success([
            'connected'  => $account->charges_enabled,
            'accountId'  => $accountId,
            'detailsSubmitted' => $account->details_submitted,
        ]);
    }
}
