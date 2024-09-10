import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableUserResetPassTokens1725218109887 implements MigrationInterface {
  name = 'CreateTableUserResetPassTokens1725218109887';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `user_reset_password_tokens` (`UserId` int NOT NULL, `Token` varchar(64) NOT NULL, `CreatedAt` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`UserId`)) ENGINE=InnoDB',
    );
    await queryRunner.query(
      'ALTER TABLE `user_reset_password_tokens` ADD CONSTRAINT `FK_UserResetPasswordToken_To_User_UserId` FOREIGN KEY (`UserId`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `user_reset_password_tokens` DROP FOREIGN KEY `FK_UserResetPasswordToken_To_User_UserId`');
    await queryRunner.query('DROP TABLE `user_reset_password_tokens`');
  }
}
