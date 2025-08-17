import { type IHasGuidId } from '../IHasGuidId';
import { type IUserId } from '../users/IUser.Id';

export interface IAnnouncementId {
  id: number;
}

export interface IAnnouncementEntity extends IAnnouncementId, IHasGuidId {}

export interface ICreateAnnouncement {
  createdBy: IUserId;
  state: number;
  validFromDate?: Date | null;
  title?: string | null;
}

export interface IUpdateAnnouncement {
  validFromDate?: Date | null;
  title?: string | null;
}
