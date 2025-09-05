import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateViewVBulletinDays1757094363178 implements MigrationInterface {
  name = 'CreateViewVBulletinDays1757094363178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE VIEW \`vBulletinDays\`
          AS
          SELECT \`bulletinDay\`.\`Date\` AS \`date\`
          FROM \`bulletin_days\` \`bulletinDay\`
          INNER JOIN \`bulletins\` \`bulletin\` ON \`bulletin\`.\`Id\` = \`bulletinDay\`.\`BulletinId\`
          INNER JOIN \`users\` \`createdBy\` ON \`createdBy\`.\`Id\` = \`bulletinDay\`.\`CreatedById\`
          LEFT JOIN \`users\` \`updatedBy\` ON \`updatedBy\`.\`Id\` = \`bulletinDay\`.\`UpdatedById\`
          WHERE  \`bulletin\`.\`State\` = 2`);
    await queryRunner.query(
      `INSERT INTO \`dev\`.\`_typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, DEFAULT, DEFAULT, ?, ?, ?)`,
      [
        'VIEW',
        'vBulletinDays',
        'SELECT `bulletinDay`.`Date` AS `date` FROM `bulletin_days` `bulletinDay` INNER JOIN `bulletins` `bulletin` ON `bulletin`.`Id` = `bulletinDay`.`BulletinId`  INNER JOIN `users` `createdBy` ON `createdBy`.`Id` = `bulletinDay`.`CreatedById`  LEFT JOIN `users` `updatedBy` ON `updatedBy`.`Id` = `bulletinDay`.`UpdatedById` WHERE \`bulletin\`.\`State\` = 2`',
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
