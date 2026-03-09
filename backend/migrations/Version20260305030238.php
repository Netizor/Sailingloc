<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260305030238 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE availability (id INT AUTO_INCREMENT NOT NULL, date DATE NOT NULL, is_available TINYINT NOT NULL, booking_id INT DEFAULT NULL, note VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, boat_id INT NOT NULL, INDEX idx_availability_boat (boat_id), UNIQUE INDEX UNIQ_3FB7A2BFA1E84A29AA9E377A (boat_id, date), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE boat (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(255) NOT NULL, description LONGTEXT NOT NULL, type VARCHAR(20) NOT NULL, manufacturer VARCHAR(100) DEFAULT NULL, model VARCHAR(100) DEFAULT NULL, year INT DEFAULT NULL, length DOUBLE PRECISION DEFAULT NULL, capacity INT NOT NULL, cabins INT NOT NULL, motorization_type VARCHAR(20) NOT NULL, motor_power INT DEFAULT NULL, with_skipper TINYINT NOT NULL, skipper_price DOUBLE PRECISION DEFAULT NULL, port VARCHAR(255) NOT NULL, city VARCHAR(255) NOT NULL, country VARCHAR(10) NOT NULL, lat DOUBLE PRECISION DEFAULT NULL, lng DOUBLE PRECISION DEFAULT NULL, daily_rate DOUBLE PRECISION NOT NULL, weekly_rate DOUBLE PRECISION DEFAULT NULL, deposit_amount DOUBLE PRECISION NOT NULL, equipment JSON DEFAULT NULL, rules LONGTEXT DEFAULT NULL, images JSON DEFAULT NULL, registration_doc VARCHAR(500) DEFAULT NULL, insurance_doc VARCHAR(500) DEFAULT NULL, license_scan_doc VARCHAR(500) DEFAULT NULL, status VARCHAR(20) NOT NULL, rating DOUBLE PRECISION NOT NULL, review_count INT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, owner_id INT NOT NULL, INDEX idx_boat_owner (owner_id), INDEX idx_boat_status (status), INDEX idx_boat_city (city), INDEX idx_boat_port (port), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE booking (id INT AUTO_INCREMENT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, total_days INT NOT NULL, with_skipper TINYINT NOT NULL, daily_rate DOUBLE PRECISION NOT NULL, subtotal DOUBLE PRECISION NOT NULL, platform_fee DOUBLE PRECISION NOT NULL, deposit_amount DOUBLE PRECISION NOT NULL, total_amount DOUBLE PRECISION NOT NULL, guest_count INT NOT NULL, special_requests LONGTEXT DEFAULT NULL, status VARCHAR(20) NOT NULL, cancellation_reason LONGTEXT DEFAULT NULL, cancelled_at DATETIME DEFAULT NULL, cancelled_by INT DEFAULT NULL, stripe_payment_intent_id VARCHAR(255) DEFAULT NULL, stripe_transfer_id VARCHAR(255) DEFAULT NULL, deposit_refunded TINYINT NOT NULL, message LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, boat_id INT NOT NULL, renter_id INT NOT NULL, owner_id INT NOT NULL, INDEX idx_booking_renter (renter_id), INDEX idx_booking_owner (owner_id), INDEX idx_booking_boat (boat_id), INDEX idx_booking_status (status), INDEX idx_booking_stripe (stripe_payment_intent_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE favorite (id INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, user_id INT NOT NULL, boat_id INT NOT NULL, INDEX IDX_68C58ED9A1E84A29 (boat_id), INDEX idx_favorite_user (user_id), UNIQUE INDEX UNIQ_68C58ED9A76ED395A1E84A29 (user_id, boat_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE message (id INT AUTO_INCREMENT NOT NULL, conversation_id VARCHAR(50) NOT NULL, content LONGTEXT NOT NULL, read_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, sender_id INT NOT NULL, receiver_id INT NOT NULL, INDEX idx_message_conversation (conversation_id), INDEX idx_message_sender (sender_id), INDEX idx_message_receiver (receiver_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE notification (id INT AUTO_INCREMENT NOT NULL, type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, message_text LONGTEXT NOT NULL, is_read TINYINT NOT NULL, data JSON DEFAULT NULL, created_at DATETIME NOT NULL, user_id INT NOT NULL, INDEX idx_notification_user (user_id), INDEX idx_notification_read (is_read), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE password_reset_token (id INT AUTO_INCREMENT NOT NULL, token VARCHAR(128) NOT NULL, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL, user_id INT NOT NULL, UNIQUE INDEX UNIQ_6B7BA4B65F37A13B (token), INDEX idx_prt_user (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE refresh_token (id INT AUTO_INCREMENT NOT NULL, token VARCHAR(512) NOT NULL, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL, user_id INT NOT NULL, UNIQUE INDEX UNIQ_C74F21955F37A13B (token), INDEX idx_refresh_token_user (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE review (id INT AUTO_INCREMENT NOT NULL, type VARCHAR(30) NOT NULL, rating INT NOT NULL, comment LONGTEXT NOT NULL, is_published TINYINT NOT NULL, created_at DATETIME NOT NULL, booking_id INT NOT NULL, boat_id INT NOT NULL, reviewer_id INT NOT NULL, reviewee_id INT NOT NULL, INDEX IDX_794381C63301C60 (booking_id), INDEX IDX_794381C6BD992930 (reviewee_id), INDEX idx_review_boat (boat_id), INDEX idx_review_reviewer (reviewer_id), UNIQUE INDEX UNIQ_794381C63301C608CDE5729 (booking_id, type), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE seasonal_price (id INT AUTO_INCREMENT NOT NULL, label VARCHAR(100) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, daily_rate DOUBLE PRECISION NOT NULL, created_at DATETIME NOT NULL, boat_id INT NOT NULL, INDEX idx_seasonal_price_boat (boat_id), INDEX idx_seasonal_price_boat_dates (boat_id, start_date, end_date), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, phone VARCHAR(20) DEFAULT NULL, avatar VARCHAR(500) DEFAULT NULL, bio LONGTEXT DEFAULT NULL, stripe_customer_id VARCHAR(255) DEFAULT NULL, stripe_account_id VARCHAR(255) DEFAULT NULL, kyc_verified TINYINT NOT NULL, kyc_document_url VARCHAR(500) DEFAULT NULL, is_active TINYINT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_8D93D649E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE availability ADD CONSTRAINT FK_3FB7A2BFA1E84A29 FOREIGN KEY (boat_id) REFERENCES boat (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE boat ADD CONSTRAINT FK_D86E834A7E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE booking ADD CONSTRAINT FK_E00CEDDEA1E84A29 FOREIGN KEY (boat_id) REFERENCES boat (id)');
        $this->addSql('ALTER TABLE booking ADD CONSTRAINT FK_E00CEDDEE289A545 FOREIGN KEY (renter_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE booking ADD CONSTRAINT FK_E00CEDDE7E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE favorite ADD CONSTRAINT FK_68C58ED9A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE favorite ADD CONSTRAINT FK_68C58ED9A1E84A29 FOREIGN KEY (boat_id) REFERENCES boat (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307FF624B39D FOREIGN KEY (sender_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307FCD53EDB6 FOREIGN KEY (receiver_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE password_reset_token ADD CONSTRAINT FK_6B7BA4B6A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE refresh_token ADD CONSTRAINT FK_C74F2195A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE review ADD CONSTRAINT FK_794381C63301C60 FOREIGN KEY (booking_id) REFERENCES booking (id)');
        $this->addSql('ALTER TABLE review ADD CONSTRAINT FK_794381C6A1E84A29 FOREIGN KEY (boat_id) REFERENCES boat (id)');
        $this->addSql('ALTER TABLE review ADD CONSTRAINT FK_794381C670574616 FOREIGN KEY (reviewer_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE review ADD CONSTRAINT FK_794381C6BD992930 FOREIGN KEY (reviewee_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE seasonal_price ADD CONSTRAINT FK_95767E18A1E84A29 FOREIGN KEY (boat_id) REFERENCES boat (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE availability DROP FOREIGN KEY FK_3FB7A2BFA1E84A29');
        $this->addSql('ALTER TABLE boat DROP FOREIGN KEY FK_D86E834A7E3C61F9');
        $this->addSql('ALTER TABLE booking DROP FOREIGN KEY FK_E00CEDDEA1E84A29');
        $this->addSql('ALTER TABLE booking DROP FOREIGN KEY FK_E00CEDDEE289A545');
        $this->addSql('ALTER TABLE booking DROP FOREIGN KEY FK_E00CEDDE7E3C61F9');
        $this->addSql('ALTER TABLE favorite DROP FOREIGN KEY FK_68C58ED9A76ED395');
        $this->addSql('ALTER TABLE favorite DROP FOREIGN KEY FK_68C58ED9A1E84A29');
        $this->addSql('ALTER TABLE message DROP FOREIGN KEY FK_B6BD307FF624B39D');
        $this->addSql('ALTER TABLE message DROP FOREIGN KEY FK_B6BD307FCD53EDB6');
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_BF5476CAA76ED395');
        $this->addSql('ALTER TABLE password_reset_token DROP FOREIGN KEY FK_6B7BA4B6A76ED395');
        $this->addSql('ALTER TABLE refresh_token DROP FOREIGN KEY FK_C74F2195A76ED395');
        $this->addSql('ALTER TABLE review DROP FOREIGN KEY FK_794381C63301C60');
        $this->addSql('ALTER TABLE review DROP FOREIGN KEY FK_794381C6A1E84A29');
        $this->addSql('ALTER TABLE review DROP FOREIGN KEY FK_794381C670574616');
        $this->addSql('ALTER TABLE review DROP FOREIGN KEY FK_794381C6BD992930');
        $this->addSql('ALTER TABLE seasonal_price DROP FOREIGN KEY FK_95767E18A1E84A29');
        $this->addSql('DROP TABLE availability');
        $this->addSql('DROP TABLE boat');
        $this->addSql('DROP TABLE booking');
        $this->addSql('DROP TABLE favorite');
        $this->addSql('DROP TABLE message');
        $this->addSql('DROP TABLE notification');
        $this->addSql('DROP TABLE password_reset_token');
        $this->addSql('DROP TABLE refresh_token');
        $this->addSql('DROP TABLE review');
        $this->addSql('DROP TABLE seasonal_price');
        $this->addSql('DROP TABLE user');
    }
}
