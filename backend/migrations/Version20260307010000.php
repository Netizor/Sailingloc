<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * P2 — Ajout des colonnes de verrouillage de compte après tentatives échouées.
 * failed_login_attempts : compteur incrémenté à chaque échec de connexion.
 * locked_until : timestamp jusqu'auquel le compte est bloqué (null = non verrouillé).
 */
final class Version20260307010000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout failed_login_attempts et locked_until sur la table user (P2 - verrouillage de compte)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user ADD failed_login_attempts INT NOT NULL DEFAULT 0');
        $this->addSql('ALTER TABLE user ADD locked_until DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user DROP COLUMN failed_login_attempts');
        $this->addSql('ALTER TABLE user DROP COLUMN locked_until');
    }
}
