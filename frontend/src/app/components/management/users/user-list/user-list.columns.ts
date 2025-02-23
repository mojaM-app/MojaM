import { IUserGridItemColumns } from 'src/app/components/management/users/user-list/interfaces/user-list.interfaces';

export const UserListColumns: { [K in keyof IUserGridItemColumns]: string } = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  isActive: 'isActive',
  isLockedOut: 'isLockedOut',
} as const;
