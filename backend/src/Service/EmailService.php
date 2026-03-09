<?php

namespace App\Service;

class EmailService
{
    public function __construct(
        private readonly string $resendApiKey,
        private readonly string $mailFrom,
        private readonly string $frontendUrl,
    ) {}

    // Échappe les données utilisateur pour éviter l'injection HTML dans les emails
    private function esc(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private function send(string $to, string $subject, string $html): void
    {
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->resendApiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'from'    => $this->mailFrom,
                'to'      => [$to],
                'subject' => $subject,
                'html'    => $html,
            ]),
        ]);
        $response  = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false || $httpCode >= 400) {
            error_log(sprintf(
                '[EmailService] Échec envoi email à %s — HTTP %d — cURL: %s — Réponse: %s',
                $to,
                $httpCode,
                $curlError,
                is_string($response) ? substr($response, 0, 500) : 'false'
            ));
            throw new \RuntimeException('Échec de l\'envoi de l\'email');
        }
    }

    public function sendWelcome(string $email, string $firstName): void
    {
        $this->send(
            $email,
            'Bienvenue sur SailingLoc !',
            "<h1>Bonjour {$this->esc($firstName)},</h1><p>Bienvenue sur SailingLoc, la plateforme de location de bateaux entre particuliers.</p>"
        );
    }

    public function sendBookingConfirmation(string $email, string $firstName, string $boatTitle, string $startDate, string $endDate): void
    {
        $this->send(
            $email,
            'Votre réservation est confirmée - SailingLoc',
            "<h1>Réservation confirmée !</h1><p>Bonjour {$this->esc($firstName)},</p><p>Votre réservation pour <strong>{$this->esc($boatTitle)}</strong> du <strong>{$this->esc($startDate)}</strong> au <strong>{$this->esc($endDate)}</strong> est confirmée.</p>"
        );
    }

    public function sendBookingRequest(string $ownerEmail, string $ownerFirstName, string $boatTitle, string $renterName): void
    {
        $this->send(
            $ownerEmail,
            'Nouvelle demande de réservation - SailingLoc',
            "<h1>Nouvelle demande de réservation</h1><p>Bonjour {$this->esc($ownerFirstName)},</p><p><strong>{$this->esc($renterName)}</strong> souhaite réserver votre bateau <strong>{$this->esc($boatTitle)}</strong>.</p><p><a href='{$this->frontendUrl}/dashboard'>Voir la demande</a></p>"
        );
    }

    /**
     * Envoie le lien de vérification d'adresse email (valable 24 heures).
     */
    public function sendEmailVerification(string $email, string $firstName, string $token): void
    {
        $link = "{$this->frontendUrl}/verifier-email?token=" . urlencode($token);
        $this->send(
            $email,
            'Vérifiez votre adresse email — SailingLoc',
            "<h1>Vérifiez votre adresse email</h1>"
            . "<p>Bonjour {$this->esc($firstName)},</p>"
            . "<p>Merci de vous être inscrit sur SailingLoc ! Cliquez sur le bouton ci-dessous pour confirmer votre adresse email (lien valable <strong>24 heures</strong>) :</p>"
            . "<p><a href='{$link}' style='background:#0369a1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;'>Vérifier mon adresse email</a></p>"
            . "<p style='color:#64748b;font-size:13px;'>Si vous n'avez pas créé de compte sur SailingLoc, ignorez cet email.</p>"
            . "<p style='color:#64748b;font-size:12px;'>Ou copiez ce lien dans votre navigateur : <a href='{$link}'>{$link}</a></p>"
        );
    }

    /**
     * Notifie le locataire que sa demande de réservation a été acceptée par le propriétaire.
     */
    public function sendBookingAccepted(string $email, string $firstName, string $boatTitle, string $startDate, string $endDate): void
    {
        $link = "{$this->frontendUrl}/mon-espace/reservations";
        $this->send(
            $email,
            '✅ Votre réservation a été acceptée — SailingLoc',
            "<h1 style='color:#059669;'>Bonne nouvelle !</h1>"
            . "<p>Bonjour {$this->esc($firstName)},</p>"
            . "<p>Le propriétaire a <strong>accepté</strong> votre demande de réservation pour "
            . "<strong>{$this->esc($boatTitle)}</strong> du <strong>{$this->esc($startDate)}</strong> "
            . "au <strong>{$this->esc($endDate)}</strong>.</p>"
            . "<p><a href='{$link}' style='background:#059669;color:#fff;padding:12px 24px;"
            . "border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;'>"
            . "Voir ma réservation</a></p>",
        );
    }

    /**
     * Notifie le locataire que sa demande de réservation a été refusée par le propriétaire.
     */
    public function sendBookingRejected(string $email, string $firstName, string $boatTitle, string $startDate, string $endDate): void
    {
        $link = "{$this->frontendUrl}/rechercher";
        $this->send(
            $email,
            'Demande de réservation refusée — SailingLoc',
            "<h1>Demande refusée</h1>"
            . "<p>Bonjour {$this->esc($firstName)},</p>"
            . "<p>Le propriétaire n'a pas pu accepter votre demande de réservation pour "
            . "<strong>{$this->esc($boatTitle)}</strong> du <strong>{$this->esc($startDate)}</strong> "
            . "au <strong>{$this->esc($endDate)}</strong>.</p>"
            . "<p>Pas d'inquiétude, d'autres bateaux sont disponibles à ces dates !</p>"
            . "<p><a href='{$link}' style='background:#0369a1;color:#fff;padding:12px 24px;"
            . "border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;'>"
            . "Rechercher un autre bateau</a></p>",
        );
    }

    /**
     * Notifie le locataire que le propriétaire a annulé sa réservation confirmée.
     */
    public function sendBookingCancelledByOwner(string $email, string $firstName, string $boatTitle, string $startDate, string $endDate): void
    {
        $link = "{$this->frontendUrl}/rechercher";
        $this->send(
            $email,
            'Votre réservation a été annulée — SailingLoc',
            "<h1 style='color:#dc2626;'>Réservation annulée</h1>"
            . "<p>Bonjour {$this->esc($firstName)},</p>"
            . "<p>Le propriétaire a annulé votre réservation pour <strong>{$this->esc($boatTitle)}</strong> "
            . "du <strong>{$this->esc($startDate)}</strong> au <strong>{$this->esc($endDate)}</strong>.</p>"
            . "<p>Si un paiement a été effectué, le remboursement sera traité automatiquement sous 5 à 10 jours ouvrés.</p>"
            . "<p><a href='{$link}' style='background:#0369a1;color:#fff;padding:12px 24px;"
            . "border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;'>"
            . "Rechercher un autre bateau</a></p>",
        );
    }

    /**
     * Notifie le propriétaire que le locataire a annulé sa réservation.
     */
    public function sendBookingCancelledByRenter(string $email, string $firstName, string $renterName, string $boatTitle, string $startDate, string $endDate): void
    {
        $link = "{$this->frontendUrl}/proprietaire/reservations";
        $this->send(
            $email,
            'Un locataire a annulé sa réservation — SailingLoc',
            "<h1>Réservation annulée par le locataire</h1>"
            . "<p>Bonjour {$this->esc($firstName)},</p>"
            . "<p><strong>{$this->esc($renterName)}</strong> a annulé sa réservation pour "
            . "<strong>{$this->esc($boatTitle)}</strong> du <strong>{$this->esc($startDate)}</strong> "
            . "au <strong>{$this->esc($endDate)}</strong>. Ces dates sont à nouveau disponibles.</p>"
            . "<p><a href='{$link}' style='background:#0369a1;color:#fff;padding:12px 24px;"
            . "border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;'>"
            . "Voir mes réservations</a></p>",
        );
    }

    /**
     * Alerte l'utilisateur que son mot de passe figure dans des fuites de données connues (HIBP).
     * Inclut un lien direct vers la page de changement de mot de passe.
     */
    public function sendPasswordCompromised(string $email, string $firstName, int $breachCount): void
    {
        $changeUrl    = "{$this->frontendUrl}/mon-espace/profil";
        $countFormatted = number_format($breachCount, 0, ',', '\u{202F}');

        $this->send(
            $email,
            '[SailingLoc] Alerte sécurité — Votre mot de passe a été compromis',
            "<div style='font-family:sans-serif;max-width:600px;margin:auto;'>"
            . "<div style='background:#dc2626;padding:24px 32px;border-radius:12px 12px 0 0;'>"
            . "<h1 style='color:#fff;margin:0;font-size:20px;'>Alerte sécurité — Mot de passe compromis</h1>"
            . "</div>"
            . "<div style='background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;'>"
            . "<p>Bonjour {$this->esc($firstName)},</p>"
            . "<p>Votre mot de passe actuel a été identifié dans <strong>{$countFormatted} fuite(s) de données</strong> "
            . "répertoriées par le service <a href='https://haveibeenpwned.com' style='color:#0369a1;'>Have I Been Pwned</a>.</p>"
            . "<p>Des attaquants pourraient connaître votre mot de passe. Nous vous recommandons vivement de le changer immédiatement.</p>"
            . "<p style='text-align:center;margin:32px 0;'>"
            . "<a href='{$changeUrl}' style='background:#dc2626;color:#fff;padding:14px 28px;border-radius:8px;"
            . "text-decoration:none;display:inline-block;font-weight:600;font-size:15px;'>Changer mon mot de passe</a>"
            . "</p>"
            . "<hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0;'>"
            . "<p style='color:#6b7280;font-size:12px;'>"
            . "Votre mot de passe n'a jamais été transmis à des tiers. SailingLoc utilise la méthode "
            . "<strong>k-anonymity</strong> de l'API Have I Been Pwned : seule une empreinte partielle "
            . "(5 caractères sur 40) est comparée — votre mot de passe reste confidentiel."
            . "</p>"
            . "</div></div>"
        );
    }

    /**
     * Envoie le lien de réinitialisation de mot de passe (valable 15 minutes).
     */
    public function sendPasswordReset(string $email, string $firstName, string $token): void
    {
        $link = "{$this->frontendUrl}/reinitialiser-mot-de-passe?token=" . urlencode($token);
        $this->send(
            $email,
            'Réinitialisation de votre mot de passe - SailingLoc',
            "<h1>Réinitialisation de mot de passe</h1>"
            . "<p>Bonjour {$this->esc($firstName)},</p>"
            . "<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous (valable <strong>15 minutes</strong>) :</p>"
            . "<p><a href='{$link}' style='background:#0369a1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;'>Réinitialiser mon mot de passe</a></p>"
            . "<p>Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe reste inchangé.</p>"
        );
    }
}
