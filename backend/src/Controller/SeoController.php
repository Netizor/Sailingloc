<?php

namespace App\Controller;

use App\Entity\Boat;
use App\Repository\BoatRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Génère le sitemap XML et le fichier robots.txt pour le référencement naturel.
 * Ces routes sont accessibles sans authentification et sans le préfixe /api.
 */
class SeoController extends AbstractController
{
    public function __construct(
        private readonly BoatRepository $boatRepo,
    ) {}

    /** GET /robots.txt */
    #[Route('/robots.txt', methods: ['GET'], format: 'txt')]
    public function robots(): Response
    {
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'https://sailingloc.fr';

        $content = implode("\n", [
            'User-agent: *',
            'Allow: /',
            'Disallow: /api/',
            'Disallow: /mon-espace/',
            'Disallow: /admin/',
            '',
            "Sitemap: {$frontendUrl}/sitemap.xml",
            '',
        ]);

        return new Response($content, 200, ['Content-Type' => 'text/plain; charset=utf-8']);
    }

    /** GET /sitemap.xml */
    #[Route('/sitemap.xml', methods: ['GET'], format: 'xml')]
    public function sitemap(): Response
    {
        $frontendUrl = rtrim($_ENV['FRONTEND_URL'] ?? 'https://sailingloc.fr', '/');
        $today       = (new \DateTimeImmutable())->format('Y-m-d');

        // Pages statiques
        $staticPaths = [
            ['loc' => '/',                     'priority' => '1.0', 'changefreq' => 'weekly'],
            ['loc' => '/bateaux',              'priority' => '0.9', 'changefreq' => 'daily'],
            ['loc' => '/destinations',         'priority' => '0.8', 'changefreq' => 'weekly'],
            ['loc' => '/a-propos',             'priority' => '0.5', 'changefreq' => 'monthly'],
            ['loc' => '/faq',                  'priority' => '0.5', 'changefreq' => 'monthly'],
            ['loc' => '/contact',              'priority' => '0.5', 'changefreq' => 'monthly'],
            ['loc' => '/guide-proprietaire',   'priority' => '0.6', 'changefreq' => 'monthly'],
        ];

        // Bateaux actifs
        /** @var Boat[] $boats */
        $boats = $this->boatRepo->findBy(['status' => 'ACTIVE'], null, 1000);

        $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($staticPaths as $page) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$frontendUrl}{$page['loc']}</loc>\n";
            $xml .= "    <lastmod>{$today}</lastmod>\n";
            $xml .= "    <changefreq>{$page['changefreq']}</changefreq>\n";
            $xml .= "    <priority>{$page['priority']}</priority>\n";
            $xml .= "  </url>\n";
        }

        foreach ($boats as $boat) {
            $lastmod = $boat->getUpdatedAt()->format('Y-m-d');
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$frontendUrl}/bateaux/{$boat->getId()}</loc>\n";
            $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
            $xml .= "    <changefreq>weekly</changefreq>\n";
            $xml .= "    <priority>0.7</priority>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return new Response($xml, 200, ['Content-Type' => 'application/xml; charset=utf-8']);
    }
}
