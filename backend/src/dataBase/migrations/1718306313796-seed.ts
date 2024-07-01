import { Guid } from 'guid-typescript';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { CryptoService } from './../../modules/auth/services/crypto.service';
import { SystemPermission } from './../../modules/permissions/enums/system-permission.enum';
import { generateRandomNumber, getAdminLoginData } from './../../utils/tests.utils';

export class Seed1718306313796 implements MigrationInterface {
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

    const adminLoginData = getAdminLoginData();
    const cryptoService = new CryptoService();
    let salt = cryptoService.generateSalt();
    let password = cryptoService.hashPassword(salt, adminLoginData.password);
    await queryRunner.query('INSERT INTO `users` (`Uuid`,`Email`,`Phone`,`Password`,`Salt`,`FirstName`,`LastName`,`IsActive`) VALUES (\'' + adminLoginData.uuid + '\', \'' + adminLoginData.email + '\', \'' + adminLoginData.phone + '\', \'' + password + '\', \'' + salt + '\', \'has full access\', \'only for tests\', 1)');
    await queryRunner.query('INSERT INTO `user_to_systempermissions` (`UserId`,`AssignedById`,`PermissionId`) SELECT (SELECT `Id` FROM `users` WHERE `Uuid` = \'' + adminLoginData.uuid + '\'), (SELECT `Id` FROM `users` WHERE `Uuid` = \'' + adminLoginData.uuid + '\'), `Id` FROM `system_permissions` WHERE `ParentId` IS NOT NULL');

    const uuid = Guid.create().toString();
    const phone = generateRandomNumber(9);
    salt = cryptoService.generateSalt();
    password = cryptoService.hashPassword(salt, 'p@ss');
    await queryRunner.query('INSERT INTO `users` (`Uuid`,`Email`,`Phone`,`Password`,`Salt`,`FirstName`,`LastName`,`IsActive`) VALUES (\'' + uuid + '\', \'user1@email.com\', \'' + phone + '\', \'' + password + '\', \'' + salt + '\', \'only for tests\', \'only for tests\', 1)');
    await queryRunner.query('INSERT INTO `user_to_systempermissions` (`UserId`,`AssignedById`,`PermissionId`) SELECT (SELECT `Id` FROM `users` WHERE `Uuid` = \'' + uuid + '\'), (SELECT `Id` FROM `users` WHERE `Uuid` = \'' + adminLoginData.uuid + '\'), `Id` FROM `system_permissions` WHERE `Id` IN(' + SystemPermission.PreviewUserList + ',' + SystemPermission.PreviewUserProfile + ')');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
