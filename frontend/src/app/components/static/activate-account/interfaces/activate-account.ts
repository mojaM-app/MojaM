export interface IAccountToActivate {
  email?: string;
  phone?: string;
  firstName?: string | null;
  lastName?: string | null;
  joiningDate?: Date | null;
  isActive: boolean;
  isLockedOut?: boolean;
}

export interface IActivateAccountResult {
  isActive?: boolean;
}
