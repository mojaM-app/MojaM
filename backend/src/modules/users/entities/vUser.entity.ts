import { DataSource, PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';
import { IUserGridItemDto } from '../dtos/get-user-list.dto';
import { User } from './user.entity';

export const UserListViewColumns: { [K in keyof IUserGridItemDto]: string } = {
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  joiningDate: 'joiningDate',
  lastLoginAt: 'lastLoginAt',
  isActive: 'isActive',
  isLockedOut: 'isLockedOut',
  permissionCount: 'permissionCount',
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
      .addSelect('(select count(0) from user_to_systempermissions as perm where user.Id = perm.UserId)', UserListViewColumns.permissionCount)
      .from(User, 'user'),
  name: 'vUsers',
})
export class vUser implements IUserGridItemDto {
  @ViewColumn()
  @PrimaryColumn()
  public id: string;

  @ViewColumn()
  public firstName?: string;

  @ViewColumn()
  public lastName?: string;

  @ViewColumn()
  public email: string;

  @ViewColumn()
  public phone: string;

  @ViewColumn()
  public joiningDate?: Date;

  @ViewColumn()
  public lastLoginAt?: Date;

  @ViewColumn()
  public isActive: boolean;

  @ViewColumn()
  public isLockedOut: boolean;

  @ViewColumn()
  public permissionCount: number;
}
