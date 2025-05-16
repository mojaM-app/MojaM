import { IUserGridItemDto } from '@core';
import { DataSource, PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';
import { EntityTransformFunctions } from './../../EntityTransformFunctions';
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
  public firstName: string | null;

  @ViewColumn()
  public lastName: string | null;

  @ViewColumn()
  public email: string;

  @ViewColumn()
  public phone: string;

  @ViewColumn({
    transformer: {
      from: EntityTransformFunctions.stringDateToDate,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public joiningDate: Date | null;

  @ViewColumn()
  public lastLoginAt: Date | null;

  @ViewColumn({
    transformer: {
      from: EntityTransformFunctions.anyToBoolean,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public isActive: boolean;

  @ViewColumn({
    transformer: {
      from: EntityTransformFunctions.anyToBoolean,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public isLockedOut: boolean;

  @ViewColumn({
    transformer: {
      from: EntityTransformFunctions.anyToNumber,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public permissionCount: number;
}
