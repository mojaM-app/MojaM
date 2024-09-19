import { IUserGridItemDto } from 'src/interfaces/users/users.interfaces';

export const UserListColumns: { [K in keyof IUserGridItemDto]: string } = {
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
} as const;
