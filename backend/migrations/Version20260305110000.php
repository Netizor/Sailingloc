<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajoute le champ welcome_message sur la table boat (E3 — message de bienvenue automatique).
 */
final class Version20260305110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute welcome_message sur boat';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE boat ADD welcome_message LONGTEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE boat DROP COLUMN welcome_message');
    }
}
