export interface IUser {
  email: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  getFullName: () => string | null;
  getFullNameOrEmail: () => string | null;
}
