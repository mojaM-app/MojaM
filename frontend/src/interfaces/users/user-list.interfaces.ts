import { IGridData } from '../common/grid.data';

export interface IUserGridItemColumns {
  id: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
}

export interface IUserGridItemDto extends IUserGridItemColumns {
  joiningDate?: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  isLockedOut: boolean;
  rolesCount: number;
}

export type UsersGridData = IGridData<IUserGridItemDto>;
