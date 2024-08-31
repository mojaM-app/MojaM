import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPasswordNullable1725027362849 implements MigrationInterface {
  name = 'UserPasswordNullable1725027362849';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` CHANGE `Password` `Password` varchar(1024) NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` CHANGE `Password` `Password` varchar(1024) NOT NULL');
  }
}
