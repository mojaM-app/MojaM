import { IUserId } from '@modules/users';
import { IAnnouncementId } from './IAnnouncementId';

export interface IUpdateAnnouncementItem {
  announcement: IAnnouncementId;
  content?: string;
  updatedBy?: IUserId;
}

export interface IUpdateAnnouncement {
  validFromDate?: Date | null;
  title?: string | null;
}
