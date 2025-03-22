import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateViewVAnnouncement1731954228434 implements MigrationInterface {
  name = 'CreateViewVAnnouncement1731954228434';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE VIEW `vAnnouncements` AS SELECT `announcement`.`Uuid` AS `Id`, `announcement`.`Title` AS `Title`, `announcement`.`State` AS `State`, `announcement`.`ValidFromDate` AS `ValidFromDate`, `announcement`.`CreatedAt` AS `CreatedAt`, concat(`createdBy`.`FirstName`, ' ', `createdBy`.`LastName`) AS `CreatedBy`, `announcement`.`UpdatedAt` AS `UpdatedAt`, `announcement`.`PublishedAt` AS `PublishedAt`, concat(`publishedBy`.`FirstName`, ' ', `publishedBy`.`LastName`) AS `PublishedBy`, (select count(0) from announcement_items as ai where `announcement`.`Id` = ai.AnnouncementId) AS `ItemsCount` FROM `announcements` `announcement` INNER JOIN `users` `createdBy` ON `createdBy`.`Id` = `announcement`.`CreatedById`  LEFT JOIN `users` `publishedBy` ON `publishedBy`.`Id` = `announcement`.`PublishedById`",
    );
    await queryRunner.query(
      'INSERT INTO `_typeorm_metadata`(`database`, `schema`, `table`, `type`, `name`, `value`) VALUES (DEFAULT, DEFAULT, DEFAULT, ?, ?, ?)',
      [
        'VIEW',
        'vAnnouncements',
        "SELECT `announcement`.`Uuid` AS `Id`, `announcement`.`Title` AS `Title`, `announcement`.`State` AS `State`, `announcement`.`ValidFromDate` AS `ValidFromDate`, `announcement`.`CreatedAt` AS `CreatedAt`, concat(`createdBy`.`FirstName`, ' ', `createdBy`.`LastName`) AS `CreatedBy`, `announcement`.`UpdatedAt` AS `UpdatedAt`, `announcement`.`PublishedAt` AS `PublishedAt`, concat(`publishedBy`.`FirstName`, ' ', `publishedBy`.`LastName`) AS `PublishedBy`, (select count(0) from announcement_items as ai where `announcement`.`Id` = ai.AnnouncementId) AS `ItemsCount` FROM `announcements` `announcement` INNER JOIN `users` `createdBy` ON `createdBy`.`Id` = `announcement`.`CreatedById`  LEFT JOIN `users` `publishedBy` ON `publishedBy`.`Id` = `announcement`.`PublishedById`",
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM `_typeorm_metadata` WHERE `type` = ? AND `name` = ?', ['VIEW', 'vAnnouncements']);
    await queryRunner.query('DROP VIEW `vAnnouncements`');
  }
}
