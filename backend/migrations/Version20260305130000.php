<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * E2 — Tarifs dégressifs : ajout de la colonne discount_rules (JSON) sur la table boat.
 * Format : [{"minDays": 3, "discountPercent": 5}, {"minDays": 7, "discountPercent": 10}]
 */
final class Version20260305130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'E2 — Ajoute discount_rules (JSON) sur boat pour les tarifs dégressifs';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE boat ADD discount_rules JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE boat DROP COLUMN discount_rules');
    }
}
