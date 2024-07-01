import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1718305944423 implements MigrationInterface {
  name = 'Initial1718305944423'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `users` (`Id` int NOT NULL AUTO_INCREMENT, `Uuid` varchar(36) NOT NULL, `Email` varchar(320) NOT NULL, `EmailConfirmed` tinyint NOT NULL DEFAULT 0, `Phone` varchar(30) NOT NULL, `PhoneConfirmed` tinyint NOT NULL DEFAULT 0, `Password` varchar(1024) NOT NULL, `Salt` varchar(64) NOT NULL, `FirstName` varchar(255) NULL, `LastName` varchar(255) NULL, `BirthDay` date NULL, `JoiningYear` date NULL, `IsActive` tinyint NOT NULL DEFAULT 0, `CreatedAt` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP, `UpdatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, `LastLoginAt` timestamp NULL, `FailedLoginAttempts` int NOT NULL DEFAULT \'0\', `IsLockedOut` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX `UQ_User_Uuid` (`Uuid`), UNIQUE INDEX `UQ_User_Email_Phone` (`Email`, `Phone`), PRIMARY KEY (`Id`)) ENGINE=InnoDB');
    await queryRunner.query('CREATE TABLE `user_to_systempermissions` (`UserId` int NOT NULL, `PermissionId` int NOT NULL, `AssignedById` int NOT NULL, `AssignedAt` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`UserId`, `PermissionId`)) ENGINE=InnoDB');
    await queryRunner.query('CREATE TABLE `system_permissions` (`Id` int NOT NULL, `ParentId` int NULL, `Name` varchar(50) NOT NULL, `Description` varchar(255) NOT NULL, PRIMARY KEY (`Id`)) ENGINE=InnoDB');
    await queryRunner.query('ALTER TABLE `user_to_systempermissions` ADD CONSTRAINT `FK_UserSystemPermission_To_User_UserId` FOREIGN KEY (`UserId`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT');
    await queryRunner.query('ALTER TABLE `user_to_systempermissions` ADD CONSTRAINT `FK_UserSystemPermission_To_SystemPermission` FOREIGN KEY (`PermissionId`) REFERENCES `system_permissions`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT');
    await queryRunner.query('ALTER TABLE `user_to_systempermissions` ADD CONSTRAINT `FK_UserSystemPermission_To_User_AssignedById` FOREIGN KEY (`AssignedById`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT');
    await queryRunner.query('ALTER TABLE `system_permissions` ADD CONSTRAINT `FK_SystemPermission_ParentId` FOREIGN KEY (`ParentId`) REFERENCES `system_permissions`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `system_permissions` DROP FOREIGN KEY `FK_SystemPermission_ParentId`');
    await queryRunner.query('ALTER TABLE `user_to_systempermissions` DROP FOREIGN KEY `FK_UserSystemPermission_To_User_AssignedById`');
    await queryRunner.query('ALTER TABLE `user_to_systempermissions` DROP FOREIGN KEY `FK_UserSystemPermission_To_SystemPermission`');
    await queryRunner.query('ALTER TABLE `user_to_systempermissions` DROP FOREIGN KEY `FK_UserSystemPermission_To_User_UserId`');
    await queryRunner.query('DROP TABLE `system_permissions`');
    await queryRunner.query('DROP TABLE `user_to_systempermissions`');
    await queryRunner.query('DROP INDEX `UQ_User_Email_Phone` ON `users`');
    await queryRunner.query('DROP INDEX `UQ_User_Uuid` ON `users`');
    await queryRunner.query('DROP TABLE `users`');
  }
}
