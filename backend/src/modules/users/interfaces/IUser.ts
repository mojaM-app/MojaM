import { AuthenticationTypes } from '@modules/auth';

export interface IUser {
  email: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  getFirstLastName: () => string | null;
  getFirstLastNameOrEmail: () => string | null;
  getLastFirstName: () => string | null;
  getLastFirstNameOrEmail: () => string | null;
  isAdmin: () => boolean;
  getAuthenticationType: () => AuthenticationTypes | undefined;
}
