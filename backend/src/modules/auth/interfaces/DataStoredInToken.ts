import { SystemPermission } from '@modules/permissions/system-permission.enum';

export interface DataStoredInToken {
  id: string | undefined;
  permissions: SystemPermission[] | undefined;
}
