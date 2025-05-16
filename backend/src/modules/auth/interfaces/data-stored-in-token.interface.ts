import { SystemPermissions } from '@core';

export interface IDataStoredInToken {
  permissions: SystemPermissions[] | undefined;
  userName: string | null;
  email: string;
  phone: string;
}
