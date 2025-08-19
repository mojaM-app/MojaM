import { type IBulletinDayId } from './bulletin-day.interfaces';
import { type IHasGuidId } from '../IHasGuidId';
import { type IUserId } from '../users/IUser.Id';

export interface IBulletinDaySectionId {
  id: number;
}

export interface IBulletinDaySectionEntity extends IBulletinDaySectionId, IHasGuidId {}

export interface ICreateBulletinDaySection {
  bulletinDay: IBulletinDayId;
  createdBy: IUserId;
  title?: string | null;
  content?: string | null;
  order: number;
  type?: string;
}

export interface IUpdateBulletinDaySection {
  updatedBy?: IUserId;
  title?: string | null;
  content?: string | null;
  order: number;
  type?: string;
}
