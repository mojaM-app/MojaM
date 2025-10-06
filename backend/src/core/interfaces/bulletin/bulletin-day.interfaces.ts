import { type IBulletinId } from './bulletin.interfaces';
import { type IHasGuidId } from '../IHasGuidId';
import { type IUserId } from '../users/IUser.Id';

export interface IBulletinDayId {
  id: number;
}

export interface IBulletinDayEntity extends IBulletinDayId, IHasGuidId {}

export interface ICreateBulletinDay {
  createdBy: IUserId;
  bulletin: IBulletinId;
  date?: Date | null;
  title?: string | null;
  settings: Record<string, any> | null;
}

export interface IUpdateBulletinDay {
  updatedBy?: IUserId;
  date?: Date | null;
  title?: string | null;
  settings?: Record<string, any> | null;
}
