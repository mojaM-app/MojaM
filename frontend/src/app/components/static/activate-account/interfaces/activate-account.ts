export interface IUserToActivate {
  email?: string;
  phone?: string;
  firstName?: string | null;
  lastName?: string | null;
  joiningDate?: Date | null;
  isActive: boolean;
  isLockedOut?: boolean;
}
