import { IPermissionId } from './../../../modules/permissions';
import { IUserId } from './IUser.Id';

export interface IAddUserSystemPermission {
  user: IUserId,
  systemPermission: IPermissionId,
  assignedAt: Date,
  assignedBy: IUserId,
}
