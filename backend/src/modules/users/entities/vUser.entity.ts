import { DataSource, PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';
import { IUserGridItemDto } from '../dtos/get-user-list.dto';
import { User } from './user.entity';

const UserListViewColumns: { [K in keyof IUserGridItemDto]: string } = {
  id: 'Id',
  firstName: 'FirstName',
  lastName: 'LastName',
  email: 'Email',
  phone: 'Phone',
  joiningDate: 'JoiningDate',
  lastLoginAt: 'LastLoginAt',
  isActive: 'IsActive',
  isLockedOut: 'IsLockedOut',
  rolesCount: 'RolesCount',
} as const;

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('user.Uuid', UserListViewColumns.id)
      .addSelect('user.FirstName', UserListViewColumns.firstName)
      .addSelect('user.LastName', UserListViewColumns.lastName)
      .addSelect('user.Email', UserListViewColumns.email)
      .addSelect('user.Phone', UserListViewColumns.phone)
      .addSelect('user.JoiningDate', UserListViewColumns.joiningDate)
      .addSelect('user.LastLoginAt', UserListViewColumns.lastLoginAt)
      .addSelect('user.IsActive', UserListViewColumns.isActive)
      .addSelect('user.IsLockedOut', UserListViewColumns.isLockedOut)
      .addSelect('user.IsDeleted', 'IsDeleted')
      .addSelect('(select count(0) from user_to_systempermissions as perm where user.Id = perm.UserId)', UserListViewColumns.rolesCount)
      .from(User, 'user'),
  name: 'vUser',
})
export class vUser implements IUserGridItemDto {
  @ViewColumn()
  @PrimaryColumn()
    id: string;

  @ViewColumn()
    firstName?: string;

  @ViewColumn()
    lastName?: string;

  @ViewColumn()
    email: string;

  @ViewColumn()
    phone: string;

  @ViewColumn()
    joiningDate?: Date;

  @ViewColumn()
    lastLoginAt?: Date;

  @ViewColumn()
    isActive: boolean;

  @ViewColumn()
    isLockedOut: boolean;

  @ViewColumn()
    isDeleted: boolean;

  @ViewColumn()
    rolesCount: number;
}
