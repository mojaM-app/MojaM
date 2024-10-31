import { IUserId } from '@modules/users';
import { IAnnouncementId } from './IAnnouncementId';

export interface ICreateAnnouncementItem {
  announcement: IAnnouncementId;
  content?: string;
  createdBy: IUserId;
}

export interface ICreateAnnouncement {
  createdBy: IUserId;
  state: number;
  validFromDate?: Date;
  title?: string;
}
