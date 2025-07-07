import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLogsTable1751575378795 implements MigrationInterface {
  name = 'CreateLogsTable1751575378795';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`logs\` (\`Id\` int NOT NULL AUTO_INCREMENT, \`CreatedAt\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`Level\` varchar(50) NOT NULL, \`Message\` text NOT NULL, \`Meta\` text NULL, \`Source\` varchar(100) NULL, \`IpAddress\` varchar(45) NULL, \`UserAgent\` varchar(500) NULL, \`Path\` varchar(255) NULL, \`Method\` varchar(10) NULL, \`RequestId\` varchar(36) NULL, \`UserId\` varchar(36) NULL, \`Severity\` varchar(20) NULL, \`IsSecurityEvent\` tinyint NOT NULL DEFAULT 0, \`AdditionalData\` text NULL, PRIMARY KEY (\`Id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(`CREATE VIEW \`vLogs\` AS
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
    await queryRunner.query(`INSERT INTO \`_typeorm_metadata\`(\`type\`, \`name\`, \`value\`) VALUES (?, ?, ?)`, [
      'VIEW',
      'vLogs',
      "SELECT\n      l.Id,\n      l.Level,\n      l.Message,\n      l.Source,\n      l.IpAddress,\n      l.UserAgent,\n      l.Path,\n      l.Method,\n      l.RequestId,\n      l.UserId,\n      l.Severity,\n      l.IsSecurityEvent,\n      l.CreatedAt,\n      u.Email as UserEmail,\n      CONCAT(u.FirstName, ' ', u.LastName) as UserFullName\n    FROM logs l\n    LEFT JOIN users u ON l.UserId = u.Uuid",
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`_typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ?`, ['VIEW', 'vLogs']);
    await queryRunner.query(`DROP VIEW \`vLogs\``);
    await queryRunner.query(`DROP TABLE \`logs\``);
  }
}
