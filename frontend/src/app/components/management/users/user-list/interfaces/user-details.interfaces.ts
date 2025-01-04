export interface IUserDetails {
  id: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  isLockedOut: boolean;
  isActive: boolean;
  joiningDate?: Date;
  lastLoginAt?: Date;
  permissionCount: number;
}
