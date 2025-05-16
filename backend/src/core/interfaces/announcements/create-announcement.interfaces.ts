import { IAnnouncementId } from './IAnnouncementId';
import { IUserId } from '../users/IUser.Id';

export interface ICreateAnnouncementItem {
  announcement: IAnnouncementId;
  content: string;
  createdBy: IUserId;
  order: number;
}

export interface ICreateAnnouncement {
  createdBy: IUserId;
  state: number;
  validFromDate?: Date | null;
  title?: string | null;
}
