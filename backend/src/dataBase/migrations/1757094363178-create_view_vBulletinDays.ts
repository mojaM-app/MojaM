import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateViewVBulletinDays1757094363178 implements MigrationInterface {
  name = 'CreateViewVBulletinDays1757094363178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE VIEW \`vBulletinDays\`
          AS
          SELECT
            \`bulletinDay\`.\`Uuid\` AS \`id\`,
            \`bulletin\`.\`Uuid\` AS \`bulletinId\`,
            \`bulletinDay\`.\`Title\` AS \`title\`,
            \`bulletinDay\`.\`Date\` AS \`date\`,
            CASE WHEN \`bulletinDay\`.\`Date\` = (SELECT MIN(\`bd_min\`.\`Date\`) FROM \`bulletin_days\` \`bd_min\` WHERE \`bd_min\`.\`BulletinId\` = \`bulletinDay\`.\`BulletinId\`) THEN 1 ELSE 0 END AS \`isFirstDay\`,
            CASE WHEN \`bulletinDay\`.\`Date\` = (SELECT MAX(\`bd_max\`.\`Date\`) FROM \`bulletin_days\` \`bd_max\` WHERE \`bd_max\`.\`BulletinId\` = \`bulletinDay\`.\`BulletinId\`) THEN 1 ELSE 0 END AS \`isLastDay\`
          FROM \`bulletin_days\` \`bulletinDay\`
          INNER JOIN \`bulletins\` \`bulletin\` ON \`bulletin\`.\`Id\` = \`bulletinDay\`.\`BulletinId\`
          INNER JOIN \`users\` \`createdBy\` ON \`createdBy\`.\`Id\` = \`bulletinDay\`.\`CreatedById\`
          LEFT JOIN \`users\` \`updatedBy\` ON \`updatedBy\`.\`Id\` = \`bulletinDay\`.\`UpdatedById\`
          WHERE  \`bulletin\`.\`State\` = 2`);
    await queryRunner.query(
      `INSERT INTO \`_typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, DEFAULT, DEFAULT, ?, ?, ?)`,
      [
        'VIEW',
        'vBulletinDays',
        'SELECT `bulletinDay`.`Uuid` AS `id`, `bulletin`.`Uuid` AS `bulletinId`, `bulletinDay`.`Title` AS `title`, `bulletinDay`.`Date` AS `date`, CASE WHEN `bulletinDay`.`Date` = (SELECT MIN(`bd_min`.`Date`) FROM `bulletin_days` `bd_min` WHERE `bd_min`.`BulletinId` = `bulletinDay`.`BulletinId`) THEN 1 ELSE 0 END AS `isFirstDay`, CASE WHEN `bulletinDay`.`Date` = (SELECT MAX(`bd_max`.`Date`) FROM `bulletin_days` `bd_max` WHERE `bd_max`.`BulletinId` = `bulletinDay`.`BulletinId`) THEN 1 ELSE 0 END AS `isLastDay` FROM `bulletin_days` `bulletinDay` INNER JOIN `bulletins` `bulletin` ON `bulletin`.`Id` = `bulletinDay`.`BulletinId`  INNER JOIN `users` `createdBy` ON `createdBy`.`Id` = `bulletinDay`.`CreatedById`  LEFT JOIN `users` `updatedBy` ON `updatedBy`.`Id` = `bulletinDay`.`UpdatedById` WHERE `bulletin`.`State` = 2',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clean up TypeORM metadata
    await queryRunner.query('DELETE FROM `_typeorm_metadata` WHERE `type` = ? AND `name` = ?', [
      'VIEW',
      'vBulletinDays',
    ]);

    // Drop the view
    await queryRunner.query(`DROP VIEW \`vBulletinDays\``);
  }
}
