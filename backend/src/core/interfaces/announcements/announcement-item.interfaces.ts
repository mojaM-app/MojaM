import { type IAnnouncementId } from './announcement.interfaces';
import { type IUserId } from '../users/IUser.Id';

export interface ICreateAnnouncementItem {
  announcement: IAnnouncementId;
  content: string;
  createdBy: IUserId;
  order: number;
}

export interface IUpdateAnnouncementItem {
  id: string;
  content: string;
  updatedBy?: IUserId;
  order: number;
}
