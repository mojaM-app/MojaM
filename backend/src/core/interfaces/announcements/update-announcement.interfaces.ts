import { type IUserId } from '../users/IUser.Id';

export interface IUpdateAnnouncementItem {
  id: string;
  content: string;
  updatedBy: IUserId;
  order: number;
}

export interface IUpdateAnnouncement {
  validFromDate?: Date | null;
  title?: string | null;
}
