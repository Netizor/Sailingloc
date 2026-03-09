<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Vérification d'email :
 * - Colonne email_verified_at sur la table user
 * - Table email_verification_token (token 24h, usage unique)
 */
final class Version20260307020000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout email_verified_at (user) + table email_verification_token';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user ADD email_verified_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');

        $this->addSql('CREATE TABLE email_verification_token (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            token VARCHAR(128) NOT NULL,
            expires_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            UNIQUE INDEX UNIQ_EVT_TOKEN (token),
            INDEX idx_evt_user (user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE email_verification_token
            ADD CONSTRAINT FK_EVT_USER
            FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE email_verification_token DROP FOREIGN KEY FK_EVT_USER');
        $this->addSql('DROP TABLE email_verification_token');
        $this->addSql('ALTER TABLE user DROP COLUMN email_verified_at');
    }
}
