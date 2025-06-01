export interface IUserGridItemDto {
  id: string;
  email: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  joiningDate: Date | null;
  lastLoginAt: Date | null;
  isActive: boolean;
  isLockedOut: boolean;
  permissionCount: number;
}
