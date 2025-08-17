import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateViewVBulletins1755371772178 implements MigrationInterface {
  name = 'CreateViewVBulletins1755371772178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create view for bulletins with user details
    await queryRunner.query(`
            CREATE VIEW \`vBulletins\` AS
            SELECT
                \`bulletin\`.\`Uuid\` AS \`id\`,
                \`bulletin\`.\`Title\` AS \`title\`,
                \`bulletin\`.\`Number\` AS \`number\`,
                \`bulletin\`.\`Date\` AS \`date\`,
                \`bulletin\`.\`State\` AS \`state\`,
                \`bulletin\`.\`CreatedAt\` AS \`createdAt\`,
                CONCAT(\`createdBy\`.\`FirstName\`, ' ', \`createdBy\`.\`LastName\`) AS \`createdBy\`,
                \`bulletin\`.\`UpdatedAt\` AS \`updatedAt\`,
                CONCAT(\`updatedBy\`.\`FirstName\`, ' ', \`updatedBy\`.\`LastName\`) AS \`updatedBy\`,
                \`bulletin\`.\`PublishedAt\` AS \`publishedAt\`,
                CONCAT(\`publishedBy\`.\`FirstName\`, ' ', \`publishedBy\`.\`LastName\`) AS \`publishedBy\`
            FROM \`bulletins\` \`bulletin\`
            INNER JOIN \`users\` \`createdBy\` ON \`createdBy\`.\`Id\` = \`bulletin\`.\`CreatedById\`
            LEFT JOIN \`users\` \`updatedBy\` ON \`updatedBy\`.\`Id\` = \`bulletin\`.\`UpdatedById\`
            LEFT JOIN \`users\` \`publishedBy\` ON \`publishedBy\`.\`Id\` = \`bulletin\`.\`PublishedById\`
        `);

    // Register view in TypeORM metadata
    await queryRunner.query(
      'INSERT INTO `_typeorm_metadata`(`database`, `schema`, `table`, `type`, `name`, `value`) VALUES (DEFAULT, DEFAULT, DEFAULT, ?, ?, ?)',
      [
        'VIEW',
        'vBulletins',
        `SELECT \`bulletin\`.\`Uuid\` AS \`id\`, \`bulletin\`.\`Title\` AS \`title\`, \`bulletin\`.\`Number\` AS \`number\`, \`bulletin\`.\`Date\` AS \`date\`, \`bulletin\`.\`State\` AS \`state\`, \`bulletin\`.\`CreatedAt\` AS \`createdAt\`, CONCAT(\`createdBy\`.\`FirstName\`, ' ', \`createdBy\`.\`LastName\`) AS \`createdBy\`, \`bulletin\`.\`UpdatedAt\` AS \`updatedAt\`, CONCAT(\`updatedBy\`.\`FirstName\`, ' ', \`updatedBy\`.\`LastName\`) AS \`updatedBy\`, \`bulletin\`.\`PublishedAt\` AS \`publishedAt\`, CONCAT(\`publishedBy\`.\`FirstName\`, ' ', \`publishedBy\`.\`LastName\`) AS \`publishedBy\` FROM \`bulletins\` \`bulletin\` INNER JOIN \`users\` \`createdBy\` ON \`createdBy\`.\`Id\` = \`bulletin\`.\`CreatedById\` LEFT JOIN \`users\` \`updatedBy\` ON \`updatedBy\`.\`Id\` = \`bulletin\`.\`UpdatedById\` LEFT JOIN \`users\` \`publishedBy\` ON \`publishedBy\`.\`Id\` = \`bulletin\`.\`PublishedById\``,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clean up TypeORM metadata
    await queryRunner.query('DELETE FROM `_typeorm_metadata` WHERE `type` = ? AND `name` = ?', ['VIEW', 'vBulletins']);

    // Drop the view
    await queryRunner.query('DROP VIEW `vBulletins`');
  }
}
