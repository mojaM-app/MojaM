import { Guid } from 'guid-typescript';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { CryptoService } from './../../modules/auth/services/crypto.service';
import { PasswordService } from './../../modules/auth/services/password.service';
import { SystemPermission } from './../../modules/permissions/enums/system-permission.enum';
import { generateRandomNumber, getAdminLoginData } from './../../utils/tests.utils';

export class Seed1729350380773 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (10, \'UsersAdministration\', \'Users administration permission group\')');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.PreviewUserList + ', \'PreviewUserList\', \'Permission that allows preview User list\', 10)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.PreviewUserProfile + ', \'PreviewUserProfile\', \'Permission that allows preview any User profile\', 10)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.AddUser + ', \'AddUser\', \'Permission that allows add new User (without password)\', 10)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.EditUserProfile + ', \'EditUserProfile\', \'Permission that allows edit any User profile information (without password)\', 10)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.DeactivateUser + ', \'DeactivateUser\', \'Permission that allows deactivate User\', 10)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.ActivateUser + ', \'ActivateUser\', \'Permission that allows activate User\', 10)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.DeleteUser + ', \'DeleteUser\', \'Permission that allows delete User (user is not deleted, is anonymized)\', 10)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.UnlockUser + ', \'UnlockUser\', \'Permission that allows unlock User (when user locks his profile by entering the wrong login or password several times)\', 10)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (20, \'PermissionsAdministration\', \'Permissions administration permission group\')');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.AddPermission + ', \'AddPermission\', \'Permission that allows to add permissions to other users\', 20)');
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (' + SystemPermission.DeletePermission + ', \'DeletePermission\', \'Permission that allows to remove permissions from other users\', 20)');

    const cryptoService = new CryptoService();
    const passwordService = new PasswordService();
    const adminLoginData = getAdminLoginData();
    let salt = '22fae28a2abbb54a638cb5b7f1acb2e9';
    let password = passwordService.hashPassword(salt, adminLoginData.password);
    let refreshTokenKey = 'aedc7970d693ea6e4d71e39bffa7dc4034bae8e858b1ad2bb65a5ffd8356db41';
    await queryRunner.query('INSERT INTO `users` (`Uuid`,`Email`,`Phone`,`Password`,`Salt`,`RefreshTokenKey`,`FirstName`,`LastName`,`IsActive`) VALUES (\'' + adminLoginData.uuid + '\', \'' + adminLoginData.email + '\', \'' + adminLoginData.phone + '\', \'' + password + '\', \'' + salt + '\', \'' + refreshTokenKey + '\', \'Admin\', \'Admin\', 1)');
    await queryRunner.query('INSERT INTO `user_to_systempermissions` (`UserId`,`AssignedById`,`PermissionId`) SELECT (SELECT `Id` FROM `users` WHERE `Uuid` = \'' + adminLoginData.uuid + '\'), (SELECT `Id` FROM `users` WHERE `Uuid` = \'' + adminLoginData.uuid + '\'), `Id` FROM `system_permissions` WHERE `ParentId` IS NOT NULL');

    const uuid = Guid.create().toString();
    const phone = generateRandomNumber(9);
    salt = cryptoService.generateSalt();
    password = passwordService.hashPassword(salt, 'p@ss');
    refreshTokenKey = cryptoService.generateUserRefreshTokenKey();
    await queryRunner.query('INSERT INTO `users` (`Uuid`,`Email`,`Phone`,`Password`,`Salt`,`RefreshTokenKey`,`FirstName`,`LastName`,`IsActive`) VALUES (\'' + uuid + '\', \'user1@email.com\', \'' + phone + '\', \'' + password + '\', \'' + salt + '\', \'' + refreshTokenKey + '\', \'only for tests\', \'only for tests\', 1)');
    await queryRunner.query('INSERT INTO `user_to_systempermissions` (`UserId`,`AssignedById`,`PermissionId`) SELECT (SELECT `Id` FROM `users` WHERE `Uuid` = \'' + uuid + '\'), (SELECT `Id` FROM `users` WHERE `Uuid` = \'' + adminLoginData.uuid + '\'), `Id` FROM `system_permissions` WHERE `Id` IN(' + SystemPermission.PreviewUserList + ',' + SystemPermission.PreviewUserProfile + ')');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
