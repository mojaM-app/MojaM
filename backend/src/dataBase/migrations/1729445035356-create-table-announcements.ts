import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableAnnouncements1729445035356 implements MigrationInterface {
  name = 'CreateTableAnnouncements1729445035356'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `announcements` (`Id` int NOT NULL, `Uuid` varchar(36) NOT NULL, `Title` varchar(255) NULL, `State` int NOT NULL, `ValidFromDate` date NULL, `CreatedAt` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP, `CreatedById` int NOT NULL, `UpdatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, `PublishedAt` timestamp(0) NULL, `PublishedById` int NULL, UNIQUE INDEX `UQ_Announcement_Uuid` (`Uuid`), PRIMARY KEY (`Id`)) ENGINE=InnoDB');
    await queryRunner.query('CREATE TABLE `announcement_items` (`Id` varchar(36) NOT NULL, `Content` text NULL, `AnnouncementId` int NOT NULL, FULLTEXT INDEX `IXD_AnnouncementItem_Content_Fulltext` (`Content`), PRIMARY KEY (`Id`)) ENGINE=InnoDB');
    await queryRunner.query('ALTER TABLE `announcements` ADD CONSTRAINT `FK_Announcement_CreatedById_To_User` FOREIGN KEY (`CreatedById`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT');
    await queryRunner.query('ALTER TABLE `announcements` ADD CONSTRAINT `FK_Announcement_PublishedById_To_User` FOREIGN KEY (`PublishedById`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT');
    await queryRunner.query('ALTER TABLE `announcement_items` ADD CONSTRAINT `FK_Announcement_To_AnnouncementItem` FOREIGN KEY (`AnnouncementId`) REFERENCES `announcements`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `announcement_items` DROP FOREIGN KEY `FK_Announcement_To_AnnouncementItem`');
    await queryRunner.query('ALTER TABLE `announcements` DROP FOREIGN KEY `FK_Announcement_PublishedById_To_User`');
    await queryRunner.query('ALTER TABLE `announcements` DROP FOREIGN KEY `FK_Announcement_CreatedById_To_User`');
    await queryRunner.query('DROP INDEX `IXD_AnnouncementItem_Content_Fulltext` ON `announcement_items`');
    await queryRunner.query('DROP TABLE `announcement_items`');
    await queryRunner.query('DROP INDEX `UQ_Announcement_Uuid` ON `announcements`');
    await queryRunner.query('DROP TABLE `announcements`');
  }
}
