<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** Ajoute la table report pour la fonctionnalité de signalement d'annonces (C13/F3). */
final class Version20260305100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Crée la table report (signalements d\'annonces)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(
            'CREATE TABLE report (
                id INT AUTO_INCREMENT NOT NULL,
                boat_id INT NOT NULL,
                reporter_id INT NOT NULL,
                reason VARCHAR(50) NOT NULL,
                details LONGTEXT DEFAULT NULL,
                status VARCHAR(20) NOT NULL DEFAULT \'PENDING\',
                admin_note LONGTEXT DEFAULT NULL,
                created_at DATETIME NOT NULL,
                processed_at DATETIME DEFAULT NULL,
                INDEX idx_report_boat (boat_id),
                INDEX idx_report_reporter (reporter_id),
                INDEX idx_report_status (status),
                UNIQUE INDEX uniq_report_boat_reporter (boat_id, reporter_id),
                PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4'
        );
        $this->addSql('ALTER TABLE report ADD CONSTRAINT FK_C42F7784A1E84A29 FOREIGN KEY (boat_id) REFERENCES boat (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE report ADD CONSTRAINT FK_C42F7784E1CFE6EF FOREIGN KEY (reporter_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE report');
    }
}
