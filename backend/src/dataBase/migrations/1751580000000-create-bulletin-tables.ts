import { MigrationInterface, QueryRunner } from 'typeorm';
import { SystemPermissions } from '../../core/enums/system-permissions.enum';

export class CreateBulletinTables1751580000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`bulletins\` (
        \`Id\` int NOT NULL AUTO_INCREMENT,
        \`Uuid\` varchar(36) NOT NULL,
        \`State\` tinyint NOT NULL DEFAULT 1,
        \`Title\` varchar(500) NULL,
        \`Date\` date NULL,
        \`Number\` int NULL,
        \`Introduction\` text NULL,
        \`TipsForWork\` text NULL,
        \`DailyPrayer\` text NULL,
        \`CreatedById\` int NOT NULL,
        \`CreatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`UpdatedById\` int NULL,
        \`UpdatedAt\` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`PublishedById\` int NULL,
        \`PublishedAt\` timestamp(0) NULL,
        UNIQUE INDEX \`UQ_Bulletin_Uuid\` (\`Uuid\`),
        UNIQUE INDEX \`UQ_Bulletin_Date\` (\`Date\`),
        FULLTEXT INDEX \`IX_Bulletin_Introduction_Fulltext\` (\`Introduction\`),
        FULLTEXT INDEX \`IX_Bulletin_TipsForWork_Fulltext\` (\`TipsForWork\`),
        FULLTEXT INDEX \`IX_Bulletin_DailyPrayer_Fulltext\` (\`DailyPrayer\`),
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletins\`
      ADD CONSTRAINT \`FK_Bulletin_CreatedById_To_User\`
      FOREIGN KEY (\`CreatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletins\`
      ADD CONSTRAINT \`FK_Bulletin_UpdatedById_To_User\`
      FOREIGN KEY (\`UpdatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletins\`
      ADD CONSTRAINT \`FK_Bulletin_PublishedById_To_User\`
      FOREIGN KEY (\`PublishedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      CREATE TABLE \`bulletin_days\` (
        \`Id\` int NOT NULL AUTO_INCREMENT,
        \`BulletinId\` int NOT NULL,
        \`Uuid\` varchar(36) NOT NULL,
        \`Title\` varchar(500) NULL,
        \`Date\` date NULL,
        \`CreatedById\` int NOT NULL,
        \`CreatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`UpdatedById\` int NULL,
        \`UpdatedAt\` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`Settings\` json NULL,
        UNIQUE INDEX \`UQ_BulletinDay_Uuid\` (\`Uuid\`),
        UNIQUE INDEX \`UQ_BulletinDay_Date\` (\`Date\`),
        FULLTEXT INDEX \`IX_BulletinDay_Title_Fulltext\` (\`Title\`),
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_days\`
      ADD CONSTRAINT \`FK_BulletinDay_BulletinId_To_Bulletin\`
      FOREIGN KEY (\`BulletinId\`) REFERENCES \`bulletins\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_days\`
      ADD CONSTRAINT \`FK_BulletinDay_CreatedById_To_User\`
      FOREIGN KEY (\`CreatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_days\`
      ADD CONSTRAINT \`FK_BulletinDay_UpdatedById_To_User\`
      FOREIGN KEY (\`UpdatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      CREATE TABLE \`bulletin_day_sections\` (
        \`Id\` int NOT NULL AUTO_INCREMENT,
        \`DayId\` int NOT NULL,
        \`Uuid\` varchar(36) NOT NULL,
        \`Order\` int NOT NULL DEFAULT 0,
        \`Type\` varchar(50) NOT NULL,
        \`Title\` varchar(500) NULL,
        \`Content\` text NULL,
        \`CreatedById\` int NOT NULL,
        \`CreatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`UpdatedById\` int NULL,
        \`UpdatedAt\` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`Settings\` json NULL,
        UNIQUE INDEX \`UQ_BulletinDaySection_Uuid\` (\`Uuid\`),
        FULLTEXT INDEX \`IX_BulletinDaySection_Title_Fulltext\` (\`Title\`),
        FULLTEXT INDEX \`IX_BulletinDaySection_Content_Fulltext\` (\`Content\`),
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_day_sections\`
      ADD CONSTRAINT \`FK_BulletinDaySection_DayId_To_BulletinDay\`
      FOREIGN KEY (\`DayId\`) REFERENCES \`bulletin_days\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_day_sections\`
      ADD CONSTRAINT \`FK_BulletinDaySection_CreatedById_To_User\`
      FOREIGN KEY (\`CreatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_day_sections\`
      ADD CONSTRAINT \`FK_BulletinDaySection_UpdatedById_To_User\`
      FOREIGN KEY (\`UpdatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    // Add bulletin administration permissions
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (?, ?, ?)', [
      50,
      'BulletinAdministration',
      'Bulletin administration permission group',
    ]);

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [
        SystemPermissions.PreviewBulletinList,
        'PreviewBulletinList',
        'Permission that allows preview bulletin list',
        50,
      ],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.AddBulletin, 'AddBulletin', 'Permission that allows add bulletins', 50],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.EditBulletin, 'EditBulletin', 'Permission that allows edit bulletins', 50],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.DeleteBulletin, 'DeleteBulletin', 'Permission that allows delete bulletins', 50],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.PublishBulletin, 'PublishBulletin', 'Permission that allows publish bulletins', 50],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [
        SystemPermissions.AnswerBulletinQuestion,
        'AnswerBulletinQuestion',
        'Permission that allows answer bulletin questions',
        50,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove bulletin permissions
    await queryRunner.query('DELETE FROM `system_permissions` WHERE `Id` IN (?, ?, ?, ?, ?, ?, ?)', [
      SystemPermissions.PreviewBulletinList,
      SystemPermissions.AddBulletin,
      SystemPermissions.EditBulletin,
      SystemPermissions.DeleteBulletin,
      SystemPermissions.PublishBulletin,
      SystemPermissions.AnswerBulletinQuestion,
      50,
    ]);

    await queryRunner.query('ALTER TABLE `bulletin_days` DROP FOREIGN KEY `FK_BulletinDay_To_Bulletin`');
    await queryRunner.query('ALTER TABLE `bulletin_days` DROP FOREIGN KEY `FK_BulletinDay_CreatedById_To_User`');
    await queryRunner.query('ALTER TABLE `bulletin_days` DROP FOREIGN KEY `FK_BulletinDay_UpdatedById_To_User`');

    await queryRunner.query('ALTER TABLE `bulletins` DROP FOREIGN KEY `FK_Bulletin_PublishedById_To_User`');
    await queryRunner.query('ALTER TABLE `bulletins` DROP FOREIGN KEY `FK_Bulletin_UpdatedById_To_User`');
    await queryRunner.query('ALTER TABLE `bulletins` DROP FOREIGN KEY `FK_Bulletin_CreatedById_To_User`');

    await queryRunner.query('DROP TABLE `bulletin_days`');
    await queryRunner.query('DROP TABLE `bulletins`');
  }
}
