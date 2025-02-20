import { SystemPermissions } from '@modules/permissions';

export interface IDataStoredInToken {
  permissions: SystemPermissions[] | undefined;
  userName: string | null;
  email: string;
  phone: string;
}
