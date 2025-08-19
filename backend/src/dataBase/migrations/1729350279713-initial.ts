import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1729350279713 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create system_permissions table
    await queryRunner.query(
      `CREATE TABLE \`system_permissions\` (
        \`Id\` int NOT NULL,
        \`ParentId\` int NULL,
        \`Name\` varchar(50) NOT NULL,
        \`Description\` varchar(255) NOT NULL,
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB`,
    );

    // Create user_to_systempermissions table
    await queryRunner.query(
      `CREATE TABLE \`user_to_systempermissions\` (
        \`UserId\` int NOT NULL,
        \`PermissionId\` int NOT NULL,
        \`AssignedById\` int NOT NULL,
        \`AssignedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`UserId\`, \`PermissionId\`)
      ) ENGINE=InnoDB`,
    );

    // Create users table
    await queryRunner.query(
      `CREATE TABLE \`users\` (
        \`Id\` int NOT NULL AUTO_INCREMENT,
        \`Uuid\` varchar(36) NOT NULL,
        \`Email\` varchar(320) NOT NULL,
        \`EmailConfirmed\` tinyint NOT NULL DEFAULT 0,
        \`Phone\` varchar(30) NOT NULL,
        \`PhoneConfirmed\` tinyint NOT NULL DEFAULT 0,
        \`Passcode\` varchar(256) NULL,
        \`Salt\` varchar(64) NOT NULL,
        \`RefreshTokenKey\` varchar(128) NOT NULL,
        \`FirstName\` varchar(255) NULL,
        \`LastName\` varchar(255) NULL,
        \`JoiningDate\` date NULL,
        \`IsActive\` tinyint NOT NULL DEFAULT 0,
        \`CreatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`UpdatedAt\` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`LastLoginAt\` timestamp NULL,
        \`FailedLoginAttempts\` int NOT NULL DEFAULT '0',
        \`IsLockedOut\` tinyint NOT NULL DEFAULT 0,
        UNIQUE INDEX \`UQ_User_Uuid\` (\`Uuid\`),
        UNIQUE INDEX \`UQ_User_Email_Phone\` (\`Email\`, \`Phone\`),
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB`,
    );

    // Create user_reset_passcode_tokens table
    await queryRunner.query(
      `CREATE TABLE \`user_reset_passcode_tokens\` (
        \`UserId\` int NOT NULL,
        \`Token\` varchar(64) NOT NULL,
        \`CreatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`UserId\`)
      ) ENGINE=InnoDB`,
    );
    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE \`system_permissions\`
       ADD CONSTRAINT \`FK_SystemPermission_ParentId_To_SystemPermission\`
       FOREIGN KEY (\`ParentId\`) REFERENCES \`system_permissions\`(\`Id\`)
       ON DELETE RESTRICT ON UPDATE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`user_to_systempermissions\`
      ADD CONSTRAINT \`FK_UserSystemPermission_UserId_To_User\`
      FOREIGN KEY (\`UserId\`) REFERENCES \`users\`(\`Id\`)
      ON DELETE RESTRICT ON UPDATE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`user_to_systempermissions\`
       ADD CONSTRAINT \`FK_UserSystemPermission_To_SystemPermission\`
       FOREIGN KEY (\`PermissionId\`) REFERENCES \`system_permissions\`(\`Id\`)
       ON DELETE RESTRICT ON UPDATE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`user_to_systempermissions\`
       ADD CONSTRAINT \`FK_UserSystemPermission_AssignedById_To_User\`
       FOREIGN KEY (\`AssignedById\`) REFERENCES \`users\`(\`Id\`)
       ON DELETE RESTRICT ON UPDATE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`user_reset_passcode_tokens\`
       ADD CONSTRAINT \`FK_UserResetPasscodeToken_UserId_To_User\`
       FOREIGN KEY (\`UserId\`) REFERENCES \`users\`(\`Id\`)
       ON DELETE RESTRICT ON UPDATE RESTRICT`,
    );

    // Create vUsers view
    await queryRunner.query(
      `CREATE VIEW \`vUsers\` AS
       SELECT
         \`user\`.\`Uuid\` AS \`Id\`,
         \`user\`.\`FirstName\` AS \`FirstName\`,
         \`user\`.\`LastName\` AS \`LastName\`,
         \`user\`.\`Email\` AS \`Email\`,
         \`user\`.\`Phone\` AS \`Phone\`,
         \`user\`.\`JoiningDate\` AS \`JoiningDate\`,
         \`user\`.\`LastLoginAt\` AS \`LastLoginAt\`,
         \`user\`.\`IsActive\` AS \`IsActive\`,
         \`user\`.\`IsLockedOut\` AS \`IsLockedOut\`,
         (select count(0) from user_to_systempermissions as perm where \`user\`.\`Id\` = perm.UserId) AS \`PermissionCount\`
       FROM \`users\` \`user\``,
    );

    // Insert view metadata
    await queryRunner.query(
      `INSERT INTO \`_typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`)
       VALUES (DEFAULT, DEFAULT, DEFAULT, ?, ?, ?)`,
      [
        'VIEW',
        'vUsers',
        'SELECT `user`.`Uuid` AS `Id`, `user`.`FirstName` AS `FirstName`, `user`.`LastName` AS `LastName`, `user`.`Email` AS `Email`, `user`.`Phone` AS `Phone`, `user`.`JoiningDate` AS `JoiningDate`, `user`.`LastLoginAt` AS `LastLoginAt`, `user`.`IsActive` AS `IsActive`, `user`.`IsLockedOut` AS `IsLockedOut`, (select count(0) from user_to_systempermissions as perm where `user`.`Id` = perm.UserId) AS `PermissionCount` FROM `users` `user`',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove view metadata and drop view
    await queryRunner.query(
      `DELETE FROM \`_typeorm_metadata\`
       WHERE \`type\` = ? AND \`name\` = ?`,
      ['VIEW', 'vUsers'],
    );
    await queryRunner.query('DROP VIEW `vUsers`');

    // Drop foreign key constraints
    await queryRunner.query(
      'ALTER TABLE `user_reset_passcode_tokens` DROP FOREIGN KEY `FK_UserResetPasscodeToken_UserId_To_User`',
    );
    await queryRunner.query(
      'ALTER TABLE `user_to_systempermissions` DROP FOREIGN KEY `FK_UserSystemPermission_AssignedById_To_User`',
    );
    await queryRunner.query(
      'ALTER TABLE `user_to_systempermissions` DROP FOREIGN KEY `FK_UserSystemPermission_To_SystemPermission`',
    );
    await queryRunner.query(
      'ALTER TABLE `user_to_systempermissions` DROP FOREIGN KEY `FK_UserSystemPermission_UserId_To_User`',
    );
    await queryRunner.query(
      'ALTER TABLE `system_permissions` DROP FOREIGN KEY `FK_SystemPermission_ParentId_To_SystemPermission`',
    );

    // Drop tables
    await queryRunner.query('DROP TABLE `user_reset_passcode_tokens`');
    await queryRunner.query('DROP INDEX `UQ_User_Email_Phone` ON `users`');
    await queryRunner.query('DROP INDEX `UQ_User_Uuid` ON `users`');
    await queryRunner.query('DROP TABLE `users`');
    await queryRunner.query('DROP TABLE `user_to_systempermissions`');
    await queryRunner.query('DROP TABLE `system_permissions`');
  }
}
