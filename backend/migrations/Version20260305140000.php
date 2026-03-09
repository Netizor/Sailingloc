<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * D5 — Push notifications PWA : table push_subscription.
 * Stocke les abonnements Web Push Protocol (endpoint + clés VAPID côté client).
 */
final class Version20260305140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'D5 — Crée la table push_subscription pour les notifications push PWA';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('
            CREATE TABLE push_subscription (
                id            INT AUTO_INCREMENT NOT NULL,
                user_id       INT NOT NULL,
                endpoint      LONGTEXT NOT NULL,
                endpoint_hash VARCHAR(64) NOT NULL,
                p256dh        VARCHAR(255) NOT NULL,
                auth          VARCHAR(255) NOT NULL,
                created_at    DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                PRIMARY KEY (id),
                UNIQUE INDEX uniq_push_endpoint (endpoint_hash),
                INDEX idx_push_user (user_id),
                CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE push_subscription');
    }
}
