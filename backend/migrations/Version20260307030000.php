<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260307030000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la table conversation_archive (archivage personnel des conversations)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('
            CREATE TABLE conversation_archive (
                id INT AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                conversation_id VARCHAR(64) NOT NULL,
                archived_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                INDEX IDX_CONV_ARCHIVE_USER (user_id),
                UNIQUE INDEX UNIQ_CONV_ARCHIVE_USER_CONV (user_id, conversation_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        ');

        $this->addSql('
            ALTER TABLE conversation_archive
            ADD CONSTRAINT FK_CONV_ARCHIVE_USER
            FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
        ');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE conversation_archive DROP FOREIGN KEY FK_CONV_ARCHIVE_USER');
        $this->addSql('DROP TABLE conversation_archive');
    }
}
