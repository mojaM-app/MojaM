import { MigrationInterface, QueryRunner } from 'typeorm';
import { getAdminLoginData } from './../../utils/tests.utils';

export class CreateTriggerUpdateAdminPermissions1729506458365 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminLoginData = getAdminLoginData();

    await queryRunner.query(`CREATE PROCEDURE \`SP_update_admin_permissions\`()
        INSERT INTO \`user_to_systempermissions\` (\`UserId\`,\`AssignedById\`,\`PermissionId\`)
        SELECT
          (SELECT u.\`Id\` FROM \`users\` AS u WHERE u.\`Uuid\` = '${adminLoginData.uuid}') as \`UserId\`,
          (SELECT a.\`Id\` FROM \`users\` AS a WHERE a.\`Uuid\` = '${adminLoginData.uuid}') as \`AssignedById\`,
          sp.\`Id\` AS \`PermissionId\`
        FROM \`system_permissions\` AS sp
        WHERE sp.\`ParentId\` IS NOT NULL
          AND EXISTS (SELECT * FROM \`users\` WHERE \`Uuid\` = '${adminLoginData.uuid}')
          AND sp.\`Id\` NOT IN (SELECT \`PermissionId\` FROM \`user_to_systempermissions\` WHERE \`UserId\` = (SELECT up.\`Id\` FROM \`users\` AS up WHERE up.\`Uuid\` = '${adminLoginData.uuid}'));`);

    await queryRunner.query(`CREATE TRIGGER \`TR_system_permissions_AI\`
                            AFTER INSERT ON \`system_permissions\`
                            FOR EACH ROW
                              CALL SP_update_admin_permissions()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
