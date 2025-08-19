import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableLogs1751575378795 implements MigrationInterface {
  name = 'CreateTableLogs1751575378795';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create logs table for system logging
    await queryRunner.query(`
      CREATE TABLE \`logs\` (
        \`Id\` int NOT NULL AUTO_INCREMENT,
        \`CreatedAt\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`Level\` varchar(50) NOT NULL,
        \`Message\` text NOT NULL,
        \`Meta\` text NULL,
        \`Source\` varchar(100) NULL,
        \`IpAddress\` varchar(45) NULL,
        \`UserAgent\` varchar(500) NULL,
        \`Path\` varchar(255) NULL,
        \`Method\` varchar(10) NULL,
        \`RequestId\` varchar(36) NULL,
        \`UserId\` varchar(36) NULL,
        \`Severity\` varchar(20) NULL,
        \`IsSecurityEvent\` tinyint NOT NULL DEFAULT 0,
        \`AdditionalData\` text NULL,
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB
    `);

    // Create view for logs with user details
    await queryRunner.query(`
      CREATE VIEW \`vLogs\` AS
      SELECT
        l.Id,
        l.Level,
        l.Message,
        l.Source,
        l.IpAddress,
        l.UserAgent,
        l.Path,
        l.Method,
        l.RequestId,
        l.UserId,
        l.Severity,
        l.IsSecurityEvent,
        l.CreatedAt,
        u.Email as UserEmail,
        CONCAT(u.FirstName, ' ', u.LastName) as UserFullName
      FROM logs l
      LEFT JOIN users u ON l.UserId = u.Uuid
    `);

    // Register view in TypeORM metadata
    await queryRunner.query('INSERT INTO `_typeorm_metadata`(`type`, `name`, `value`) VALUES (?, ?, ?)', [
      'VIEW',
      'vLogs',
      `SELECT
          l.Id,
          l.Level,
          l.Message,
          l.Source,
          l.IpAddress,
          l.UserAgent,
          l.Path,
          l.Method,
          l.RequestId,
          l.UserId,
          l.Severity,
          l.IsSecurityEvent,
          l.CreatedAt,
          u.Email as UserEmail,
          CONCAT(u.FirstName, ' ', u.LastName) as UserFullName
        FROM logs l
        LEFT JOIN users u ON l.UserId = u.Uuid`,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clean up TypeORM metadata
    await queryRunner.query('DELETE FROM `_typeorm_metadata` WHERE `type` = ? AND `name` = ?', ['VIEW', 'vLogs']);

    // Drop view and table
    await queryRunner.query('DROP VIEW `vLogs`');
    await queryRunner.query('DROP TABLE `logs`');
  }
}
