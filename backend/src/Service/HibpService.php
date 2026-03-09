<?php

namespace App\Service;

/**
 * Vérifie si un mot de passe a été compromis via l'API Have I Been Pwned.
 *
 * Méthode k-anonymity : seuls les 5 premiers caractères du hash SHA-1 sont
 * transmis à l'API — ni le mot de passe en clair, ni le hash complet ne quittent
 * le serveur. L'API retourne tous les suffixes correspondant à ce préfixe et c'est
 * le backend qui compare localement.
 *
 * @see https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
 */
class HibpService
{
    /**
     * Retourne le nombre de fuites connues pour ce mot de passe (0 = non compromis).
     * En cas d'erreur réseau, retourne 0 pour ne jamais bloquer l'utilisateur.
     */
    public function getBreachCount(string $password): int
    {
        $hash   = strtoupper(sha1($password));
        $prefix = substr($hash, 0, 5);
        $suffix = substr($hash, 5);

        $ch = curl_init("https://api.pwnedpasswords.com/range/{$prefix}");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            // Add-Padding atténue les attaques par analyse de volume de trafic
            CURLOPT_HTTPHEADER     => ['Add-Padding: true'],
            CURLOPT_USERAGENT      => 'SailingLoc-HibpCheck/1.0',
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            // Erreur réseau ou service HIBP indisponible — ne pas bloquer l'utilisateur
            return 0;
        }

        foreach (explode("\n", $response) as $line) {
            $parts = explode(':', trim($line), 2);
            if (count($parts) === 2 && strtoupper($parts[0]) === $suffix) {
                return (int) $parts[1];
            }
        }

        return 0;
    }
}
