import { type IUserId } from '../users/IUser.Id';

export interface IUpdateBulletin {
  title?: string | null;
  startDate?: Date | null;
  updatedBy?: IUserId;
}
