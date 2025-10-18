import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeBulletinNumberToVarchar1760801211863 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change column type from INT to VARCHAR(30)
    await queryRunner.query(`
            ALTER TABLE \`bulletins\`
            MODIFY COLUMN \`Number\` varchar(30) NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert column type back to INT
    await queryRunner.query(`
            ALTER TABLE \`bulletins\`
            MODIFY COLUMN \`Number\` int NULL
        `);
  }
}
