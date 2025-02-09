export interface IUserPermissions {
  id: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  permissions: number[];
}
