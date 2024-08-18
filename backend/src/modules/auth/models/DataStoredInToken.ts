import { SystemPermission } from '@modules/permissions';

export interface DataStoredInToken {
  permissions: SystemPermission[] | undefined;
  userName: string | undefined;
}
