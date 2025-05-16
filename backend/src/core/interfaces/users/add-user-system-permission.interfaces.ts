import { IUserId } from './IUser.Id';
import { IPermissionId } from '../permissions/IPermissionId';

export interface IAddUserSystemPermission {
  user: IUserId;
  systemPermission: IPermissionId;
  assignedAt: Date;
  assignedBy: IUserId;
}
