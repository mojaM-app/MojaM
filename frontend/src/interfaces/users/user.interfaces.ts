export interface IUser {
  id: string;
  email: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  joiningDate?: Date | null;
}
