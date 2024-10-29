import { MigrationInterface, QueryRunner } from 'typeorm';
import { SystemPermission } from '../../modules/permissions/enums/system-permission.enum';

export class InsertSystemPermissions1729536458365 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (30, \'AnnouncementsAdministration\', \'Announcements administration permission group\')');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.PreviewAnnouncementsList + ', \'PreviewAnnouncementsList\', \'Permission that allows preview announcements list\', 30)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.AddAnnouncements + ', \'AddAnnouncements\', \'Permission that allows add announcements\', 30)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.EditAnnouncements + ', \'EditAnnouncements\', \'Permission that allows edit announcements\', 30)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.DeleteAnnouncements + ', \'DeleteAnnouncements\', \'Permission that allows delete announcements\', 30)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.PublishAnnouncements + ', \'PublishAnnouncements\', \'Permission that allows publish announcements\', 30)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
