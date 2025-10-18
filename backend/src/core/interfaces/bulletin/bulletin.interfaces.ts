import { type IHasGuidId } from '../IHasGuidId';
import { type IUserId } from '../users/IUser.Id';

export interface IBulletinId {
  id: number;
}

export interface IBulletinEntity extends IBulletinId, IHasGuidId {}

export interface ICreateBulletin {
  createdBy: IUserId;
  state: number;
  title?: string | null;
  date?: Date | null;
  number?: string | null;
  introduction?: string | null;
  tipsForWork?: string | null;
  dailyPrayer?: string | null;
}

export interface IUpdateBulletin {
  id: number;
  updatedBy?: IUserId;
  title?: string | null;
  date?: Date | null;
  number?: string | null;
  introduction?: string | null;
  tipsForWork?: string | null;
  dailyPrayer?: string | null;
}
