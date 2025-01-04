import { IGridData } from '../../../../../../interfaces/common/grid.data';

export interface IUserGridItemColumns {
  id: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  isLockedOut: boolean;
  isActive: boolean;
}

export interface IUserGridItemDto extends IUserGridItemColumns {
  joiningDate?: Date;
  lastLoginAt?: Date;
  permissionCount: number;
}

export type UsersGridData = IGridData<IUserGridItemDto>;
