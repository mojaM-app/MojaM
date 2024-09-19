import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersAddIsDeleted1726604550350 implements MigrationInterface {
  name = 'AlterUsersAddIsDeleted1726604550350'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` ADD `IsDeleted` tinyint NOT NULL DEFAULT 0');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `IsDeleted`');
  }
}
