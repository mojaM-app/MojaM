import { IUserId } from './IUser.Id';
import { IPermissionId } from '../permissions/IPermission.Id';

export interface IAddUserSystemPermission {
  user: IUserId;
  systemPermission: IPermissionId;
  assignedAt: Date;
  assignedBy: IUserId;
}
