import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateViewUserList1729187044355 implements MigrationInterface {
  name = 'CreateViewUserList1729187044355'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE VIEW `vUser` AS SELECT `user`.`Uuid` AS `Id`, `user`.`FirstName` AS `FirstName`, `user`.`LastName` AS `LastName`, `user`.`Email` AS `Email`, `user`.`Phone` AS `Phone`, `user`.`JoiningDate` AS `JoiningDate`, `user`.`LastLoginAt` AS `LastLoginAt`, `user`.`IsActive` AS `IsActive`, `user`.`IsLockedOut` AS `IsLockedOut`, `user`.`IsDeleted` AS `IsDeleted`, (select count(0) from user_to_systempermissions as perm where `user`.`Id` = perm.UserId) AS `RolesCount` FROM `users` `user`');
    await queryRunner.query('INSERT INTO `dev`.`typeorm_metadata`(`database`, `schema`, `table`, `type`, `name`, `value`) VALUES (DEFAULT, ?, DEFAULT, ?, ?, ?)', ['dev', 'VIEW', 'vUser', 'SELECT `user`.`Uuid` AS `Id`, `user`.`FirstName` AS `FirstName`, `user`.`LastName` AS `LastName`, `user`.`Email` AS `Email`, `user`.`Phone` AS `Phone`, `user`.`JoiningDate` AS `JoiningDate`, `user`.`LastLoginAt` AS `LastLoginAt`, `user`.`IsActive` AS `IsActive`, `user`.`IsLockedOut` AS `IsLockedOut`, `user`.`IsDeleted` AS `IsDeleted`, (select count(0) from user_to_systempermissions as perm where `user`.`Id` = perm.UserId) AS `RolesCount` FROM `users` `user`']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM `dev`.`typeorm_metadata` WHERE `type` = ? AND `name` = ? AND `schema` = ?', ['VIEW', 'vUser', 'dev']);
    await queryRunner.query('DROP VIEW `vUser`');
  }
}
