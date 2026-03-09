<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * RGPD Art. 7 — Ajout du champ terms_accepted_at sur la table user.
 * Horodatage du consentement explicite aux CGU et à la politique de confidentialité
 * lors de l'inscription. Nullable pour les comptes créés avant cette migration.
 */
final class Version20260307000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'RGPD — Ajout de terms_accepted_at sur la table user';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` ADD terms_accepted_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` DROP terms_accepted_at');
    }
}
