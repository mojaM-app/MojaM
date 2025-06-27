import { MigrationInterface, QueryRunner } from 'typeorm';
import { SystemPermissions } from '../../core/enums/system-permissions.enum';

export class CreateTableAnnouncements1729890701959 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `announcements` (`Id` int NOT NULL AUTO_INCREMENT, `Uuid` varchar(36) NOT NULL, `Title` varchar(255) NULL, `State` int NOT NULL, `ValidFromDate` date NULL, `CreatedAt` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP, `CreatedById` int NOT NULL, `UpdatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, `PublishedAt` timestamp(0) NULL, `PublishedById` int NULL, UNIQUE INDEX `UQ_Announcement_Uuid` (`Uuid`), PRIMARY KEY (`Id`)) ENGINE=InnoDB',
    );
    await queryRunner.query(
      'CREATE TABLE `announcement_items` (`Id` varchar(36) NOT NULL, `Content` text NOT NULL, `Order` int NOT NULL, `CreatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `CreatedById` int NOT NULL, `UpdatedAt` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), `UpdatedById` int NULL, `AnnouncementId` int NOT NULL, FULLTEXT INDEX `IXD_AnnouncementItem_Content_Fulltext` (`Content`), PRIMARY KEY (`Id`)) ENGINE=InnoDB',
    );
    await queryRunner.query(
      'ALTER TABLE `announcements` ADD CONSTRAINT `FK_Announcement_CreatedById_To_User` FOREIGN KEY (`CreatedById`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `announcements` ADD CONSTRAINT `FK_Announcement_PublishedById_To_User` FOREIGN KEY (`PublishedById`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `announcement_items` ADD CONSTRAINT `FK_AnnouncementItem_CreatedById_To_User` FOREIGN KEY (`CreatedById`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `announcement_items` ADD CONSTRAINT `FK_AnnouncementItem_UpdatedById_To_User` FOREIGN KEY (`UpdatedById`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `announcement_items` ADD CONSTRAINT `FK_Announcement_To_AnnouncementItem` FOREIGN KEY (`AnnouncementId`) REFERENCES `announcements`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );

    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (?, ?, ?)', [
      30,
      'AnnouncementsAdministration',
      'Announcements administration permission group',
    ]);
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)', [
      SystemPermissions.PreviewAnnouncementsList,
      'PreviewAnnouncementsList',
      'Permission that allows preview announcements list',
      30,
    ]);
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)', [
      SystemPermissions.AddAnnouncements,
      'AddAnnouncements',
      'Permission that allows add announcements',
      30,
    ]);
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)', [
      SystemPermissions.EditAnnouncements,
      'EditAnnouncements',
      'Permission that allows edit announcements',
      30,
    ]);
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)', [
      SystemPermissions.DeleteAnnouncements,
      'DeleteAnnouncements',
      'Permission that allows delete announcements',
      30,
    ]);
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)', [
      SystemPermissions.PublishAnnouncements,
      'PublishAnnouncements',
      'Permission that allows publish announcements',
      30,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `announcement_items` DROP FOREIGN KEY `FK_Announcement_To_AnnouncementItem`');
    await queryRunner.query('ALTER TABLE `announcement_items` DROP FOREIGN KEY `FK_AnnouncementItem_UpdatedById_To_User`');
    await queryRunner.query('ALTER TABLE `announcement_items` DROP FOREIGN KEY `FK_AnnouncementItem_CreatedById_To_User`');
    await queryRunner.query('ALTER TABLE `announcements` DROP FOREIGN KEY `FK_Announcement_PublishedById_To_User`');
    await queryRunner.query('ALTER TABLE `announcements` DROP FOREIGN KEY `FK_Announcement_CreatedById_To_User`');
    await queryRunner.query('DROP INDEX `IXD_AnnouncementItem_Content_Fulltext` ON `announcement_items`');
    await queryRunner.query('DROP TABLE `announcement_items`');
    await queryRunner.query('DROP INDEX `UQ_Announcement_Uuid` ON `announcements`');
    await queryRunner.query('DROP TABLE `announcements`');
  }
}
