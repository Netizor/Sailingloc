<?php

namespace App\DataFixtures;

use App\Entity\Boat;
use App\Entity\Booking;
use App\Entity\Review;
use App\Entity\User;
use App\Service\AuthService;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function __construct(private readonly AuthService $authService) {}

    public function load(ObjectManager $manager): void
    {
        // ── Users ────────────────────────────────────────────────────────────

        $admin = $this->authService->createUser(
            'admin@sailingloc.fr', 'Admin@Sail2026!', 'Admin', 'SailingLoc', User::ROLE_ADMIN
        );

        $owner1 = $this->authService->createUser(
            'owner@demo.fr', 'Owner@Sail2026!', 'Pierre', 'Dupont', User::ROLE_OWNER
        );
        $owner1->setBio('Passionné de voile depuis 20 ans, je partage mes bateaux avec plaisir.');
        $owner1->setPhone('+33612345678');

        $owner2 = $this->authService->createUser(
            'sophie.martin@demo.fr', 'Owner@Sail2026!', 'Sophie', 'Martin', User::ROLE_OWNER
        );
        $owner2->setBio('Navigatrice professionnelle, je propose des bateaux de qualité sur la côte atlantique.');
        $owner2->setPhone('+33687654321');

        $owner3 = $this->authService->createUser(
            'luc.bernard@demo.fr', 'Owner@Sail2026!', 'Luc', 'Bernard', User::ROLE_OWNER
        );
        $owner3->setBio('Marin breton depuis toujours, spécialiste de la Bretagne et de la Manche.');
        $owner3->setPhone('+33698765432');

        $owner4 = $this->authService->createUser(
            'claire.rousseau@demo.fr', 'Owner@Sail2026!', 'Claire', 'Rousseau', User::ROLE_OWNER
        );
        $owner4->setBio('Amatrice de catamaran et de navigation en famille sur la Méditerranée.');
        $owner4->setPhone('+33611223344');

        $renter = $this->authService->createUser(
            'renter@demo.fr', 'Renter@Sail2026!', 'Marie', 'Martin', User::ROLE_RENTER
        );

        $renter2 = $this->authService->createUser(
            'thomas.leroy@demo.fr', 'Renter@Sail2026!', 'Thomas', 'Leroy', User::ROLE_RENTER
        );

        $renter3 = $this->authService->createUser(
            'emma.dubois@demo.fr', 'Renter@Sail2026!', 'Emma', 'Dubois', User::ROLE_RENTER
        );

        // Tous les comptes demo ont leur email pré-vérifié pour que la démo fonctionne sans passer par la boite mail
        $now = new \DateTimeImmutable();
        foreach ([$admin, $owner1, $owner2, $owner3, $owner4, $renter, $renter2, $renter3] as $u) {
            $u->setEmailVerifiedAt($now);
        }

        $manager->flush();

        // ── Boats ────────────────────────────────────────────────────────────
        // owner => $owner1 : Méditerranée Est
        // owner => $owner2 : Atlantique
        // owner => $owner3 : Bretagne / Manche
        // owner => $owner4 : Méditerranée Ouest + catamarans

        $boats = [

            // ── MÉDITERRANÉE EST (owner1) ────────────────────────────────────
            [
                'owner' => $owner1,
                'title' => 'Bénéteau Oceanis 45 – Cannes',
                'description' => 'Magnifique voilier de 45 pieds, idéal pour les croisières en Méditerranée. Confortable et bien équipé pour 8 personnes.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Oceanis 45',
                'year' => 2019, 'length' => 13.9, 'capacity' => 8, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Cannes', 'city' => 'Cannes', 'lat' => 43.5483, 'lng' => 7.0125,
                'dailyRate' => 350.0, 'weeklyRate' => 2100.0, 'depositAmount' => 1500.0,
                'equipment' => ['GPS', 'VHF', 'Autopilote', 'Bimini', 'Équipement plongée'],
            ],
            [
                'owner' => $owner1,
                'title' => 'Jeanneau Sun Odyssey 440 – Marseille',
                'description' => 'Voilier moderne et rapide, parfait pour les régates et croisières. Équipement haut de gamme.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Sun Odyssey 440',
                'year' => 2021, 'length' => 13.4, 'capacity' => 6, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port Vieux de Marseille', 'city' => 'Marseille', 'lat' => 43.2965, 'lng' => 5.3698,
                'dailyRate' => 280.0, 'weeklyRate' => 1680.0, 'depositAmount' => 1200.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Dufour 460 GL – Nice',
                'description' => 'Voilier grand luxe avec finitions premium. Vue imprenable sur la Baie des Anges. Parfait pour découvrir la Riviera.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Dufour', 'model' => '460 GL',
                'year' => 2022, 'length' => 14.0, 'capacity' => 8, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Nice', 'city' => 'Nice', 'lat' => 43.6961, 'lng' => 7.2795,
                'dailyRate' => 380.0, 'weeklyRate' => 2280.0, 'depositAmount' => 1800.0,
                'equipment' => ['GPS chartplotter', 'AIS', 'Autopilote', 'Bimini', 'Lazy bag'],
            ],
            [
                'owner' => $owner1,
                'title' => 'Bénéteau First 35 – Toulon',
                'description' => 'Voilier sportif idéal pour la régate côtière. Rapide et maniable, pour les amateurs de sensations.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'First 35',
                'year' => 2018, 'length' => 10.7, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port du Mourillon', 'city' => 'Toulon', 'lat' => 43.1242, 'lng' => 5.9281,
                'dailyRate' => 200.0, 'weeklyRate' => 1200.0, 'depositAmount' => 900.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Jeanneau Cap Camarat 9.0 CC – Saint-Tropez',
                'description' => 'Vedette rapide et élégante pour sillonner le golfe de Saint-Tropez. Jusqu\'à 8 personnes à bord.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Cap Camarat 9.0 CC',
                'year' => 2020, 'length' => 9.0, 'capacity' => 8, 'cabins' => 1,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 250,
                'port' => 'Port de Saint-Tropez', 'city' => 'Saint-Tropez', 'lat' => 43.2727, 'lng' => 6.6408,
                'dailyRate' => 320.0, 'depositAmount' => 1500.0,
                'equipment' => ['GPS', 'VHF', 'Bimini', 'Douche de pont'],
            ],
            [
                'owner' => $owner1,
                'title' => 'Quicksilver Activ 755 Open – Antibes',
                'description' => 'Open sportif pour sorties à la journée. Idéal pour les plages et les calanques autour d\'Antibes.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Quicksilver', 'model' => 'Activ 755',
                'year' => 2021, 'length' => 7.5, 'capacity' => 7, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 200,
                'port' => 'Port Vauban', 'city' => 'Antibes', 'lat' => 43.5836, 'lng' => 7.1276,
                'dailyRate' => 220.0, 'depositAmount' => 1000.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Bayliner VR6 – Cap d\'Agde',
                'description' => 'Bateau moteur rapide pour les sorties en famille ou entre amis. Idéal pour le ski nautique.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Bayliner', 'model' => 'VR6',
                'year' => 2020, 'length' => 5.5, 'capacity' => 6, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 150,
                'port' => 'Port du Cap d\'Agde', 'city' => 'Agde', 'lat' => 43.2799, 'lng' => 3.5125,
                'dailyRate' => 180.0, 'depositAmount' => 800.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Bénéteau Antares 760 – La Ciotat',
                'description' => 'Vedette de croisière côtière avec cabine. Parfaite pour explorer les calanques depuis La Ciotat.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Antares 760',
                'year' => 2019, 'length' => 7.6, 'capacity' => 7, 'cabins' => 1,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 175,
                'port' => 'Port de La Ciotat', 'city' => 'La Ciotat', 'lat' => 43.1766, 'lng' => 5.6073,
                'dailyRate' => 210.0, 'weeklyRate' => 1260.0, 'depositAmount' => 1000.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Zodiac Pro Open 650 – Cassis',
                'description' => 'Semi-rigide rapide pour explorer les calanques de Marseille à Cassis. Maniable et agréable.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Zodiac', 'model' => 'Pro Open 650',
                'year' => 2022, 'length' => 6.5, 'capacity' => 8, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 115,
                'port' => 'Port de Cassis', 'city' => 'Cassis', 'lat' => 43.2136, 'lng' => 5.5382,
                'dailyRate' => 150.0, 'depositAmount' => 600.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Highfield CL 550 – Bandol',
                'description' => 'Semi-rigide aluminium robuste, idéal pour les familles et les groupes. Navigation côtière autour de Bandol.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Highfield', 'model' => 'CL 550',
                'year' => 2021, 'length' => 5.5, 'capacity' => 6, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 90,
                'port' => 'Port de Bandol', 'city' => 'Bandol', 'lat' => 43.1358, 'lng' => 5.7516,
                'dailyRate' => 130.0, 'depositAmount' => 500.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Fountaine Pajot Lucia 40 – Toulon',
                'description' => 'Catamaran moderne et spacieux, parfait pour une croisière confortable en Méditerranée.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Fountaine Pajot', 'model' => 'Lucia 40',
                'year' => 2020, 'length' => 12.2, 'capacity' => 10, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port du Mourillon', 'city' => 'Toulon', 'lat' => 43.1197, 'lng' => 5.9513,
                'dailyRate' => 520.0, 'weeklyRate' => 3120.0, 'depositAmount' => 2500.0,
                'withSkipper' => true, 'skipperPrice' => 180.0,
                'equipment' => ['GPS', 'AIS', 'Radar', 'Bimini', 'Trampoline', 'Grill BBQ'],
            ],
            [
                'owner' => $owner1,
                'title' => 'Bavaria C42 – Fréjus',
                'description' => 'Voilier familial idéal pour découvrir l\'Estérel et les îles de Lérins depuis Fréjus.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bavaria', 'model' => 'C42',
                'year' => 2017, 'length' => 12.8, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port Fréjus', 'city' => 'Fréjus', 'lat' => 43.4228, 'lng' => 6.7423,
                'dailyRate' => 260.0, 'weeklyRate' => 1560.0, 'depositAmount' => 1100.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Elan E4 – Port-Camargue',
                'description' => 'Voilier performant et élégant à Port-Camargue, porte d\'entrée idéale vers la Camargue et la Grande Motte.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Elan', 'model' => 'E4',
                'year' => 2020, 'length' => 11.7, 'capacity' => 6, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port-Camargue', 'city' => 'Port-Camargue', 'lat' => 43.5285, 'lng' => 4.1347,
                'dailyRate' => 240.0, 'weeklyRate' => 1440.0, 'depositAmount' => 1000.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Dufour 382 GL – Sète',
                'description' => 'Voilier compact et économique pour explorer l\'étang de Thau et les mouillages de la côte languedocienne.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Dufour', 'model' => '382 GL',
                'year' => 2016, 'length' => 11.5, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Sète', 'city' => 'Sète', 'lat' => 43.4039, 'lng' => 3.6967,
                'dailyRate' => 200.0, 'weeklyRate' => 1200.0, 'depositAmount' => 900.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Jeanneau Leader 10.5 – Mandelieu',
                'description' => 'Vedette sportive et bien équipée pour des sorties à la journée ou en cabine. Accès rapide aux îles de Lérins.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Leader 10.5',
                'year' => 2021, 'length' => 10.5, 'capacity' => 9, 'cabins' => 1,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 300,
                'port' => 'Port de Mandelieu', 'city' => 'Mandelieu-la-Napoule', 'lat' => 43.5085, 'lng' => 6.9367,
                'dailyRate' => 350.0, 'depositAmount' => 1800.0,
                'equipment' => ['GPS', 'VHF', 'Bimini', 'Équipement snorkeling'],
            ],

            // ── MÉDITERRANÉE OUEST + CATAMARANS (owner4) ─────────────────────
            [
                'owner' => $owner4,
                'title' => 'Lagoon 40 Catamaran – Antibes',
                'description' => 'Catamaran spacieux et stable, idéal pour les familles. Deux coques offrant beaucoup d\'espace de vie.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Lagoon', 'model' => '400 S2',
                'year' => 2018, 'length' => 11.73, 'capacity' => 10, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port Vauban', 'city' => 'Antibes', 'lat' => 43.5836, 'lng' => 7.1276,
                'dailyRate' => 480.0, 'weeklyRate' => 2880.0, 'depositAmount' => 2000.0,
                'withSkipper' => true, 'skipperPrice' => 150.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Lagoon 42 – Marseille',
                'description' => 'Grand catamaran pour croisières en famille ou entre amis. Stabilité et confort garantis en Méditerranée.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Lagoon', 'model' => '42',
                'year' => 2021, 'length' => 12.8, 'capacity' => 12, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Marina Vieux-Port', 'city' => 'Marseille', 'lat' => 43.2931, 'lng' => 5.3756,
                'dailyRate' => 600.0, 'weeklyRate' => 3600.0, 'depositAmount' => 3000.0,
                'withSkipper' => true, 'skipperPrice' => 200.0,
                'equipment' => ['GPS chartplotter', 'AIS', 'Radar', 'Bimini', 'Bains de soleil', 'Cuisine équipée'],
            ],
            [
                'owner' => $owner4,
                'title' => 'Fountaine Pajot Elba 45 – Cannes',
                'description' => 'Catamaran haut de gamme, finitions luxueuses. Idéal pour une semaine de croisière inoubliable sur la Riviera.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Fountaine Pajot', 'model' => 'Elba 45',
                'year' => 2022, 'length' => 13.7, 'capacity' => 10, 'cabins' => 5,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Cannes', 'city' => 'Cannes', 'lat' => 43.5512, 'lng' => 7.0172,
                'dailyRate' => 750.0, 'weeklyRate' => 4500.0, 'depositAmount' => 4000.0,
                'withSkipper' => true, 'skipperPrice' => 220.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'NEEL 45 Trimaran – Sète',
                'description' => 'Trimaran hautes performances pour navigateurs passionnés. Vitesse et confort en Méditerranée occidentale.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'NEEL', 'model' => '45',
                'year' => 2020, 'length' => 13.5, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Sète', 'city' => 'Sète', 'lat' => 43.4039, 'lng' => 3.6967,
                'dailyRate' => 650.0, 'weeklyRate' => 3900.0, 'depositAmount' => 3500.0,
                'withSkipper' => true, 'skipperPrice' => 190.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Lagoon 38 – Port-Camargue',
                'description' => 'Catamaran familial pour explorer la Camargue et le littoral languedocien. Confort et stabilité.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Lagoon', 'model' => '38',
                'year' => 2017, 'length' => 11.6, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port-Camargue', 'city' => 'Port-Camargue', 'lat' => 43.5285, 'lng' => 4.1347,
                'dailyRate' => 420.0, 'weeklyRate' => 2520.0, 'depositAmount' => 2000.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Bénéteau Oceanis 51.1 – Nice',
                'description' => 'Grand voilier de croisière pour navigations hauturières ou côtières. Confort hôtelier à bord.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Oceanis 51.1',
                'year' => 2022, 'length' => 15.5, 'capacity' => 10, 'cabins' => 5,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Nice', 'city' => 'Nice', 'lat' => 43.6953, 'lng' => 7.2801,
                'dailyRate' => 550.0, 'weeklyRate' => 3300.0, 'depositAmount' => 2500.0,
                'withSkipper' => true, 'skipperPrice' => 200.0,
                'equipment' => ['GPS chartplotter', 'AIS', 'Autopilote', 'Radar', 'Lazy jack', 'Bimini'],
            ],
            [
                'owner' => $owner4,
                'title' => 'Jeanneau Merry Fisher 895 – Toulon',
                'description' => 'Vedette de croisière robuste pour explorer le Var et les îles d\'Hyères. Cabine confortable.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Merry Fisher 895',
                'year' => 2020, 'length' => 8.95, 'capacity' => 8, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 225,
                'port' => 'Port de Hyères', 'city' => 'Hyères', 'lat' => 43.1139, 'lng' => 6.1525,
                'dailyRate' => 300.0, 'weeklyRate' => 1800.0, 'depositAmount' => 1500.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Zodiac Medline 7.5 – Marseille',
                'description' => 'Semi-rigide haut de gamme pour explorer les calanques marseillaises. Rapide et confortable.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Zodiac', 'model' => 'Medline 7.5',
                'year' => 2021, 'length' => 7.5, 'capacity' => 10, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 150,
                'port' => 'Port de la Pointe-Rouge', 'city' => 'Marseille', 'lat' => 43.2442, 'lng' => 5.3671,
                'dailyRate' => 180.0, 'depositAmount' => 800.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Bavaria C50 – Saint-Tropez',
                'description' => 'Grand voilier de croisière pour une semaine de rêve entre Saint-Tropez, Porquerolles et les calanques.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bavaria', 'model' => 'C50',
                'year' => 2019, 'length' => 15.2, 'capacity' => 10, 'cabins' => 5,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Saint-Tropez', 'city' => 'Saint-Tropez', 'lat' => 43.2712, 'lng' => 6.6393,
                'dailyRate' => 500.0, 'weeklyRate' => 3000.0, 'depositAmount' => 2200.0,
                'withSkipper' => true, 'skipperPrice' => 180.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Fountaine Pajot MY 44 – Cannes',
                'description' => 'Catamaran à moteur luxueux pour des sorties VIP sur la Côte d\'Azur. Terrasse extérieure immense.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Fountaine Pajot', 'model' => 'MY 44',
                'year' => 2022, 'length' => 13.4, 'capacity' => 10, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 360,
                'port' => 'Port de Cannes', 'city' => 'Cannes', 'lat' => 43.5497, 'lng' => 7.0145,
                'dailyRate' => 900.0, 'weeklyRate' => 5400.0, 'depositAmount' => 5000.0,
                'withSkipper' => true, 'skipperPrice' => 250.0,
                'equipment' => ['GPS', 'AIS', 'Climatisation', 'Bar extérieur', 'Jacuzzi de bord', 'WiFi satellite'],
            ],

            // ── ATLANTIQUE (owner2) ──────────────────────────────────────────
            [
                'owner' => $owner2,
                'title' => 'Bénéteau Oceanis 35.1 – La Rochelle',
                'description' => 'Voilier polyvalent pour naviguer sur l\'Atlantique. Port de La Rochelle, idéal pour rejoindre l\'île de Ré.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Oceanis 35.1',
                'year' => 2018, 'length' => 10.6, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Les Minimes', 'city' => 'La Rochelle', 'lat' => 46.1457, 'lng' => -1.1786,
                'dailyRate' => 220.0, 'weeklyRate' => 1320.0, 'depositAmount' => 900.0,
                'equipment' => ['GPS', 'VHF', 'Pilote automatique', 'Bimini'],
            ],
            [
                'owner' => $owner2,
                'title' => 'Jeanneau Sun Fast 3300 – La Rochelle',
                'description' => 'Voilier de course-croisière, rapide et performant. Idéal pour les amateurs de navigation sportive.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Sun Fast 3300',
                'year' => 2021, 'length' => 9.99, 'capacity' => 5, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port des Minimes', 'city' => 'La Rochelle', 'lat' => 46.1477, 'lng' => -1.1802,
                'dailyRate' => 250.0, 'weeklyRate' => 1500.0, 'depositAmount' => 1100.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Dufour 430 GL – Arcachon',
                'description' => 'Voilier confortable pour explorer le Bassin d\'Arcachon et ses cabanes ostréicoles. Couchers de soleil magiques.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Dufour', 'model' => '430 GL',
                'year' => 2019, 'length' => 13.1, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port d\'Arcachon', 'city' => 'Arcachon', 'lat' => 44.6578, 'lng' => -1.1635,
                'dailyRate' => 300.0, 'weeklyRate' => 1800.0, 'depositAmount' => 1300.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Bavaria 37 Cruiser – Royan',
                'description' => 'Voilier de croisière robuste pour naviguer en Gironde et sur l\'Atlantique. Idéal pour rejoindre l\'île d\'Oléron.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bavaria', 'model' => '37 Cruiser',
                'year' => 2015, 'length' => 11.2, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Royan', 'city' => 'Royan', 'lat' => 45.6209, 'lng' => -1.0264,
                'dailyRate' => 210.0, 'weeklyRate' => 1260.0, 'depositAmount' => 900.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Quicksilver Activ 605 Cabin – La Rochelle',
                'description' => 'Open à cabine pratique pour sorties à la journée et sur l\'île de Ré. Rapide et maniable.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Quicksilver', 'model' => 'Activ 605 Cabin',
                'year' => 2020, 'length' => 6.05, 'capacity' => 6, 'cabins' => 1,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 115,
                'port' => 'Vieux Port de La Rochelle', 'city' => 'La Rochelle', 'lat' => 46.1578, 'lng' => -1.1534,
                'dailyRate' => 140.0, 'depositAmount' => 600.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Bombard Explorer 550 – Arcachon',
                'description' => 'Semi-rigide pour explorer les passes du Bassin d\'Arcachon. Accès aux plages sauvages du Cap Ferret.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Bombard', 'model' => 'Explorer 550',
                'year' => 2021, 'length' => 5.5, 'capacity' => 6, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 60,
                'port' => 'Port du Moulleau', 'city' => 'Arcachon', 'lat' => 44.6621, 'lng' => -1.1711,
                'dailyRate' => 110.0, 'depositAmount' => 400.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Jeanneau Merry Fisher 795 – Les Sables-d\'Olonne',
                'description' => 'Vedette de plaisance pour explorer la côte vendéenne et les îles de Noirmoutier et Yeu.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Merry Fisher 795',
                'year' => 2019, 'length' => 7.95, 'capacity' => 7, 'cabins' => 1,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 175,
                'port' => 'Port Olona', 'city' => 'Les Sables-d\'Olonne', 'lat' => 46.4936, 'lng' => -1.7800,
                'dailyRate' => 230.0, 'depositAmount' => 1100.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Bénéteau Flyer 8.8 SPACEdeck – Biarritz',
                'description' => 'Open sportif pour profiter des vagues basques et rejoindre Saint-Jean-de-Luz ou l\'Espagne.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Flyer 8.8 SPACEdeck',
                'year' => 2022, 'length' => 8.8, 'capacity' => 8, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 200,
                'port' => 'Port de Biarritz', 'city' => 'Biarritz', 'lat' => 43.4923, 'lng' => -1.5555,
                'dailyRate' => 250.0, 'depositAmount' => 1200.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Lagoon 440 – La Rochelle',
                'description' => 'Grand catamaran pour une semaine en famille sur l\'Atlantique. Île de Ré, Oléron, Aix à portée de voile.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Lagoon', 'model' => '440',
                'year' => 2016, 'length' => 13.4, 'capacity' => 10, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port des Minimes', 'city' => 'La Rochelle', 'lat' => 46.1477, 'lng' => -1.1802,
                'dailyRate' => 560.0, 'weeklyRate' => 3360.0, 'depositAmount' => 2800.0,
                'withSkipper' => true, 'skipperPrice' => 170.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Elan E3 – Capbreton',
                'description' => 'Voilier performant pour la navigation côtière basque. Idéal pour rejoindre les côtes espagnoles.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Elan', 'model' => 'E3',
                'year' => 2020, 'length' => 10.0, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Capbreton', 'city' => 'Capbreton', 'lat' => 43.6449, 'lng' => -1.4437,
                'dailyRate' => 220.0, 'weeklyRate' => 1320.0, 'depositAmount' => 950.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Dufour 310 GL – Royan',
                'description' => 'Petit voilier économique pour s\'initier à la voile ou explorer la Gironde en couple.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Dufour', 'model' => '310 GL',
                'year' => 2014, 'length' => 9.4, 'capacity' => 4, 'cabins' => 1,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Royan', 'city' => 'Royan', 'lat' => 45.6234, 'lng' => -1.0281,
                'dailyRate' => 150.0, 'weeklyRate' => 900.0, 'depositAmount' => 650.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Zodiac N-ZO 760 – Biarritz',
                'description' => 'Semi-rigide sportif pour explorer les côtes basques. Robuste et adapté aux conditions atlantiques.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Zodiac', 'model' => 'N-ZO 760',
                'year' => 2022, 'length' => 7.6, 'capacity' => 9, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 150,
                'port' => 'Port de Biarritz', 'city' => 'Biarritz', 'lat' => 43.4891, 'lng' => -1.5601,
                'dailyRate' => 160.0, 'depositAmount' => 700.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Hanse 388 – Bordeaux Pauillac',
                'description' => 'Voilier moderne sur la Gironde. Remontez vers Bordeaux ou descendez vers l\'océan depuis Pauillac.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Hanse', 'model' => '388',
                'year' => 2018, 'length' => 11.7, 'capacity' => 6, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Pauillac', 'city' => 'Pauillac', 'lat' => 45.1939, 'lng' => -0.7450,
                'dailyRate' => 230.0, 'weeklyRate' => 1380.0, 'depositAmount' => 1000.0,
            ],

            // ── BRETAGNE / MANCHE (owner3) ───────────────────────────────────
            [
                'owner' => $owner3,
                'title' => 'Bénéteau Oceanis 40.1 – Brest',
                'description' => 'Voilier robuste pour naviguer en Bretagne et dans la rade de Brest. Bien préparé pour la navigation atlantique.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Oceanis 40.1',
                'year' => 2020, 'length' => 12.2, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Commerce de Brest', 'city' => 'Brest', 'lat' => 48.3787, 'lng' => -4.4947,
                'dailyRate' => 260.0, 'weeklyRate' => 1560.0, 'depositAmount' => 1100.0,
                'equipment' => ['GPS', 'VHF', 'AIS', 'Pilote auto', 'Combinaisons de survie'],
            ],
            [
                'owner' => $owner3,
                'title' => 'Jeanneau Sun Odyssey 349 – Lorient',
                'description' => 'Voilier compact idéal pour découvrir le Morbihan et les îles bretonnes depuis Lorient.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Sun Odyssey 349',
                'year' => 2017, 'length' => 10.5, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Plaisance de Lorient', 'city' => 'Lorient', 'lat' => 47.7482, 'lng' => -3.3684,
                'dailyRate' => 220.0, 'weeklyRate' => 1320.0, 'depositAmount' => 950.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Dufour 412 GL – Vannes',
                'description' => 'Voilier confortable pour explorer le Golfe du Morbihan et ses 365 îles. Navigation accessible.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Dufour', 'model' => '412 GL',
                'year' => 2016, 'length' => 12.5, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Vannes', 'city' => 'Vannes', 'lat' => 47.6480, 'lng' => -2.7571,
                'dailyRate' => 240.0, 'weeklyRate' => 1440.0, 'depositAmount' => 1000.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Bavaria 46 Cruiser – Saint-Malo',
                'description' => 'Grand voilier pour naviguer en Manche et explorer les îles Anglo-Normandes depuis Saint-Malo.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bavaria', 'model' => '46 Cruiser',
                'year' => 2015, 'length' => 14.0, 'capacity' => 10, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port des Bas-Sablons', 'city' => 'Saint-Malo', 'lat' => 48.6397, 'lng' => -2.0219,
                'dailyRate' => 320.0, 'weeklyRate' => 1920.0, 'depositAmount' => 1400.0,
                'withSkipper' => true, 'skipperPrice' => 150.0,
                'equipment' => ['GPS', 'AIS', 'VHF', 'Radar', 'Pilote auto', 'Combinaisons'],
            ],
            [
                'owner' => $owner3,
                'title' => 'Hanse 315 – Quiberon',
                'description' => 'Petit voilier parfait pour la baie de Quiberon et le Golfe du Morbihan. Facile à manœuvrer.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Hanse', 'model' => '315',
                'year' => 2018, 'length' => 9.5, 'capacity' => 4, 'cabins' => 1,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port Maria', 'city' => 'Quiberon', 'lat' => 47.4823, 'lng' => -3.1199,
                'dailyRate' => 180.0, 'weeklyRate' => 1080.0, 'depositAmount' => 750.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Jeanneau Sun Odyssey 490 – La Trinité-sur-Mer',
                'description' => 'Voilier haut de gamme pour naviguer dans le Morbihan et partir vers les îles du Ponant.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Sun Odyssey 490',
                'year' => 2021, 'length' => 14.9, 'capacity' => 10, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de La Trinité-sur-Mer', 'city' => 'La Trinité-sur-Mer', 'lat' => 47.5877, 'lng' => -3.0242,
                'dailyRate' => 400.0, 'weeklyRate' => 2400.0, 'depositAmount' => 1800.0,
                'withSkipper' => true, 'skipperPrice' => 160.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Bénéteau Oceanis 30.1 – Concarneau',
                'description' => 'Voilier compact et moderne pour débuter ou naviguer en Bretagne sud. Idéal pour les îles Glénan.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Oceanis 30.1',
                'year' => 2022, 'length' => 9.2, 'capacity' => 4, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Plaisance de Concarneau', 'city' => 'Concarneau', 'lat' => 47.8690, 'lng' => -3.9179,
                'dailyRate' => 170.0, 'weeklyRate' => 1020.0, 'depositAmount' => 700.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Dufour 56 Exclusive – Brest',
                'description' => 'Maxi-voilier pour une croisière hauturière inoubliable en Atlantique. Prestations grand luxe.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Dufour', 'model' => '56 Exclusive',
                'year' => 2021, 'length' => 17.0, 'capacity' => 12, 'cabins' => 6,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port du Moulin Blanc', 'city' => 'Brest', 'lat' => 48.3819, 'lng' => -4.4289,
                'dailyRate' => 700.0, 'weeklyRate' => 4200.0, 'depositAmount' => 4000.0,
                'withSkipper' => true, 'skipperPrice' => 230.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Bénéteau Flyer 6.6 SPACEdeck – Lorient',
                'description' => 'Open sportif pour des sorties côtières autour de Groix et Belle-Île. Maniable et rapide.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Flyer 6.6 SPACEdeck',
                'year' => 2021, 'length' => 6.6, 'capacity' => 6, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 115,
                'port' => 'Port de Plaisance de Lorient', 'city' => 'Lorient', 'lat' => 47.7461, 'lng' => -3.3651,
                'dailyRate' => 140.0, 'depositAmount' => 600.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Quicksilver Activ 855 Open – Saint-Malo',
                'description' => 'Vedette ouverte robuste pour naviguer en Manche. Balade vers Jersey et Guernesey possible.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Quicksilver', 'model' => 'Activ 855 Open',
                'year' => 2020, 'length' => 8.55, 'capacity' => 8, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 250,
                'port' => 'Port des Bas-Sablons', 'city' => 'Saint-Malo', 'lat' => 48.6415, 'lng' => -2.0198,
                'dailyRate' => 270.0, 'depositAmount' => 1300.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Zodiac Medline 580 – Vannes',
                'description' => 'Semi-rigide pour explorer les criques du Golfe du Morbihan à la journée. Léger et agile.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Zodiac', 'model' => 'Medline 580',
                'year' => 2021, 'length' => 5.8, 'capacity' => 6, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 60,
                'port' => 'Port de Vannes', 'city' => 'Vannes', 'lat' => 47.6462, 'lng' => -2.7592,
                'dailyRate' => 100.0, 'depositAmount' => 400.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Lagoon 380 – Lorient',
                'description' => 'Catamaran familial pour naviguer dans le Morbihan. Excellent choix pour une semaine avec enfants.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Lagoon', 'model' => '380',
                'year' => 2015, 'length' => 11.6, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Plaisance de Lorient', 'city' => 'Lorient', 'lat' => 47.7443, 'lng' => -3.3622,
                'dailyRate' => 430.0, 'weeklyRate' => 2580.0, 'depositAmount' => 2000.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Jeanneau Leader 33 – Cherbourg',
                'description' => 'Vedette de croisière pour explorer la Manche. Alderney, Jersey à portée. Navigation en eaux normandes.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Leader 33',
                'year' => 2019, 'length' => 10.0, 'capacity' => 8, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 300,
                'port' => 'Port Chantereyne', 'city' => 'Cherbourg', 'lat' => 49.6480, 'lng' => -1.6230,
                'dailyRate' => 290.0, 'weeklyRate' => 1740.0, 'depositAmount' => 1400.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Bénéteau Oceanis 38.1 – Douarnenez',
                'description' => 'Voilier pour explorer la mer d\'Iroise et la presqu\'île de Crozon. Passage du Raz en vedette.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Oceanis 38.1',
                'year' => 2017, 'length' => 11.6, 'capacity' => 6, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Douarnenez', 'city' => 'Douarnenez', 'lat' => 48.0958, 'lng' => -4.3299,
                'dailyRate' => 230.0, 'weeklyRate' => 1380.0, 'depositAmount' => 1000.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Hanse 418 – Caen-Ouistreham',
                'description' => 'Voilier pour naviguer en Manche. Départ de Caen pour rejoindre les côtes normandes et la Bretagne.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Hanse', 'model' => '418',
                'year' => 2019, 'length' => 12.5, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Caen', 'city' => 'Ouistreham', 'lat' => 49.2812, 'lng' => -0.2478,
                'dailyRate' => 250.0, 'weeklyRate' => 1500.0, 'depositAmount' => 1100.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Bavaria 32 Sport – Honfleur',
                'description' => 'Voilier classique pour naviguer en Estuaire de la Seine et en Normandie. Escales pittoresques garanties.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bavaria', 'model' => '32 Sport',
                'year' => 2014, 'length' => 9.8, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Vieux Bassin de Honfleur', 'city' => 'Honfleur', 'lat' => 49.4190, 'lng' => 0.2336,
                'dailyRate' => 185.0, 'weeklyRate' => 1110.0, 'depositAmount' => 800.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Jeanneau Cap Camarat 6.5 WA – Deauville',
                'description' => 'Vedette walk-around pour sorties en famille au large de Deauville et Trouville. Côte de Nacre accessible.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Cap Camarat 6.5 WA',
                'year' => 2020, 'length' => 6.5, 'capacity' => 6, 'cabins' => 1,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 150,
                'port' => 'Port Deauville', 'city' => 'Deauville', 'lat' => 49.3605, 'lng' => 0.0725,
                'dailyRate' => 160.0, 'depositAmount' => 700.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Bénéteau Gran Turismo 40 – Dieppe',
                'description' => 'Vedette de croisière rapide pour rejoindre les côtes anglaises depuis Dieppe. Cabine luxueuse.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Gran Turismo 40',
                'year' => 2018, 'length' => 12.0, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 500,
                'port' => 'Port de Plaisance de Dieppe', 'city' => 'Dieppe', 'lat' => 49.9279, 'lng' => 1.0841,
                'dailyRate' => 380.0, 'weeklyRate' => 2280.0, 'depositAmount' => 2000.0,
                'withSkipper' => true, 'skipperPrice' => 160.0,
            ],

            // ── BATEAUX SUPPLÉMENTAIRES TOUS PROPRIÉTAIRES ───────────────────
            [
                'owner' => $owner1,
                'title' => 'Jeanneau Sun Odyssey 519 – Marseille',
                'description' => 'Grand voilier pour semaine de croisière en Méditerranée. Architecture lumineuse et volumes exceptionnels.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Sun Odyssey 519',
                'year' => 2020, 'length' => 15.8, 'capacity' => 10, 'cabins' => 5,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Marina de Marseille', 'city' => 'Marseille', 'lat' => 43.2892, 'lng' => 5.3649,
                'dailyRate' => 520.0, 'weeklyRate' => 3120.0, 'depositAmount' => 2800.0,
                'withSkipper' => true, 'skipperPrice' => 190.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Fountaine Pajot Isla 40 – Arcachon',
                'description' => 'Catamaran motorisé pour explorer le Bassin d\'Arcachon en toute quiétude et confort.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Fountaine Pajot', 'model' => 'Isla 40',
                'year' => 2021, 'length' => 12.0, 'capacity' => 10, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 200,
                'port' => 'Port d\'Arcachon', 'city' => 'Arcachon', 'lat' => 44.6608, 'lng' => -1.1663,
                'dailyRate' => 580.0, 'weeklyRate' => 3480.0, 'depositAmount' => 3000.0,
                'withSkipper' => true, 'skipperPrice' => 180.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Dufour 530 GL – Marseille',
                'description' => 'Voilier spacieux et performant pour une navigation agréable sur toute la Méditerranée.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Dufour', 'model' => '530 GL',
                'year' => 2021, 'length' => 16.0, 'capacity' => 10, 'cabins' => 5,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de la Joliette', 'city' => 'Marseille', 'lat' => 43.3037, 'lng' => 5.3639,
                'dailyRate' => 580.0, 'weeklyRate' => 3480.0, 'depositAmount' => 3000.0,
                'withSkipper' => true, 'skipperPrice' => 210.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Quicksilver Captur 905 Weekend – Nice',
                'description' => 'Vedette week-end luxueuse pour profiter de la Riviera. Deux cabines, pont en teck, équipement premium.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Quicksilver', 'model' => 'Captur 905 Weekend',
                'year' => 2022, 'length' => 9.05, 'capacity' => 9, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 300,
                'port' => 'Port de Nice', 'city' => 'Nice', 'lat' => 43.6978, 'lng' => 7.2764,
                'dailyRate' => 400.0, 'weeklyRate' => 2400.0, 'depositAmount' => 2000.0,
                'equipment' => ['GPS', 'VHF', 'Bimini', 'Cuisine équipée', 'Annexe pneumatique'],
            ],
            [
                'owner' => $owner3,
                'title' => 'Bénéteau Antares 9.80 – Cherbourg',
                'description' => 'Vedette de croisière solide pour la Manche. Cabine équipée pour plusieurs nuits à bord.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Antares 9.80',
                'year' => 2018, 'length' => 9.8, 'capacity' => 8, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 260,
                'port' => 'Port Chantereyne', 'city' => 'Cherbourg', 'lat' => 49.6455, 'lng' => -1.6215,
                'dailyRate' => 270.0, 'weeklyRate' => 1620.0, 'depositAmount' => 1300.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Highfield SP 800 – Hyères',
                'description' => 'Semi-rigide premium pour rejoindre les îles d\'Hyères (Porquerolles, Port-Cros, Le Levant). Ultra-rapide.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Highfield', 'model' => 'SP 800',
                'year' => 2022, 'length' => 8.0, 'capacity' => 10, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 200,
                'port' => 'Port de Hyères', 'city' => 'Hyères', 'lat' => 43.1173, 'lng' => 6.1544,
                'dailyRate' => 200.0, 'depositAmount' => 900.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Bavaria 45 Cruiser – La Rochelle',
                'description' => 'Grand croiseur atlantique pour une semaine complète. Île de Ré, Noirmoutier, Oléron au programme.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bavaria', 'model' => '45 Cruiser',
                'year' => 2017, 'length' => 13.7, 'capacity' => 10, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port des Minimes', 'city' => 'La Rochelle', 'lat' => 46.1489, 'lng' => -1.1821,
                'dailyRate' => 350.0, 'weeklyRate' => 2100.0, 'depositAmount' => 1600.0,
                'withSkipper' => true, 'skipperPrice' => 155.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Jeanneau NC 895 – Port Grimaud',
                'description' => 'Vedette de croisière pour la Côte d\'Azur. Port Grimaud, golfe de Saint-Tropez, îles d\'Hyères accessible.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'NC 895',
                'year' => 2021, 'length' => 9.0, 'capacity' => 8, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 250,
                'port' => 'Port Grimaud', 'city' => 'Grimaud', 'lat' => 43.2734, 'lng' => 6.5848,
                'dailyRate' => 330.0, 'weeklyRate' => 1980.0, 'depositAmount' => 1600.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Lagoon 42 – Brest',
                'description' => 'Grand catamaran pour une croisière en Bretagne. Ouessant, Molène, Sein accessibles depuis Brest.',
                'type' => Boat::TYPE_CATAMARAN, 'manufacturer' => 'Lagoon', 'model' => '42',
                'year' => 2020, 'length' => 12.8, 'capacity' => 12, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port du Moulin Blanc', 'city' => 'Brest', 'lat' => 48.3821, 'lng' => -4.4281,
                'dailyRate' => 580.0, 'weeklyRate' => 3480.0, 'depositAmount' => 2800.0,
                'withSkipper' => true, 'skipperPrice' => 185.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Elan E6 – Toulon',
                'description' => 'Voilier sportif haut de gamme pour régates et croisières côtières dans le Var.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Elan', 'model' => 'E6',
                'year' => 2022, 'length' => 18.6, 'capacity' => 8, 'cabins' => 4,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port du Mourillon', 'city' => 'Toulon', 'lat' => 43.1231, 'lng' => 5.9295,
                'dailyRate' => 650.0, 'weeklyRate' => 3900.0, 'depositAmount' => 3500.0,
                'withSkipper' => true, 'skipperPrice' => 220.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Zodiac Pro Open 700 – Les Sables-d\'Olonne',
                'description' => 'Semi-rigide professionnel pour naviguer au large des Sables et rejoindre l\'île d\'Yeu.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Zodiac', 'model' => 'Pro Open 700',
                'year' => 2021, 'length' => 7.0, 'capacity' => 9, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 130,
                'port' => 'Port Olona', 'city' => 'Les Sables-d\'Olonne', 'lat' => 46.4921, 'lng' => -1.7789,
                'dailyRate' => 140.0, 'depositAmount' => 600.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Hanse 508 – Marseille',
                'description' => 'Voilier luxueux pour semaine de croisière en Méditerranée. Design allemand, performances exceptionnelles.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Hanse', 'model' => '508',
                'year' => 2020, 'length' => 15.4, 'capacity' => 10, 'cabins' => 5,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de la Pointe-Rouge', 'city' => 'Marseille', 'lat' => 43.2467, 'lng' => 5.3682,
                'dailyRate' => 540.0, 'weeklyRate' => 3240.0, 'depositAmount' => 2800.0,
                'withSkipper' => true, 'skipperPrice' => 200.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Jeanneau Leader 8 – Quiberon',
                'description' => 'Open polyvalent pour sorties à la journée autour de Quiberon et Belle-Île. Simple à utiliser.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Leader 8',
                'year' => 2020, 'length' => 8.0, 'capacity' => 7, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 175,
                'port' => 'Port Maria', 'city' => 'Quiberon', 'lat' => 47.4834, 'lng' => -3.1187,
                'dailyRate' => 195.0, 'depositAmount' => 850.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Bénéteau Sense 51 – Antibes',
                'description' => 'Voilier moderne avec cockpit ouvert sur la mer. Navigation Côte d\'Azur dans un confort absolu.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Sense 51',
                'year' => 2018, 'length' => 15.5, 'capacity' => 10, 'cabins' => 5,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port Vauban', 'city' => 'Antibes', 'lat' => 43.5851, 'lng' => 7.1253,
                'dailyRate' => 560.0, 'weeklyRate' => 3360.0, 'depositAmount' => 2800.0,
                'withSkipper' => true, 'skipperPrice' => 195.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Bavaria 35 Cruiser – Hendaye',
                'description' => 'Voilier pour naviguer entre la France et l\'Espagne. Côte Basque, Saint-Sébastien accessible.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Bavaria', 'model' => '35 Cruiser',
                'year' => 2016, 'length' => 10.6, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Hendaye', 'city' => 'Hendaye', 'lat' => 43.3683, 'lng' => -1.7707,
                'dailyRate' => 195.0, 'weeklyRate' => 1170.0, 'depositAmount' => 850.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Bénéteau Flyer 10 – Cannes',
                'description' => 'Vedette de croisière puissante et élégante pour profiter de la Riviera. Plusieurs cabines, grand confort.',
                'type' => Boat::TYPE_MOTORBOAT, 'manufacturer' => 'Bénéteau', 'model' => 'Flyer 10',
                'year' => 2022, 'length' => 10.0, 'capacity' => 9, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 300,
                'port' => 'Port de Cannes', 'city' => 'Cannes', 'lat' => 43.5465, 'lng' => 7.0158,
                'dailyRate' => 450.0, 'weeklyRate' => 2700.0, 'depositAmount' => 2200.0,
            ],
            [
                'owner' => $owner3,
                'title' => 'Highfield Ocean 760 – Vannes',
                'description' => 'Semi-rigide aluminium 4 places pour explorer les îles du Morbihan à petite vitesse. Économique.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Highfield', 'model' => 'Ocean 760',
                'year' => 2022, 'length' => 7.6, 'capacity' => 8, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 100,
                'port' => 'Port de Vannes', 'city' => 'Vannes', 'lat' => 47.6471, 'lng' => -2.7601,
                'dailyRate' => 130.0, 'depositAmount' => 550.0,
            ],
            [
                'owner' => $owner4,
                'title' => 'Dufour 412 GL – Port-Camargue',
                'description' => 'Voilier familial solide pour naviguer entre le Languedoc et la Provence. Accès direct à la mer.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Dufour', 'model' => '412 GL',
                'year' => 2017, 'length' => 12.5, 'capacity' => 8, 'cabins' => 3,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port-Camargue', 'city' => 'Port-Camargue', 'lat' => 43.5291, 'lng' => 4.1333,
                'dailyRate' => 245.0, 'weeklyRate' => 1470.0, 'depositAmount' => 1050.0,
            ],
            [
                'owner' => $owner1,
                'title' => 'Zodiac Medline 900 – Nice',
                'description' => 'Semi-rigide grand luxe pour explorer Monaco, Villefranche, Beaulieu depuis Nice.',
                'type' => Boat::TYPE_INFLATABLE, 'manufacturer' => 'Zodiac', 'model' => 'Medline 900',
                'year' => 2022, 'length' => 9.0, 'capacity' => 12, 'cabins' => 0,
                'motorizationType' => Boat::MOTORIZATION_MOTOR, 'motorPower' => 250,
                'port' => 'Port de Nice', 'city' => 'Nice', 'lat' => 43.6967, 'lng' => 7.2779,
                'dailyRate' => 250.0, 'depositAmount' => 1200.0,
                'withSkipper' => true, 'skipperPrice' => 130.0,
            ],
            [
                'owner' => $owner2,
                'title' => 'Jeanneau Sun Odyssey 379 – Royan',
                'description' => 'Voilier intermédiaire pour naviguer entre Charente-Maritime et l\'Atlantique. Très bien équipé.',
                'type' => Boat::TYPE_SAILBOAT, 'manufacturer' => 'Jeanneau', 'model' => 'Sun Odyssey 379',
                'year' => 2015, 'length' => 11.3, 'capacity' => 6, 'cabins' => 2,
                'motorizationType' => Boat::MOTORIZATION_SAIL,
                'port' => 'Port de Royan', 'city' => 'Royan', 'lat' => 45.6251, 'lng' => -1.0272,
                'dailyRate' => 205.0, 'weeklyRate' => 1230.0, 'depositAmount' => 900.0,
            ],
        ];

        $boatObjects = [];
        foreach ($boats as $boatData) {
            $boat = new Boat();
            $boat->setOwner($boatData['owner']);
            $boat->setTitle($boatData['title']);
            $boat->setDescription($boatData['description']);
            $boat->setType($boatData['type']);
            $boat->setManufacturer($boatData['manufacturer'] ?? null);
            $boat->setModel($boatData['model'] ?? null);
            $boat->setYear($boatData['year'] ?? null);
            $boat->setLength($boatData['length'] ?? null);
            $boat->setCapacity($boatData['capacity']);
            $boat->setCabins($boatData['cabins'] ?? 0);
            $boat->setMotorizationType($boatData['motorizationType']);
            $boat->setMotorPower($boatData['motorPower'] ?? null);
            $boat->setWithSkipper($boatData['withSkipper'] ?? false);
            $boat->setSkipperPrice($boatData['skipperPrice'] ?? null);
            $boat->setPort($boatData['port']);
            $boat->setCity($boatData['city']);
            $boat->setCountry('FR');
            $boat->setLat($boatData['lat'] ?? null);
            $boat->setLng($boatData['lng'] ?? null);
            $boat->setDailyRate($boatData['dailyRate']);
            $boat->setWeeklyRate($boatData['weeklyRate'] ?? null);
            $boat->setDepositAmount($boatData['depositAmount']);
            $boat->setEquipment($boatData['equipment'] ?? null);
            $boat->setStatus(Boat::STATUS_ACTIVE);

            $manager->persist($boat);
            $boatObjects[] = $boat;
        }

        $manager->flush();

        // ── Bookings ─────────────────────────────────────────────────────────
        // Format: [boat_idx, renter_idx(0-2), start, end, guests, withSkipper, message, status, cancellationReason?]

        $renters = [$renter, $renter2, $renter3];

        $bookingDefs = [
            // ── COMPLETED (indices 0-29) ─────────────────────────────────────
            [0,  0, '2024-06-15', '2024-06-22', 4, false, 'Première croisière en famille, très impatients !', Booking::STATUS_COMPLETED],
            [2,  1, '2024-07-01', '2024-07-07', 6, false, null, Booking::STATUS_COMPLETED],
            [4,  2, '2024-07-14', '2024-07-21', 2, false, 'Voyage de noces, merci de tout préparer.', Booking::STATUS_COMPLETED],
            [6,  0, '2024-08-01', '2024-08-08', 4, false, null, Booking::STATUS_COMPLETED],
            [8,  1, '2024-08-10', '2024-08-17', 3, false, null, Booking::STATUS_COMPLETED],
            [10, 2, '2024-09-01', '2024-09-07', 2, false, 'Week-end prolongé pour fêter notre anniversaire.', Booking::STATUS_COMPLETED],
            [12, 0, '2024-06-20', '2024-06-27', 5, false, null, Booking::STATUS_COMPLETED],
            [14, 1, '2024-07-05', '2024-07-12', 4, false, null, Booking::STATUS_COMPLETED],
            [16, 2, '2024-07-20', '2024-07-27', 6, false, "Groupe d'amis, nous serons 6 à bord.", Booking::STATUS_COMPLETED],
            [18, 0, '2024-08-02', '2024-08-09', 2, false, null, Booking::STATUS_COMPLETED],
            [20, 1, '2024-08-15', '2024-08-22', 4, false, null, Booking::STATUS_COMPLETED],
            [22, 2, '2024-09-05', '2024-09-12', 3, false, null, Booking::STATUS_COMPLETED],
            [24, 0, '2024-07-10', '2024-07-17', 5, false, null, Booking::STATUS_COMPLETED],
            [26, 1, '2024-06-01', '2024-06-08', 2, false, 'Location pour la Fête de la Voile.', Booking::STATUS_COMPLETED],
            [28, 2, '2024-08-20', '2024-08-27', 4, false, null, Booking::STATUS_COMPLETED],
            [30, 0, '2024-07-25', '2024-08-01', 6, false, null, Booking::STATUS_COMPLETED],
            [33, 1, '2024-09-10', '2024-09-17', 2, false, null, Booking::STATUS_COMPLETED],
            [36, 2, '2025-06-01', '2025-06-08', 4, false, 'Location annuelle, habitués de la région.', Booking::STATUS_COMPLETED],
            [40, 0, '2025-07-05', '2025-07-12', 3, false, null, Booking::STATUS_COMPLETED],
            [44, 1, '2025-07-15', '2025-07-22', 5, false, null, Booking::STATUS_COMPLETED],
            [48, 2, '2025-08-01', '2025-08-08', 6, false, null, Booking::STATUS_COMPLETED],
            [52, 0, '2025-08-10', '2025-08-17', 2, false, null, Booking::STATUS_COMPLETED],
            [58, 1, '2025-06-20', '2025-06-27', 4, false, null, Booking::STATUS_COMPLETED],
            [63, 2, '2025-07-28', '2025-08-04', 3, false, null, Booking::STATUS_COMPLETED],
            [68, 0, '2025-09-01', '2025-09-08', 2, false, 'Fin de saison, parfait pour découvrir la côte.', Booking::STATUS_COMPLETED],
            [1,  1, '2024-06-10', '2024-06-15', 2, false, null, Booking::STATUS_COMPLETED],
            [3,  2, '2024-07-22', '2024-07-29', 4, false, null, Booking::STATUS_COMPLETED],
            [5,  0, '2025-07-01', '2025-07-07', 3, false, null, Booking::STATUS_COMPLETED],
            [7,  1, '2025-08-18', '2025-08-25', 4, false, null, Booking::STATUS_COMPLETED],
            [9,  2, '2025-09-10', '2025-09-17', 2, false, null, Booking::STATUS_COMPLETED],
            // ── CONFIRMED (future 2026) ──────────────────────────────────────
            [11, 0, '2026-04-15', '2026-04-22', 4, false, null, Booking::STATUS_CONFIRMED],
            [13, 1, '2026-05-01', '2026-05-08', 6, false, 'Nous sommes impatients de cette semaine de navigation !', Booking::STATUS_CONFIRMED],
            [17, 2, '2026-05-20', '2026-05-27', 2, false, null, Booking::STATUS_CONFIRMED],
            [21, 0, '2026-06-01', '2026-06-08', 5, false, null, Booking::STATUS_CONFIRMED],
            [29, 1, '2026-06-15', '2026-06-22', 3, false, null, Booking::STATUS_CONFIRMED],
            [37, 2, '2026-07-01', '2026-07-08', 4, false, null, Booking::STATUS_CONFIRMED],
            [45, 0, '2026-07-12', '2026-07-19', 2, false, null, Booking::STATUS_CONFIRMED],
            [55, 1, '2026-08-01', '2026-08-08', 6, false, 'Grande traversée planifiée. Très enthousiastes !', Booking::STATUS_CONFIRMED],
            // ── PENDING ──────────────────────────────────────────────────────
            [15, 2, '2026-03-20', '2026-03-27', 2, false, 'Disponible pour ce week-end prolongé ?', Booking::STATUS_PENDING],
            [19, 0, '2026-04-05', '2026-04-10', 4, false, null, Booking::STATUS_PENDING],
            [31, 1, '2026-05-10', '2026-05-17', 3, false, 'Voyage de printemps en famille.', Booking::STATUS_PENDING],
            [47, 2, '2026-06-20', '2026-06-27', 2, false, null, Booking::STATUS_PENDING],
            [62, 0, '2026-07-20', '2026-07-27', 5, false, null, Booking::STATUS_PENDING],
            // ── CANCELLED ────────────────────────────────────────────────────
            [23, 1, '2024-08-05', '2024-08-12', 4, false, null, Booking::STATUS_CANCELLED, 'Annulation pour raisons personnelles.'],
            [27, 2, '2024-07-08', '2024-07-15', 2, false, null, Booking::STATUS_CANCELLED, 'Problème de santé inattendu.'],
            [39, 0, '2025-06-10', '2025-06-17', 3, false, null, Booking::STATUS_CANCELLED, 'Conditions météorologiques défavorables annoncées.'],
            [53, 1, '2025-08-25', '2025-09-01', 6, false, null, Booking::STATUS_CANCELLED, 'Changement de planning professionnel.'],
        ];

        $bookingObjects = [];
        foreach ($bookingDefs as $def) {
            $boat      = $boatObjects[$def[0]];
            $renterU   = $renters[$def[1]];
            $startDate = new \DateTimeImmutable($def[2]);
            $endDate   = new \DateTimeImmutable($def[3]);
            $days      = (int) $startDate->diff($endDate)->days;
            $dailyRate = $boat->getDailyRate();
            $subtotal  = $days * $dailyRate;
            $fee       = round($subtotal * 0.10, 2);
            $total     = $subtotal + $fee;

            $booking = new Booking();
            $booking->setBoat($boat);
            $booking->setRenter($renterU);
            $booking->setOwner($boat->getOwner());
            $booking->setStartDate($startDate);
            $booking->setEndDate($endDate);
            $booking->setTotalDays($days);
            $booking->setWithSkipper($def[5]);
            $booking->setDailyRate($dailyRate);
            $booking->setSubtotal($subtotal);
            $booking->setPlatformFee($fee);
            $booking->setDepositAmount($boat->getDepositAmount());
            $booking->setTotalAmount($total);
            $booking->setGuestCount($def[4]);
            $booking->setStatus($def[7]);
            if ($def[6] !== null) {
                $booking->setMessage($def[6]);
            }
            if (isset($def[8])) {
                $booking->setCancellationReason($def[8]);
            }
            $manager->persist($booking);
            $bookingObjects[] = ['booking' => $booking, 'boat' => $boat, 'status' => $def[7]];
        }

        $manager->flush();

        // ── Reviews ──────────────────────────────────────────────────────────
        // RENTER_TO_BOAT for all 30 COMPLETED bookings (indices 0-29)
        // OWNER_TO_RENTER for the first 15 COMPLETED bookings

        $renterComments = [
            'Bateau en excellent état, conforme à la description. Navigation magnifique !',
            'Propriétaire très arrangeant et disponible. Je recommande vivement ce bateau.',
            'Superbe expérience, bateau bien entretenu et très confortable. Nous reviendrons !',
            'Très beau voilier, manœuvres aisées. Parfait pour une semaine en famille.',
            'Bateau impeccable, équipement complet. La zone de navigation était splendide.',
            'Excellente location, bateau moderne et bien équipé. Heureux de notre choix !',
            'Propriétaire accueillant, bateau propre et bien entretenu. Parfait séjour.',
            'Navigation fantastique ! Le bateau était dans un état irréprochable.',
            'Bonne expérience globale. Bateau solide et fiable pour la navigation côtière.',
            'Un régal de naviguer sur ce bateau. Très bonne qualité de construction.',
            'Quelques petits problèmes mineurs mais bon rapport qualité/prix au final.',
            'Très satisfait de notre location. Je recommande ce bateau et son propriétaire.',
            'Navigation superbe dans une région magnifique. Bateau au top de la forme !',
            'Propriétaire très sympa, bateau en bon état. Belle découverte de la côte.',
            'Parfait pour des vacances en famille. Les enfants ont adoré l\'expérience.',
            'Séjour inoubliable ! Le bateau dépassait nos espérances.',
            'Excellent rapport qualité/prix. Bateau bien aménagé et très confortable.',
            'Superbe découverte de la région grâce à ce magnifique bateau.',
            'Bateau récent et très bien équipé. Propriétaire réactif et professionnel.',
            'Une semaine de rêve ! Le bateau nous a permis de découvrir des criques paradisiaques.',
            'Très bonne location. Nous reviendrons l\'année prochaine sans hésiter.',
            'Navigation agréable, bateau bien entretenu. Propriétaire de confiance.',
            'Bonne surprise ! Le bateau était encore mieux qu\'en photos.',
            'Magnifique croisière grâce à un bateau fiable et confortable.',
            'Excellente prestation, nous recommandons chaleureusement !',
            'Belle semaine de navigation. Bateau et propriétaire irréprochables.',
            'Idéal pour explorer la région. Bateau spacieux et bien équipé.',
            'Très bonne communication, départ et retour sans accroc.',
            'Voilier au top, skipper sympa. On garde l\'adresse pour la prochaine fois.',
            'Expérience positive dans l\'ensemble. Location à renouveler sans hésitation.',
        ];

        $ownerComments = [
            'Locataires très sérieux, bateau rendu propre et en bon état. Je les recommande.',
            'Excellent locataires, respectueux du matériel. Un plaisir de louer son bateau.',
            'Bonne communication avant et pendant la location. Bateau rendu en parfait état.',
            'Locataires ponctuels et soigneux. Pas de problème particulier à signaler.',
            'Parfaits locataires ! Je les accueillerai sans hésiter pour une prochaine location.',
            'Bonne expérience, locataires respectueux. Le bateau était propre au retour.',
            'Navigation sécurisée, locataires responsables. Recommandés sans réserve.',
            'Locataires agréables, communication facile. Reviendront sûrement !',
            'Bateau rendu propre, locataires sympas. Parfaite location d\'été !',
            'Bonne expérience. Les locataires ont pris soin du bateau comme du leur.',
            'Très sérieux et responsables. La caution a été restituée en totalité.',
            'Locataires charmants et respectueux. Navigation en toute sécurité.',
            'Excellente location. Bateau rendu en parfait état, je les recommande.',
            'Des locataires de qualité. Je serai heureux de les accueillir à nouveau.',
            'Très bonne expérience. Ponctualité et respect du matériel au rendez-vous.',
        ];

        $boatRatings = [];
        $completedCount = 30; // first 30 entries in $bookingObjects are COMPLETED

        for ($i = 0; $i < $completedCount; $i++) {
            $entry      = $bookingObjects[$i];
            $booking    = $entry['booking'];
            $boat       = $entry['boat'];
            $renterUser = $booking->getRenter();
            $ownerUser  = $boat->getOwner();

            // Vary ratings: mostly 5, some 4, rare 3
            $rating = match (true) {
                $i % 9 === 7 => 3,
                $i % 5 === 3 => 4,
                default      => 5,
            };

            // RENTER_TO_BOAT
            $review = new Review();
            $review->setBooking($booking);
            $review->setBoat($boat);
            $review->setReviewer($renterUser);
            $review->setReviewee($ownerUser);
            $review->setType(Review::TYPE_RENTER_TO_BOAT);
            $review->setRating($rating);
            $review->setComment($renterComments[$i % count($renterComments)]);
            $review->setIsPublished(true);
            $manager->persist($review);

            // Track ratings per boat
            $bid = $boat->getId();
            if (!isset($boatRatings[$bid])) {
                $boatRatings[$bid] = ['sum' => 0, 'count' => 0, 'boat' => $boat];
            }
            $boatRatings[$bid]['sum']   += $rating;
            $boatRatings[$bid]['count'] += 1;

            // OWNER_TO_RENTER (first 15 only)
            if ($i < 15) {
                $ownerRating = ($i % 6 === 4) ? 4 : 5;
                $review2 = new Review();
                $review2->setBooking($booking);
                $review2->setBoat($boat);
                $review2->setReviewer($ownerUser);
                $review2->setReviewee($renterUser);
                $review2->setType(Review::TYPE_OWNER_TO_RENTER);
                $review2->setRating($ownerRating);
                $review2->setComment($ownerComments[$i % count($ownerComments)]);
                $review2->setIsPublished(true);
                $manager->persist($review2);
            }
        }

        // Update boat aggregate ratings
        foreach ($boatRatings as $data) {
            $avg = $data['sum'] / $data['count'];
            $data['boat']->setRating(round($avg, 2));
            $data['boat']->setReviewCount($data['count']);
        }

        $manager->flush();

        $nbBookings = count($bookingObjects);
        $nbReviews  = $completedCount + 15; // RENTER_TO_BOAT + OWNER_TO_RENTER
        echo "Fixtures loaded!\n";
        echo "  " . count($boats) . " bateaux\n";
        echo "  $nbBookings réservations\n";
        echo "  $nbReviews avis\n";
        echo "Comptes :\n";
        echo "  admin@sailingloc.fr / Admin@Sail2026!\n";
        echo "  owner@demo.fr / Owner@Sail2026!\n";
        echo "  sophie.martin@demo.fr / Owner@Sail2026!\n";
        echo "  luc.bernard@demo.fr / Owner@Sail2026!\n";
        echo "  claire.rousseau@demo.fr / Owner@Sail2026!\n";
        echo "  renter@demo.fr / Renter@Sail2026!\n";
        echo "  thomas.leroy@demo.fr / Renter@Sail2026!\n";
        echo "  emma.dubois@demo.fr / Renter@Sail2026!\n";
    }
}
