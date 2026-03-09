<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajoute le champ moderation_status sur la table review (F4 — modération des avis).
 * Les avis existants reçoivent le statut APPROVED pour maintenir la compatibilité.
 * is_published passe à false par défaut pour les nouveaux avis (PENDING).
 */
final class Version20260305120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute moderation_status sur review';
    }

    public function up(Schema $schema): void
    {
        // Ajoute la colonne avec APPROVED comme valeur par défaut pour les lignes existantes
        $this->addSql("ALTER TABLE review ADD moderation_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED'");
        // Les avis existants sont déjà publiés — on conserve is_published = 1 pour eux
        // On change juste la valeur par défaut pour les futures insertions via l'ORM
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE review DROP COLUMN moderation_status');
    }
}
