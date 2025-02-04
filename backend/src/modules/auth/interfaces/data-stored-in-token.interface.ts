import { SystemPermission } from '@modules/permissions';

export interface IDataStoredInToken {
  permissions: SystemPermission[] | undefined;
  userName: string | null;
  email: string;
  phone: string;
}
