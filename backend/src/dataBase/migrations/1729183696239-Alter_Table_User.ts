import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableUser1729183696239 implements MigrationInterface {
  name = 'AlterTableUser1729183696239'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `BirthDay`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `JoiningYear`');
    await queryRunner.query('ALTER TABLE `users` ADD `JoiningDate` date NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `JoiningDate`');
    await queryRunner.query('ALTER TABLE `users` ADD `JoiningYear` date NULL');
    await queryRunner.query('ALTER TABLE `users` ADD `BirthDay` date NULL');
  }
}
