import { MigrationInterface, QueryRunner } from 'typeorm';
import { PasswordService } from './../../modules/auth/services/password.service';
import { SystemPermission } from './../../modules/permissions/enums/system-permission.enum';
import { getAdminLoginData } from './../../utils/tests.utils';

export class Seed1729350380773 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (10, 'UsersAdministration', 'Users administration permission group')",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.PreviewUserList +
        ", 'PreviewUserList', 'Permission that allows preview User list', 10)",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.PreviewUserDetails +
        ", 'PreviewUserDetails', 'Permission that allows preview details of any User from User list', 10)",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.AddUser +
        ", 'AddUser', 'Permission that allows add new User (without password) from User list', 10)",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.EditUser +
        ", 'EditUser', 'Permission that allows edit any User (without password) from User list', 10)",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.DeactivateUser +
        ", 'DeactivateUser', 'Permission that allows deactivate User', 10)",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.ActivateUser +
        ", 'ActivateUser', 'Permission that allows activate User', 10)",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.DeleteUser +
        ", 'DeleteUser', 'Permission that allows delete User (user is not deleted, is anonymized)', 10)",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.UnlockUser +
        ", 'UnlockUser', 'Permission that allows unlock User (when user locks his profile by entering the wrong login or password several times)', 10)",
    );
    await queryRunner.query(
      "INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (20, 'PermissionsAdministration', 'Permissions administration permission group')",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.AddPermission +
        ", 'AddPermission', 'Permission that allows to add permissions to other users', 20)",
    );
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' +
        SystemPermission.DeletePermission +
        ", 'DeletePermission', 'Permission that allows to remove permissions from other users', 20)",
    );

    const passwordService = new PasswordService();
    const adminLoginData = getAdminLoginData();
    const salt = '22fae28a2abbb54a638cb5b7f1acb2e9';
    const password = passwordService.hashPassword(salt, adminLoginData.password);
    const refreshTokenKey = 'aedc7970d693ea6e4d71e39bffa7dc4034bae8e858b1ad2bb65a5ffd8356db41';
    await queryRunner.query(
      "INSERT INTO `users` (`Uuid`,`Email`,`Phone`,`Password`,`Salt`,`RefreshTokenKey`,`FirstName`,`LastName`,`IsActive`) VALUES ('" +
        adminLoginData.uuid +
        "', '" +
        adminLoginData.email +
        "', '" +
        adminLoginData.phone +
        "', '" +
        password +
        "', '" +
        salt +
        "', '" +
        refreshTokenKey +
        "', 'Admin', 'Admin', 1)",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
