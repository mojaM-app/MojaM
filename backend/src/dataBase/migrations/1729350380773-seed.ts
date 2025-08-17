import { MigrationInterface, QueryRunner } from 'typeorm';
import { SystemPermissions } from '../../core/enums/system-permissions.enum';
import { PasswordService } from './../../modules/auth/services/password.service';
import { getAdminLoginData } from './../../utils/user.utils';

export class Seed1729350380773 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Users Administration permission group
    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`)
       VALUES (10, 'UsersAdministration', 'Users administration permission group')`,
    );

    // Insert user management permissions
    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [SystemPermissions.PreviewUserList, 'PreviewUserList', 'Permission that allows preview User list', 10],
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [
        SystemPermissions.PreviewUserDetails,
        'PreviewUserDetails',
        'Permission that allows preview details of any User from User list',
        10,
      ],
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [
        SystemPermissions.AddUser,
        'AddUser',
        'Permission that allows add new User (without password and pin) from User list',
        10,
      ],
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [
        SystemPermissions.EditUser,
        'EditUser',
        'Permission that allows edit any User (without password and pin) from User list',
        10,
      ],
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [SystemPermissions.DeactivateUser, 'DeactivateUser', 'Permission that allows deactivate User', 10],
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [SystemPermissions.ActivateUser, 'ActivateUser', 'Permission that allows activate User', 10],
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [
        SystemPermissions.DeleteUser,
        'DeleteUser',
        'Permission that allows delete User (user is not deleted, is anonymized)',
        10,
      ],
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [
        SystemPermissions.UnlockUser,
        'UnlockUser',
        'Permission that allows unlock User (when user locks his profile by entering the wrong login or passcode several times)',
        10,
      ],
    );

    // Create Permissions Administration permission group
    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`)
       VALUES (20, 'PermissionsAdministration', 'Permissions administration permission group')`,
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [
        SystemPermissions.AddPermission,
        'AddPermission',
        'Permission that allows to add permissions to other users',
        20,
      ],
    );

    await queryRunner.query(
      `INSERT INTO \`system_permissions\` (\`Id\`, \`Name\`, \`Description\`, \`ParentId\`)
       VALUES (?, ?, ?, ?)`,
      [
        SystemPermissions.DeletePermission,
        'DeletePermission',
        'Permission that allows to remove permissions from other users',
        20,
      ],
    );

    // Create admin user
    const passwordService = new PasswordService();
    const adminLoginData = getAdminLoginData();
    const passcode = passwordService.getHash(adminLoginData.salt, adminLoginData.passcode);

    await queryRunner.query(
      `INSERT INTO \`users\` (
        \`Uuid\`, \`Email\`, \`Phone\`, \`Passcode\`, \`Salt\`, \`RefreshTokenKey\`,
        \`FirstName\`, \`LastName\`, \`IsActive\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminLoginData.uuid,
        adminLoginData.email,
        adminLoginData.phone,
        passcode,
        adminLoginData.salt,
        adminLoginData.refreshTokenKey,
        'Admin',
        'Admin',
        1,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
