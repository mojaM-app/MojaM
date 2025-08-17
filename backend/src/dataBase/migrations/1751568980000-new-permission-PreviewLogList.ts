import { SystemPermissions } from '../../core/enums/system-permissions.enum';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewPermissionPreviewLogList1751568980000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add advanced options administration permission group
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (?, ?, ?)', [
      40,
      'AdvancedOptionsAdministration',
      'Advanced options administration permission group',
    ]);

    // Add permission to preview log list
    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.PreviewLogList, 'PreviewLogList', 'Permission that allows preview log list', 40],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: Not removing permissions as they might be already assigned to users
  }
}
